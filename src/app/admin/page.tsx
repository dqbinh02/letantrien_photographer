"use client";

import { Column, Heading, Button, Text, Row } from "@once-ui-system/core";
import { useState, useEffect } from "react";
import Link from "next/link";
import { AlbumCard } from "@/components";
import type { AlbumDocument } from "@/types";

interface AlbumWithCount extends AlbumDocument {
  mediaCount: number;
}

export default function AdminDashboard() {
  const [albums, setAlbums] = useState<AlbumWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/albums");
      const result = await response.json();

      if (result.success) {
        setAlbums(result.data);
      } else {
        setError(result.error || "Failed to fetch albums");
      }
    } catch (error) {
      console.error("Error fetching albums:", error);
      setError("Failed to fetch albums");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    if (!confirm("Are you sure you want to delete this album and all its media?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/albums/${albumId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setAlbums(albums.filter(album => album._id?.toString() !== albumId));
      } else {
        alert(result.error || "Failed to delete album");
      }
    } catch (error) {
      console.error("Error deleting album:", error);
      alert("Failed to delete album");
    }
  };

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
        <Button onClick={fetchAlbums}>Try Again</Button>
      </Column>
    );
  }

  return (
    <Column maxWidth="l" paddingTop="24" gap="24">
      <Row horizontal="between" vertical="center">
        <Heading marginBottom="l" variant="heading-strong-xl">
          Admin Dashboard
        </Heading>
        <Link href="/admin/albums/create" style={{ textDecoration: "none" }}>
          <Button size="l">Create New Album</Button>
        </Link>
      </Row>

      {albums.length === 0 ? (
        <Column gap="16" horizontal="center" padding="32">
          <Heading variant="heading-default-l">No albums yet</Heading>
          <Text variant="body-default-s" onBackground="neutral-weak">
            Create your first album to get started
          </Text>
          <Link href="/admin/albums/create" style={{ textDecoration: "none" }}>
            <Button size="m">Create Album</Button>
          </Link>
        </Column>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {albums.map((album) => (
            <AlbumCard
              key={album._id?.toString()}
              album={album}
              mediaCount={album.mediaCount}
              onDelete={handleDeleteAlbum}
            />
          ))}
        </div>
      )}
    </Column>
  );
}
