# Business Analysis: Tính năng Sắp xếp Ảnh trong Album

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Mục tiêu Business
- Cho phép admin sắp xếp thứ tự hiển thị ảnh trong album một cách linh hoạt
- Cải thiện trải nghiệm người xem với album được tổ chức logic
- Tăng tính chuyên nghiệp của gallery website

### 1.2 Stakeholders
- **Admin/Photographer**: Người cần sắp xếp ảnh theo ý muốn
- **End Users/Clients**: Xem album với thứ tự ảnh đã được sắp xếp
- **Developer**: Implement và maintain tính năng

### 1.3 Success Metrics
- Admin có thể sắp xếp ảnh trong < 30 giây
- Không có downtime khi sắp xếp
- Thứ tự ảnh được persist và hiển thị chính xác cho end users
- UI/UX intuitive, không cần training

---

## 2. YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

### 2.1 User Stories

#### US-001: Admin sắp xếp ảnh bằng Drag & Drop
**As an** admin  
**I want to** drag and drop ảnh để sắp xếp thứ tự  
**So that** tôi có thể tổ chức album theo ý muốn một cách nhanh chóng

**Acceptance Criteria:**
- Admin vào trang `/admin/albums/[albumId]`
- Thấy tất cả ảnh trong album hiện tại
- Có thể kéo (drag) ảnh từ vị trí này sang vị trí khác
- Visual feedback khi đang drag (ghost image, drop zone highlight)
- Thứ tự mới được lưu tự động hoặc có nút "Save Order"
- Toast notification xác nhận lưu thành công

#### US-002: Xem album với thứ tự đã sắp xếp
**As a** website visitor  
**I want to** xem ảnh theo thứ tự mà photographer đã sắp xếp  
**So that** tôi thấy album có cấu trúc và story logic

**Acceptance Criteria:**
- Truy cập `/gallery/[token]`
- Ảnh hiển thị theo thứ tự đã được admin sắp xếp
- Thứ tự consistent qua nhiều lần reload trang
- Masonry layout vẫn giữ thứ tự từ trái sang phải, trên xuống dưới

#### US-003: Sắp xếp tự động (Optional Enhancement)
**As an** admin  
**I want to** có options sắp xếp tự động (date, name, file size)  
**So that** tôi có điểm khởi đầu trước khi fine-tune thủ công

**Acceptance Criteria:**
- Dropdown/button group: "Sort by Date", "Sort by Name", "Sort by Size"
- Click → ảnh được sắp xếp theo tiêu chí
- Có thể tiếp tục drag & drop để adjust sau khi auto-sort

---

## 3. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

### 3.1 Performance
- Drag & drop response time: < 100ms
- Save order API call: < 500ms
- Load album with custom order: không chậm hơn 10% so với hiện tại

### 3.2 Scalability
- Hỗ trợ album với 100+ ảnh mà không lag UI
- Database query optimized với index trên `order` field

### 3.3 Usability
- Mobile responsive: có thể sắp xếp trên tablet (optional cho phone)
- Accessibility: keyboard navigation support (arrows + space)

### 3.4 Reliability
- Conflict resolution nếu nhiều admin cùng lúc (low priority - single admin)
- Rollback mechanism nếu lưu thất bại

---

## 4. DATA MODEL CHANGES

### 4.1 MediaDocument Schema Update

**Current:**
```typescript
interface MediaDocument {
  _id?: ObjectId;
  albumId: ObjectId;
  url: string;
  type: "image" | "video";
  filename: string;
  uploadedAt: Date;
}
```

**Proposed:**
```typescript
interface MediaDocument {
  _id?: ObjectId;
  albumId: ObjectId;
  url: string;
  type: "image" | "video";
  filename: string;
  uploadedAt: Date;
  order: number;  // NEW: Thứ tự hiển thị (0, 1, 2, ...)
}
```

### 4.2 Migration Strategy
1. **Backward Compatible**: Thêm field `order` với default value
2. **Data Migration Script**: 
   - Tìm tất cả media documents không có `order`
   - Set `order = index` based on `uploadedAt` (oldest = 0)
3. **Index Creation**: `db.media.createIndex({ albumId: 1, order: 1 })`

---

## 5. TECHNICAL ARCHITECTURE

