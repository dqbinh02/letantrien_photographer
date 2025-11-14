import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { MediaDocument } from '@/types';

interface ReorderRequest {
  mediaOrders: Array<{
    mediaId: string;
    order: number;
  }>;
}

/**
 * PATCH /api/admin/albums/[albumId]/reorder
 * 
 * Reorder media items within an album by updating their order field.
 * Uses bulk write operations for optimal performance.
 * 
 * Request body:
 * {
 *   mediaOrders: [
 *     { mediaId: "abc123", order: 0 },
 *     { mediaId: "def456", order: 1 },
 *     ...
 *   ]
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   message: "Order updated successfully",
 *   updatedCount: 5
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const { albumId } = await params;

    // Validate albumId format
    if (!ObjectId.isValid(albumId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid album ID format' },
        { status: 400 }
      );
    }

    // Parse request body
    let body: ReorderRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate request body
    if (!body.mediaOrders || !Array.isArray(body.mediaOrders)) {
      return NextResponse.json(
        { success: false, error: 'mediaOrders must be an array' },
        { status: 400 }
      );
    }

    if (body.mediaOrders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'mediaOrders array cannot be empty' },
        { status: 400 }
      );
    }

    // Validate each media order entry
    for (const item of body.mediaOrders) {
      if (!item.mediaId || typeof item.mediaId !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Each item must have a valid mediaId string' },
          { status: 400 }
        );
      }

      if (!ObjectId.isValid(item.mediaId)) {
        return NextResponse.json(
          { success: false, error: `Invalid mediaId format: ${item.mediaId}` },
          { status: 400 }
        );
      }

      if (typeof item.order !== 'number' || item.order < 0) {
        return NextResponse.json(
          { success: false, error: 'Each item must have a valid order number (>= 0)' },
          { status: 400 }
        );
      }
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Verify album exists
    const album = await db
      .collection('albums')
      .findOne({ _id: new ObjectId(albumId) });

    if (!album) {
      return NextResponse.json(
        { success: false, error: 'Album not found' },
        { status: 404 }
      );
    }

    // Security check: Verify all media items belong to this album
    const mediaIds = body.mediaOrders.map(item => new ObjectId(item.mediaId));
    const mediaCount = await db
      .collection<MediaDocument>('media')
      .countDocuments({
        _id: { $in: mediaIds },
        albumId: new ObjectId(albumId)
      });

    if (mediaCount !== body.mediaOrders.length) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'One or more media items do not belong to this album' 
        },
        { status: 403 }
      );
    }

    // Prepare bulk write operations
    const bulkOps = body.mediaOrders.map(({ mediaId, order }) => ({
      updateOne: {
        filter: {
          _id: new ObjectId(mediaId),
          albumId: new ObjectId(albumId) // Additional security check
        },
        update: {
          $set: { order }
        }
      }
    }));

    // Execute bulk update
    const result = await db
      .collection<MediaDocument>('media')
      .bulkWrite(bulkOps);

    // Log for debugging
    console.log(`✅ Reordered ${result.modifiedCount} media items in album ${albumId}`);

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      updatedCount: result.modifiedCount,
    });

  } catch (_error: unknown) {
    console.error('❌ Error reordering media:', _error);
    
    // Return user-friendly error message
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update media order. Please try again.' 
      },
      { status: 500 }
    );
  }
}
