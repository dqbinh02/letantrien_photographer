"use client";

import { Column, Text, Button } from "@once-ui-system/core";
import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { FiUpload, FiImage, FiVideo } from "react-icons/fi";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  isUploading?: boolean;
  accept?: string;
  /** maxFiles: if undefined, no limit */
  maxFiles?: number;
}

export function UploadZone({
  onFilesSelected,
  isUploading = false,
  accept = "image/*,video/*",
  maxFiles
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    // Filter to only images and videos
    const validFiles = files.filter((file) =>
      file.type.startsWith("image/") || file.type.startsWith("video/")
    );

    // If maxFiles is provided, limit; otherwise accept all
    const limitedFiles = typeof maxFiles === "number" && isFinite(maxFiles)
      ? validFiles.slice(0, maxFiles)
      : validFiles;

    onFilesSelected(limitedFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Column gap="16">
      <Text variant="heading-strong-m">Upload Media</Text>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{
          border: `2px dashed ${isDragOver ? 'var(--accent-border-strong)' : 'var(--neutral-border-medium)'}`,
          borderRadius: 'var(--radius-l)',
          padding: 'var(--static-space-32)',
          textAlign: 'center',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          backgroundColor: isDragOver
            ? 'var(--accent-alpha-weak)'
            : 'var(--neutral-alpha-weak)',
          transition: 'all 0.2s ease-in-out',
          opacity: isUploading ? 0.6 : 1,
        }}
      >
        <Column gap="16" horizontal="center">
          <div style={{ fontSize: '48px', color: 'var(--neutral-on-background-weak)' }}>
            <FiUpload />
          </div>

          <Column gap="8" horizontal="center">
            <Text variant="heading-default-l">
              {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
            </Text>
            <Text variant="body-default-s" onBackground="neutral-weak">
              or click to select files
            </Text>
            <Text variant="label-default-xs" onBackground="neutral-weak">
              {typeof maxFiles === 'number' && isFinite(maxFiles)
                ? `Supports images and videos (max ${maxFiles} files)`
                : 'Supports images and videos (no limit)'}
            </Text>
          </Column>

          <Column gap="8" horizontal="center">
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiImage size={16} />
                <Text variant="label-default-s">Images</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiVideo size={16} />
                <Text variant="label-default-s">Videos</Text>
              </div>
            </div>
          </Column>

          {isUploading && (
            <Text variant="body-default-s" style={{ color: 'var(--accent-on-background-strong)' }}>
              Uploading files...
            </Text>
          )}
        </Column>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileInput}
        style={{ display: 'none' }}
        disabled={isUploading}
      />
    </Column>
  );
}