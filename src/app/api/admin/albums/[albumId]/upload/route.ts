import { connectToDatabase } from "@/lib/mongodb";
import type { MediaDocument } from "@/types";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { ObjectId } from "mongodb";

// POST /api/admin/albums/[albumId]/upload - Upload media files
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

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    const uploadedMedia: MediaDocument[] = [];

    // Upload each file to Vercel Blob
    for (const file of files) {
      try {
        // Upload to Vercel Blob
        const blob = await put(file.name, file, {
          access: "public",
        });

        // Save metadata to MongoDB
        const media: Omit<MediaDocument, "_id"> = {
          albumId: new ObjectId(albumId),
          url: blob.url,
          type: file.type.startsWith("image/") ? "image" : "video",
          filename: file.name,
          uploadedAt: new Date(),
        };

        const result = await db.collection<MediaDocument>("media").insertOne(media as MediaDocument);

        uploadedMedia.push({
          _id: result.insertedId,
          ...media,
        });
      } catch (uploadError) {
        console.error(`Error uploading file ${file.name}:`, uploadError);
        // Continue with other files even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      data: uploadedMedia,
      message: `Successfully uploaded ${uploadedMedia.length} of ${files.length} files`,
    });
  } catch (error) {
    console.error("Error uploading media:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload media" },
      { status: 500 }
    );
  }
}