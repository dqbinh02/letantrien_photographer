# Feature: Download Media & Download All

## Overview
Thêm chức năng download cho từng media item và download tất cả media trong album dưới dạng ZIP file.

## Requirements

### 1. Download Individual Media Item
- **UI**: Khi hover vào mỗi media item trên gallery, xuất hiện nút Download ở góc dưới bên phải
- **Position**: Nút nằm trong khung ảnh/video, không làm thay đổi layout
- **Style**: 
  - Absolute position, bottom-right
  - Fade-in on hover
  - Icon màu trắng
  - Nền đen mờ (rgba)
- **Action**: Click vào sẽ gọi API và tải file về

### 2. Download All Media (ZIP)
- **UI**: Nút "Download All" ở phần header album
- **Action**: Click → gọi POST `/api/albums/{albumId}/export-zip?token={token}`
- **Backend**: Tạo ZIP (streaming), trả về file để tải xuống
- **UX**: Khi đang tạo ZIP, nút chuyển sang trạng thái loading/disabled

---

## Implementation Plan

### Phase 1: Download Individual Media

#### 1.1. Frontend - Component Updates

**File**: `src/components/gallery/GalleryView.tsx`
- Thêm download button overlay vào mỗi media item
- Implement hover state
- CSS for fade-in animation

**Changes**:
```tsx
// Thêm download button overlay
<div className="media-item-container">
  <img src={...} />
  <button className="download-overlay" onClick={() => handleDownload(media)}>
    <DownloadIcon />
  </button>
</div>
```

**CSS** (trong component hoặc custom.css):
```css
.media-item-container {
  position: relative;
}

.download-overlay {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 10;
}

.media-item-container:hover .download-overlay {
  opacity: 1;
}

.download-overlay:hover {
  background: rgba(0, 0, 0, 0.9);
}
```

#### 1.2. Frontend - Download Handler

**Function**: `handleDownload(media: MediaDocument)`
```tsx
const handleDownload = async (media: MediaDocument) => {
  try {
    const token = searchParams?.get("token");
    const url = `/api/media/${media._id}/download${token ? `?token=${token}` : ''}`;
    
    // Fetch file
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    
    // Create blob and download
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = media.filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download error:', error);
    // Show error toast
  }
};
```

#### 1.3. Backend - Download Single Media API

**File**: `src/app/api/media/[mediaId]/download/route.ts` (NEW)

**Endpoint**: `GET /api/media/{mediaId}/download?token={token}`

**Implementation**:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: { mediaId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    
    // Validate access (same logic as album detail)
    const client = await clientPromise;
    const db = client.db("photographer");
    
    const media = await db.collection("media").findOne({
      _id: new ObjectId(params.mediaId),
    });
    
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }
    
    // Verify album access
    const album = await db.collection("albums").findOne({
      _id: new ObjectId(media.albumId),
    });
    
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }
    
    // Check if album is published or valid token
    if (!album.isPublished) {
      if (!token || album.accessToken !== token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }
    
    // Get file from S3
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: media.s3Key,
    });
    
    const s3Response = await s3Client.send(command);
    
    if (!s3Response.Body) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    
    // Stream response
    const stream = s3Response.Body.transformToWebStream();
    
    return new NextResponse(stream, {
      headers: {
        'Content-Type': s3Response.ContentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${media.filename}"`,
        'Content-Length': s3Response.ContentLength?.toString() || '0',
      },
    });
    
  } catch (error) {
    console.error("Download media error:", error);
    return NextResponse.json(
      { error: "Failed to download media" },
      { status: 500 }
    );
  }
}
```

---

### Phase 2: Download All as ZIP

#### 2.1. Frontend - Download All Button

**File**: `src/app/albums/[albumId]/page.tsx`

**Changes**: Thêm button vào album header
```tsx
import { useState } from 'react';
import { Button } from '@once-ui-system/core';

const [isDownloading, setIsDownloading] = useState(false);

// In the album header section:
<div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
  <Heading variant="heading-strong-l">
    {album.title}
  </Heading>
  <Button
    onClick={handleDownloadAll}
    disabled={isDownloading}
    variant="secondary"
    size="m"
  >
    {isDownloading ? 'Creating ZIP...' : 'Download All'}
  </Button>
