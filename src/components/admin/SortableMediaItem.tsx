"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Column, Text, Button, Row } from "@once-ui-system/core";
import Image from "next/image";
import { FiPlay, FiTrash2, FiStar, FiLock, FiUnlock, FiMove, FiHeart } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import type { MediaDocument } from "@/types";
import React from "react";

interface SortableMediaItemProps {
  media: MediaDocument;
  onDelete?: (mediaId: string) => void;
  onSetCover?: (mediaUrl: string) => void;
  onTogglePublish?: (mediaId: string, nextState: boolean) => void;
  onToggleFavorite?: (mediaId: string) => void;
  isCover?: boolean;
  onClick?: () => void;
}

export const SortableMediaItem = React.memo(function SortableMediaItem({
  media,
  onDelete,
  onSetCover,
  onTogglePublish,
  onToggleFavorite,
  isCover,
  onClick
}: SortableMediaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: media._id?.toString() || media.url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

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

  const handleToggleFavorite = () => {
    if (onToggleFavorite && media._id) {
      onToggleFavorite(media._id.toString());
    }
  };

  const isVideo = media.type === "video";
  const isPublished = media.isPublished ?? false;
  const isFavorite = media.isFavorite ?? false;

  return (
    <div ref={setNodeRef} style={style}>
      <Column
        gap="8"
        padding="12"
        radius="m"
        background="neutral-alpha-weak"
        style={{ 
          position: "relative",
          border: isDragging ? '2px solid var(--accent-background-strong)' : 'none',
        }}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            zIndex: 10,
            cursor: isDragging ? 'grabbing' : 'grab',
            backgroundColor: 'var(--neutral-alpha-strong)',
            borderRadius: '4px',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.8,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
        >
          <FiMove size={16} style={{ color: 'var(--neutral-on-background-strong)' }} />
        </div>

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

          {/* Favorite toggle button */}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite();
              }}
              style={{
                position: "absolute",
                top: "8px",
                right: isCover ? "40px" : "8px",
                backgroundColor: "var(--neutral-alpha-strong)",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {isFavorite ? (
                <FaHeart size={12} style={{ color: "var(--danger-on-background-strong)" }} />
              ) : (
                <FiHeart size={12} style={{ color: "var(--neutral-on-background-weak)" }} />
              )}
            </button>
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
    </div>
  );
});
