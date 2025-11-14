# Technical Implementation Plan - Photo Sorting Feature

## Sprint Breakdown (1 Week / 5 Days)

---

## 🗓️ DAY 1: Database & Backend Foundation

### Morning (4h)
**Task 1.1: Update Schema & Types**
- [ ] Update `MediaDocument` interface trong `/src/types/album.types.ts`
- [ ] Add `order: number` field
- [ ] Update related types

**Task 1.2: Migration Script**
- [ ] Create `/scripts/migrate-add-order-field.ts`
- [ ] Script logic:
  ```typescript
  // Pseudo-code
  for each album:
    get all media sorted by uploadedAt
    for each media (index):
      set media.order = index
  ```
- [ ] Dry-run mode + production mode
- [ ] Backup reminder trong script

**Task 1.3: Database Index**
- [ ] Add compound index: `{ albumId: 1, order: 1 }`
- [ ] Document trong README

### Afternoon (4h)
**Task 1.4: Update Existing Queries**
- [ ] `/src/app/gallery/[token]/page.tsx`: 
  - Change `.sort({ uploadedAt: -1 })` → `.sort({ order: 1 })`
- [ ] `/src/app/admin/albums/[albumId]/page.tsx`: 
  - Fetch media sorted by `order`

**Task 1.5: Update Upload Logic**
- [ ] `/src/app/api/admin/albums/[albumId]/upload/route.ts`
- [ ] Before insert new media:
  ```typescript
  const maxOrder = await db.collection('media')
    .find({ albumId })
    .sort({ order: -1 })
    .limit(1)
    .toArray();
  newMedia.order = (maxOrder[0]?.order ?? -1) + 1;
  ```

**Task 1.6: Testing**
- [ ] Run migration script locally
- [ ] Verify albums hiển thị đúng order
- [ ] Upload new photo → verify order tăng

**Deliverable:** Backend ready, albums sorted by `order` field ✅

---

## 🗓️ DAY 2: API Endpoint cho Reorder

### Morning (4h)
**Task 2.1: Create Reorder API**
- [ ] Create `/src/app/api/admin/albums/[albumId]/reorder/route.ts`
- [ ] Implement PATCH handler:

```typescript
// /src/app/api/admin/albums/[albumId]/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface ReorderRequest {
  mediaOrders: Array<{
    mediaId: string;
    order: number;
  }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const { albumId } = await params;
    const body: ReorderRequest = await request.json();
    const { db } = await connectToDatabase();

    // Validate album exists
    const album = await db.collection('albums').findOne({ 
      _id: new ObjectId(albumId) 
    });
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Bulk update using bulkWrite for performance
    const bulkOps = body.mediaOrders.map(({ mediaId, order }) => ({
      updateOne: {
        filter: { 
          _id: new ObjectId(mediaId),
          albumId: new ObjectId(albumId) // Security: ensure media belongs to album
        },
        update: { $set: { order } }
      }
    }));

    const result = await db.collection('media').bulkWrite(bulkOps);

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Reorder error:', error);
    return NextResponse.json({ 
      error: 'Failed to update order' 
    }, { status: 500 });
  }
}
```

**Task 2.2: API Types**
- [ ] Add types trong `/src/types/index.ts`:
```typescript
export interface ReorderMediaRequest {
  mediaOrders: Array<{
    mediaId: string;
    order: number;
  }>;
}
```

### Afternoon (4h)
**Task 2.3: Test API với Postman/Thunder Client**
- [ ] Test case 1: Valid reorder
- [ ] Test case 2: Invalid albumId (404)
- [ ] Test case 3: Invalid mediaId (security check)
- [ ] Test case 4: Concurrent updates (race condition)

**Task 2.4: Error Handling**
- [ ] Add validation: check all mediaIds belong to album
- [ ] Add transaction support (if MongoDB supports)
- [ ] Add logging

**Deliverable:** Working API endpoint ✅

---

## 🗓️ DAY 3: Frontend - DnD Component

### Morning (4h)
**Task 3.1: Install Dependencies**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Task 3.2: Create Sortable Grid Component**
- [ ] Create `/src/components/admin/MediaSortableGrid.tsx`

