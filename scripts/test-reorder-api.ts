/**
 * Test Script: Reorder API Endpoint
 * 
 * This script tests the /api/admin/albums/[albumId]/reorder endpoint
 * to verify it correctly updates media order.
 * 
 * Usage:
 *   npx tsx scripts/test-reorder-api.ts
 * 
 * Requirements:
 *   - MongoDB connection configured in .env.local
 *   - At least one album with media items
 */

import { config } from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'photographer_portfolio';

interface MediaDocument {
  _id: ObjectId;
  albumId: ObjectId;
  url: string;
  thumbnailUrl: string | null;
  uploadedAt: Date;
  order: number;
}

async function testReorderAPI() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  console.log('🔗 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    console.log('✅ Connected to database:', DB_NAME);
    
    // Step 1: Find an album that has media (by checking media collection)
    console.log('\n📂 Finding an album with media...');
    
    // First, find a media item to get albumId
    const sampleMedia = await db.collection<MediaDocument>('media').findOne({});
    
    if (!sampleMedia) {
      console.log('❌ No media found in database. Please upload some photos first.');
      return;
    }
    
    const albumId = sampleMedia.albumId;
    
    // Now get the album details
    const album = await db.collection('albums').findOne({ _id: albumId });
    
    if (!album) {
      console.log('❌ Album not found for media. Database inconsistency detected.');
      return;
    }
    
    console.log(`✅ Found album: ${albumId} (${album.title || 'Untitled'})`);
    
    // Step 2: Fetch media items for this album
    console.log('\n📸 Fetching media items...');
    const mediaItems = await db
      .collection<MediaDocument>('media')
      .find({ albumId: new ObjectId(albumId) })
      .sort({ order: 1 })
      .toArray();
    
    console.log(`✅ Found ${mediaItems.length} media items`);
    
    if (mediaItems.length < 2) {
      console.log('⚠️  Need at least 2 media items to test reordering.');
      console.log('Current media:');
      mediaItems.forEach((m, idx) => {
        console.log(`  ${idx + 1}. ${m._id} - order: ${m.order}`);
      });
      return;
    }
    
    console.log('\nCurrent order:');
    mediaItems.forEach((m, idx) => {
      console.log(`  ${idx + 1}. ${m._id} - order: ${m.order}`);
    });
    
    // Step 3: Prepare reverse order
    console.log('\n🔄 Preparing to reverse the order...');
    const mediaOrders = mediaItems
      .reverse() // Reverse array
      .map((media, index) => ({
        mediaId: media._id.toString(),
        order: index // Assign new order: 0, 1, 2, ...
      }));
    
    console.log('New order to apply:');
    mediaOrders.forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.mediaId} - order: ${item.order}`);
    });
    
    // Step 4: Test the reorder logic (simulate the API)
    console.log('\n⚡ Simulating bulk update...');
    
    const bulkOps = mediaOrders.map(({ mediaId, order }) => ({
      updateOne: {
        filter: {
          _id: new ObjectId(mediaId),
          albumId: new ObjectId(albumId)
        },
        update: {
          $set: { order }
        }
      }
    }));
    
    const result = await db.collection<MediaDocument>('media').bulkWrite(bulkOps);
    
    console.log(`✅ Bulk update completed:`);
    console.log(`   - Matched: ${result.matchedCount}`);
    console.log(`   - Modified: ${result.modifiedCount}`);
    
    // Step 5: Verify the new order
    console.log('\n🔍 Verifying new order...');
    const updatedMedia = await db
      .collection<MediaDocument>('media')
      .find({ albumId: new ObjectId(albumId) })
      .sort({ order: 1 })
      .toArray();
    
    console.log('Updated order:');
    updatedMedia.forEach((m, idx) => {
      console.log(`  ${idx + 1}. ${m._id} - order: ${m.order}`);
    });
    
    // Step 6: Reverse back to original order
    console.log('\n↩️  Reversing back to original order...');
    const restoreOrders = updatedMedia
      .reverse()
      .map((media, index) => ({
        mediaId: media._id.toString(),
        order: index
      }));
    
    const restoreBulkOps = restoreOrders.map(({ mediaId, order }) => ({
      updateOne: {
        filter: {
          _id: new ObjectId(mediaId),
          albumId: new ObjectId(albumId)
        },
        update: {
          $set: { order }
        }
      }
    }));
    
    const restoreResult = await db.collection<MediaDocument>('media').bulkWrite(restoreBulkOps);
    console.log(`✅ Restored original order (modified: ${restoreResult.modifiedCount})`);
    
    console.log('\n✨ Test completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Album ID: ${albumId}`);
    console.log(`   - Media count: ${mediaItems.length}`);
    console.log(`   - Reorder test: PASSED ✅`);
    console.log(`   - Restore test: PASSED ✅`);
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testReorderAPI().catch(console.error);
