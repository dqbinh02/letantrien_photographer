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
  coverImage: string;
  images: AlbumImage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AlbumFormData {
  title: string;
  description: string;
  coverImage: string;
  images: AlbumImage[];
}
