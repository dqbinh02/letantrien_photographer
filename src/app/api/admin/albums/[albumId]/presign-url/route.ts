import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { ObjectId } from "mongodb";
import type { MediaDocument } from "@/types";

// POST /api/admin/albums/[albumId]/presign-url - Generate pre-signed URLs and save metadata on upload completion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const { albumId } = await params;

    if (!ObjectId.isValid(albumId)) {
      return NextResponse.json(
        { success: false, error: "Invalid album ID" },
        { status: 400 }
      );
    }

    const body = await request.json() as HandleUploadBody;
    
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string, clientPayload: string | null) => {
        // Parse client metadata
        const metadata = clientPayload ? JSON.parse(clientPayload) : {};
        const albumIdFromClient = metadata.albumId;

        // Validate albumId from client matches URL param
        if (albumIdFromClient !== albumId) {
          throw new Error("Album ID mismatch");
        }

        // Verify album exists
        const { db } = await connectToDatabase();
        const album = await db
          .collection("albums")
          .findOne({ _id: new ObjectId(albumId) });

        if (!album) {
          throw new Error("Album not found");
        }

        // Return upload configuration
        return {
          allowedContentTypes: [
            'image/jpeg', 
            'image/png', 
            'image/gif', 
            'image/webp',
            'image/heic',
            'image/heif', 
            'video/mp4', 
            'video/quicktime',
            'video/webm',
            'video/mpeg'
          ],
          tokenPayload: JSON.stringify({
            albumId,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This runs after successful upload - save metadata to MongoDB
        try {
          const payload = tokenPayload ? JSON.parse(tokenPayload) : {};
          const albumIdFromToken = payload.albumId;

          if (!albumIdFromToken || !ObjectId.isValid(albumIdFromToken)) {
            console.error("Invalid albumId in token payload");
            return;
          }

          const { db } = await connectToDatabase();

          // Create media document
          const media: Omit<MediaDocument, "_id"> = {
            albumId: new ObjectId(albumIdFromToken),
            url: blob.url,
            type: blob.contentType?.startsWith("image/") ? "image" : "video",
            filename: blob.pathname,
            uploadedAt: new Date(),
          };

          // Save to MongoDB
          await db.collection<MediaDocument>("media").insertOne(media as MediaDocument);

          console.log(`✅ Saved media metadata for: ${blob.pathname}`);
        } catch (error) {
          console.error("❌ Error saving media metadata:", error);
          // Don't throw - the blob upload already succeeded
          // The client can retry saving metadata if needed
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Error in handleUpload:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to generate upload URL" 
      },
      { status: 500 }
    );
  }
}
