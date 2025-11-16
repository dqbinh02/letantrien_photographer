# Feature: Download Media & Download All

## Overview
Thêm chức năng download cho từng media item và download tất cả media trong album dưới dạng ZIP file.

## Requirements

### **QUAN TRỌNG: Chỉ hiển thị nút download khi có token trong URL**
- Download chỉ khả dụng cho gallery được truy cập qua link có token
- Ví dụ: `http://localhost:3000/albums/69172e8d22885229f4b6b238?token=6e4de82047a80b136148ebcb1dfd4cbc`
- Nếu không có token trong URL → KHÔNG hiển thị các nút download

### 1. Download Individual Media Item
- **Điều kiện hiển thị**: Chỉ hiển thị khi `token` có trong URL query params
- **UI**: Khi hover vào mỗi media item trên gallery, xuất hiện nút Download ở góc dưới bên phải
- **Position**: Nút nằm trong khung ảnh/video, không làm thay đổi layout
- **Style**: 
  - Absolute position, bottom-right
  - Fade-in on hover
  - Icon màu trắng
  - Nền đen mờ (rgba)
- **Action**: Click vào sẽ gọi API và tải file về

### 2. Download All Media (ZIP)
- **Điều kiện hiển thị**: Chỉ hiển thị khi `token` có trong URL query params
- **UI**: Nút "Download All" ở phần header album
- **Action**: Click → gọi POST `/api/albums/{albumId}/export-zip?token={token}`
- **Backend**: Tạo ZIP (streaming), trả về file để tải xuống
- **UX**: Khi đang tạo ZIP, nút chuyển sang trạng thái loading/disabled

---

## Implementation Plan

### Phase 1: Download Individual Media

#### 1.1. Frontend - Component Updates

**File**: `src/components/gallery/GalleryView.tsx`
- Thêm prop `hasToken` để kiểm tra xem có token hay không
- Chỉ render download button khi `hasToken === true`
- Implement hover state
- CSS for fade-in animation

**Changes**:
```tsx
interface GalleryViewProps {
  media: MediaDocument[];
  hasToken?: boolean; // NEW: Chỉ hiển thị download khi có token
}

export default function GalleryView({ media, hasToken = false }: GalleryViewProps) {
  // ...existing code...

  return (
    <Masonry>
      {images.map((image, index) => (
        <div className="media-item-container" key={...}>
          <Image
            src={image.url}
            alt={image.filename}
            // ...existing props...
          />
          {/* Chỉ hiển thị download button khi có token */}
          {hasToken && (
            <button 
              className="download-overlay" 
              onClick={(e) => {
                e.stopPropagation(); // Prevent opening modal
                handleDownload(image);
              }}
            >
              <DownloadIcon />
            </button>
          )}
        </div>
      ))}
    </Masonry>
  );
}
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

#### 1.2. Frontend - Download Handler (in GalleryView.tsx)

**Function**: `handleDownload(media: MediaDocument)`
```tsx
interface GalleryViewProps {
  media: MediaDocument[];
  hasToken?: boolean;
  token?: string | null; // NEW: Pass token from parent
}

