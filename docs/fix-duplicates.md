# Fix Gallery Duplicate Images on Vercel

## 🐛 Problem
Gallery displays duplicate images on Vercel production but works fine locally.

## 🔍 Root Cause
The production database on Vercel contains duplicate media entries with the same URL. This happens when:
1. Upload process calls `complete-upload` API multiple times for the same file
2. Network issues cause retry requests
3. Race conditions during parallel uploads

## ✅ Solutions Implemented

### 1. **Client-Side Deduplication** (Gallery Page)
The gallery now automatically filters out duplicate URLs before rendering:

```tsx
// Remove duplicate URLs
const uniqueImages = Array.from(new Set(imgs));
```

### 2. **API Prevention** (Complete Upload)
The API now checks if media already exists before inserting:

```tsx
// Check if media with same URL already exists
const existingMedia = await db
  .collection<MediaDocument>("media")
  .findOne({ 
    albumId: new ObjectId(albumId),
    url: url 
  });

if (existingMedia) {
  // Return existing instead of creating duplicate
  return NextResponse.json({ success: true, data: existingMedia });
}
```

### 3. **Admin Cleanup Tool**
Added a "Cleanup Duplicates" button in the album admin panel that:
- Scans for duplicate media entries
- Keeps the oldest entry (first uploaded)
- Deletes all duplicates
- Shows results in toast notification

### 4. **Enhanced Logging**
Added comprehensive logging to track:
- API requests and responses
- Duplicate detection
- Cleanup operations

## 🚀 How to Fix Existing Duplicates on Vercel

### Option 1: Use Admin Panel (Recommended)
1. Go to album detail page in admin panel
2. Click "🧹 Cleanup Duplicates" button in Album Information section
3. Confirm the action
4. Wait for success message

### Option 2: Use API Endpoints

**Check for duplicates:**
```bash
curl https://your-app.vercel.app/api/admin/albums/[albumId]/check-duplicates
```

**Cleanup duplicates:**
```bash
curl -X POST https://your-app.vercel.app/api/admin/albums/[albumId]/cleanup-duplicates
```

### Option 3: Run Cleanup Script Locally
```bash
# Connect to production database
MONGODB_URI="your-production-uri" npx tsx scripts/remove-duplicates.ts
```

## 📊 Monitoring

Check browser console logs when viewing gallery:
```
🔄 Fetching album with token: xxx
📦 Raw media from API: X items
🖼️ Images after filter: Y
✨ Unique images: Z
```

If Y ≠ Z, duplicates were found and removed client-side.

Check Vercel server logs for:
```
⚠️ WARNING: Album has X duplicate media entries in database!
```

## 🛡️ Prevention

Going forward, duplicates are prevented by:
1. ✅ API checks before insert
2. ✅ Client-side deduplication as backup
3. ✅ Better error handling in upload flow
4. ✅ Proper cleanup on failed uploads

## 🔗 Related Files
- `/src/app/gallery/[token]/page.tsx` - Client deduplication
- `/src/app/api/admin/albums/[albumId]/complete-upload/route.ts` - API prevention
- `/src/app/api/admin/albums/[albumId]/cleanup-duplicates/route.ts` - Cleanup endpoint
- `/src/app/api/admin/albums/[albumId]/check-duplicates/route.ts` - Check endpoint
- `/scripts/remove-duplicates.ts` - CLI cleanup script