### 5.1 Tech Stack
- **Frontend**: React 19, Next.js 15, TypeScript
- **Drag & Drop**: `@dnd-kit/core` + `@dnd-kit/sortable` (modern, accessible)
- **Backend**: Next.js API Routes
- **Database**: MongoDB với indexed `order` field

### 5.2 Component Architecture

```
/admin/albums/[albumId]/
├── page.tsx (Server Component)
│   └── Fetch album + media with order
│
└── components/
    ├── MediaSortableGrid.tsx (Client Component)
    │   ├── DnD context provider
    │   ├── SortableItem wrapper for each media
    │   └── Auto-sort controls
    │
    └── MediaGridItem.tsx
        ├── Thumbnail display
        ├── Drag handle
        └── Delete/Edit actions
```

### 5.3 API Endpoints

#### PATCH `/api/admin/albums/[albumId]/reorder`
**Request:**
```json
{
  "mediaOrders": [
    { "mediaId": "abc123", "order": 0 },
    { "mediaId": "def456", "order": 1 },
    { "mediaId": "ghi789", "order": 2 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order updated successfully",
  "updatedCount": 3
}
```

**Logic:**
1. Validate albumId ownership (admin check)
2. Bulk update: `db.media.bulkWrite()` for performance
3. Return count of updated documents

---

## 6. USER INTERFACE DESIGN

### 6.1 Admin Album Page UI
```
┌─────────────────────────────────────────────────────────┐
│  Album: "Summer Wedding 2025"                   [Save]  │
├─────────────────────────────────────────────────────────┤
│  Sort by: [Date ▼] [Name] [Manual]              [↻]    │
├─────────────────────────────────────────────────────────┤
│  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐           │
│  │ IMG 1 │  │ IMG 2 │  │ IMG 3 │  │ IMG 4 │           │
│  │ [:::] │  │ [:::] │  │ [:::] │  │ [:::] │  ← Drag   │
│  │  📷   │  │  📷   │  │  📷   │  │  📷   │    Handle │
│  └───────┘  └───────┘  └───────┘  └───────┘           │
│                                                         │
│  ┌───────┐  ┌───────┐  ┌───────┐                      │
│  │ IMG 5 │  │ IMG 6 │  │ IMG 7 │                      │
│  │ [:::] │  │ [:::] │  │ [:::] │                      │
│  │  📷   │  │  📷   │  │  📷   │                      │
│  └───────┘  └───────┘  └───────┘                      │
└─────────────────────────────────────────────────────────┘

Legend:
[:::] = Drag handle (6 dots icon)
[Save] = Save order button (appears when changes made)
[↻] = Reset to original order
```

### 6.2 Interaction States
- **Idle**: Normal grid display
- **Dragging**: 
  - Source item: 50% opacity
  - Drop zone: Blue dashed border
  - Cursor: `grabbing`
- **Saving**: Spinner + disabled state
- **Success**: Green toast "Order saved successfully"
- **Error**: Red toast "Failed to save order. Please try again."

---

## 7. IMPLEMENTATION PLAN

### Phase 1: Foundation (Week 1)
**Tasks:**
- [ ] Update `MediaDocument` schema với `order` field
- [ ] Write migration script để set default `order` values
- [ ] Create index `{ albumId: 1, order: 1 }`
- [ ] Update `getAlbumByToken()` query để sort by `order`
- [ ] Update upload API để set `order = maxOrder + 1`

**Deliverable:** Backend ready, albums hiển thị theo order

### Phase 2: Drag & Drop UI (Week 2)
**Tasks:**
- [ ] Install `@dnd-kit/core`, `@dnd-kit/sortable`
- [ ] Create `MediaSortableGrid.tsx` component
- [ ] Implement drag & drop logic
- [ ] Add visual feedback (ghost, drop zones)
- [ ] Local state management cho order changes

**Deliverable:** Working drag & drop (client-side only)

### Phase 3: API Integration (Week 2)
**Tasks:**
- [ ] Create API route `/api/admin/albums/[albumId]/reorder`
- [ ] Implement bulk update logic
- [ ] Connect UI "Save" button → API call
- [ ] Add loading/error states
- [ ] Toast notifications

**Deliverable:** End-to-end sắp xếp và lưu