export default function GalleryView({ media, hasToken = false, token = null }: GalleryViewProps) {
  const handleDownload = async (media: MediaDocument) => {
    if (!token) {
      console.error('No token available for download');
      return;
    }

    try {
      const url = `/api/media/${media._id}/download?token=${token}`;
      
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
  
  // ...rest of component
}
```

#### 1.3. Backend - Download Single Media API

**File**: `src/app/api/media/[mediaId]/download/route.ts` (NEW)

**Endpoint**: `GET /api/media/{mediaId}/download?token={token}`

**QUAN TRỌNG**: API này **BẮT BUỘC** phải có token. Không cho phép download nếu không có token.

**Implementation**:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import type { AlbumDocument, MediaDocument } from "@/types";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const { mediaId } = await params;
    
    // QUAN TRỌNG: Bắt buộc phải có token
    if (!token) {
      return NextResponse.json(
        { error: "Token is required for download" }, 
        { status: 401 }
      );
    }
    
    if (!ObjectId.isValid(mediaId)) {
      return NextResponse.json(
        { error: "Invalid media ID" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Get media
    const media = await db.collection<MediaDocument>("media").findOne({
      _id: new ObjectId(mediaId),
    });
    
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }
    
    // Verify album access with token (same logic as GET /api/albums/[albumId])
    const album = await db.collection<AlbumDocument>("albums").findOne({
      _id: new ObjectId(media.albumId),
    });
    
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }
    
    // Validate token (same as album detail route)
    const linkToken = album.link?.token;
    const expiresAt = album.link?.expiresAt ? new Date(album.link.expiresAt) : null;
    const isTokenValid =
      Boolean(token && linkToken && token === linkToken) &&
      (!expiresAt || expiresAt.getTime() > Date.now());
    
    if (!isTokenValid) {
      return NextResponse.json(
        { error: "Invalid or expired token" }, 
        { status: 403 }
      );
    }
    
    // Get file from S3
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: media.url, // media.url contains the S3 key/path
    });
    
    const s3Response = await s3Client.send(command);
    
    if (!s3Response.Body) {
      return NextResponse.json({ error: "File not found in S3" }, { status: 404 });
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

**Changes**: 
1. Thêm button "Download All" vào album header (chỉ khi có token)
2. Pass `hasToken` và `token` props xuống GalleryView

```tsx
import { useState } from 'react';
import { Button } from '@once-ui-system/core';

export default function AlbumDetailPage() {
  const params = useParams<{ albumId: string }>();
  const searchParams = useSearchParams();
  const albumId = params?.albumId ?? "";
  const token = searchParams?.get("token"); // Đã có sẵn trong code hiện tại
  
  const [isDownloading, setIsDownloading] = useState(false);
  
  // ...existing code...

  // Kiểm tra xem có token không
  const hasToken = Boolean(token);

  return (
    <Column maxWidth="xl" paddingTop="40" paddingBottom="40" gap="48">
      {/* Album Header */}
      <Column gap="24" horizontal="center" style={{ width: '100%' }}>
        {/* ...existing date & title... */}
        
        {/* Download All Button - CHỈ hiển thị khi có token */}
        {hasToken && (
          <Button
            onClick={handleDownloadAll}
            disabled={isDownloading}
            variant="secondary"
            size="m"
          >
            {isDownloading ? 'Creating ZIP...' : 'Download All'}
          </Button>
        )}
        
        {/* ...existing description... */}
      </Column>

      {/* Gallery - Pass hasToken và token */}
      <GalleryView 
        media={media} 
        hasToken={hasToken}
        token={token}
      />
    </Column>
  );
}
```

#### 2.2. Frontend - Download All Handler

```tsx
const handleDownloadAll = async () => {
  // Double check token exists (should always be true if button is visible)
  if (!token) {
    console.error('No token available for download');
    return;
  }

  try {
    setIsDownloading(true);
    
    const url = `/api/albums/${albumId}/export-zip?token=${token}`;
    
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

**QUAN TRỌNG**: API này **BẮT BUỘC** phải có token. Không cho phép download nếu không có token.

**Dependencies**: 
```bash
pnpm add archiver @types/archiver
```

**Implementation**:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import archiver from "archiver";
import type { AlbumDocument, MediaDocument } from "@/types";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const { albumId } = await params;
    
    // QUAN TRỌNG: Bắt buộc phải có token
    if (!token) {
      return NextResponse.json(
        { error: "Token is required for download" }, 
        { status: 401 }
      );
    }
    
    if (!ObjectId.isValid(albumId)) {
      return NextResponse.json(
        { error: "Invalid album ID" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Validate album access with token (same logic as GET /api/albums/[albumId])
    const album = await db.collection<AlbumDocument>("albums").findOne({
      _id: new ObjectId(albumId),
    });
    
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }
    
    // Validate token (same as album detail route)
    const linkToken = album.link?.token;
    const expiresAt = album.link?.expiresAt ? new Date(album.link.expiresAt) : null;
    const isTokenValid =
      Boolean(token && linkToken && token === linkToken) &&
      (!expiresAt || expiresAt.getTime() > Date.now());
    
    if (!isTokenValid) {
      return NextResponse.json(
        { error: "Invalid or expired token" }, 
        { status: 403 }
      );
    }
    
    // Get all published media
    const media = await db.collection<MediaDocument>("media")
      .find({
        albumId: new ObjectId(albumId),
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
          Key: item.url, // media.url contains the S3 key/path
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
- [ ] **Download button CHỈ xuất hiện khi URL có token**
- [ ] Download button KHÔNG xuất hiện khi không có token trong URL
- [ ] Download button xuất hiện khi hover vào media item (nếu có token)
- [ ] Download button có animation fade-in mượt mà
- [ ] Click download button tải đúng file về
- [ ] Download hoạt động với cả ảnh và video
- [ ] API trả về 401 nếu không có token
- [ ] API trả về 403 nếu token không hợp lệ hoặc đã hết hạn
- [ ] Hiển thị lỗi khi download thất bại

### Download All
- [ ] **Nút "Download All" CHỈ hiển thị khi URL có token**
- [ ] Nút "Download All" KHÔNG hiển thị khi không có token trong URL
- [ ] Click nút tạo ZIP và tải về
- [ ] Nút chuyển sang trạng thái loading khi đang tạo ZIP
- [ ] Nút disabled khi đang tạo ZIP
- [ ] ZIP chứa tất cả media đã published
- [ ] File trong ZIP giữ nguyên tên gốc
- [ ] File trong ZIP sắp xếp theo order
- [ ] ZIP download hoạt động với album lớn (nhiều file)
- [ ] API trả về 401 nếu không có token
- [ ] API trả về 403 nếu token không hợp lệ hoặc đã hết hạn
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
1. `src/components/gallery/GalleryView.tsx` - Add download button overlay (conditional on hasToken)
2. `src/app/albums/[albumId]/page.tsx` - Add "Download All" button (conditional on token), pass props to GalleryView
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

1. **Token Required**: Download chỉ hoạt động khi có token trong URL (không cho phép download public)
2. **Access Control**: Verify album access với token validation (same logic as GET /api/albums/[albumId])
3. **Token Validation**: 
   - Check token === album.link.token
   - Check expiration time (album.link.expiresAt)
   - Return 401 nếu không có token
   - Return 403 nếu token invalid hoặc expired
4. **Rate Limiting**: Consider adding rate limiting for download endpoints
5. **File Size**: Monitor ZIP file size to prevent memory issues
6. **S3 Permissions**: Ensure S3 bucket has proper read permissions

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
