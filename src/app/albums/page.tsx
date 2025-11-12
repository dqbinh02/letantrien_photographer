"use client";

import { Column, Heading, Text, Row } from "@once-ui-system/core";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { AlbumDocument } from "@/types";

interface AlbumWithCount extends AlbumDocument {
  publishedMediaCount: number;
}

export default function PublicAlbumsPage() {
  const [albums, setAlbums] = useState<AlbumWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/albums");
        const result = await response.json();

        if (result.success) {
          setAlbums(result.data);
        } else {
          setError(result.error || "Failed to fetch albums");
        }
      } catch (err) {
        console.error("Error fetching albums:", err);
        setError("Failed to fetch albums");
      } finally {
        setLoading(false);
      }
    };

    void fetchAlbums();
  }, []);

  if (loading) {
    return (
      <Column maxWidth="l" paddingTop="24" gap="24" horizontal="center">
        <Text variant="body-default-l">Loading albums...</Text>
      </Column>
    );
  }

  if (error) {
    return (
      <Column maxWidth="l" paddingTop="24" gap="24" horizontal="center">
        <Text variant="body-default-l" style={{ color: "var(--danger-on-background-strong)" }}>
          Error: {error}
        </Text>
      </Column>
    );
  }

  if (albums.length === 0) {
    return (
      <Column maxWidth="l" paddingTop="24" gap="24" horizontal="center">
        <Heading variant="heading-strong-l">Photo Albums</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          No albums available at this time
        </Text>
      </Column>
    );
  }

  return (
    <Column maxWidth="l" paddingTop="24" gap="24">
      <Column gap="8">
        <Heading variant="heading-strong-l">Photo Albums</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          Browse through our collection of photo albums
        </Text>
      </Column>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "24px",
        }}
      >
        {albums.map((album) => (
          <AlbumCard key={album._id?.toString()} album={album} />
        ))}
      </div>
    </Column>
  );
}

interface AlbumCardProps {
  album: AlbumWithCount;
}

function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link
      href={`/albums/${album._id?.toString()}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Column
        gap="12"
        padding="16"
        radius="m"
        background="neutral-alpha-weak"
        style={{
          transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
          cursor: "pointer",
          height: "100%",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Album Cover */}
        <div
          style={{
            width: "100%",
            height: "220px",
            borderRadius: "8px",
            overflow: "hidden",
            backgroundColor: "var(--neutral-alpha-medium)",
            position: "relative",
          }}
        >
          {album.coverImage ? (
            <Image
              src={album.coverImage}
              alt={album.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
              style={{
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--neutral-on-background-weak)",
              }}
            >
              No Cover
            </div>
          )}
        </div>

        {/* Album Info */}
        <Column gap="8">
          <Text variant="heading-strong-m" style={{ lineHeight: 1.3 }}>
            {album.title}
          </Text>

          {album.description && (
            <Text
              variant="body-default-s"
              onBackground="neutral-weak"
              style={{ lineHeight: 1.4 }}
            >
              {album.description.length > 120
                ? `${album.description.substring(0, 120)}...`
                : album.description}
            </Text>
          )}

          <Row gap="16">
            <Text variant="label-default-xs" onBackground="neutral-weak">
              {album.publishedMediaCount} {album.publishedMediaCount === 1 ? "photo" : "photos"}
            </Text>
            <Text variant="label-default-xs" onBackground="neutral-weak">
              {new Date(album.createdAt).toLocaleDateString()}
            </Text>
          </Row>
        </Column>
      </Column>
    </Link>
  );
}
