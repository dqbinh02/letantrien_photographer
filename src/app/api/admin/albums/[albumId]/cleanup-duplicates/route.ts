import { connectToDatabase } from "@/lib/mongodb";
import type { MediaDocument } from "@/types";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ObjectId } from "mongodb";

// POST /api/admin/albums/[albumId]/cleanup-duplicates - Remove duplicate media entries
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

    const albumObjectId = new ObjectId(albumId);

    // Find all media for this album
    const allMedia = await db
      .collection<MediaDocument>("media")
      .find({ albumId: albumObjectId })
      .sort({ uploadedAt: 1 }) // oldest first
      .toArray();

    console.log(`📊 Album ${albumId}: Total media: ${allMedia.length}`);

    // Group by URL to find duplicates
    const mediaByUrl = new Map<string, MediaDocument[]>();
    
    for (const media of allMedia) {
      if (!mediaByUrl.has(media.url)) {
        mediaByUrl.set(media.url, []);
      }
      mediaByUrl.get(media.url)!.push(media);
    }

    let duplicatesFound = 0;
    let duplicatesRemoved = 0;
    const deletedIds: ObjectId[] = [];

    // Process each URL group
    for (const [url, mediaList] of mediaByUrl.entries()) {
      if (mediaList.length > 1) {
        duplicatesFound += mediaList.length - 1;
        
        console.log(`🔍 Found ${mediaList.length} copies of: ${url}`);
        
        // Keep the oldest (first one), delete the rest
        const toKeep = mediaList[0];
        const toDelete = mediaList.slice(1);
        
        console.log(`  ✅ Keeping: ${toKeep._id} (uploaded: ${toKeep.uploadedAt})`);
        
        for (const media of toDelete) {
          await db.collection("media").deleteOne({ _id: media._id });
          deletedIds.push(media._id!);
          duplicatesRemoved++;
          console.log(`  ❌ Deleted: ${media._id} (uploaded: ${media.uploadedAt})`);
        }
      }
    }

    console.log(`✨ Cleanup complete: Removed ${duplicatesRemoved} duplicate entries`);

    return NextResponse.json({
      success: true,
      data: {
        totalMedia: allMedia.length,
        duplicatesFound,
        duplicatesRemoved,
        deletedIds: deletedIds.map(id => id.toString()),
      },
    });
  } catch (error) {
    console.error("❌ Error cleaning up duplicates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cleanup duplicates" },
      { status: 500 }
    );
  }
}
