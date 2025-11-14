import type { ObjectId } from 'mongodb';

export interface AlbumImage {
  /** Image source path */
  src: string;
  /** Image alt text */
  alt: string;
  /** Image orientation (horizontal/vertical) */
  orientation: 'horizontal' | 'vertical';
}

export interface AlbumDocument {
  _id?: ObjectId;
  title: string;
  description: string;
  coverImage: string; // blob URL
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  link: {
    token: string;
    expiresAt: Date | null;
  };
}

export interface AlbumFormData {
  title: string;
  description: string;
  coverImage: string;
  images: AlbumImage[];
  isPublished?: boolean;
}

export interface MediaDocument {
  _id?: ObjectId;
  albumId: ObjectId;
  url: string;      // blob URL
  type: "image" | "video";
  filename: string;
  isPublished: boolean;
  uploadedAt: Date;
  order: number;    // Display order (0, 1, 2, ...) - used for manual sorting
}

export interface CreateAlbumRequest {
  title: string;
  description?: string;
  isPublished?: boolean;
  expiresAt?: Date;
}

export interface UploadMediaRequest {
  file: File;
  filename: string;
}
