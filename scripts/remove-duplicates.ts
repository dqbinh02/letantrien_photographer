/**
 * Script to remove duplicate media entries from MongoDB
 * Run with: npx tsx scripts/remove-duplicates.ts
 */

import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'photographer';

interface MediaDocument {
  _id: ObjectId;
  albumId: ObjectId;
  url: string;
  type: string;
  filename: string;
  uploadedAt: Date;
}

async function removeDuplicates() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const mediaCollection = db.collection<MediaDocument>('media');

    // Find all media grouped by albumId and url
    const pipeline = [
      {
        $group: {
          _id: { albumId: '$albumId', url: '$url' },
          docs: { $push: '$$ROOT' },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 } // Only duplicates
        }
      }
    ];

    const duplicates = await mediaCollection.aggregate(pipeline).toArray();

    console.log(`\n📊 Found ${duplicates.length} sets of duplicate media\n`);

    if (duplicates.length === 0) {
      console.log('✨ No duplicates found!');
      return;
    }

    let totalRemoved = 0;

    for (const duplicate of duplicates) {
      const docs = duplicate.docs as MediaDocument[];
      console.log(`\n🔍 Processing: ${docs[0].url}`);
      console.log(`   Count: ${docs.length} copies`);

      // Keep the oldest one (first uploaded), delete the rest
      const sorted = docs.sort((a, b) => 
        new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
      );

      const toKeep = sorted[0];
      const toDelete = sorted.slice(1);

      console.log(`   ✅ Keeping: ${toKeep._id} (uploaded: ${toKeep.uploadedAt})`);

      for (const doc of toDelete) {
        await mediaCollection.deleteOne({ _id: doc._id });
        console.log(`   ❌ Deleted: ${doc._id} (uploaded: ${doc.uploadedAt})`);
        totalRemoved++;
      }
    }

    console.log(`\n🎉 Removed ${totalRemoved} duplicate media entries!`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
removeDuplicates()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