### Phase 4: Enhancements (Week 3 - Optional)
**Tasks:**
- [ ] Auto-sort options (Date, Name, Size)
- [ ] Keyboard navigation (arrows + space to reorder)
- [ ] Mobile/tablet optimization
- [ ] Undo/Redo functionality
- [ ] Conflict resolution (if needed)

**Deliverable:** Polished, production-ready feature

---

## 8. TESTING STRATEGY

### 8.1 Unit Tests
- `reorder` API logic
- Order calculation functions
- Media query sorting

### 8.2 Integration Tests
- Drag item #3 to position #1 → verify order update
- Upload new media → verify order = max + 1
- Delete media → verify orders remain consistent

### 8.3 E2E Tests (Playwright)
1. Login as admin
2. Navigate to album
3. Drag image from position 5 to position 2
4. Click "Save Order"
5. Refresh page
6. Verify new order persisted
7. Check public gallery → verify same order

### 8.4 Performance Tests
- Album with 100 images: drag should be smooth
- Bulk update 100+ media: < 1s API response

---

## 9. RISKS & MITIGATION

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Drag & drop lag trên album lớn | High | Medium | Virtualization với `react-window` nếu >50 ảnh |
| Race condition khi multi-admin | Medium | Low | Optimistic locking hoặc last-write-wins |
| Migration script fail | High | Low | Backup database trước migration, rollback plan |
| Browser compatibility | Medium | Low | Test trên Chrome, Firefox, Safari; polyfills nếu cần |
| Mobile UX phức tạp | Low | Medium | Desktop-first, mobile = read-only hoặc simple sort |

---

## 10. DEPENDENCIES

### 10.1 Libraries
```json
{
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/utilities": "^3.2.2"
}
```

### 10.2 External Services
- None (fully self-contained)

---

## 11. ROLLOUT PLAN

### 11.1 Development
- Branch: `feature/photo-sorting`
- PR review by lead developer
- QA testing trên staging environment

### 11.2 Staging Deployment
1. Deploy migration script (dry-run mode)
2. Deploy application code
3. Test with sample albums
4. Performance profiling

### 11.3 Production Deployment
1. Maintenance window announcement (if needed)
2. Run migration script (< 1 minute expected)
3. Deploy application
4. Monitor error logs for 24h
5. Collect user feedback

### 11.4 Rollback Plan
- Keep previous deployment ready
- Revert database migration:
  ```javascript
  db.media.updateMany({}, { $unset: { order: "" } })
  ```

---

## 12. COST ANALYSIS

### 12.1 Development Time
- Backend (migration, API): 8 hours
- Frontend (UI, DnD): 16 hours
- Testing: 8 hours
- Documentation: 4 hours
**Total:** ~36 hours (~1 week sprint)

### 12.2 Infrastructure Cost
- No additional cost (uses existing MongoDB, Next.js)
- Minimal storage increase (~4 bytes per media document)

### 12.3 Maintenance
- Low maintenance (stable feature)
- Future enhancements: ~4h per quarter

---

## 13. CONCLUSION

Tính năng sắp xếp ảnh trong album là một enhancement quan trọng giúp photographer tổ chức và present work một cách chuyên nghiệp. Với tech stack hiện tại và architecture đề xuất, implementation là feasible, low-risk, và high-value.

**Recommendation:** Proceed với Phase 1-3 (core functionality). Phase 4 enhancements có thể defer dựa trên user feedback sau initial release.

---

## APPENDIX A: Technical Spike - @dnd-kit Example

```tsx
// MediaSortableGrid.tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableMediaItem({ media }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: media.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <img src={media.url} alt={media.filename} />
    </div>
  );
}

export default function MediaSortableGrid({ media, onReorder }) {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      // Reorder logic
      const oldIndex = media.findIndex(m => m.id === active.id);
      const newIndex = media.findIndex(m => m.id === over.id);
      onReorder(arrayMove(media, oldIndex, newIndex));
    }
  };
  
  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={media} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-4 gap-4">
          {media.map(m => <SortableMediaItem key={m.id} media={m} />)}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

---

**Document Version:** 1.0  
**Last Updated:** November 14, 2025  
**Author:** GitHub Copilot (Technical BA)  
**Status:** Ready for Review & Approval
