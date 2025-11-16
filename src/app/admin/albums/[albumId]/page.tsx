"use client";

import { Column, Heading, Button, Text, Row, Input, Textarea } from "@once-ui-system/core";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FiLock, FiUnlock, FiArrowDown } from "react-icons/fi";
import { UploadZone, CopyGalleryLinkButton, UploadProgress, type UploadItem } from "@/components";
import { SortableMediaGrid } from "@/components/admin/SortableMediaGrid";
import type { AlbumDocument, MediaDocument, AlbumTheme } from "@/types";
import { upload } from "@vercel/blob/client";

interface AlbumDetail {
  album: AlbumDocument;
  media: MediaDocument[];
}

export default function AlbumDetailPage() {
  const params = useParams();
  const albumId = params.albumId as string;

  const [albumDetail, setAlbumDetail] = useState<AlbumDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadItem[]>([]);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingLocation, setEditingLocation] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [sortBy, setSortBy] = useState<'order' | 'date' | 'name' | 'size'>('order');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reorderTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);

  const fetchAlbumDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/albums/${albumId}`);
      const result = await response.json();

      if (result.success) {
        setAlbumDetail(result.data);
        setEditingTitle(result.data.album.title);
        setEditingDescription(result.data.album.description || "");
        setEditingLocation(result.data.album.location || "");
      } else {
        setError(result.error || "Failed to fetch album");
      }
    } catch (error) {
      console.error("Error fetching album:", error);
      setError("Failed to fetch album");
    } finally {
      setLoading(false);
    }
  }, [albumId]);

  const fetchMediaOnly = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/albums/${albumId}`);
      const result = await response.json();

      if (result.success) {
        setAlbumDetail((previous) => {
          if (!previous) {
            return previous;
          }
          return {
            ...previous,
            media: result.data.media,
          };
        });
      }
    } catch (error) {
      console.error("Error fetching media:", error);
    }
  }, [albumId]);

  useEffect(() => {
    if (albumId) {
      void fetchAlbumDetail();
    }
  }, [albumId, fetchAlbumDetail]);

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
    const albumMongoId = albumDetail.album._id;
    if (!albumMongoId) {
      setUploading(false);
      return;
    }

    const placeholderMedia: MediaDocument[] = files.map((file, index) => ({
      albumId: albumMongoId,
      url: URL.createObjectURL(file), // temporary local URL
      type: file.type.startsWith("image/") ? "image" : "video",
      filename: file.name,
      isPublished: true,
      uploadedAt: new Date(),
      order: albumDetail.media.length + index, // Temporary order
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
          
          // Add timeout handling with AbortController
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
          
          try {
            const blob = await upload(blobPath, file, {
              access: 'public',
              handleUploadUrl: `/api/admin/albums/${albumId}/presign-url`,
              clientPayload: JSON.stringify({ albumId }),
            });
            
            clearTimeout(timeoutId);

            // Update progress
            requestAnimationFrame(() => {
              setUploadProgress(prev => prev.map((item, i) => 
                i === index ? { ...item, progress: 60 } : item
              ));
            });

            // 2. Save metadata to MongoDB with timeout
            const saveResponse = await Promise.race([
              fetch(`/api/admin/albums/${albumId}/complete-upload`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  url: blob.url,
                  pathname: blob.pathname,
                  contentType: file.type,
                }),
              }),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Metadata save timeout')), 30000)
              )
            ]);

            if (!saveResponse.ok) {
              throw new Error(`Failed to save metadata for ${file.name}`);
            }

            const result = await saveResponse.json();
            
            console.log(`✅ [${index}] Upload complete:`, {
              filename: file.name,
              url: `${result.data?.url?.substring(0, 50)}...`,
              hasId: Boolean(result.data?._id)
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
          } catch (uploadError) {
            clearTimeout(timeoutId);
            throw uploadError;
          }
        } catch (fileError) {
          console.error(`Error uploading ${file.name}:`, fileError);
          const errorMessage = fileError instanceof Error 
            ? (fileError.name === 'AbortError' || fileError.message.includes('timeout') 
                ? `Upload timeout (file too large or slow connection): ${file.name}`
                : `Upload failed: ${fileError.message}`)
            : `Upload failed: ${file.name}`;
          
          // Mark as error
          requestAnimationFrame(() => {
            setUploadProgress(prev => prev.map((item, i) => 
              i === index ? { ...item, status: 'error', progress: 0 } : item
            ));
          });
          
          console.error(`❌ [${index}] ${errorMessage}`);
          return null;
        }
      });

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);
      
      // Filter successful uploads
  const successfulUploads = results.filter((entry): entry is { file: File; data: MediaDocument; index: number } => entry !== null);
      
      // Update state once with all new media (smooth, no flickering)
      if (successfulUploads.length > 0 && albumDetail) {
        setAlbumDetail((prev) => {
          if (!prev) return prev;
          
          // Create a map by index for accurate replacement
          const uploadsByIndex = new Map(successfulUploads.map((upload) => [upload.index, upload.data]));
          
          // Filter out all placeholder items (blob: URLs)
          const realMedia = prev.media.filter(item => !item.url.startsWith('blob:'));
          
          // Add all successful uploads
          const newUploads = Array.from(uploadsByIndex.values());
          
          // Cleanup blob URLs
          for (const item of prev.media) {
            if (item.url.startsWith('blob:')) {
              URL.revokeObjectURL(item.url);
            }
          }
          
          return {
            ...prev,
            media: [...realMedia, ...newUploads],
          };
        });
      }
      
      // Progress bar will auto-hide after 2s (handled in UploadProgress component)
    } catch (error) {
      console.error("Error uploading files:", error);
      // Revert optimistic update on error
      await fetchMediaOnly();
    } finally {
      setUploading(false);
      // Cleanup any remaining temporary URLs
      if (albumDetail) {
        for (const item of albumDetail.media) {
          if (item.url.startsWith('blob:')) {
            URL.revokeObjectURL(item.url);
          }
        }
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
      }
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  }, [fetchMediaOnly]);

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
      }
    } catch (error) {
      console.error("Error setting cover:", error);
    }
  }, [albumId, albumDetail]);

  const handleToggleMediaPublish = useCallback(async (mediaId: string, nextState: boolean) => {
    try {
      const response = await fetch(`/api/admin/media/${mediaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPublished: nextState }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setAlbumDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            media: prev.media.map((m) =>
              m._id?.toString() === mediaId
                ? { ...m, isPublished: nextState }
                : m
            ),
          };
        });
      }
    } catch (error) {
      console.error("Error toggling media publish:", error);
    }
  }, []);

  const handleToggleFavorite = useCallback(async (mediaId: string) => {
    try {
      const response = await fetch(`/api/admin/media/${mediaId}/toggle-favorite`, {
        method: "PATCH",
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setAlbumDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            media: prev.media.map((m) =>
              m._id?.toString() === mediaId
                ? { ...m, isFavorite: result.isFavorite }
                : m
            ),
          };
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  }, []);

  const handleCloseUploadProgress = useCallback(() => {
    setUploadProgress([]);
  }, []);

  const updateAlbumField = useCallback(async (field: 'title' | 'description' | 'location' | 'isPublished' | 'theme' | 'fallingLeaves', value: string | boolean | AlbumTheme) => {
    if (!albumId) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/admin/albums/${albumId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      const result = await response.json();

      if (result.success) {
        setAlbumDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            album: { ...prev.album, [field]: value },
          };
        });
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    } finally {
      setIsSaving(false);
    }
  }, [albumId]);

  const handleTitleChange = useCallback((newTitle: string) => {
    setEditingTitle(newTitle);
    
    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Set new timer for auto-save after 2 seconds
    saveTimerRef.current = setTimeout(() => {
      void updateAlbumField('title', newTitle);
    }, 2000);
  }, [updateAlbumField]);

  const handleDescriptionChange = useCallback((newDescription: string) => {
    setEditingDescription(newDescription);
    
    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Set new timer for auto-save after 2 seconds
    saveTimerRef.current = setTimeout(() => {
      void updateAlbumField('description', newDescription);
    }, 2000);
  }, [updateAlbumField]);

  const handleLocationChange = useCallback((newLocation: string) => {
    setEditingLocation(newLocation);
    
    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Set new timer for auto-save after 2 seconds
    saveTimerRef.current = setTimeout(() => {
      void updateAlbumField('location', newLocation);
    }, 2000);
  }, [updateAlbumField]);

  const handleTogglePublish = useCallback(() => {
    if (!albumDetail) return;
    void updateAlbumField('isPublished', !albumDetail.album.isPublished);
  }, [albumDetail, updateAlbumField]);

  const handleSort = useCallback(async (sortType: 'date' | 'name' | 'size') => {
    if (!albumDetail || !albumId) return;

    setSortBy(sortType);
    setSortMenuOpen(false);

    // Sort media based on selected criteria
    const sortedMedia = [...albumDetail.media];
    
    switch (sortType) {
      case 'date':
        sortedMedia.sort((a, b) => 
          new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
        );
        break;
      case 'name':
        sortedMedia.sort((a, b) => 
          a.filename.localeCompare(b.filename)
        );
        break;
      case 'size':
        // Sort by URL length as proxy for size (real size would need additional metadata)
        sortedMedia.sort((a, b) => {
          const sizeA = a.url?.length || 0;
          const sizeB = b.url?.length || 0;
          return sizeA - sizeB;
        });
        break;
    }

    // Update local state immediately
    setAlbumDetail({
      ...albumDetail,
      media: sortedMedia,
    });

    // Update order in database
    try {
      setIsReordering(true);
      
      const mediaOrders = sortedMedia.map((media, index) => ({
        mediaId: media._id!.toString(),
        order: index,
      }));

      const response = await fetch(`/api/admin/albums/${albumId}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaOrders }),
      });

      const result = await response.json();

      if (!result.success) {
        await fetchMediaOnly();
      }
    } catch (error) {
      console.error('Error sorting media:', error);
      await fetchMediaOnly();
    } finally {
      setIsReordering(false);
    }
  }, [albumDetail, albumId, fetchMediaOnly]);

  const handleReorder = useCallback(async (reorderedMedia: MediaDocument[]) => {
    if (!albumId) return;

    // Update local state immediately (optimistic update)
    setAlbumDetail((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        media: reorderedMedia,
      };
    });

    // Clear existing timer
    if (reorderTimerRef.current) {
      clearTimeout(reorderTimerRef.current);
    }

    // Debounce API call (500ms after last drag)
    reorderTimerRef.current = setTimeout(async () => {
      try {
        setIsReordering(true);

        // Prepare request body
        const mediaOrders = reorderedMedia.map((media, index) => ({
          mediaId: media._id!.toString(),
          order: index,
        }));

        const response = await fetch(`/api/admin/albums/${albumId}/reorder`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mediaOrders }),
        });

        const result = await response.json();

        if (!result.success) {
          // Revert on error
          await fetchMediaOnly();
        }
      } catch (error) {
        console.error('Error reordering media:', error);
        // Revert on error
        await fetchMediaOnly();
      } finally {
        setIsReordering(false);
      }
    }, 500);
  }, [albumId, fetchMediaOnly]);

  // Close sort menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    };

    if (sortMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [sortMenuOpen]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      if (reorderTimerRef.current) {
        clearTimeout(reorderTimerRef.current);
      }
    };
  }, []);

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
        <Column gap="4" fillWidth>
          <Row gap="12" vertical="center">
            <Heading variant="heading-strong-xl">Album Settings</Heading>
            {isSaving && (
              <Text variant="body-default-xs" onBackground="neutral-weak">
                Saving...
              </Text>
            )}
          </Row>
        </Column>
        <Row gap="12">
          <Button
            variant={albumDetail.album.isPublished ? "secondary" : "primary"}
            onClick={handleTogglePublish}
          >
            <Row gap="8" vertical="center">
              {albumDetail.album.isPublished ? <FiUnlock /> : <FiLock />}
              <Text>{albumDetail.album.isPublished ? "Published" : "Private"}</Text>
            </Row>
          </Button>
          <CopyGalleryLinkButton
            albumId={albumId}
            token={album.link.token}
          />
          <Link href="/admin" style={{ textDecoration: "none" }}>
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </Row>
      </Row>

      {/* Album Edit Section */}
      <Column gap="16" padding="20" radius="m" background="neutral-alpha-weak">
        <Text variant="label-default-m">Album Information</Text>
        <Column gap="16">
          <Column gap="8">
            <Text variant="label-default-s" onBackground="neutral-weak">
              Title
            </Text>
            <Input
              id="album-title"
              value={editingTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter album title"
            />
          </Column>
          <Column gap="8">
            <Text variant="label-default-s" onBackground="neutral-weak">
              Description
            </Text>
            <Textarea
              id="album-description"
              value={editingDescription}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Enter album description"
              rows={3}
            />
          </Column>
          <Column gap="8">
            <Text variant="label-default-s" onBackground="neutral-weak">
              Location
            </Text>
            <Input
              id="album-location"
              value={editingLocation}
              onChange={(e) => handleLocationChange(e.target.value)}
              placeholder="Enter location (e.g., Hanoi, Saigon)"
            />
          </Column>
          <Column gap="8">
            <Text variant="label-default-s" onBackground="neutral-weak">
              Gallery Theme
            </Text>
            <select
              value={album.theme || 'light'}
              onChange={(e) => updateAlbumField('theme', e.target.value as AlbumTheme)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--neutral-border-medium)',
                backgroundColor: 'var(--neutral-background-medium)',
                color: 'var(--neutral-on-background-strong)',
                fontSize: '14px',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
              <option value="auto">Auto (System Preference)</option>
            </select>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              Choose how the gallery will be displayed to viewers
            </Text>
          </Column>
          <Column gap="8">
            <Row horizontal="between" vertical="center">
              <Column gap="4">
                <Text variant="label-default-s" onBackground="neutral-weak">
                  Falling Leaves Effect
                </Text>
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  Add animated falling leaves to the gallery
                </Text>
              </Column>
              <Button
                variant={album.fallingLeaves ? "primary" : "secondary"}
                onClick={() => updateAlbumField('fallingLeaves', !album.fallingLeaves)}
                size="s"
              >
                {album.fallingLeaves ? "Enabled" : "Disabled"}
              </Button>
            </Row>
          </Column>
        </Column>
      </Column>

      {/* Album Info */}
      <Column gap="8" padding="16" radius="m" background="neutral-alpha-weak">
        <Text variant="label-default-s">Album Information</Text>
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

      {/* Sort Controls */}
      <Row horizontal="between" vertical="center">
        <Row gap="12" vertical="center">
          <Text variant="heading-strong-m">Media Files ({media.length})</Text>
          {isReordering && (
            <Text variant="body-default-xs" onBackground="neutral-weak">
              Saving order...
            </Text>
          )}
        </Row>
        <div ref={sortMenuRef} style={{ position: 'relative' }}>
          <Button
            variant="secondary"
            size="m"
            onClick={() => setSortMenuOpen(!sortMenuOpen)}
            disabled={media.length < 2}
          >
            <Row gap="8" vertical="center">
              <Text>
                {sortBy === 'order' && 'Manual Order'}
                {sortBy === 'date' && 'Sort by Date'}
                {sortBy === 'name' && 'Sort by Name'}
                {sortBy === 'size' && 'Sort by Size'}
              </Text>
              <FiArrowDown size={14} />
            </Row>
          </Button>

          {/* Dropdown Menu */}
          {sortMenuOpen && (
            <Column
              gap="0"
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                minWidth: '180px',
                backgroundColor: 'var(--neutral-background-strong)',
                border: '1px solid var(--neutral-border-medium)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => handleSort('date')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: sortBy === 'date' ? 'var(--accent-background-weak)' : 'transparent',
                  color: sortBy === 'date' ? 'var(--accent-on-background-strong)' : 'var(--neutral-on-background-strong)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: sortBy === 'date' ? 600 : 400,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (sortBy !== 'date') {
                    e.currentTarget.style.background = 'var(--neutral-alpha-weak)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (sortBy !== 'date') {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                Sort by Date ↑
              </button>
              <button
                type="button"
                onClick={() => handleSort('name')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: sortBy === 'name' ? 'var(--accent-background-weak)' : 'transparent',
                  color: sortBy === 'name' ? 'var(--accent-on-background-strong)' : 'var(--neutral-on-background-strong)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: sortBy === 'name' ? 600 : 400,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (sortBy !== 'name') {
                    e.currentTarget.style.background = 'var(--neutral-alpha-weak)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (sortBy !== 'name') {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                Sort by Name (A-Z)
              </button>
              <button
                type="button"
                onClick={() => handleSort('size')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: sortBy === 'size' ? 'var(--accent-background-weak)' : 'transparent',
                  color: sortBy === 'size' ? 'var(--accent-on-background-strong)' : 'var(--neutral-on-background-strong)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: sortBy === 'size' ? 600 : 400,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (sortBy !== 'size') {
                    e.currentTarget.style.background = 'var(--neutral-alpha-weak)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (sortBy !== 'size') {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                Sort by Size ↑
              </button>
            </Column>
          )}
        </div>
      </Row>

      {/* Sortable Media Grid */}
      <SortableMediaGrid
        media={media}
        onDelete={handleDeleteMedia}
        onSetCover={handleSetCover}
        onTogglePublish={handleToggleMediaPublish}
        onToggleFavorite={handleToggleFavorite}
        onReorder={handleReorder}
        coverImage={album.coverImage}
      />

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <UploadProgress
          items={uploadProgress}
          onClose={handleCloseUploadProgress}
        />
      )}
    </Column>
  );
}