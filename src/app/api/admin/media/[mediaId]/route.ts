import { connectToDatabase } from "@/lib/mongodb";
import type { MediaDocument } from "@/types";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { del } from "@vercel/blob";
import { ObjectId } from "mongodb";

// PUT /api/admin/media/[mediaId] - Update media publish status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { db } = await connectToDatabase();
    const { mediaId } = await params;

    if (!ObjectId.isValid(mediaId)) {
      return NextResponse.json(
        { success: false, error: "Invalid media ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (body.isPublished === undefined || typeof body.isPublished !== "boolean") {
      return NextResponse.json(
        { success: false, error: "isPublished must be provided as a boolean" },
        { status: 400 }
      );
    }

    const result = await db
      .collection<MediaDocument>("media")
      .updateOne(
        { _id: new ObjectId(mediaId) },
        { $set: { isPublished: body.isPublished } }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Media not found" },
        { status: 404 }
      );
    }

    const updatedMedia = await db
      .collection<MediaDocument>("media")
      .findOne({ _id: new ObjectId(mediaId) });

    if (!updatedMedia) {
      return NextResponse.json(
        { success: false, error: "Media not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedMedia,
        isPublished: updatedMedia.isPublished ?? false,
      },
    });
  } catch (error) {
    console.error("Error updating media publish status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update media" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/media/[mediaId] - Delete media file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { db } = await connectToDatabase();
    const { mediaId } = await params;

    if (!ObjectId.isValid(mediaId)) {
      return NextResponse.json(
        { success: false, error: "Invalid media ID" },
        { status: 400 }
      );
    }

    // Get media document
    const media = await db
      .collection<MediaDocument>("media")
      .findOne({ _id: new ObjectId(mediaId) });

    if (!media) {
      return NextResponse.json(
        { success: false, error: "Media not found" },
        { status: 404 }
      );
    }

    // Delete from Vercel Blob
    try {
      await del(media.url);
    } catch (blobError) {
      console.error("Error deleting from blob storage:", blobError);
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from MongoDB
    const result = await db
      .collection<MediaDocument>("media")
      .deleteOne({ _id: new ObjectId(mediaId) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to delete media from database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting media:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete media" },
      { status: 500 }
    );
  }
}