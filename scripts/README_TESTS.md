# Test Scripts for Reorder API

This directory contains test scripts to verify the photo reordering functionality.

---

## Prerequisites

1. **MongoDB Connection:** Ensure `.env.local` has valid `MONGODB_URI`
2. **Test Data:** At least 1 album with 2+ media items

---

## Test Scripts

### 1. Database Logic Test
**File:** `test-reorder-api.ts`

Tests the core reordering logic by directly interacting with MongoDB.

**What it tests:**
- Finding albums with media
- Fetching media sorted by order
- Reversing order of all media
- Bulk update operations
- Verification of changes
- Restoring original state

**Usage:**
```bash
npx tsx scripts/test-reorder-api.ts
```

**No server required** - connects directly to MongoDB.

**Expected Output:**
```
✅ Found album: 6915db0fb92390306b9a8e45 (ALohfj)
✅ Found 14 media items
✅ Bulk update completed: Matched: 14, Modified: 14
✅ Test completed successfully!
```

---

### 2. HTTP Integration Test
**File:** `test-reorder-http.ts`

Tests the actual HTTP endpoint through the Next.js API routes.

**What it tests:**
- HTTP PATCH requests to `/api/admin/albums/[albumId]/reorder`
- Request/response cycle
- Database changes after HTTP call
- Restoring original order

**Usage:**
```bash
# Terminal 1: Start development server
npm run dev

# Terminal 2: Run HTTP test
npx tsx scripts/test-reorder-http.ts
```

**Requires:** Development server running on port 3000

**Expected Output:**
```
🔄 Sending PATCH request to reorder endpoint...
   Status: 200 OK
   Response: { success: true, message: "Order updated successfully", updatedCount: 14 }
✅ HTTP Integration Test PASSED!
```

---

### 3. Validation Test Suite
**File:** `test-reorder-validation.ts`

Tests error handling and validation logic with various edge cases.

**What it tests:**
- Invalid album ID format
- Album not found (404)
- Missing/invalid request body
- Empty mediaOrders array
- Invalid mediaId format
- Negative order values
- Security: media not belonging to album

**Usage:**
```bash
# Start dev server first
npm run dev

# Run validation tests
npx tsx scripts/test-reorder-validation.ts
```

**Requires:** Development server running

**Expected Output:**
```
🧪 Invalid album ID format... ✅ PASS
🧪 Album not found... ✅ PASS
🧪 Missing mediaOrders field... ✅ PASS
🧪 mediaOrders is not array... ✅ PASS
🧪 Empty mediaOrders array... ✅ PASS
🧪 Invalid mediaId format... ✅ PASS
🧪 Missing order field... ✅ PASS
🧪 Negative order value... ✅ PASS
🧪 Media does not belong to album... ✅ PASS

📊 Test Results: 9 passed, 0 failed
✅ All validation tests passed!
```

---

### 4. Database Inspector
**File:** `debug-database.ts`

Utility script to inspect database structure and media order.

**What it shows:**
- All albums and their properties
- All media documents with order field
- Current order values

**Usage:**
```bash
npx tsx scripts/debug-database.ts
```

**Example Output:**
```
📂 Albums Collection:
   Total albums: 1
   - ID: 6915db0fb92390306b9a8e45
     Title: ALohfj
     Media array length: 0

📸 Media Collection:
   Total media documents: 14
   1. ID: 6915db1cb92390306b9a8e46 - Order: 0
   2. ID: 6915db1cb92390306b9a8e47 - Order: 1
   ...
```

---

## Running All Tests

To run the complete test suite:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests sequentially
npx tsx scripts/test-reorder-api.ts && \
npx tsx scripts/test-reorder-http.ts && \
npx tsx scripts/test-reorder-validation.ts

# Output should show all tests passing ✅
```

---

## Test Coverage

### Unit Tests (Database Logic)
- [x] Find album with media
- [x] Sort media by order field
- [x] Bulk update operations
- [x] Verify order changes
- [x] Restore original state

### Integration Tests (HTTP)
- [x] PATCH request to reorder endpoint
- [x] Response format validation
- [x] Database persistence after HTTP call
- [x] Network error handling

### Validation Tests
- [x] Invalid album ID format → 400
- [x] Album not found → 404
- [x] Missing request body → 400
- [x] Invalid mediaOrders type → 400
- [x] Empty array → 400
- [x] Invalid mediaId format → 400
- [x] Missing order field → 400
- [x] Negative order → 400
- [x] Media ownership check → 403

---

## Troubleshooting

### "Connection refused" error
**Problem:** Dev server not running  
**Solution:** Start dev server with `npm run dev`

### "No media found" error
**Problem:** Empty database  
**Solution:** Upload some photos through the admin UI first

### "MONGODB_URI not found" error
**Problem:** Missing environment variable  
**Solution:** Ensure `.env.local` exists with valid MongoDB connection string

### TypeScript errors
**Problem:** Missing dependencies  
**Solution:** Run `pnpm install`

---

## Next Steps

After all tests pass:
1. ✅ Day 2 complete - Backend API verified
2. 🎯 Day 3 - Build drag-and-drop UI
3. 🎯 Day 4 - Integration and polish
4. 🎯 Day 5 - Final testing and documentation

---

## Test Data Requirements

Minimum required test data:
- 1 album (created via admin UI)
- 2+ media items (uploaded to that album)

For comprehensive testing:
- 10+ media items recommended
- Multiple albums to test isolation

---

## Performance Notes

**Database Test:** ~100-200ms (direct MongoDB)  
**HTTP Test:** ~200-500ms (includes Next.js overhead)  
**Validation Test:** ~1-2 seconds (9 test cases)

All tests are safe to run on production database - they restore original state after testing.
