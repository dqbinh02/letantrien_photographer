import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import type { AlbumDocument, MediaDocument } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const { mediaId } = await params;
    
    // IMPORTANT: Token is required for download
    if (!token) {
      return NextResponse.json(
        { error: "Token is required for download" }, 
        { status: 401 }
      );
    }
    
    if (!ObjectId.isValid(mediaId)) {
      return NextResponse.json(
        { error: "Invalid media ID" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Get media
    const media = await db.collection<MediaDocument>("media").findOne({
      _id: new ObjectId(mediaId),
    });
    
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }
    
    // Verify album access with token (same logic as GET /api/albums/[albumId])
    const album = await db.collection<AlbumDocument>("albums").findOne({
      _id: media.albumId,
    });
    
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }
    
    // Validate token (same as album detail route)
    const linkToken = album.link?.token;
    const expiresAt = album.link?.expiresAt ? new Date(album.link.expiresAt) : null;
    const isTokenValid =
      Boolean(token && linkToken && token === linkToken) &&
      (!expiresAt || expiresAt.getTime() > Date.now());
    
    if (!isTokenValid) {
      return NextResponse.json(
        { error: "Invalid or expired token" }, 
        { status: 403 }
      );
    }
    
    // Fetch file from Vercel Blob URL
    const fileResponse = await fetch(media.url);
    
    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: "File not found" }, 
        { status: 404 }
      );
    }
    
    // Get file as blob
    const blob = await fileResponse.blob();
    
    // Return file for download
    return new NextResponse(blob, {
      headers: {
        'Content-Type': blob.type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${media.filename}"`,
        'Content-Length': blob.size.toString(),
      },
    });
    
  } catch (error) {
    console.error("Download media error:", error);
    return NextResponse.json(
      { error: "Failed to download media" },
      { status: 500 }
    );
  }
}
