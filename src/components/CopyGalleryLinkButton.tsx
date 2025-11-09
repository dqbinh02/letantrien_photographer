"use client";

import { Button, Text } from "@once-ui-system/core";
import { useState } from "react";

interface CopyGalleryLinkButtonProps {
  albumId: string;
  token: string;
  baseURL?: string;
}

export function CopyGalleryLinkButton({ albumId, token, baseURL = "http://localhost:3000" }: CopyGalleryLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const galleryLink = `${baseURL}/gallery/${token}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(galleryLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <Text variant="body-default-s" onBackground="neutral-weak">
        {galleryLink}
      </Text>
      <Button
        size="s"
        variant={copied ? "primary" : "secondary"}
        onClick={handleCopy}
      >
        {copied ? "Copied!" : "Copy Link"}
      </Button>
    </div>
  );
}