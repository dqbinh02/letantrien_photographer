"use client";

import { Column, Text, Button, Row } from "@once-ui-system/core";
import { FiPlay, FiTrash2, FiStar } from "react-icons/fi";
import type { MediaDocument } from "@/types";
import React from "react";

interface MediaGridProps {
  media: MediaDocument[];
  onDelete?: (mediaId: string) => void;
  onSetCover?: (mediaUrl: string) => void;
  coverImage?: string;
}

export const MediaGrid = React.memo(function MediaGrid({ media, onDelete, onSetCover, coverImage }: MediaGridProps) {
  if (media.length === 0) {
    return (
      <Column gap="16" horizontal="center" padding="32">
        <Text variant="body-default-s" onBackground="neutral-weak">
          No media files uploaded yet
        </Text>
      </Column>
    );
  }

  return (
    <Column gap="16">
      <Text variant="heading-strong-m">Media Files ({media.length})</Text>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        {media.map((item, index) => (
          <MediaItem
            key={item._id?.toString() || `temp-${item.filename}-${index}`}
            media={item}
            onDelete={onDelete}
            onSetCover={onSetCover}
            isCover={coverImage === item.url}
          />
        ))}
      </div>
    </Column>
  );
});

interface MediaItemProps {
  media: MediaDocument;
  onDelete?: (mediaId: string) => void;
  onSetCover?: (mediaUrl: string) => void;
  isCover?: boolean;
}

const MediaItem = React.memo(function MediaItem({ media, onDelete, onSetCover, isCover }: MediaItemProps) {
  const handleDelete = () => {
    if (onDelete && media._id) {
      onDelete(media._id.toString());
    }
  };

  const handleSetCover = () => {
    if (onSetCover) {
      onSetCover(media.url);
    }
  };

  const isVideo = media.type === "video";

  return (
    <Column
      gap="8"
      padding="12"
      radius="m"
      background="neutral-alpha-weak"
      style={{ position: "relative" }}
    >
      {/* Media Thumbnail */}
      <div
        style={{
          width: "100%",
          height: "150px",
          borderRadius: "8px",
          overflow: "hidden",
          backgroundColor: "var(--neutral-alpha-medium)",
          position: "relative",
        }}
      >
        {isVideo ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--neutral-alpha-strong)",
            }}
          >
            <FiPlay size={32} style={{ color: "var(--neutral-on-background-weak)" }} />
          </div>
        ) : (
          <img
            src={media.url}
            alt={media.filename}
            loading="lazy"
            decoding="async"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}

        {/* Cover indicator */}
        {isCover && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              backgroundColor: "var(--accent-background-strong)",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiStar size={12} style={{ color: "var(--accent-on-background-strong)" }} />
          </div>
        )}
      </div>

      {/* Media Info */}
      <Column gap="4">
        <Text variant="body-default-s" style={{ fontWeight: 500, lineHeight: 1.3 }}>
          {media.filename.length > 20
            ? `${media.filename.substring(0, 20)}...`
            : media.filename
          }
        </Text>
        <Text variant="label-default-xs" onBackground="neutral-weak">
          {media.type} • {new Date(media.uploadedAt).toLocaleDateString()}
        </Text>
      </Column>

      {/* Action Buttons */}
      <Row gap="8">
        {!isCover && onSetCover && (
          <Button
            size="s"
            variant="secondary"
            onClick={handleSetCover}
            style={{ flex: 1 }}
          >
            Set Cover
          </Button>
        )}

        {onDelete && (
          <Button
            size="s"
            variant="tertiary"
            onClick={handleDelete}
            style={{
              color: "var(--danger-on-background-strong)",
              flex: isCover ? 1 : "none",
            }}
          >
            <FiTrash2 size={14} />
          </Button>
        )}
      </Row>
    </Column>
  );
});