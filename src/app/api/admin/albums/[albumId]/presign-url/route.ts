import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { ObjectId } from "mongodb";

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
      onUploadCompleted: async ({ blob }) => {
        // NOTE: This callback works on Vercel production but NOT in local development
        // For consistency, we use a separate complete-upload endpoint instead
        // This prevents duplicate inserts and works in both environments
        console.log('✅ Upload completed to blob:', blob.pathname);
        console.log('⚠️  Metadata will be saved via /complete-upload endpoint');
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
