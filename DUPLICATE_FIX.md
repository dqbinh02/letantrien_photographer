# Fixed: Duplicate Media Upload Issue

## Problem
Media files were being duplicated when uploaded through the admin panel.

## Root Cause
Upload flow was inserting media into database **twice**:
1. Via `onUploadCompleted` callback in presign-url API
2. Via explicit `complete-upload` API call from client

## Solution
- ✅ Removed database insertion from `onUploadCompleted` callback
- ✅ Fixed optimistic update logic to properly replace placeholders
- ✅ Simplified replace logic: remove all placeholders, add all successful uploads

## Files Changed
- `src/app/api/admin/albums/[albumId]/presign-url/route.ts` - Removed database save from callback
- `src/app/admin/albums/[albumId]/page.tsx` - Fixed placeholder replacement logic

## Result
- ✅ No more duplicate media entries
- ✅ Upload flow works correctly in both local and production
- ✅ Cleaner, more predictable code