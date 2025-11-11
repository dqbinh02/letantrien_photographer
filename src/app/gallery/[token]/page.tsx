"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Masonry from 'react-masonry-css';
import { ImageModal } from '@/components';

type MediaItem = { _id?: string; url: string; type?: string; filename?: string };

export default function PublicGallery(_: any) {
  // In client components, prefer using `useParams` from next/navigation
  const routeParams = useParams() as { token?: string } | null;
  const token = routeParams?.token;

  const [images, setImages] = useState<string[]>([]);
  const [albumTitle, setAlbumTitle] = useState<string | null>(null);
  const [albumDescription, setAlbumDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    console.log('🔄 Fetching album with token:', token);

    fetch(`/api/albums/${token}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || 'Failed to load album');
        return json;
      })
      .then((data) => {
        if (cancelled) {
          console.log('⚠️ Request cancelled, ignoring response');
          return;
        }
        
        const media: MediaItem[] = data?.data?.media || [];
        
        console.log('📦 Raw media from API:', media.length, 'items');
        
        // Filter images and remove duplicates based on URL
        const imgs = media
          .filter((m) => m.type !== 'video')
          .map((m) => m.url);
        
        console.log('🖼️ Images after filter:', imgs.length);
        
        // Remove duplicate URLs
        const uniqueImages = Array.from(new Set(imgs));
        
        console.log('✨ Unique images:', uniqueImages.length);
        
        // Check for duplicates
        if (imgs.length !== uniqueImages.length) {
          console.warn(`⚠️ Found ${imgs.length - uniqueImages.length} duplicate images in API response!`);
          console.warn('Duplicate URLs:', imgs.filter((url, index) => imgs.indexOf(url) !== index));
        }
        
        setImages(uniqueImages);
        setAlbumTitle(data?.data?.album?.title || null);
        setAlbumDescription(data?.data?.album?.description || null);
      })
      .catch((err: any) => {
        if (cancelled) return;
        console.error('❌ Error fetching album:', err);
        setError(err?.message || 'Failed to load album');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      console.log('🧹 Cleanup: cancelling request');
      cancelled = true;
    };
  }, [token]);

  const breakpointColumnsObj = {
    // default: 2 columns on desktop
    default: 2,
    // keep 2 columns for medium widths, you can set 1 for small screens if desired
    768: 2,
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleCloseModal = () => {
    setSelectedImageIndex(null);
  };

  const handleNext = () => {
    if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handlePrev = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  return (
    <>
      <div
        className="mx-auto px-4 py-8"
        // inline style to enforce gallery max width and avoid being overridden by outer layout styles
        style={{ maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto' }}
      >
        {albumTitle && <h1 className="text-2xl font-semibold mb-2">{albumTitle}</h1>}
        {albumDescription && <p className="text-sm text-muted mb-4">{albumDescription}</p>}

        {loading ? (
          <div className="text-center py-8">Loading gallery…</div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : images.length === 0 ? (
          <div className="text-center py-8">No images to display</div>
        ) : (
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {images.map((src, i) => (
              <img 
                key={`${src}-${i}`}
                src={src} 
                alt={`gallery-${i}`} 
                loading="lazy"
                decoding="async"
                onClick={() => handleImageClick(i)}
                className="rounded-lg w-full h-auto cursor-pointer hover:opacity-90 transition-opacity" 
              />
            ))}
          </Masonry>
        )}
      </div>

      {/* Image Modal */}
      {selectedImageIndex !== null && images[selectedImageIndex] && (
        <ImageModal
          imageUrl={images[selectedImageIndex]}
          alt={`gallery-${selectedImageIndex}`}
          onClose={handleCloseModal}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={selectedImageIndex < images.length - 1}
          hasPrev={selectedImageIndex > 0}
        />
      )}
    </>
  );
}
