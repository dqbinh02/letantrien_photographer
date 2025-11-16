/**
 * Migration Script: Add theme field to existing albums
 * 
 * This script adds the 'theme' field with default value 'light' to all existing albums
 * that don't have this field yet.
 * 
 * Usage:
 *   npx tsx scripts/migrate-add-theme-field.ts
 */

import { connectToDatabase } from "../src/lib/mongodb";
import type { AlbumDocument } from "../src/types";

async function migrateAddThemeField() {
  console.log("🔄 Starting migration: Add theme field to albums...\n");

  try {
    const { db } = await connectToDatabase();
    const albumsCollection = db.collection<AlbumDocument>("albums");

    // Find albums without theme field
    const albumsWithoutTheme = await albumsCollection
      .find({ theme: { $exists: false } })
      .toArray();

    console.log(`📊 Found ${albumsWithoutTheme.length} albums without theme field\n`);

    if (albumsWithoutTheme.length === 0) {
      console.log("✅ All albums already have theme field. Migration not needed.");
      return;
    }

    // Update all albums without theme field
    const result = await albumsCollection.updateMany(
      { theme: { $exists: false } },
      { $set: { theme: "light" } }
    );

    console.log(`✅ Migration completed successfully!`);
    console.log(`   - Matched: ${result.matchedCount} albums`);
    console.log(`   - Modified: ${result.modifiedCount} albums`);
    console.log(`   - Default theme set to: 'light'\n`);

    // Verify migration
    const allAlbums = await albumsCollection.find({}).toArray();
    const albumsWithTheme = allAlbums.filter((album) => album.theme);

    console.log(`📊 Verification:`);
    console.log(`   - Total albums: ${allAlbums.length}`);
    console.log(`   - Albums with theme: ${albumsWithTheme.length}`);
    console.log(`   - Albums without theme: ${allAlbums.length - albumsWithTheme.length}`);

    if (albumsWithTheme.length === allAlbums.length) {
      console.log("\n✅ All albums now have theme field!");
    } else {
      console.log("\n⚠️  Some albums still missing theme field");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateAddThemeField()
  .then(() => {
    console.log("\n✨ Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration script failed:", error);
    process.exit(1);
  });
