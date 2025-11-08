# Admin Panel - Album Upload

This feature allows you to upload and manage photo albums using MongoDB as the database.

## Prerequisites

1. **MongoDB Installation**
   - Install MongoDB locally: https://www.mongodb.com/docs/manual/installation/
   - Ensure MongoDB is running on `localhost:27017`
   - Start MongoDB:
     ```bash
     # macOS (if installed via Homebrew)
     brew services start mongodb-community
     
     # Or start manually
     mongod --config /usr/local/etc/mongod.conf
     ```

2. **Environment Variables**
   - Copy `.env.local.example` to `.env.local`
   - The default configuration points to local MongoDB:
     ```
     MONGODB_URI=mongodb://localhost:27017
     MONGODB_DB=photographer
     ```

## Features

### Admin Page (`/admin`)
- Upload new albums with:
  - Title
  - Description
  - Cover image
  - Multiple images with alt text and orientation

### Album Display (`/album`)
- Displays all albums from MongoDB
- Shows album cover, title, description, and photo count
- Responsive grid layout

### API Routes
- `GET /api/albums` - Fetch all albums
- `POST /api/albums` - Create a new album

## Usage

1. **Start the development server:**
   ```bash
   pnpm dev
   ```

2. **Access the admin panel:**
   - Navigate to `http://localhost:3000/admin`

3. **Create an album:**
   - Fill in the album title and description
   - Add a cover image URL (e.g., `/images/cover.jpg`)
   - Add images by providing:
     - Image URL
     - Alt text
     - Orientation (horizontal/vertical)
   - Click "Add Image to Album" for each image
   - Click "Create Album" to save

4. **View albums:**
   - Navigate to `http://localhost:3000/album`
   - All created albums will be displayed in a grid

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   └── page.tsx          # Admin upload interface
│   ├── album/
│   │   └── page.tsx          # Album display page
│   └── api/
│       └── albums/
│           └── route.ts       # API endpoints
├── lib/
│   └── mongodb.ts            # MongoDB connection utility
└── types/
    └── album.types.ts        # TypeScript types for albums
```

## Database Schema

Albums are stored in MongoDB with the following structure:

```typescript
{
  _id: ObjectId,
  title: string,
  description: string,
  coverImage: string,
  images: [
    {
      src: string,
      alt: string,
      orientation: "horizontal" | "vertical"
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

## Troubleshooting

1. **MongoDB Connection Error**
   - Ensure MongoDB is running: `brew services list`
   - Check the connection string in `.env.local`

2. **Images Not Displaying**
   - Ensure image paths are correct
   - Images should be placed in the `public/` directory
   - Use paths like `/images/photo.jpg`

3. **API Errors**
   - Check browser console for error messages
   - Verify MongoDB is running
   - Check server logs in the terminal
