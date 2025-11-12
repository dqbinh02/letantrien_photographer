# Changelog - Album Management & Publish System


### 🎯 Tính năng mới

#### 1. Hệ thống Publish/Unpublish cho Albums và Media
- **Album Publish Status**: 
  - Albums có thể được đánh dấu là "Published" hoặc "Private"
  - Chỉ albums Published mới hiển thị trên trang public gallery `/albums`
  - Albums Private vẫn có thể truy cập qua link với token

- **Media Publish Status**:
  - Mỗi media item (ảnh/video) có thể được publish/unpublish riêng lẻ
  - Logic hiển thị: **"Nếu album publish, chỉ thấy được những media đã publish. Nếu album không publish, cho dù media có publish cũng không thấy được"**

#### 2. Admin Edit Interface (`/admin/albums/[albumId]`)
- **Album Settings Section**:
  - Chỉnh sửa Title, Description (Deplay 2s để gọi api update)
  - Toggle Publish/Private cho album

- **Upload Media Section**: Như cũ

- **Media Management Section**:
  - Hiển thị như cũ
  - Mỗi media card có thêm:
    - **Publish/Unpublish button** - Icon ổ khóa đóng hoặc mở bên cạnh thùng rác.

#### 3. Unified Album Access Route
- **Route `/albums/[albumId]`**: Hỗ trợ cả public access và private access với token
  - Public access: `/albums/[albumId]` - Chỉ với published albums và published media
  - Private access: `/albums/[albumId]?token=xyz` - Với bất kỳ album nào có token hợp lệ, và chỉ xem được published media
- Loại bỏ route cũ `/gallery/[token]` để tránh conflict

#### 4. Public Albums Listing (`/albums`)
- Hiển thị tất cả albums đã publish
- Grid layout responsive
- Album cards với cover image, title, description, media count
- Click vào card để xem album

### 🎨 Cải tiến UI/UX

#### 1. Gallery Layout
- Columns configuration:
  - Default: 4 cột
  - Large screens (≥1024px): 3 cột
  - Small screens : 2 cột
  - Small screens : 1 cột

### 🔧 API Endpoints

#### Additional Albums API
- `GET /api/albums` - Lấy danh sách published albums (public)
- `GET /api/albums/[albumId]` - Lấy album với media filtering (public/private)
- `GET /api/admin/albums` - Lấy tất cả albums (admin)
- `GET /api/admin/albums/[albumId]` - Lấy album details (admin)
- `PUT /api/admin/albums/[albumId]` - Update album (title, description, isPublished)
- `DELETE /api/admin/albums/[albumId]` - Xóa album

#### Media API
- `PUT /api/admin/media/[mediaId]` - Update media publish status

### 📊 Database Schema Updates

#### AlbumDocument
```typescript
interface AlbumDocument {
  _id: ObjectId;
  title: string;
  description: string;
  coverImage: string;
  isPublished: boolean;  // ✨ NEW
  createdAt: Date;
  updatedAt: Date;
  link: {
    token: string;
    expiresAt: Date | null;
  };
}
```

#### MediaDocument
```typescript
interface MediaDocument {
  _id: ObjectId;
  albumId: ObjectId;
  url: string;
  type: "image" | "video";
  filename: string;
  isPublished: boolean;  // ✨ NEW
  uploadedAt: Date;
}


