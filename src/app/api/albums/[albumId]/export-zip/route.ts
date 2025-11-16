import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import archiver from "archiver";
import type { AlbumDocument, MediaDocument } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const { albumId } = await params;
    
    // IMPORTANT: Token is required for download
    if (!token) {
      return NextResponse.json(
        { error: "Token is required for download" }, 
        { status: 401 }
      );
    }
    
    if (!ObjectId.isValid(albumId)) {
      return NextResponse.json(
        { error: "Invalid album ID" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Validate album access with token (same logic as GET /api/albums/[albumId])
    const album = await db.collection<AlbumDocument>("albums").findOne({
      _id: new ObjectId(albumId),
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
    
    // Get all published media
    const media = await db.collection<MediaDocument>("media")
      .find({
        albumId: new ObjectId(albumId),
        isPublished: true,
      })
      .sort({ order: 1 })
      .toArray();
    
    if (media.length === 0) {
      return NextResponse.json({ error: "No media to download" }, { status: 404 });
    }
    
    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Create transform stream for ZIP
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    
    // Pipe archive data to writable stream
    archive.on('data', (chunk: Buffer) => {
      writer.write(new Uint8Array(chunk));
    });
    
    archive.on('end', () => {
      writer.close();
    });
    
    archive.on('error', (err: Error) => {
      console.error('Archive error:', err);
      writer.abort(err);
    });
    
    // Add files to archive
    const downloadPromises = media.map(async (item) => {
      try {
        // Fetch file from Vercel Blob
        const response = await fetch(item.url);
        
        if (!response.ok) {
          console.error(`Failed to fetch ${item.filename}`);
          return;
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Add to archive with original filename
        archive.append(buffer, { name: item.filename });
      } catch (err) {
        console.error(`Error adding ${item.filename} to ZIP:`, err);
      }
    });
    
    // Wait for all downloads to complete
    await Promise.all(downloadPromises);
    
    // Finalize archive (must be called after all files are added)
    archive.finalize();
    
    // Generate filename from album title (keep Vietnamese characters)
    const filename = `${album.title}.zip`;
    
    // Return streaming response
    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
    
  } catch (error) {
    console.error("Export ZIP error:", error);
    return NextResponse.json(
      { error: "Failed to create ZIP" },
      { status: 500 }
    );
  }
}
