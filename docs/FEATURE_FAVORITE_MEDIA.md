# Feature: Favorite/Like Media

## Overview
Admin có thể đánh dấu "favorite" (tim) vào các media trong trang edit album. Icon tim sẽ hiển thị cho viewer khi xem gallery với token.

## Requirements

### 1. Admin - Mark Media as Favorite
- **Location**: Admin edit album page
- **UI**: Checkbox hoặc heart icon toggle để đánh dấu favorite
- **Action**: Update media document với field `isFavorite: boolean`

### 2. Gallery - Display Favorite Icon
- **Condition**: Chỉ hiển thị khi có token trong URL (giống download button)
- **Position**: Top-right của media item (phía trên), trong khung ảnh
- **Style**: 
  - Heart icon (filled) màu đỏ hoặc trắng
  - Position absolute, top-right
  - Fade-in on hover (giống download button)
  - Nằm trên cùng một media item với download button

---

## Implementation Plan

### Phase 1: Database Schema

#### 1.1. Update MediaDocument Type

**File**: `src/types/album.types.ts`

**Changes**:
```typescript
export interface MediaDocument {
  _id?: ObjectId;
  albumId: ObjectId;
  url: string;
  type: "image" | "video";
  filename: string;
  isPublished: boolean;
  isFavorite?: boolean; // NEW: Mark as favorite by admin
  uploadedAt: Date;
  order: number;
}
```

---

### Phase 2: Admin - Toggle Favorite

#### 2.1. Backend API - Toggle Favorite

**File**: `src/app/api/admin/media/[mediaId]/toggle-favorite/route.ts` (NEW)

**Endpoint**: `PATCH /api/admin/media/{mediaId}/toggle-favorite`

