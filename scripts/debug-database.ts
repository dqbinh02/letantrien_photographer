/**
 * Debug Script: Check Database Structure
 * 
 * Inspects the database to understand the album and media structure.
 */

import { config } from 'dotenv';
import { MongoClient } from 'mongodb';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'photographer_portfolio';

async function inspectDatabase() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    console.log('✅ Connected to:', DB_NAME);
    
    // Check albums
    console.log('\n📂 Albums Collection:');
    const albums = await db.collection('albums').find({}).toArray();
    console.log(`   Total albums: ${albums.length}`);
    
    if (albums.length > 0) {
      console.log('\n   Album details:');
      for (const album of albums) {
        console.log(`   - ID: ${album._id}`);
        console.log(`     Title: ${album.title || 'Untitled'}`);
        console.log(`     Status: ${album.status}`);
        console.log(`     Media array length: ${album.media?.length || 0}`);
        if (album.media && album.media.length > 0) {
          console.log(`     Sample media ID: ${album.media[0]}`);
        }
      }
    }
    
    // Check media
    console.log('\n📸 Media Collection:');
    const media = await db.collection('media').find({}).toArray();
    console.log(`   Total media documents: ${media.length}`);
    
    if (media.length > 0) {
      console.log('\n   Media details:');
      media.forEach((m, idx) => {
        console.log(`   ${idx + 1}. ID: ${m._id}`);
        console.log(`      Album ID: ${m.albumId}`);
        console.log(`      Order: ${m.order}`);
        console.log(`      URL: ${m.url?.substring(0, 50)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

inspectDatabase().catch(console.error);
