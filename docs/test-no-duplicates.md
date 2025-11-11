# Test Case: Verify No Duplicate Media on Upload

## 🧪 Test Scenario

Upload multiple files và kiểm tra không có duplicate trong database.

## 📋 Test Steps

### 1. Preparation
- Mở album detail page trong admin
- Mở browser DevTools Console
- Clear database của album (optional - dùng cleanup button)

### 2. Upload Test
1. Chọn 3-5 ảnh để upload
2. Click upload
3. Đợi upload hoàn tất

### 3. Verification - Console Logs

**Expected logs:**
```
📤 Starting upload: 3 files
📊 Current media count: 0

✅ [0] Upload complete: { filename: 'photo1.jpg', url: '...', hasId: true }
✅ [1] Upload complete: { filename: 'photo2.jpg', url: '...', hasId: true }
✅ [2] Upload complete: { filename: 'photo3.jpg', url: '...', hasId: true }

📊 Upload results: { total: 3, successful: 3, failed: 0 }

🔄 Updating media: {
  previousTotal: 6,      // 3 old + 3 placeholders
  placeholders: 3,       // Should equal number of uploads
  realMedia: 3,          // Old media count
  newUploads: 3,         // Successful uploads
  finalTotal: 6          // Should be realMedia + newUploads
}
```

**Check for issues:**
- ❌ If `finalTotal > realMedia + newUploads` → Still has duplicates
- ✅ If `finalTotal = realMedia + newUploads` → Fixed!

### 4. Verification - Database

Check API response:
```bash
curl https://your-app.vercel.app/api/admin/albums/[albumId]/check-duplicates
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "totalMedia": 6,
    "uniqueUrls": 6,
    "duplicateCount": 0,
    "duplicates": []
  }
}
```

### 5. Verification - UI

- Media grid should show exactly 6 items (not 12)
- No duplicate images visible
- Each image appears only once

## 🐛 If Still Has Duplicates

### Check These:

1. **presign-url callback**
   ```
   ⚠️ Metadata will be saved via /complete-upload endpoint
   ```
   Should NOT see: `✅ Saved media metadata for:`

2. **complete-upload API**
   ```
   ⚠️ Media already exists: ...
   ```
   If you see this, existing duplicates being prevented

3. **Client-side logic**
   ```
   placeholders: X should equal newUploads: X
   ```
   If not equal, some uploads failed

## 🔧 Fix Commands

If duplicates still found:

```bash
# In admin panel: Click "🧹 Cleanup Duplicates" button
# Or via API:
curl -X POST https://your-app.vercel.app/api/admin/albums/[albumId]/cleanup-duplicates
```

## ✅ Success Criteria

- [ ] Console shows correct counts
- [ ] No duplicate warnings in logs
- [ ] Database check returns 0 duplicates
- [ ] UI displays each image once
- [ ] Can upload multiple times without creating duplicates