**Implementation**:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import type { MediaDocument } from "@/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { mediaId } = await params;
    
    if (!ObjectId.isValid(mediaId)) {
      return NextResponse.json(
        { success: false, error: "Invalid media ID" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Get current media
    const media = await db.collection<MediaDocument>("media").findOne({
      _id: new ObjectId(mediaId),
    });
    
    if (!media) {
      return NextResponse.json(
        { success: false, error: "Media not found" },
        { status: 404 }
      );
    }
    
    // Toggle favorite
    const newFavoriteState = !(media.isFavorite ?? false);
    
    await db.collection<MediaDocument>("media").updateOne(
      { _id: new ObjectId(mediaId) },
      { $set: { isFavorite: newFavoriteState } }
    );
    
    return NextResponse.json({
      success: true,
      data: { isFavorite: newFavoriteState },
    });
    
  } catch (error) {
    console.error("Toggle favorite error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}
```

#### 2.2. Frontend - Admin Edit Page

**File**: `src/components/admin/SortableMediaItem.tsx`

**Changes**: Thêm heart icon toggle button

```tsx
import { FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';

// Add to component props
interface SortableMediaItemProps {
  media: MediaDocument;
  onTogglePublish: (mediaId: string) => void;
  onToggleFavorite?: (mediaId: string) => void; // NEW
  onDelete: (mediaId: string) => void;
}

// Add favorite toggle button in the UI
<button
  onClick={(e) => {
    e.stopPropagation();
    onToggleFavorite?.(media._id!.toString());
  }}
  title={media.isFavorite ? "Remove from favorites" : "Add to favorites"}
  style={{
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'rgba(0, 0, 0, 0.6)',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 10,
  }}
>
  {media.isFavorite ? (
    <FaHeart color="#ff4444" size={16} />
  ) : (
    <FiHeart color="white" size={16} />
  )}
</button>
```

**File**: `src/app/admin/albums/[albumId]/page.tsx`

**Changes**: Add handler for toggle favorite

```typescript
const handleToggleFavorite = useCallback(async (mediaId: string) => {
  try {
    const response = await fetch(`/api/admin/media/${mediaId}/toggle-favorite`, {
      method: 'PATCH',
    });

    const result = await response.json();

    if (result.success) {
      // Update local state optimistically
      setAlbumDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          media: prev.media.map((m) =>
            m._id?.toString() === mediaId
              ? { ...m, isFavorite: result.data.isFavorite }
              : m
          ),
        };
      });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
  }
}, []);

// Pass to SortableMediaGrid
<SortableMediaGrid
  media={albumDetail.media}
  onReorder={handleReorder}
  onTogglePublish={handleTogglePublish}
  onToggleFavorite={handleToggleFavorite} // NEW
  onDelete={handleDeleteMedia}
/>
```

---

### Phase 3: Gallery - Display Favorite Icon

#### 3.1. Frontend - GalleryView Component

**File**: `src/components/gallery/GalleryView.tsx`

**Changes**: Add heart icon overlay (only when hasToken)

```tsx
import { FaHeart } from 'react-icons/fa';

// In the map function where we render images:
<div 
  key={image._id?.toString() || `image-${index}`}
  className="media-item-container"
  style={{ position: 'relative' }}
>
  <Image
    src={image.url}
    alt={image.filename}
    // ...existing props
  />
  
  {/* Favorite Icon - Top Right (only with token AND if marked as favorite) */}
  {hasToken && image.isFavorite && (
    <div className="favorite-overlay">
      <FaHeart color="#ff4444" size={20} />
    </div>
  )}
  
  {/* Download Button - Bottom Right (only with token) */}
  {hasToken && (
    <button 
      className="download-overlay"
      onClick={(e) => handleDownload(image, e)}
      title="Download"
    >
      <svg 
        width="20" 
        height="20" 
        // ...existing svg
      </svg>
    </button>
  )}
</div>
```

#### 3.2. CSS Styles

**File**: `src/resources/custom.css`

**Changes**: Add favorite icon styles

```css
/* Favorite icon overlay - top right */
.favorite-overlay {
	position: absolute;
	top: 12px;
	right: 12px;
	background: rgba(0, 0, 0, 0.7);
	padding: 10px;
	border-radius: 50%;
	opacity: 0;
	transition: opacity 0.2s ease;
	z-index: 10;
	display: flex;
	align-items: center;
	justify-content: center;
	pointer-events: none; /* Not clickable, just display */
}

.media-item-container:hover .favorite-overlay {
	opacity: 1;
}
```

---

## Testing Checklist

### Admin Features
- [ ] Admin có thể toggle favorite trên media item
- [ ] Heart icon filled (đỏ) khi đã favorite
- [ ] Heart icon outline (trắng) khi chưa favorite
- [ ] Toggle favorite update ngay lập tức (optimistic update)
- [ ] API toggle-favorite hoạt động đúng
- [ ] Database lưu trạng thái isFavorite

### Gallery Display
- [ ] **Favorite icon CHỈ hiển thị khi có token trong URL**
- [ ] Favorite icon KHÔNG hiển thị khi không có token
- [ ] Favorite icon hiển thị ở top-right của media
- [ ] Download button vẫn ở bottom-right (không conflict)
- [ ] Cả 2 icons đều fade-in on hover
- [ ] Favorite icon chỉ hiển thị trên media được đánh dấu isFavorite
- [ ] Icon không clickable (chỉ hiển thị)

### Layout
- [ ] Favorite icon không làm thay đổi layout
- [ ] Favorite icon có z-index phù hợp
- [ ] Cả 2 icons (heart + download) hiển thị rõ ràng
- [ ] Hover effect mượt mà

---

## Files to Create/Modify

### New Files
1. `src/app/api/admin/media/[mediaId]/toggle-favorite/route.ts`

### Modified Files
1. `src/types/album.types.ts` - Add isFavorite to MediaDocument
2. `src/components/admin/SortableMediaItem.tsx` - Add favorite toggle button
3. `src/app/admin/albums/[albumId]/page.tsx` - Add handleToggleFavorite
4. `src/components/gallery/GalleryView.tsx` - Add favorite icon display
5. `src/resources/custom.css` - Add favorite icon styles

---

## UI/UX Notes

### Admin Edit Page
- Heart icon nằm ở góc top-right của mỗi media thumbnail
- Filled heart (đỏ) = đã favorite
- Outline heart (trắng) = chưa favorite
- Click để toggle on/off

### Gallery View (with Token)
- Heart icon ở **top-right** của media
- Download button ở **bottom-right** của media
- Cả 2 đều fade-in on hover
- Heart không clickable (chỉ hiển thị)
- Chỉ hiển thị trên media có `isFavorite: true`

---

## Security Considerations

1. **Admin Only**: Toggle favorite chỉ có trong admin API (không public)
2. **Token Required**: Display favorite icon chỉ khi có token (giống download)
3. **Validation**: Validate mediaId và albumId ownership

---

## Future Enhancements

1. Bulk favorite selection
2. Filter/view chỉ favorite media
3. Export favorite media only
4. Favorite count statistics
5. Custom heart color/style per album theme
