"use client";

import React, { useState } from "react";
import Image from "next/image";
import Masonry from "react-masonry-css";
import { ImageModal } from "../ImageModal";
import type { MediaDocument } from "@/types";

interface GalleryViewProps {
  media: MediaDocument[];
}

export default function GalleryView({ media }: GalleryViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Filter only images
  const images = media.filter((m) => m.type === "image");

  const breakpointColumnsObj = {
    // default: 2 columns on desktop
    default: 2,
    // keep 2 columns for medium widths
    768: 2,
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
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

  if (images.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "32px" }}>
        <p>No images to display</p>
      </div>
    );
  }

  return (
    <div
      style={{ 
        maxWidth: '1200px', 
        marginLeft: 'auto', 
        marginRight: 'auto',
        padding: '16px'
      }}
    >
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {images.map((image, index) => (
          <Image
            key={image._id?.toString() || `image-${index}`}
            src={image.url}
            alt={image.filename}
            width={800}
            height={600}
            loading="lazy"
            onClick={() => handleImageClick(index)}
            className="rounded-lg w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
            style={{
              display: "block",
              width: "100%",
              height: "auto",
              borderRadius: "8px",
            }}
          />
        ))}
      </Masonry>

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
    </div>
  );
}

