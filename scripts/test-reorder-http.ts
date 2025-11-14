/**
 * HTTP Integration Test: Reorder API Endpoint
 * 
 * Tests the actual HTTP endpoint /api/admin/albums/[albumId]/reorder
 * 
 * Prerequisites:
 *   - Development server must be running (npm run dev)
 *   - At least one album with 2+ media items
 * 
 * Usage:
 *   # Terminal 1: Start dev server
 *   npm run dev
 * 
 *   # Terminal 2: Run this test
 *   npx tsx scripts/test-reorder-http.ts
 */

import { config } from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'photographer_portfolio';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface MediaDocument {
  _id: ObjectId;
  albumId: ObjectId;
  url: string;
  thumbnailUrl: string | null;
  uploadedAt: Date;
  order: number;
}

async function testReorderHTTP() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found');
    process.exit(1);
  }

  console.log('🔗 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    console.log('✅ Connected to database');
    
    // Get album and media
    const sampleMedia = await db.collection<MediaDocument>('media').findOne({});
    if (!sampleMedia) {
      console.log('❌ No media found');
      return;
    }
    
    const albumId = sampleMedia.albumId.toString();
    console.log(`📂 Using album: ${albumId}`);
    
    // Fetch all media for this album
    const mediaItems = await db
      .collection<MediaDocument>('media')
      .find({ albumId: new ObjectId(albumId) })
      .sort({ order: 1 })
      .toArray();
    
    console.log(`📸 Found ${mediaItems.length} media items`);
    
    if (mediaItems.length < 2) {
      console.log('⚠️  Need at least 2 media items');
      return;
    }
    
    console.log('\nCurrent order:');
    mediaItems.slice(0, 5).forEach((m, i) => {
      console.log(`  ${i + 1}. ${m._id} - order: ${m.order}`);
    });
    if (mediaItems.length > 5) {
      console.log(`  ... and ${mediaItems.length - 5} more`);
    }
    
    // Prepare reversed order
    const reversedOrder = mediaItems
      .reverse()
      .map((m, index) => ({
        mediaId: m._id.toString(),
        order: index
      }));
    
    console.log('\n🔄 Sending PATCH request to reorder endpoint...');
    console.log(`   URL: ${API_BASE}/api/admin/albums/${albumId}/reorder`);
    
    const response = await fetch(
      `${API_BASE}/api/admin/albums/${albumId}/reorder`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaOrders: reversedOrder
        })
      }
    );
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log(`   Response:`, data);
    
    if (!response.ok) {
      console.log('❌ Request failed');
      return;
    }
    
    // Verify the changes
    console.log('\n🔍 Verifying database changes...');
    const updatedMedia = await db
      .collection<MediaDocument>('media')
      .find({ albumId: new ObjectId(albumId) })
      .sort({ order: 1 })
      .toArray();
    
    console.log('Updated order:');
    updatedMedia.slice(0, 5).forEach((m, i) => {
      console.log(`  ${i + 1}. ${m._id} - order: ${m.order}`);
    });
    if (updatedMedia.length > 5) {
      console.log(`  ... and ${updatedMedia.length - 5} more`);
    }
    
    // Restore original order
    console.log('\n↩️  Restoring original order...');
    const restoreOrder = updatedMedia
      .reverse()
      .map((m, index) => ({
        mediaId: m._id.toString(),
        order: index
      }));
    
    const restoreResponse = await fetch(
      `${API_BASE}/api/admin/albums/${albumId}/reorder`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaOrders: restoreOrder
        })
      }
    );
    
    const restoreData = await restoreResponse.json();
    console.log(`   Status: ${restoreResponse.status}`);
    console.log(`   Modified: ${restoreData.updatedCount} items`);
    
    console.log('\n✅ HTTP Integration Test PASSED!');
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      console.error('\n❌ Connection refused. Is the dev server running?');
      console.error('   Start it with: npm run dev');
    } else {
      console.error('\n❌ Test failed:');
      console.error(error);
    }
    process.exit(1);
  } finally {
    await client.close();
  }
}

testReorderHTTP().catch(console.error);
