"use client";

import { useEffect, useCallback, useState } from "react";
import { FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import Image from "next/image";

interface ImageModalProps {
  imageUrl: string;
  alt?: string;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  nextImageUrl?: string;
  prevImageUrl?: string;
}

export function ImageModal({ 
  imageUrl, 
  alt = "Image", 
  onClose, 
  onNext, 
  onPrev,
  hasNext = false,
  hasPrev = false,
  nextImageUrl,
  prevImageUrl
}: ImageModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);

  // Update image when prop changes
  useEffect(() => {
    if (imageUrl !== currentImageUrl) {
      setIsLoading(true);
      setCurrentImageUrl(imageUrl);
    }
  }, [imageUrl, currentImageUrl]);
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowRight' && hasNext && onNext) {
      onNext();
    } else if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
      onPrev();
    }
  }, [onClose, onNext, onPrev, hasNext, hasPrev]);

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const buttonStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '50%',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'white',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        title="Close (Esc)"
        style={{
          ...buttonStyle,
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10000,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        <FiX size={24} />
      </button>

      {/* Previous Button */}
      {hasPrev && onPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          title="Previous (←)"
          style={{
            ...buttonStyle,
            position: 'fixed',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10000,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <FiChevronLeft size={32} />
        </button>
      )}

      {/* Next Button */}
      {hasNext && onNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          title="Next (→)"
          style={{
            ...buttonStyle,
            position: 'fixed',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10000,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <FiChevronRight size={32} />
        </button>
      )}

      {/* Image - unoptimized to use original blob URL (already cached from grid) */}
      <div style={{ 
        position: 'relative', 
        width: '90vw', 
        height: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Image
          src={currentImageUrl}
          alt={alt || "Gallery image"}
          width={1920}
          height={1080}
          unoptimized
          onLoad={() => setIsLoading(false)}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            borderRadius: '8px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            opacity: isLoading ? 0.3 : 1,
            transition: 'opacity 0.2s ease-out',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes zoomIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
