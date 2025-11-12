import { connectToDatabase } from "@/lib/mongodb";
import type { AlbumDocument, CreateAlbumRequest, MediaDocument } from "@/types";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";

// GET /api/admin/albums - List all albums with media count
export async function GET() {
  try {
    const { db } = await connectToDatabase();

    // Get all albums
    const albums = await db
      .collection<AlbumDocument>("albums")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Get media count for each album
    const albumsWithCount = await Promise.all(
      albums.map(async (album) => {
        const mediaCount = await db
          .collection<MediaDocument>("media")
          .countDocuments({ albumId: album._id });
        
        const publishedMediaCount = await db
          .collection<MediaDocument>("media")
          .countDocuments({ albumId: album._id, isPublished: true });

        return {
          ...album,
          isPublished: album.isPublished ?? false,
          mediaCount,
          publishedMediaCount,
        };
      })
    );

    return NextResponse.json({ success: true, data: albumsWithCount });
  } catch (error) {
    console.error("Error fetching albums:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch albums" },
      { status: 500 }
    );
  }
}

// POST /api/admin/albums - Create new album
export async function POST(request: NextRequest) {
  try {
  const body: CreateAlbumRequest = await request.json();
  const { title, description, expiresAt, isPublished } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Generate unique token for gallery link
    const token = randomBytes(16).toString('hex');

    const album: Omit<AlbumDocument, "_id"> = {
      title: title.trim(),
      description: description?.trim() || "",
      coverImage: "",
      isPublished: Boolean(isPublished),
      createdAt: new Date(),
      updatedAt: new Date(),
      link: {
        token,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    };

    const result = await db.collection<AlbumDocument>("albums").insertOne(album as AlbumDocument);

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId, ...album },
    });
  } catch (error) {
    console.error("Error creating album:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create album" },
      { status: 500 }
    );
  }
}