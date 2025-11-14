#!/usr/bin/env tsx
/**
 * Migration Script: Add order field to existing media documents
 * 
 * This script adds the `order` field to all MediaDocument records that don't have it.
 * The order is set based on the uploadedAt timestamp (oldest = 0, newest = n-1)
 * 
 * Usage:
 *   npx tsx scripts/migrate-add-order-field.ts --dry-run    # Preview changes
 *   npx tsx scripts/migrate-add-order-field.ts --execute    # Execute migration
 * 
 * IMPORTANT: Backup your database before running with --execute!
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'photographer_db';

interface MediaDocument {
  _id: ObjectId;
  albumId: ObjectId;
  url: string;
  type: 'image' | 'video';
  filename: string;
  isPublished: boolean;
  uploadedAt: Date;
  order?: number;
}

interface Album {
  _id: ObjectId;
  title: string;
}

async function migrate(dryRun: boolean = true) {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  console.log('🔗 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const mediaCollection = db.collection<MediaDocument>('media');
    const albumsCollection = db.collection<Album>('albums');

    // Get all albums
    const albums = await albumsCollection.find({}).toArray();
    console.log(`\n📚 Found ${albums.length} albums`);

    let totalMediaProcessed = 0;
    let totalMediaUpdated = 0;

    for (const album of albums) {
      console.log(`\n🎨 Processing album: "${album.title}" (${album._id})`);

      // Find all media for this album sorted by uploadedAt
      const mediaDocuments = await mediaCollection
        .find({ albumId: album._id })
        .sort({ uploadedAt: 1 })
        .toArray();

      console.log(`   📸 Found ${mediaDocuments.length} media items`);

      if (mediaDocuments.length === 0) {
        continue;
      }

      // Check which documents need order field
      const mediaWithoutOrder = mediaDocuments.filter(m => m.order === undefined);
      console.log(`   🔢 ${mediaWithoutOrder.length} media items without order field`);

      if (mediaWithoutOrder.length === 0) {
        console.log(`   ✅ All media items already have order field`);
        continue;
      }

      // Assign order based on position in sorted array
      const updates: Array<{ _id: ObjectId; order: number }> = [];

      mediaDocuments.forEach((media, index) => {
        if (media.order === undefined) {
          updates.push({
            _id: media._id,
            order: index,
          });
        }
      });

      if (dryRun) {
        console.log(`   🔍 DRY RUN: Would update ${updates.length} documents:`);
        updates.slice(0, 3).forEach(u => {
          const media = mediaDocuments.find(m => m._id.equals(u._id));
          console.log(`      - ${media?.filename} → order: ${u.order}`);
        });
        if (updates.length > 3) {
          console.log(`      ... and ${updates.length - 3} more`);
        }
      } else {
        // Execute bulk update
        const bulkOps = updates.map(({ _id, order }) => ({
          updateOne: {
            filter: { _id },
            update: { $set: { order } },
          },
        }));

        const result = await mediaCollection.bulkWrite(bulkOps);
        console.log(`   ✅ Updated ${result.modifiedCount} documents`);
        totalMediaUpdated += result.modifiedCount;
      }

      totalMediaProcessed += mediaDocuments.length;
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   Total media processed: ${totalMediaProcessed}`);
    if (!dryRun) {
      console.log(`   Total media updated: ${totalMediaUpdated}`);
    } else {
      console.log(`   (Dry run mode - no changes made)`);
    }
    console.log('='.repeat(60));

    // Create index if not in dry run
    if (!dryRun) {
      console.log('\n🔍 Creating compound index on (albumId, order)...');
      await mediaCollection.createIndex({ albumId: 1, order: 1 });
      console.log('✅ Index created successfully');
    } else {
      console.log('\n💡 Recommended: Create index after migration:');
      console.log('   db.media.createIndex({ albumId: 1, order: 1 })');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');

console.log('🚀 Media Order Field Migration Script');
console.log('=' .repeat(60));

if (dryRun) {
  console.log('⚠️  DRY RUN MODE - No changes will be made');
  console.log('   Run with --execute to apply changes');
} else {
  console.log('⚠️  EXECUTE MODE - Changes will be applied!');
  console.log('   Make sure you have backed up your database!');
}

console.log('=' .repeat(60) + '\n');

// Confirm before execute
if (!dryRun) {
  console.log('⏳ Starting migration in 3 seconds...');
  setTimeout(() => {
    migrate(false);
  }, 3000);
} else {
  migrate(true);
}
