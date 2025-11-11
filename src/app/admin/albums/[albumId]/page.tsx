"use client";

import { Column, Heading, Button, Text, Row } from "@once-ui-system/core";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { UploadZone, MediaGrid, CopyGalleryLinkButton, Toast, UploadProgress, type UploadItem } from "@/components";
import type { AlbumDocument, MediaDocument } from "@/types";
import { upload } from "@vercel/blob/client";

interface AlbumDetail {
  album: AlbumDocument;
  media: MediaDocument[];
}

export default function AlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = params.albumId as string;

  const [albumDetail, setAlbumDetail] = useState<AlbumDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadItem[]>([]);

  useEffect(() => {
    if (albumId) {
      fetchAlbumDetail();
    }
  }, [albumId]);

  const fetchAlbumDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/albums/${albumId}`);
      const result = await response.json();

      if (result.success) {
        setAlbumDetail(result.data);
      } else {
        setError(result.error || "Failed to fetch album");
      }
    } catch (error) {
      console.error("Error fetching album:", error);
      setError("Failed to fetch album");
    } finally {
      setLoading(false);
    }
  };

  const fetchMediaOnly = async () => {
    try {
      const response = await fetch(`/api/admin/albums/${albumId}`);
      const result = await response.json();

      if (result.success && albumDetail) {
        // Only update media, keep album info unchanged
        setAlbumDetail({
          ...albumDetail,
          media: result.data.media,
        });
      }
    } catch (error) {
      console.error("Error fetching media:", error);
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    if (!albumId || !albumDetail) return;

    console.log('📤 Starting upload:', files.length, 'files');
    console.log('📊 Current media count:', albumDetail.media.length);

    setUploading(true);
    
    // Create album folder path: albums/{albumTitle}-{albumId[:5]}/
    const albumFolderPath = `albums/${albumDetail.album.title.replace(/[^a-zA-Z0-9]/g, '-')}-${albumId.slice(0, 5)}`;
    
    // Initialize upload progress tracking
    const progressItems: UploadItem[] = files.map(file => ({
      filename: file.name,
      status: 'pending',
      progress: 0,
    }));
    setUploadProgress(progressItems);
    
    // Optimistic update: add placeholder items to prevent layout shift
    const placeholderMedia: MediaDocument[] = files.map((file) => ({
      albumId: albumDetail.album._id!,
      url: URL.createObjectURL(file), // temporary local URL
      type: file.type.startsWith("image/") ? "image" : "video",
      filename: file.name,
      uploadedAt: new Date(),
    }));

    // Update UI optimistically
    setAlbumDetail({
      ...albumDetail,
      media: [...albumDetail.media, ...placeholderMedia],
    });

    try {
            // Upload files in parallel for speed
      const uploadPromises = files.map(async (file, index) => {
        try {
          // Update status to uploading (batch with requestAnimationFrame to reduce re-renders)
          requestAnimationFrame(() => {
            setUploadProgress(prev => prev.map((item, i) => 
              i === index ? { ...item, status: 'uploading', progress: 10 } : item
            ));
          });

          // 1. Upload to Vercel Blob with custom path
          // Format: albums/{albumTitle}-{albumId[:5]}/{timestamp}-{index}-{filename}
          const timestamp = Date.now();
          const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const blobPath = `${albumFolderPath}/${timestamp}-${index}-${sanitizedFilename}`;
          
          const blob = await upload(blobPath, file, {
            access: 'public',
            handleUploadUrl: `/api/admin/albums/${albumId}/presign-url`,
            clientPayload: JSON.stringify({ albumId }),
          });

          // Update progress
          requestAnimationFrame(() => {
            setUploadProgress(prev => prev.map((item, i) => 
              i === index ? { ...item, progress: 60 } : item
            ));
          });

          // 2. Save metadata to MongoDB
          const saveResponse = await fetch(`/api/admin/albums/${albumId}/complete-upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: blob.url,
              pathname: blob.pathname,
              contentType: file.type,
            }),
          });

          if (!saveResponse.ok) {
            throw new Error(`Failed to save metadata for ${file.name}`);
          }

          const result = await saveResponse.json();
          
          console.log(`✅ [${index}] Upload complete:`, {
            filename: file.name,
            url: result.data?.url?.substring(0, 50) + '...',
            hasId: !!result.data?._id
          });
          
          // Update to success
          requestAnimationFrame(() => {
            setUploadProgress(prev => prev.map((item, i) => 
              i === index ? { ...item, status: 'success', progress: 100 } : item
            ));
          });
          
          if (result.success && result.data) {
            return { file, data: result.data, index };
          }
          return null;
        } catch (fileError) {
          console.error(`Error uploading ${file.name}:`, fileError);
          // Mark as error
          requestAnimationFrame(() => {
            setUploadProgress(prev => prev.map((item, i) => 
              i === index ? { ...item, status: 'error' } : item
            ));
          });
          return null;
        }
      });

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);
      
      // Filter successful uploads
      const successfulUploads = results.filter(r => r !== null);
      
      console.log('📊 Upload results:', {
        total: files.length,
        successful: successfulUploads.length,
        failed: files.length - successfulUploads.length
      });
      
      // Update state once with all new media (smooth, no flickering)
      if (successfulUploads.length > 0 && albumDetail) {
        setAlbumDetail((prev) => {
          if (!prev) return prev;
          
          // Create a map by index for accurate replacement
          const uploadsByIndex = new Map(
            successfulUploads.map(upload => [upload!.index, upload!.data])
          );
          
          // Filter out all placeholder items (blob: URLs)
          const realMedia = prev.media.filter(item => !item.url.startsWith('blob:'));
          
          // Add all successful uploads
          const newUploads = Array.from(uploadsByIndex.values());
          
          console.log('🔄 Updating media:', {
            previousTotal: prev.media.length,
            placeholders: prev.media.filter(m => m.url.startsWith('blob:')).length,
            realMedia: realMedia.length,
            newUploads: newUploads.length,
            finalTotal: realMedia.length + newUploads.length
          });
          
          // Cleanup blob URLs
          prev.media.forEach(item => {
            if (item.url.startsWith('blob:')) {
              URL.revokeObjectURL(item.url);
            }
          });
          
          return {
            ...prev,
            media: [...realMedia, ...newUploads],
          };
        });
      }
      
      // Progress bar will auto-hide after 2s (handled in UploadProgress component)
      // Don't show toast for successful uploads - progress bar is enough
    } catch (error) {
      console.error("Error uploading files:", error);
      // Revert optimistic update on error
      await fetchMediaOnly();
      setToast({ message: error instanceof Error ? error.message : "Failed to upload files", type: 'error' });
    } finally {
      setUploading(false);
      // Cleanup any remaining temporary URLs
      if (albumDetail) {
        albumDetail.media.forEach(item => {
          if (item.url.startsWith('blob:')) {
            URL.revokeObjectURL(item.url);
          }
        });
      }
    }
  };

  const handleDeleteMedia = useCallback(async (mediaId: string) => {
    if (!confirm("Are you sure you want to delete this media file?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/media/${mediaId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        // Refresh media list only
        await fetchMediaOnly();
      } else {
        setToast({ message: result.error || "Failed to delete media", type: 'error' });
      }
    } catch (error) {
      console.error("Error deleting media:", error);
      setToast({ message: "Failed to delete media", type: 'error' });
    }
  }, []);

  const handleSetCover = useCallback(async (mediaUrl: string) => {
    try {
      const response = await fetch(`/api/admin/albums/${albumId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ coverImage: mediaUrl }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        if (albumDetail) {
          setAlbumDetail({
            ...albumDetail,
            album: { ...albumDetail.album, coverImage: mediaUrl },
          });
        }
      } else {
        setToast({ message: result.error || "Failed to set cover image", type: 'error' });
      }
    } catch (error) {
      console.error("Error setting cover:", error);
      setToast({ message: "Failed to set cover image", type: 'error' });
    }
  }, [albumId, albumDetail]);

  const handleCloseUploadProgress = useCallback(() => {
    setUploadProgress([]);
  }, []);

  const handleCleanupDuplicates = useCallback(async () => {
    if (!confirm("This will remove duplicate media entries from the database. Continue?")) {
      return;
    }

    try {
      setToast({ message: "Cleaning up duplicates...", type: 'info' });
      
      const response = await fetch(`/api/admin/albums/${albumId}/cleanup-duplicates`, {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        const { duplicatesRemoved, totalMedia } = result.data;
        
        if (duplicatesRemoved > 0) {
          setToast({ 
            message: `Removed ${duplicatesRemoved} duplicate entries. Refreshing...`, 
            type: 'success' 
          });
          // Refresh the page to show updated list
          await fetchAlbumDetail();
        } else {
          setToast({ message: "No duplicates found!", type: 'success' });
        }
      } else {
        setToast({ message: result.error || "Failed to cleanup duplicates", type: 'error' });
      }
    } catch (error) {
      console.error("Error cleaning up duplicates:", error);
      setToast({ message: "Failed to cleanup duplicates", type: 'error' });
    }
  }, [albumId, fetchAlbumDetail]);

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
          Error: {error || "Album not found"}
        </Text>
        <Link href="/admin" style={{ textDecoration: "none" }}>
          <Button>Back to Dashboard</Button>
        </Link>
      </Column>
    );
  }

  const { album, media } = albumDetail;

  return (
    <Column maxWidth="l" paddingTop="24" gap="24">
      {/* Header */}
      <Row horizontal="between" vertical="center">
        <Column gap="4">
          <Heading variant="heading-strong-xl">{album.title}</Heading>
          {album.description && (
            <Text variant="body-default-s" onBackground="neutral-weak">
              {album.description}
            </Text>
          )}
        </Column>
        <Row gap="12">
          <CopyGalleryLinkButton
            albumId={albumId}
            token={album.link.token}
          />
          <Link href="/admin" style={{ textDecoration: "none" }}>
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </Row>
      </Row>

      {/* Album Info */}
      <Column gap="8" padding="16" radius="m" background="neutral-alpha-weak">
        <Row horizontal="between" vertical="center">
          <Text variant="label-default-s">Album Information</Text>
          <Button 
            size="s" 
            variant="tertiary"
            onClick={handleCleanupDuplicates}
            style={{ fontSize: '12px' }}
          >
            🧹 Cleanup Duplicates
          </Button>
        </Row>
        <Row gap="24">
          <Column gap="4">
            <Text variant="body-default-xs" onBackground="neutral-weak">
              Created
            </Text>
            <Text variant="body-default-s">
              {new Date(album.createdAt).toLocaleDateString()}
            </Text>
          </Column>
          <Column gap="4">
            <Text variant="body-default-xs" onBackground="neutral-weak">
              Media Count
            </Text>
            <Text variant="body-default-s">{media.length} files</Text>
          </Column>
          <Column gap="4">
            <Text variant="body-default-xs" onBackground="neutral-weak">
              Expires
            </Text>
            <Text variant="body-default-s">
              {album.link.expiresAt
                ? new Date(album.link.expiresAt).toLocaleDateString()
                : "Never"
              }
            </Text>
          </Column>
        </Row>
      </Column>

      {/* Upload Zone */}
      <UploadZone
        onFilesSelected={handleFilesSelected}
        isUploading={uploading}
      />

      {/* Media Grid */}
      <MediaGrid
        media={media}
        onDelete={handleDeleteMedia}
        onSetCover={handleSetCover}
        coverImage={album.coverImage}
      />

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <UploadProgress
          items={uploadProgress}
          onClose={handleCloseUploadProgress}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onDismiss={() => setToast(null)}
        />
      )}
    </Column>
  );
}