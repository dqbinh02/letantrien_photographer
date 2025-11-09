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
}

export interface MediaDocument {
  _id?: ObjectId;
  albumId: ObjectId;
  url: string;      // blob URL
  type: "image" | "video";
  filename: string;
  uploadedAt: Date;
}

export interface CreateAlbumRequest {
  title: string;
  description?: string;
  expiresAt?: Date;
}

export interface UploadMediaRequest {
  file: File;
  filename: string;
}
