"use client";

import { Column, Heading, Text, Button } from "@once-ui-system/core";
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import GalleryView from "@/components/gallery/GalleryView";
import { AlbumThemeManager } from "@/components/AlbumThemeManager";
import type { AlbumDocument, MediaDocument } from "@/types";

interface AlbumDetail {
  album: AlbumDocument;
  media: MediaDocument[];
}

export default function AlbumDetailPage() {
  const params = useParams<{ albumId: string }>();
  const searchParams = useSearchParams();
  const albumId = params?.albumId ?? "";
  const token = searchParams?.get("token");

  const [albumDetail, setAlbumDetail] = useState<AlbumDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!albumId) {
        setError("Album ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const url = token
          ? `/api/albums/${albumId}?token=${token}`
          : `/api/albums/${albumId}`;
        
        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
          setAlbumDetail(result.data);
          setError(null);
        } else {
          setError(result.error || "Failed to fetch album");
        }
      } catch (err) {
        console.error("Error fetching album:", err);
        setError("Failed to fetch album");
      } finally {
        setLoading(false);
      }
    };

    void fetchAlbum();
  }, [albumId, token]);

  const handleDownloadAll = async () => {
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
      
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `${albumDetail?.album.title || 'album'}.zip`;
      
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
      alert('Failed to download all media. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <Column maxWidth="l" paddingTop="24" gap="24" horizontal="center">
        <Text variant="body-default-l">Loading album...</Text>
      </Column>
    );
  }

  if (error || !albumDetail) {
    return (
      <Column maxWidth="l" paddingTop="24" gap="24" horizontal="center">
        <Text variant="body-default-l" style={{ color: "var(--danger-on-background-strong)" }}>
          {error || "Album not found"}
        </Text>
      </Column>
    );
  }

  const { album, media } = albumDetail;
  const hasToken = Boolean(token);

  return (
    <Column maxWidth="xl" paddingTop="40" paddingBottom="40" gap="48">
      {/* Apply album-specific theme */}
      <AlbumThemeManager theme={album.theme || 'light'} />
      
      {/* Album Header */}
      <Column gap="8" horizontal="center" style={{ width: '100%' }}>
        {/* Date & Photo Count */}
        <Text
          variant="label-default-m"
          onBackground="neutral-weak"
          style={{ 
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontSize: '0.875rem',
          }}
        >
          {new Date(album.createdAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
          {' • '}
          {media.length} {media.length === 1 ? 'Photo' : 'Photos'}
        </Text>

        {/* Title */}
        <Heading 
          variant="heading-strong-l" 
          style={{ 
            textAlign: 'center',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            letterSpacing: '0.05em',
            lineHeight: '1.3',
            fontWeight: 500,
            textTransform: 'uppercase',
          }}
        >
          {album.title}
        </Heading>

        {/* Description */}
        {album.description && (
          <>
            <div
              style={{
                width: '60px',
                height: '1px',
                backgroundColor: 'var(--neutral-border-medium)',
                opacity: 0.5,
              }}
            />
            <Text
              variant="body-default-l"
              onBackground="neutral-medium"
              style={{ 
                textAlign: 'center', 
                maxWidth: '680px',
                lineHeight: '1.8',
                fontSize: '1.125rem',
                fontWeight: 400,
              }}
            >
              {album.description}
            </Text>
          </>
        )}
      </Column>

      {/* Download All Button - Right before gallery, minimal gap */}
      {hasToken && (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginTop: '-50px', marginBottom: '-45px' }}>
          <Button
            onClick={handleDownloadAll}
            disabled={isDownloading}
            variant="secondary"
            size="m"
          >
            {isDownloading ? 'Creating ZIP...' : 'Download All'}
          </Button>
        </div>
      )}

      {/* Gallery */}
      <GalleryView 
        media={media}
        hasToken={hasToken}
        token={token}
      />
    </Column>
  );
}
