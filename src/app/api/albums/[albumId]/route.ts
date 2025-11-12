import { connectToDatabase } from "@/lib/mongodb";
import type { AlbumDocument, MediaDocument } from "@/types";
import { ObjectId } from "mongodb";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// GET /api/albums/[albumId] - Public album access supporting optional token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const { db } = await connectToDatabase();
    const { albumId } = await params;
    const searchParams = new URL(request.url).searchParams;
    const token = searchParams.get("token");

    if (!ObjectId.isValid(albumId)) {
      return NextResponse.json(
        { success: false, error: "Invalid album ID" },
        { status: 400 }
      );
    }

    const album = await db
      .collection<AlbumDocument>("albums")
      .findOne({ _id: new ObjectId(albumId) });

    if (!album) {
      return NextResponse.json(
        { success: false, error: "Album not found" },
        { status: 404 }
      );
    }

    const normalizedAlbum = {
      ...album,
      isPublished: album.isPublished ?? false,
    };

    const linkToken = album.link?.token;
    const expiresAt = album.link?.expiresAt ? new Date(album.link.expiresAt) : null;
    const isTokenValid =
      Boolean(token && linkToken && token === linkToken) &&
      (!expiresAt || expiresAt.getTime() > Date.now());

    if (!normalizedAlbum.isPublished && !isTokenValid) {
      return NextResponse.json(
        { success: false, error: "Album is private" },
        { status: 403 }
      );
    }

    const media = await db
      .collection<MediaDocument>("media")
      .find({
        albumId: new ObjectId(albumId),
        isPublished: true,
      })
      .sort({ uploadedAt: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        album: {
          ...normalizedAlbum,
          link: {
            expiresAt: album.link?.expiresAt ?? null,
          },
        },
        media: media.map((item) => ({
          ...item,
          isPublished: item.isPublished ?? false,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching album by ID:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch album" },
      { status: 500 }
    );
  }
}
