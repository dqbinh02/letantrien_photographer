"use client";

import { Column, Heading, Button, Text, Row } from "@once-ui-system/core";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { UploadZone, MediaGrid, CopyGalleryLinkButton } from "@/components";
import type { AlbumDocument, MediaDocument } from "@/types";

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

  const handleFilesSelected = async (files: File[]) => {
    if (!albumId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`/api/admin/albums/${albumId}/upload`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Refresh album data
        await fetchAlbumDetail();
        alert(`Successfully uploaded ${result.data.length} files`);
      } else {
        alert(result.error || "Failed to upload files");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm("Are you sure you want to delete this media file?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/media/${mediaId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        // Refresh album data
        await fetchAlbumDetail();
      } else {
        alert(result.error || "Failed to delete media");
      }
    } catch (error) {
      console.error("Error deleting media:", error);
      alert("Failed to delete media");
    }
  };

  const handleSetCover = async (mediaUrl: string) => {
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
        alert(result.error || "Failed to set cover image");
      }
    } catch (error) {
      console.error("Error setting cover:", error);
      alert("Failed to set cover image");
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

      {/* Media Grid */}
      <MediaGrid
        media={media}
        onDelete={handleDeleteMedia}
        onSetCover={handleSetCover}
        coverImage={album.coverImage}
      />
    </Column>
  );
}