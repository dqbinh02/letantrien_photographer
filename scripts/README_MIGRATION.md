# Migration Script: Add Order Field

## Overview
This migration adds the `order` field to all existing `MediaDocument` records in MongoDB. The order is assigned based on the `uploadedAt` timestamp (oldest photo gets order 0, newest gets order n-1).

## Prerequisites
- Node.js installed
- MongoDB running and accessible
- `.env.local` file configured with `MONGODB_URI`
- **BACKUP YOUR DATABASE FIRST!**

## Installation

```bash
# Install dependencies (if not already installed)
npm install --save-dev tsx dotenv @types/node
```

## Usage

### 1. Dry Run (Preview Changes)
**Always run this first to see what will be changed:**

```bash
npx tsx scripts/migrate-add-order-field.ts --dry-run
```

This will show:
- How many albums were found
- How many media items per album
- Which items will be updated
- Preview of order values that will be assigned

### 2. Execute Migration

**⚠️ Only run this after:**
- Backing up your database
- Reviewing dry-run output
- Confirming changes look correct

```bash
npx tsx scripts/migrate-add-order-field.ts --execute
```

## What This Script Does

1. **Connects to MongoDB** using your `.env.local` credentials
2. **Fetches all albums** from the database
3. **For each album:**
   - Finds all media sorted by `uploadedAt` (oldest first)
   - Assigns `order = 0, 1, 2, ...` based on position
   - Updates documents that don't have `order` field
4. **Creates index** on `{ albumId: 1, order: 1 }` for query performance

## Example Output

### Dry Run Mode:
```
🚀 Media Order Field Migration Script
============================================================
⚠️  DRY RUN MODE - No changes will be made
   Run with --execute to apply changes
============================================================

🔗 Connecting to MongoDB...
✅ Connected to MongoDB

📚 Found 3 albums

🎨 Processing album: "Summer Wedding 2025" (507f1f77bcf86cd799439011)
   📸 Found 15 media items
   🔢 15 media items without order field
   🔍 DRY RUN: Would update 15 documents:
      - IMG_001.jpg → order: 0
      - IMG_002.jpg → order: 1
      - IMG_003.jpg → order: 2
      ... and 12 more

============================================================
📊 Migration Summary:
   Total media processed: 45
   (Dry run mode - no changes made)
============================================================

💡 Recommended: Create index after migration:
   db.media.createIndex({ albumId: 1, order: 1 })
```

### Execute Mode:
```
🚀 Media Order Field Migration Script
============================================================
⚠️  EXECUTE MODE - Changes will be applied!
   Make sure you have backed up your database!
============================================================
⏳ Starting migration in 3 seconds...

[... processing ...]

============================================================
📊 Migration Summary:
   Total media processed: 45
   Total media updated: 45
============================================================

🔍 Creating compound index on (albumId, order)...
✅ Index created successfully

👋 Disconnected from MongoDB
```

## Rollback

If you need to rollback (remove `order` field):

```javascript
// Connect to mongo shell or use MongoDB Compass
db.media.updateMany({}, { $unset: { order: "" } })
```

## Verification

After migration, verify the results:

```javascript
// Check a sample album's media order
db.media.find({ albumId: ObjectId("your-album-id") }).sort({ order: 1 })

// Verify all media have order field
db.media.countDocuments({ order: { $exists: false } })
// Should return 0

// Check index exists
db.media.getIndexes()
// Should see { albumId: 1, order: 1 }
```

## Troubleshooting

### Error: "MONGODB_URI not found"
- Check `.env.local` file exists in project root
- Verify `MONGODB_URI` variable is set correctly

### Error: "Cannot find module 'dotenv'"
- Run: `npm install --save-dev dotenv tsx`

### Some media already have `order` field
- Script safely skips media that already have `order`
- Only updates documents missing the field

### Order values seem wrong
- Order is based on `uploadedAt` timestamp
- Oldest photo = order 0
- If you want different ordering, manually adjust after migration or use the reorder UI (coming in Day 2-4)

## Next Steps

After successful migration:
1. ✅ All existing media now have `order` field
2. ✅ New uploads will automatically get `order = max + 1` (implemented in complete-upload route)
3. ✅ Public APIs now sort by `order` instead of `uploadedAt`
4. 🚧 Continue with Day 2: Build reorder API
5. 🚧 Continue with Day 3-4: Build drag & drop UI

## Safety Features

- **Dry run by default**: Prevents accidental execution
- **3-second delay**: Time to cancel if executed by mistake
- **Bulk operations**: Efficient updates, all-or-nothing per album
- **Existing order preserved**: Skips media that already have order field
- **Logging**: Detailed output for every step

---

**Created:** November 14, 2025  
**Author:** Day 1 Implementation  
**Status:** Ready to use
