import { connectToDatabase } from '@/lib/mongodb';
import type { AlbumDocument, MediaDocument } from '@/types';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// GET /api/albums/[token] - Public read-only endpoint to fetch album and its media by token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { db } = await connectToDatabase();
    const { token } = await params;

    if (!token || token.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    // Find album by link.token
    const album = await db.collection<AlbumDocument>('albums').findOne({ 'link.token': token });

    if (!album) {
      return NextResponse.json({ success: false, error: 'Album not found' }, { status: 404 });
    }

    // If the link has an expiry and it's past, respond accordingly
    if (album.link?.expiresAt) {
      const expires = new Date(album.link.expiresAt);
      if (expires.getTime() < Date.now()) {
        return NextResponse.json({ success: false, error: 'Link expired' }, { status: 410 });
      }
    }

    // Fetch media for this album
    const media = await db
      .collection<MediaDocument>('media')
      .find({ albumId: album._id })
      // sort ascending (oldest first) so newest appear last
      .sort({ uploadedAt: 1 })
      .toArray();

    console.log(`📊 Album ${album.title} (${album._id}): Found ${media.length} media items`);
    
    // Check for duplicates in database
    const urls = media.map(m => m.url);
    const uniqueUrls = new Set(urls);
    if (urls.length !== uniqueUrls.size) {
      console.warn(`⚠️ WARNING: Album has ${urls.length - uniqueUrls.size} duplicate media entries in database!`);
      // Log the duplicate URLs
      const duplicates = urls.filter((url, index) => urls.indexOf(url) !== index);
      console.warn('Duplicate URLs:', [...new Set(duplicates)]);
    }

    return NextResponse.json({ success: true, data: { album, media } });
  } catch (error) {
    console.error('Error fetching album by token:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch album' }, { status: 500 });
  }
}
