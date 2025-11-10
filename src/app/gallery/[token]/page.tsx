"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Masonry from 'react-masonry-css';

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

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/albums/${token}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || 'Failed to load album');
        return json;
      })
      .then((data) => {
        if (cancelled) return;
        const media: MediaItem[] = data?.data?.media || [];
        const imgs = media.filter((m) => m.type !== 'video').map((m) => m.url);
        setImages(imgs);
        setAlbumTitle(data?.data?.album?.title || null);
        setAlbumDescription(data?.data?.album?.description || null);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err?.message || 'Failed to load album');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const breakpointColumnsObj = {
    // default: 2 columns on desktop
    default: 2,
    // keep 2 columns for medium widths, you can set 1 for small screens if desired
    768: 2,
  };

  return (
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
              key={i} 
              src={src} 
              alt={`gallery-${i}`} 
              loading="lazy"
              decoding="async"
              className="rounded-lg w-full h-auto" 
            />
          ))}
        </Masonry>
      )}
    </div>
  );
}
