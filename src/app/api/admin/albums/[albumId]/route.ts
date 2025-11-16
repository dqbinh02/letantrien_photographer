import { connectToDatabase } from "@/lib/mongodb";
import type { AlbumDocument, MediaDocument } from "@/types";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ObjectId } from "mongodb";

// GET /api/admin/albums/[albumId] - Get album details with media
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

    // Get album
    const album = await db
      .collection<AlbumDocument>("albums")
      .findOne({ _id: new ObjectId(albumId) });

    if (!album) {
      return NextResponse.json(
        { success: false, error: "Album not found" },
        { status: 404 }
      );
    }

    // Get media for this album
    const media = await db
      .collection<MediaDocument>("media")
      .find({ albumId: new ObjectId(albumId) })
      // sort ascending so oldest items come first and newest appear last
      .sort({ uploadedAt: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        album: {
          ...album,
          isPublished: album.isPublished ?? false,
        },
        media: media.map((item) => ({
          ...item,
          isPublished: item.isPublished ?? false,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching album:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch album" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/albums/[albumId] - Update album
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const { db } = await connectToDatabase();
    const { albumId } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(albumId)) {
      return NextResponse.json(
        { success: false, error: "Invalid album ID" },
        { status: 400 }
      );
    }

    const updateData: Partial<AlbumDocument> = {
      updatedAt: new Date(),
    };

    // Only allow updating specific fields
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;
    if (body.theme !== undefined) updateData.theme = body.theme;

    const result = await db
      .collection<AlbumDocument>("albums")
      .updateOne(
        { _id: new ObjectId(albumId) },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Album not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Album updated successfully",
    });
  } catch (error) {
    console.error("Error updating album:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update album" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/albums/[albumId] - Replace editable album fields
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const { db } = await connectToDatabase();
    const { albumId } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(albumId)) {
      return NextResponse.json(
        { success: false, error: "Invalid album ID" },
        { status: 400 }
      );
    }

    const updateData: Partial<AlbumDocument> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Title must be a non-empty string" },
          { status: 400 }
        );
      }
      updateData.title = body.title.trim();
    }

    if (body.description !== undefined) {
      if (typeof body.description !== "string") {
        return NextResponse.json(
          { success: false, error: "Description must be a string" },
          { status: 400 }
        );
      }
      updateData.description = body.description;
    }

    if (body.location !== undefined) {
      if (typeof body.location !== "string") {
        return NextResponse.json(
          { success: false, error: "Location must be a string" },
          { status: 400 }
        );
      }
      updateData.location = body.location;
    }

    if (body.isPublished !== undefined) {
      if (typeof body.isPublished !== "boolean") {
        return NextResponse.json(
          { success: false, error: "isPublished must be a boolean" },
          { status: 400 }
        );
      }
      updateData.isPublished = body.isPublished;
    }

    if (body.theme !== undefined) {
      if (!['light', 'dark', 'auto'].includes(body.theme)) {
        return NextResponse.json(
          { success: false, error: "theme must be 'light', 'dark', or 'auto'" },
          { status: 400 }
        );
      }
      updateData.theme = body.theme;
    }

    const result = await db
      .collection<AlbumDocument>("albums")
      .updateOne(
        { _id: new ObjectId(albumId) },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Album not found" },
        { status: 404 }
      );
    }

    const updatedAlbum = await db
      .collection<AlbumDocument>("albums")
      .findOne({ _id: new ObjectId(albumId) });

    if (!updatedAlbum) {
      return NextResponse.json(
        { success: false, error: "Album not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedAlbum,
        isPublished: updatedAlbum.isPublished ?? false,
      },
    });
  } catch (error) {
    console.error("Error updating album via PUT:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update album" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/albums/[albumId] - Delete album and all its media
export async function DELETE(
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

    // Delete album
    const albumResult = await db
      .collection<AlbumDocument>("albums")
      .deleteOne({ _id: new ObjectId(albumId) });

    if (albumResult.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Album not found" },
        { status: 404 }
      );
    }

    // Delete all media for this album
    await db
      .collection<MediaDocument>("media")
      .deleteMany({ albumId: new ObjectId(albumId) });

    return NextResponse.json({
      success: true,
      message: "Album and associated media deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting album:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete album" },
      { status: 500 }
    );
  }
}