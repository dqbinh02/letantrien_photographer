"use client";

import { Column, Heading, Input, Button, Text } from "@once-ui-system/core";
import { useState } from "react";
import type { AlbumFormData, AlbumImage } from "@/types";

export default function AdminPage() {
  const [formData, setFormData] = useState<AlbumFormData>({
    title: "",
    description: "",
    coverImage: "",
    images: [],
  });
  const [currentImage, setCurrentImage] = useState<AlbumImage>({
    src: "",
    alt: "",
    orientation: "horizontal",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleAddImage = () => {
    if (currentImage.src && currentImage.alt) {
      setFormData({
        ...formData,
        images: [...formData.images, currentImage],
      });
      setCurrentImage({ src: "", alt: "", orientation: "horizontal" });
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/albums", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: "success", text: "Album created successfully!" });
        setFormData({
          title: "",
          description: "",
          coverImage: "",
          images: [],
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to create album",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while creating the album",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Column maxWidth="l" paddingTop="24" gap="24">
      <Heading marginBottom="l" variant="heading-strong-xl" marginLeft="24">
        Admin - Upload Album
      </Heading>

      <Column fillWidth padding="l" gap="24">
        {message && (
          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              backgroundColor:
                message.type === "success"
                  ? "var(--accent-alpha-weak)"
                  : "var(--danger-alpha-weak)",
              color:
                message.type === "success"
                  ? "var(--accent-on-background-strong)"
                  : "var(--danger-on-background-strong)",
            }}
          >
            <Text>{message.text}</Text>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Column gap="20">
            {/* Album Title */}
            <Column gap="8">
              <Text variant="label-default-s">Album Title</Text>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter album title"
                required
              />
            </Column>

            {/* Album Description */}
            <Column gap="8">
              <Text variant="label-default-s">Description</Text>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter album description"
                required
                style={{
                  width: "100%",
                  minHeight: "100px",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid var(--neutral-alpha-weak)",
                  backgroundColor: "var(--neutral-alpha-weak)",
                  color: "var(--neutral-on-background-strong)",
                  fontFamily: "inherit",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
            </Column>

            {/* Cover Image */}
            <Column gap="8">
              <Text variant="label-default-s">Cover Image URL</Text>
              <Input
                id="coverImage"
                value={formData.coverImage}
                onChange={(e) =>
                  setFormData({ ...formData, coverImage: e.target.value })
                }
                placeholder="/images/album-cover.jpg"
                required
              />
            </Column>

            {/* Images Section */}
            <Column gap="12" marginTop="24">
              <Heading variant="heading-strong-l">Album Images</Heading>

              {/* Add Image Form */}
              <Column
                gap="12"
                padding="16"
                style={{
                  backgroundColor: "var(--neutral-alpha-weak)",
                  borderRadius: "8px",
                }}
              >
                <Text variant="label-default-s">Add Image</Text>
                <Column gap="8">
                  <Input
                    id="imageSrc"
                    value={currentImage.src}
                    onChange={(e) =>
                      setCurrentImage({ ...currentImage, src: e.target.value })
                    }
                    placeholder="Image URL (e.g., /images/photo.jpg)"
                  />
                </Column>
                <Column gap="8">
                  <Input
                    id="imageAlt"
                    value={currentImage.alt}
                    onChange={(e) =>
                      setCurrentImage({ ...currentImage, alt: e.target.value })
                    }
                    placeholder="Image alt text"
                  />
                </Column>
                <Column gap="8">
                  <Text variant="label-default-s">Orientation</Text>
                  <select
                    value={currentImage.orientation}
                    onChange={(e) =>
                      setCurrentImage({
                        ...currentImage,
                        orientation: e.target.value as "horizontal" | "vertical",
                      })
                    }
                    style={{
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid var(--neutral-alpha-weak)",
                      backgroundColor: "var(--neutral-alpha-weak)",
                      color: "var(--neutral-on-background-strong)",
                      fontFamily: "inherit",
                      fontSize: "14px",
                    }}
                  >
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                  </select>
                </Column>
                <Button onClick={handleAddImage} type="button" size="m">
                  Add Image to Album
                </Button>
              </Column>

              {/* Images List */}
              {formData.images.length > 0 && (
                <Column gap="12" marginTop="16">
                  <Text variant="label-default-s">
                    Images ({formData.images.length})
                  </Text>
                  {formData.images.map((image, index) => (
                    <div
                      key={`${image.src}-${index}`}
                      style={{
                        padding: "12px",
                        backgroundColor: "var(--neutral-alpha-weak)",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Column gap="4">
                        <Text variant="body-default-s" style={{ fontWeight: 500 }}>
                          {image.alt}
                        </Text>
                        <Text
                          variant="body-default-xs"
                          style={{ color: "var(--neutral-on-background-weak)" }}
                        >
                          {image.src} - {image.orientation}
                        </Text>
                      </Column>
                      <Button
                        onClick={() => handleRemoveImage(index)}
                        size="s"
                        variant="tertiary"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </Column>
              )}
            </Column>

            {/* Submit Button */}
            <Button
              type="submit"
              size="l"
              disabled={loading}
              style={{ marginTop: "24px" }}
            >
              {loading ? "Creating Album..." : "Create Album"}
            </Button>
          </Column>
        </form>
      </Column>
    </Column>
  );
}