</div>
```

#### 2.2. Frontend - Download All Handler

```tsx
const handleDownloadAll = async () => {
  try {
    setIsDownloading(true);
    
    const url = `/api/albums/${albumId}/export-zip${token ? `?token=${token}` : ''}`;
    
    const response = await fetch(url, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to create ZIP');
    }
    
    // Get filename from header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    const filename = filenameMatch?.[1] || `${album.title}.zip`;
    
    // Download blob
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
  } catch (error) {
    console.error('Download all error:', error);
    // Show error toast
  } finally {
    setIsDownloading(false);
  }
};
```

#### 2.3. Backend - Export ZIP API

**File**: `src/app/api/albums/[albumId]/export-zip/route.ts` (NEW)

**Endpoint**: `POST /api/albums/{albumId}/export-zip?token={token}`

**Dependencies**: 
```bash
pnpm add archiver @types/archiver
```

**Implementation**:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import archiver from "archiver";
import { Readable } from "stream";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(
  request: NextRequest,
  { params }: { params: { albumId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    
    const client = await clientPromise;
    const db = client.db("photographer");
    
    // Validate album access
    const album = await db.collection("albums").findOne({
      _id: new ObjectId(params.albumId),
    });
    
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }
    
    if (!album.isPublished) {
      if (!token || album.accessToken !== token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }
    
    // Get all published media
    const media = await db.collection("media")
      .find({
        albumId: params.albumId,
        isPublished: true,
      })
      .sort({ order: 1 })
      .toArray();
    
    if (media.length === 0) {
      return NextResponse.json({ error: "No media to download" }, { status: 404 });
    }
    
    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Compression level
    });
    
    // Create readable stream from archive
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    
    archive.on('data', (chunk) => {
      writer.write(chunk);
    });
    
    archive.on('end', () => {
      writer.close();
    });
    
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      writer.abort(err);
    });
    
    // Add files to archive
    for (const item of media) {
      try {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: item.s3Key,
        });
        
        const s3Response = await s3Client.send(command);
        
        if (s3Response.Body) {
          // Convert to buffer
          const buffer = await s3Response.Body.transformToByteArray();
          archive.append(Buffer.from(buffer), { name: item.filename });
        }
      } catch (err) {
        console.error(`Error adding ${item.filename} to ZIP:`, err);
      }
    }
    
    // Finalize archive
    archive.finalize();
    
    // Return streaming response
    const filename = `${album.title.replace(/[^a-z0-9]/gi, '_')}.zip`;
    
    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
    
  } catch (error) {
    console.error("Export ZIP error:", error);
    return NextResponse.json(
      { error: "Failed to create ZIP" },
      { status: 500 }
    );
  }
}
```

---

## Testing Checklist

### Individual Download
- [ ] Download button xuất hiện khi hover vào media item
- [ ] Download button có animation fade-in mượt mà
- [ ] Click download button tải đúng file về
- [ ] Download hoạt động với cả ảnh và video
- [ ] Download hoạt động với album published (không cần token)
- [ ] Download hoạt động với album unpublished (có token)
- [ ] Download không hoạt động khi không có quyền truy cập
- [ ] Hiển thị lỗi khi download thất bại

### Download All
- [ ] Nút "Download All" hiển thị ở album header
- [ ] Click nút tạo ZIP và tải về
- [ ] Nút chuyển sang trạng thái loading khi đang tạo ZIP
- [ ] Nút disabled khi đang tạo ZIP
- [ ] ZIP chứa tất cả media đã published
- [ ] File trong ZIP giữ nguyên tên gốc
- [ ] File trong ZIP sắp xếp theo order
- [ ] ZIP download hoạt động với album lớn (nhiều file)
- [ ] Download All hoạt động với album published
- [ ] Download All hoạt động với album unpublished (có token)
- [ ] Hiển thị lỗi khi tạo ZIP thất bại

### UI/UX
- [ ] Download button không làm thay đổi layout
- [ ] Download button có z-index phù hợp (không bị che)
- [ ] Hover state mượt mà
- [ ] Loading state rõ ràng
- [ ] Error handling với toast notification

---

## Files to Create/Modify

### New Files
1. `src/app/api/media/[mediaId]/download/route.ts`
2. `src/app/api/albums/[albumId]/export-zip/route.ts`

### Modified Files
1. `src/components/gallery/GalleryView.tsx` - Add download button overlay
2. `src/app/albums/[albumId]/page.tsx` - Add "Download All" button
3. `src/resources/custom.css` - Add download button styles
4. `package.json` - Add archiver dependency

---

## Dependencies to Install

```bash
pnpm add archiver @types/archiver
pnpm add @aws-sdk/client-s3  # Should already be installed
```

---

## Security Considerations

1. **Access Control**: Verify album access before allowing download (both for individual and ZIP)
2. **Token Validation**: Check token for unpublished albums
3. **Rate Limiting**: Consider adding rate limiting for download endpoints
4. **File Size**: Monitor ZIP file size to prevent memory issues
5. **S3 Permissions**: Ensure S3 bucket has proper read permissions

---

## Performance Considerations

1. **Streaming**: Use streaming for both individual downloads and ZIP creation
2. **Compression**: Use archiver compression level 9 for optimal file size
3. **Memory**: ZIP creation streams files to avoid loading all in memory
4. **CDN**: Individual media downloads go through S3 (already optimized)

---

## Future Enhancements

1. Add progress indicator for ZIP creation
2. Allow selective download (checkbox on each media)
3. Add download history/analytics
4. Implement download limits for free tier
5. Add watermark option before download
