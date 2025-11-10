import { connectToDatabase } from "@/lib/mongodb";
import type { MediaDocument } from "@/types";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ObjectId } from "mongodb";

// POST /api/admin/albums/[albumId]/complete-upload - Save media metadata after client-side upload
export async function POST(
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

    // Check if album exists
    const album = await db
      .collection("albums")
      .findOne({ _id: new ObjectId(albumId) });

    if (!album) {
      return NextResponse.json(
        { success: false, error: "Album not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { url, pathname, contentType } = body;

    if (!url || !pathname) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: url and pathname" },
        { status: 400 }
      );
    }

    // Save metadata to MongoDB
    const media: Omit<MediaDocument, "_id"> = {
      albumId: new ObjectId(albumId),
      url,
      type: contentType?.startsWith("image/") ? "image" : "video",
      filename: pathname,
      uploadedAt: new Date(),
    };

    const result = await db.collection<MediaDocument>("media").insertOne(media as MediaDocument);

    console.log(`✅ Saved media metadata for: ${pathname}`);

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        ...media,
      },
    });
  } catch (error) {
    console.error("❌ Error saving media metadata:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save media metadata" },
      { status: 500 }
    );
  }
}
