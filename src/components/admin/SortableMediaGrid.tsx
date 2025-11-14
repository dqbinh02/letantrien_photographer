"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Column, Text } from "@once-ui-system/core";
import type { MediaDocument } from "@/types";
import React, { useState } from "react";
import { SortableMediaItem } from "./SortableMediaItem";
import { ImageModal } from "../ImageModal";

interface SortableMediaGridProps {
  media: MediaDocument[];
  onDelete?: (mediaId: string) => void;
  onSetCover?: (mediaUrl: string) => void;
  onTogglePublish?: (mediaId: string, nextState: boolean) => void;
  onReorder?: (reorderedMedia: MediaDocument[]) => void;
  coverImage?: string;
  isReordering?: boolean;
}

export const SortableMediaGrid = React.memo(function SortableMediaGrid({
  media,
  onDelete,
  onSetCover,
  onTogglePublish,
  onReorder,
  coverImage,
  isReordering = false,
}: SortableMediaGridProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [localMedia, setLocalMedia] = useState<MediaDocument[]>(media);

  // Update local state when media prop changes
  React.useEffect(() => {
    setLocalMedia(media);
  }, [media]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localMedia.findIndex((item) => 
        (item._id?.toString() || item.url) === active.id
      );
      const newIndex = localMedia.findIndex((item) => 
        (item._id?.toString() || item.url) === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(localMedia, oldIndex, newIndex);
        setLocalMedia(reordered);
        
        // Call parent callback with reordered media
        if (onReorder) {
          onReorder(reordered);
        }
      }
    }
  };

  // Filter only images for modal navigation
  const images = localMedia.filter(m => m.type === "image");
  
  const handleImageClick = (mediaItem: MediaDocument) => {
    if (mediaItem.type === "image") {
      const imageIndex = images.findIndex(img => 
        img._id?.toString() === mediaItem._id?.toString()
      );
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

  if (localMedia.length === 0) {
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
        <Text variant="heading-strong-m">
          Media Files ({localMedia.length})
          {isReordering && (
            <Text 
              variant="body-default-xs" 
              onBackground="neutral-weak"
              style={{ marginLeft: '12px' }}
            >
              Saving order...
            </Text>
          )}
        </Text>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localMedia.map(item => item._id?.toString() || item.url)}
            strategy={rectSortingStrategy}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "8px",
              }}
            >
              {localMedia.map((item) => (
                <SortableMediaItem
                  key={item._id?.toString() || item.url}
                  media={item}
                  onDelete={onDelete}
                  onSetCover={onSetCover}
                  onTogglePublish={onTogglePublish}
                  isCover={coverImage === item.url}
                  onClick={() => handleImageClick(item)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
