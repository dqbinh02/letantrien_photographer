"use client";

import { Column, Text, Button, Row } from "@once-ui-system/core";
import Image from "next/image";
import { FiPlay, FiTrash2, FiStar, FiLock, FiUnlock } from "react-icons/fi";
import type { MediaDocument } from "@/types";
import React, { useState } from "react";
import { ImageModal } from "./ImageModal";

interface MediaGridProps {
  media: MediaDocument[];
  onDelete?: (mediaId: string) => void;
  onSetCover?: (mediaUrl: string) => void;
  onTogglePublish?: (mediaId: string, nextState: boolean) => void;
  coverImage?: string;
}

export const MediaGrid = React.memo(function MediaGrid({ media, onDelete, onSetCover, onTogglePublish, coverImage }: MediaGridProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Filter only images for modal navigation
  const images = media.filter(m => m.type === "image");
  
  const handleImageClick = (mediaItem: MediaDocument) => {
    if (mediaItem.type === "image") {
      const imageIndex = images.findIndex(img => img._id?.toString() === mediaItem._id?.toString());
      setSelectedImageIndex(imageIndex);
    }
  };

  const handleCloseModal = () => {
    setSelectedImageIndex(null);
  };

  const handleNext = () => {
    if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handlePrev = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

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
    <>
      <Column gap="16">
        <Text variant="heading-strong-m">Media Files ({media.length})</Text>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "8px",
          }}
        >
          {media.map((item, index) => (
            <MediaItem
              key={item._id?.toString() || `temp-${item.filename}-${index}`}
              media={item}
              onDelete={onDelete}
              onSetCover={onSetCover}
              onTogglePublish={onTogglePublish}
              isCover={coverImage === item.url}
              onClick={() => handleImageClick(item)}
            />
          ))}
        </div>
      </Column>

      {/* Image Modal */}
      {selectedImageIndex !== null && images[selectedImageIndex] && (
        <ImageModal
          imageUrl={images[selectedImageIndex].url}
          alt={images[selectedImageIndex].filename}
          onClose={handleCloseModal}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={selectedImageIndex < images.length - 1}
          hasPrev={selectedImageIndex > 0}
        />
      )}
    </>
  );
});

interface MediaItemProps {
  media: MediaDocument;
  onDelete?: (mediaId: string) => void;
  onSetCover?: (mediaUrl: string) => void;
  onTogglePublish?: (mediaId: string, nextState: boolean) => void;
  isCover?: boolean;
  onClick?: () => void;
}

const MediaItem = React.memo(function MediaItem({ media, onDelete, onSetCover, onTogglePublish, isCover, onClick }: MediaItemProps) {
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

  const handleTogglePublish = () => {
    if (onTogglePublish && media._id) {
      const nextState = !media.isPublished;
      onTogglePublish(media._id.toString(), nextState);
    }
  };

  const isVideo = media.type === "video";
  const isPublished = media.isPublished ?? false;

  return (
    <Column
      gap="8"
      padding="12"
      radius="m"
      background="neutral-alpha-weak"
      style={{ position: "relative" }}
    >
      {/* Media Thumbnail */}
      <button
        type="button"
        onClick={onClick}
        disabled={isVideo}
        style={{
          width: "100%",
          height: "150px",
          borderRadius: "8px",
          overflow: "hidden",
          backgroundColor: "var(--neutral-alpha-medium)",
          position: "relative",
          cursor: isVideo ? "default" : "pointer",
          border: "none",
          padding: 0,
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
          <Image
            src={media.url}
            alt={media.filename}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            loading="lazy"
            style={{
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
      </button>

      {/* Media Info */}
      <Column gap="4">
        <Row horizontal="between" vertical="center">
          <Text variant="body-default-s" style={{ fontWeight: 500, lineHeight: 1.3, flex: 1 }}>
            {media.filename.length > 20
              ? `${media.filename.substring(0, 20)}...`
              : media.filename
            }
          </Text>
          {onTogglePublish && (
            <Button
              size="s"
              variant="tertiary"
              onClick={handleTogglePublish}
              style={{ padding: "4px" }}
              aria-label={isPublished ? "Unpublish media" : "Publish media"}
            >
              {isPublished ? (
                <FiUnlock size={14} style={{ color: "var(--accent-on-background-strong)" }} />
              ) : (
                <FiLock size={14} style={{ color: "var(--neutral-on-background-weak)" }} />
              )}
            </Button>
          )}
        </Row>
        <Text variant="label-default-xs" onBackground="neutral-weak">
          {media.type} • {new Date(media.uploadedAt).toLocaleDateString()}
          {isPublished && " • Published"}
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