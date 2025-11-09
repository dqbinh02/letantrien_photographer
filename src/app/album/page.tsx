import { Column, Heading, Meta, Text, Grid } from "@once-ui-system/core";
import { baseURL, album } from "@/resources";
import { connectToDatabase } from "@/lib/mongodb";
import type { AlbumDocument, MediaDocument } from "@/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return Meta.generate({
    title: album.title,
    description: album.description,
    baseURL: baseURL,
    path: album.path,
  });
}

async function getAlbums() {
  try {
    const { db } = await connectToDatabase();

    // Get all albums
    const albums = await db
      .collection<AlbumDocument>("albums")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Get media count for each album
    const albumsWithCount = await Promise.all(
      albums.map(async (album) => {
        const mediaCount = await db
          .collection<MediaDocument>("media")
          .countDocuments({ albumId: album._id });

        return {
          ...album,
          mediaCount,
        };
      })
    );

    return albumsWithCount;
  } catch (error) {
    console.error("Error fetching albums:", error);
    return [];
  }
}

export default async function Album() {
  const albums = await getAlbums();

  return (
    <Column maxWidth="m" paddingTop="24">
      <Heading marginBottom="l" variant="heading-strong-xl" marginLeft="24">
        {album.title}
      </Heading>
      <Column fillWidth flex={1} gap="40" padding="l">
        {albums.length === 0 ? (
          <Column gap="16">
            <Heading variant="heading-default-l">No albums yet</Heading>
            <Text>
              Visit <Link href="/admin" style={{ textDecoration: "underline" }}>/admin</Link> to create your first album.
            </Text>
          </Column>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
            {albums.map((albumItem) => (
              <Column
                key={albumItem._id?.toString()}
                gap="12"
                padding="16"
                style={{
                  backgroundColor: "var(--neutral-alpha-weak)",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
              >
                {albumItem.coverImage && (
                  <img
                    src={albumItem.coverImage}
                    alt={albumItem.title}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                )}
                <Heading variant="heading-strong-m">{albumItem.title}</Heading>
                <Text variant="body-default-s">{albumItem.description}</Text>
                <Text
                  variant="label-default-xs"
                  style={{ color: "var(--neutral-on-background-weak)" }}
                >
                  {albumItem.mediaCount} photos
                </Text>
              </Column>
            ))}
          </div>
        )}
      </Column>
    </Column>
  );
}
