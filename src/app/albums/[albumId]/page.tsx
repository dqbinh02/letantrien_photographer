"use client";

import { Column, Heading, Text } from "@once-ui-system/core";
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import GalleryView from "@/components/gallery/GalleryView";
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

  return (
    <Column maxWidth="xl" paddingTop="24" gap="24">
      <Column gap="8" horizontal="center">
        <Heading variant="heading-strong-xl">{album.title}</Heading>
        {album.description && (
          <Text
            variant="body-default-m"
            onBackground="neutral-weak"
            style={{ textAlign: "center", maxWidth: "600px" }}
          >
            {album.description}
          </Text>
        )}
        <Text variant="label-default-s" onBackground="neutral-weak">
          {media.length} {media.length === 1 ? "photo" : "photos"}
        </Text>
      </Column>

      <GalleryView media={media} />
    </Column>
  );
}
