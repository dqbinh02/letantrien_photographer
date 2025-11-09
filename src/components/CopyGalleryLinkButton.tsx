"use client";

import { Button, Text } from "@once-ui-system/core";
import { useState } from "react";

interface CopyGalleryLinkButtonProps {
  albumId: string;
  token: string;
  baseURL?: string;
}

export function CopyGalleryLinkButton({ albumId, token, baseURL }: CopyGalleryLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const galleryLink = `${baseURL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")}/gallery/${token}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(galleryLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      // Fallback for older browsers or restricted environments
      try {
        const textArea = document.createElement("textarea");
        textArea.value = galleryLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error("Fallback copy failed:", fallbackError);
        alert("Unable to copy link. Please copy manually: " + galleryLink);
      }
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