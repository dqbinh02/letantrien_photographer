import { connectToDatabase } from "@/lib/mongodb";
import type { MediaDocument } from "@/types";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ObjectId } from "mongodb";

// GET /api/admin/albums/[albumId]/check-duplicates - Check for duplicate media entries
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const { db } = await connectToDatabase();
    const { albumId } = await params;

    if (!ObjectId.isValid(albumId)) {
      return NextResponse.json(
        { success: false, error: "Invalid album ID" },
        { status: 400 }
      );
    }

    const albumObjectId = new ObjectId(albumId);

    // Find all media for this album
    const allMedia = await db
      .collection<MediaDocument>("media")
      .find({ albumId: albumObjectId })
      .toArray();

    // Group by URL to find duplicates
    const mediaByUrl = new Map<string, MediaDocument[]>();
    
    for (const media of allMedia) {
      if (!mediaByUrl.has(media.url)) {
        mediaByUrl.set(media.url, []);
      }
      mediaByUrl.get(media.url)!.push(media);
    }

    const duplicates: Array<{ url: string; count: number; ids: string[] }> = [];

    for (const [url, mediaList] of mediaByUrl.entries()) {
      if (mediaList.length > 1) {
        duplicates.push({
          url,
          count: mediaList.length,
          ids: mediaList.map(m => m._id!.toString()),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalMedia: allMedia.length,
        uniqueUrls: mediaByUrl.size,
        duplicateCount: duplicates.length,
        duplicates,
      },
    });
  } catch (error) {
    console.error("❌ Error checking duplicates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check duplicates" },
      { status: 500 }
    );
  }
}
