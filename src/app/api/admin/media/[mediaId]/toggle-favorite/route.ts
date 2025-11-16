import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";

/**
 * PATCH /api/admin/media/[mediaId]/toggle-favorite
 * Toggle the isFavorite field for a media item
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { mediaId } = await params;

    // Validate ObjectId
    if (!ObjectId.isValid(mediaId)) {
      return NextResponse.json(
        { error: "Invalid media ID" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const mediaCollection = db.collection("media");

    // Get current media
    const media = await mediaCollection.findOne({ _id: new ObjectId(mediaId) });
    if (!media) {
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      );
    }

    // Toggle isFavorite
    const newFavoriteState = !media.isFavorite;
    
    await mediaCollection.updateOne(
      { _id: new ObjectId(mediaId) },
      { $set: { isFavorite: newFavoriteState } }
    );

    return NextResponse.json({
      success: true,
      isFavorite: newFavoriteState,
    });
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return NextResponse.json(
      { error: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}
