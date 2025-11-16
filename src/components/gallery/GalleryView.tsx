"use client";

import React, { useState } from "react";
import Image from "next/image";
import Masonry from "react-masonry-css";
import { FaHeart } from "react-icons/fa";
import { ImageModal } from "../ImageModal";
import type { MediaDocument } from "@/types";

interface GalleryViewProps {
  media: MediaDocument[];
  hasToken?: boolean;
  token?: string | null;
}

export default function GalleryView({ media, hasToken = false, token = null }: GalleryViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Filter only images
  const images = media.filter((m) => m.type === "image");

  const breakpointColumnsObj = {
    // default: 3 columns on desktop
    default: 3,
    // 2 columns for medium widths (tablets)
    1024: 2,
    // 2 columns for mobile
    640: 2,
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

  const handleDownload = async (image: MediaDocument, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening modal
    
    if (!token) {
      console.error('No token available for download');
      return;
    }

    try {
      const url = `/api/media/${image._id}/download?token=${token}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = image.filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file. Please try again.');
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
        maxWidth: '100%', 
        marginLeft: 'auto', 
        marginRight: 'auto',
      }}
    >
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {images.map((image, index) => (
          <div 
            key={image._id?.toString() || `image-${index}`}
            className="media-item-container"
            style={{ position: 'relative' }}
          >
            <Image
              src={image.url}
              alt={image.filename}
              width={800}
              height={600}
              loading={index < 6 ? "eager" : "lazy"}
              priority={index < 3}
              onClick={() => handleImageClick(index)}
              className="rounded-lg w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                borderRadius: "8px",
              }}
            />
            {hasToken && image.isFavorite && (
              <div className="favorite-overlay">
                <FaHeart size={16} />
              </div>
            )}
            {hasToken && (
              <button 
                className="download-overlay"
                onClick={(e) => handleDownload(image, e)}
                title="Download"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            )}
          </div>
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
          nextImageUrl={selectedImageIndex < images.length - 1 ? images[selectedImageIndex + 1]?.url : undefined}
          prevImageUrl={selectedImageIndex > 0 ? images[selectedImageIndex - 1]?.url : undefined}
        />
      )}
    </div>
  );
}

