"use client";

import { Column, Heading, Input, Button, Text, Textarea, Row } from "@once-ui-system/core";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CreateAlbumRequest } from "@/types";

export default function CreateAlbumPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateAlbumRequest>({
    title: "",
    description: "",
  });
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const submitData: CreateAlbumRequest = {
        ...formData,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      };

      const response = await fetch("/api/admin/albums", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: "success", text: "Album created successfully!" });
        // Redirect to album detail page
        setTimeout(() => {
          router.push(`/admin/albums/${result.data._id}`);
        }, 1000);
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to create album",
        });
      }
    } catch (error) {
      console.error("Error creating album:", error);
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
      <Row horizontal="between" vertical="center">
        <Heading variant="heading-strong-xl">
          Create New Album
        </Heading>
        <Link href="/admin" style={{ textDecoration: "none" }}>
          <Button variant="secondary">Back to Dashboard</Button>
        </Link>
      </Row>

      <Column fillWidth padding="l" gap="24">
        {message && (
          <Column
            padding="16"
            radius="m"
            background={
              message.type === "success" ? "accent-alpha-weak" : "danger-alpha-weak"
            }
          >
            <Text
              onBackground={
                message.type === "success"
                  ? "accent-strong"
                  : "danger-strong"
              }
            >
              {message.text}
            </Text>
          </Column>
        )}

        <form onSubmit={handleSubmit}>
          <Column gap="20">
            {/* Album Title */}
            <Column gap="8">
              <Text variant="label-default-s">Album Title *</Text>
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
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter album description (optional)"
                rows={4}
              />
            </Column>

            {/* Expiration Date */}
            <Column gap="8">
              <Text variant="label-default-s">Expiration Date (Optional)</Text>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                placeholder="Select expiration date"
              />
              <Text variant="body-default-xs" onBackground="neutral-weak">
                Leave empty for no expiration. Gallery links will be accessible until this date.
              </Text>
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