```typescript
"use client";

import { useState } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableMediaItem } from './SortableMediaItem';

interface Media {
  id: string;
  url: string;
  filename: string;
  order: number;
  type: 'image' | 'video';
}

interface MediaSortableGridProps {
  initialMedia: Media[];
  albumId: string;
  onSaveSuccess?: () => void;
}

export default function MediaSortableGrid({ 
  initialMedia, 
  albumId,
  onSaveSuccess 
}: MediaSortableGridProps) {
  const [media, setMedia] = useState(initialMedia);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    setMedia((items) => {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      
      const reordered = arrayMove(items, oldIndex, newIndex);
      setHasChanges(true);
      return reordered;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const mediaOrders = media.map((m, index) => ({
        mediaId: m.id,
        order: index
      }));

      const response = await fetch(`/api/admin/albums/${albumId}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaOrders })
      });

      if (!response.ok) throw new Error('Failed to save');

      setHasChanges(false);
      onSaveSuccess?.();
      // Show toast notification
    } catch (error) {
      console.error('Save error:', error);
      // Show error toast
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setMedia(initialMedia);
    setHasChanges(false);
  };

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Order'}
        </button>
        <button
          onClick={handleReset}
          disabled={!hasChanges || isSaving}
          className="px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50"
        >
          Reset
        </button>
      </div>

      {/* Sortable Grid */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={media.map(m => m.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {media.map((item) => (
              <SortableMediaItem key={item.id} media={item} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
```

### Afternoon (4h)
**Task 3.3: Create SortableMediaItem Component**
- [ ] Create `/src/components/admin/SortableMediaItem.tsx`

```typescript
"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Media {
  id: string;
  url: string;
  filename: string;
  type: 'image' | 'video';
}

export function SortableMediaItem({ media }: { media: Media }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: media.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group cursor-grab active:cursor-grabbing"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 bg-white/80 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </div>

      {/* Media Preview */}
      {media.type === 'image' ? (
        <img
          src={media.url}
          alt={media.filename}
          className="w-full h-48 object-cover rounded-lg"
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
          <span className="text-4xl">🎥</span>
        </div>
      )}
    </div>
  );
}
```

**Task 3.4: Visual Polish**
- [ ] Add hover states
- [ ] Add drop zone indicators
- [ ] Add smooth transitions

**Deliverable:** Working drag & drop UI (client-side) ✅

---

## 🗓️ DAY 4: Integration & Polish

### Morning (4h)
**Task 4.1: Update Admin Album Page**
- [ ] Modify `/src/app/admin/albums/[albumId]/page.tsx`
- [ ] Replace static grid with `MediaSortableGrid`
- [ ] Pass album data as props

**Task 4.2: Add Toast Notifications**
- [ ] Install `react-hot-toast` or use Once UI toast
- [ ] Success: "Order saved successfully ✓"
- [ ] Error: "Failed to save order. Please try again."

**Task 4.3: Loading States**
- [ ] Skeleton loader khi fetch media
- [ ] Disable grid khi đang save
- [ ] Spinner trên "Save" button

### Afternoon (4h)
**Task 4.4: Responsive Design**
- [ ] Desktop: 4 columns
- [ ] Tablet: 3 columns
- [ ] Mobile: 2 columns (or disable DnD, show warning)

**Task 4.5: Accessibility**
- [ ] Add keyboard navigation hints
- [ ] ARIA labels cho drag handles
- [ ] Focus management

**Task 4.6: Performance Optimization**
- [ ] Memoize components với `React.memo`
- [ ] Debounce save nếu cần
- [ ] Lazy load images với `loading="lazy"`

**Deliverable:** Polished, production-ready UI ✅

---

## 🗓️ DAY 5: Testing & Documentation

### Morning (4h)
**Task 5.1: Manual Testing Checklist**
- [ ] Upload 10 ảnh → verify order 0-9
- [ ] Drag ảnh #5 lên vị trí #2 → save → reload → verify
- [ ] Delete ảnh #3 → verify orders không bị lỗ
- [ ] Upload ảnh mới → verify order = max + 1
- [ ] Test trên Chrome, Firefox, Safari
- [ ] Test responsive trên tablet

**Task 5.2: Integration Tests**
- [ ] Write test cho reorder API
- [ ] Write test cho migration script
- [ ] Write test cho upload with order

**Task 5.3: E2E Test (Optional)**
```typescript
// tests/e2e/photo-sorting.spec.ts
test('admin can reorder photos', async ({ page }) => {
  await page.goto('/admin/albums/test-album-id');
  
  // Drag photo #3 to position #1
  const photo3 = page.locator('[data-media-id="photo-3"]');
  const photo1 = page.locator('[data-media-id="photo-1"]');
  await photo3.dragTo(photo1);
  
  // Save
  await page.click('button:has-text("Save Order")');
  await expect(page.locator('.toast')).toContainText('saved successfully');
  
  // Reload and verify
  await page.reload();
  const firstPhoto = page.locator('.media-grid > div').first();
  await expect(firstPhoto).toHaveAttribute('data-media-id', 'photo-3');
});
```

### Afternoon (4h)
**Task 5.4: Documentation**
- [ ] Update README với photo sorting feature
- [ ] Document migration script usage
- [ ] Add JSDoc comments cho components
- [ ] Create user guide: "How to reorder photos"

**Task 5.5: Code Review Prep**
- [ ] Run linter: `npm run lint`
- [ ] Run type check: `npx tsc --noEmit`
- [ ] Clean up console.logs
- [ ] Format code: `npm run biome-write`

**Task 5.6: PR Preparation**
- [ ] Create PR với clear description
- [ ] Add screenshots/GIF của DnD action
- [ ] Tag reviewers
- [ ] Link to BA document

**Deliverable:** Feature ready for review & merge ✅

---

## 📦 Dependencies to Install

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install react-hot-toast  # for toast notifications (or use Once UI)
```

---

## 🧪 Testing Commands

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Format
npm run biome-write

# Build test
npm run build

# Run migration (local)
npx tsx scripts/migrate-add-order-field.ts --dry-run
npx tsx scripts/migrate-add-order-field.ts --execute
```

---

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Backup production database
- [ ] Test migration script trên staging DB
- [ ] Verify no breaking changes cho existing features
- [ ] Performance test với album >50 ảnh

### Deployment Steps
1. **Deploy code** (backend + frontend)
2. **Run migration script**:
   ```bash
   # On production server
   node scripts/migrate-add-order-field.js --execute
   ```
3. **Verify migration**:
   ```bash
   # Check sample album
   db.media.find({ albumId: ObjectId('...') }).sort({ order: 1 })
   ```
4. **Monitor error logs** for 24h
5. **User notification**: "New feature: Reorder your photos!"

### Rollback Plan
```bash
# Remove order field
db.media.updateMany({}, { $unset: { order: "" } })

# Revert code deployment
git revert <commit-hash>
```

---

## 📊 Success Metrics (Post-Launch)

- [ ] 0 errors in production logs related to sorting
- [ ] <500ms API response time for reorder
- [ ] Admin can reorder 20 photos in <30 seconds
- [ ] Positive user feedback (NPS survey)

---

## 🔧 Troubleshooting Guide

### Issue: Drag doesn't work on mobile
**Solution:** Disable DnD on mobile, show "Please use desktop" message

### Issue: Order gets out of sync
**Solution:** Add "Recalculate Order" admin tool:
```typescript
// Reset orders to sequential 0, 1, 2, ...
const media = await db.collection('media')
  .find({ albumId })
  .sort({ uploadedAt: 1 })
  .toArray();

const bulkOps = media.map((m, index) => ({
  updateOne: {
    filter: { _id: m._id },
    update: { $set: { order: index } }
  }
}));

await db.collection('media').bulkWrite(bulkOps);
```

### Issue: Performance lag với 100+ ảnh
**Solution:** Implement virtualization với `react-window`

---

**Plan Version:** 1.0  
**Estimated Effort:** 40 hours (1 sprint)  
**Status:** Ready to Execute  
**Next Step:** Day 1, Task 1.1 - Update Schema
