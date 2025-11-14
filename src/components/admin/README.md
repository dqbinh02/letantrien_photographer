# Admin Components

This directory contains admin-specific components for photo management.

---

## Components

### SortableMediaGrid
**File:** `SortableMediaGrid.tsx`

Drag-and-drop sortable grid for managing media items in albums.

**Props:**
```typescript
interface SortableMediaGridProps {
  media: MediaDocument[];
  onDelete?: (mediaId: string) => void;
  onSetCover?: (mediaUrl: string) => void;
  onTogglePublish?: (mediaId: string, nextState: boolean) => void;
  onReorder?: (reorderedMedia: MediaDocument[]) => void;
  coverImage?: string;
  isReordering?: boolean;
}
```

**Usage:**
```tsx
<SortableMediaGrid
  media={albumMedia}
  onReorder={(reordered) => handleReorder(reordered)}
  onDelete={(id) => handleDelete(id)}
  onSetCover={(url) => handleSetCover(url)}
  onTogglePublish={(id, state) => handleToggle(id, state)}
  coverImage={album.coverImage}
  isReordering={isSaving}
/>
```

**Features:**
- Drag-and-drop reordering
- Keyboard navigation (arrow keys)
- Touch support (mobile)
- Image modal preview
- Loading state indicator

---

### SortableMediaItem
**File:** `SortableMediaItem.tsx`

Individual draggable media card with controls.

**Props:**
```typescript
interface SortableMediaItemProps {
  media: MediaDocument;
  onDelete?: (mediaId: string) => void;
  onSetCover?: (mediaUrl: string) => void;
  onTogglePublish?: (mediaId: string, nextState: boolean) => void;
  isCover?: boolean;
  onClick?: () => void;
}
```

**Features:**
- Drag handle (top-left corner)
- Visual feedback during drag
- Delete button
- Set cover button
- Publish/unpublish toggle
- Cover indicator (star icon)
- Image/video thumbnail

---

## Drag-and-Drop Configuration

**Activation Distance:** 8px  
**Prevents accidental drags** - user must drag at least 8px before drag starts

**Collision Detection:** closestCenter  
**Provides smooth snapping** behavior when dragging over other items

**Sorting Strategy:** rectSortingStrategy  
**Optimized for grid layouts** (as opposed to vertical/horizontal lists)

**Sensors:**
- **PointerSensor:** Mouse and touch events
- **KeyboardSensor:** Arrow key navigation

---

## Accessibility

### Keyboard Navigation
- **Tab:** Focus drag handle
- **Space/Enter:** Activate drag mode
- **Arrow Keys:** Move item in grid
- **Escape:** Cancel drag

### Screen Reader Support
- Drag handles have ARIA labels
- Drag state announced to screen readers
- Focus management during drag operations

---

## Performance

**Optimizations:**
- React.memo on all components
- CSS transforms (hardware accelerated)
- Debounced API calls (500ms)
- Local state management (reduces parent re-renders)

**Bundle Impact:**
- @dnd-kit packages: ~25KB gzipped
- Components: ~5KB gzipped
- **Total:** ~30KB added to bundle

---

## Browser Support

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support (including mobile) |
| Edge | 90+ | Full support (Chromium-based) |
| Mobile Safari | iOS 14+ | Touch events supported |
| Chrome Mobile | Latest | Touch events supported |

---

## Examples

### Basic Usage
```tsx
import { SortableMediaGrid } from "@/components/admin/SortableMediaGrid";

function AlbumManager() {
  const [media, setMedia] = useState<MediaDocument[]>([]);
  
  const handleReorder = async (reordered: MediaDocument[]) => {
    // Update local state immediately
    setMedia(reordered);
    
    // Call API
    await fetch('/api/albums/123/reorder', {
      method: 'PATCH',
      body: JSON.stringify({
        mediaOrders: reordered.map((m, i) => ({
          mediaId: m._id,
          order: i
        }))
      })
    });
  };
  
  return (
    <SortableMediaGrid
      media={media}
      onReorder={handleReorder}
    />
  );
}
```

### With Loading State
```tsx
const [isReordering, setIsReordering] = useState(false);

const handleReorder = async (reordered: MediaDocument[]) => {
  setIsReordering(true);
  try {
    await saveOrder(reordered);
  } finally {
    setIsReordering(false);
  }
};

<SortableMediaGrid
  media={media}
  onReorder={handleReorder}
  isReordering={isReordering}
/>
```

### With Error Handling
```tsx
const handleReorder = async (reordered: MediaDocument[]) => {
  const previousMedia = [...media];
  setMedia(reordered); // Optimistic update
  
  try {
    await saveOrder(reordered);
    toast.success('Order updated');
  } catch (error) {
    setMedia(previousMedia); // Revert on error
    toast.error('Failed to save order');
  }
};
```

---

## Styling

Components use Once UI design system:
- `Column`, `Row`, `Text`, `Button` components
- CSS custom properties for theming
- Responsive grid layout

**Customization:**
```tsx
// Custom grid columns
<div style={{
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", // Wider cards
  gap: "16px", // More spacing
}}>
```

---

## Testing

### Unit Tests (TODO)
- Component rendering
- Drag-and-drop behavior
- Callback invocation
- Error states

### Integration Tests (TODO)
- Full reorder flow
- API integration
- Error recovery
- Loading states

### Manual Testing Checklist
- [ ] Drag items to reorder
- [ ] Keyboard navigation works
- [ ] Delete button works
- [ ] Set cover button works
- [ ] Publish toggle works
- [ ] Image modal opens
- [ ] Loading state displays
- [ ] Error recovery works

---

## Known Issues

None currently.

---

## Future Enhancements

1. **Custom Drag Overlay:** Show thumbnail while dragging
2. **Multi-Select:** Drag multiple items at once
3. **Drop Zones:** Drag items between albums
4. **Undo/Redo:** Ctrl+Z to undo reorder
5. **Batch Operations:** Reorder multiple items at once
6. **Animation Polish:** Spring physics for smoother transitions

---

## Dependencies

- `@dnd-kit/core@6.3.1` - Core drag-and-drop
- `@dnd-kit/sortable@10.0.0` - Sortable utilities
- `@dnd-kit/utilities@3.2.2` - Helper functions
- `@once-ui-system/core` - UI components
- `next/image` - Image optimization
- `react-icons/fi` - Feather icons

---

## Related Files

- `/src/app/admin/albums/[albumId]/page.tsx` - Main usage
- `/src/components/MediaGrid.tsx` - Non-sortable version (public view)
- `/src/components/ImageModal.tsx` - Fullscreen image preview
- `/src/app/api/admin/albums/[albumId]/reorder/route.ts` - Reorder API

---

## Documentation

- [Day 3 Progress](../../docs/DAY3_PROGRESS.md) - Implementation details
- [@dnd-kit Documentation](https://docs.dndkit.com/) - Library docs
- [Once UI Components](https://once-ui.com/) - Design system
