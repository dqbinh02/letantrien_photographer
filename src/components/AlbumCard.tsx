"use client";

import { Column, Text, Button, Row } from "@once-ui-system/core";
import Link from "next/link";
import Image from "next/image";
import { FiLock, FiUnlock } from "react-icons/fi";
import type { AlbumDocument } from "@/types";
import { CopyGalleryLinkButton } from "./CopyGalleryLinkButton";

interface AlbumCardProps {
  album: AlbumDocument;
  mediaCount?: number;
  publishedMediaCount?: number;
  onDelete?: (albumId: string) => void;
}

export function AlbumCard({ album, mediaCount = 0, publishedMediaCount, onDelete }: AlbumCardProps) {
  const handleDelete = () => {
    if (onDelete && album._id) {
      onDelete(album._id.toString());
    }
  };

  const displayPublishedCount = publishedMediaCount !== undefined ? publishedMediaCount : mediaCount;

  return (
    <Column
      gap="12"
      padding="16"
      radius="m"
      background="neutral-alpha-weak"
      style={{
        transition: "transform 0.2s ease-in-out",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Album Cover */}
      <div
        style={{
          width: "100%",
          height: "200px",
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
              borderRadius: "8px",
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
        <Row horizontal="between" vertical="center">
          <Text variant="heading-strong-m" style={{ lineHeight: 1.3 }}>
            {album.title}
          </Text>
          <Row 
            gap="4" 
            vertical="center"
            padding="4"
            paddingLeft="8"
            paddingRight="8"
            radius="s"
            background={album.isPublished ? "success-alpha-weak" : "neutral-alpha-medium"}
          >
            {album.isPublished ? (
              <FiUnlock size={14} style={{ color: "var(--success-on-background-strong)" }} />
            ) : (
              <FiLock size={14} style={{ color: "var(--neutral-on-background-medium)" }} />
            )}
            <Text 
              variant="label-default-xs" 
              style={{ 
                color: album.isPublished 
                  ? "var(--success-on-background-strong)" 
                  : "var(--neutral-on-background-medium)"
              }}
            >
              {album.isPublished ? "Public" : "Private"}
            </Text>
          </Row>
        </Row>

        {album.description && (
          <Text variant="body-default-s" onBackground="neutral-weak" style={{ lineHeight: 1.4 }}>
            {album.description.length > 100
              ? `${album.description.substring(0, 100)}...`
              : album.description
            }
          </Text>
        )}

        <Column gap="4">
          <Text variant="label-default-xs" onBackground="neutral-weak">
            {publishedMediaCount !== undefined 
              ? `${displayPublishedCount}/${mediaCount} published`
              : `${mediaCount} media files`
            }
          </Text>
          <Text variant="label-default-xs" onBackground="neutral-weak">
            Created {new Date(album.createdAt).toLocaleDateString()}
          </Text>
        </Column>
      </Column>

      {/* Gallery Link */}
      <Column gap="8">
        <Text variant="label-default-s" onBackground="neutral-strong">
          Gallery Link
        </Text>
        <CopyGalleryLinkButton
          albumId={album._id?.toString() || ""}
          token={album.link.token}
          baseURL={typeof window !== "undefined" ? window.location.origin : ""}
        />
      </Column>

      {/* Action Buttons */}
      <Column gap="8">
        <Link href={`/admin/albums/${album._id}`} style={{ textDecoration: "none" }}>
          <Button size="s" fillWidth>
            View Details
          </Button>
        </Link>

        <Button
          size="s"
          variant="tertiary"
          fillWidth
          onClick={handleDelete}
          style={{ color: "var(--danger-on-background-strong)" }}
        >
          Delete Album
        </Button>
      </Column>
    </Column>
  );
}