import { Column, Heading, Text, Meta } from "@once-ui-system/core";
import { connectToDatabase } from "@/lib/mongodb";
import type { AlbumDocument, MediaDocument } from "@/types";
import { notFound } from "next/navigation";
import GalleryView from "@/components/gallery/GalleryView";
import { person } from "@/resources";
import type { Gallery } from "@/types";

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

async function getAlbumByToken(token: string) {
  try {
    const { db } = await connectToDatabase();

    // Find album by token
    const album = await db
      .collection<AlbumDocument>("albums")
      .findOne({ "link.token": token });

    if (!album) {
      return null;
    }

    // Check if album has expired
    if (album.link.expiresAt && new Date(album.link.expiresAt) < new Date()) {
      return null;
    }

    // Get media for this album
    const media = await db
      .collection<MediaDocument>("media")
      .find({ albumId: album._id })
      .sort({ uploadedAt: -1 })
      .toArray();

    return { album, media };
  } catch (error) {
    console.error("Error fetching album by token:", error);
    return null;
  }
}

// Helper function to determine image orientation
function getImageOrientation(filename: string): "horizontal" | "vertical" {
  // Simple heuristic: check filename for orientation hints
  const lowerFilename = filename.toLowerCase();
  if (lowerFilename.includes('horizontal') || lowerFilename.includes('wide') || lowerFilename.includes('landscape')) {
    return 'horizontal';
  }
  if (lowerFilename.includes('vertical') || lowerFilename.includes('tall') || lowerFilename.includes('portrait')) {
    return 'vertical';
  }
  // Default to horizontal for most photos
  return 'horizontal';
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const data = await getAlbumByToken(resolvedParams.token);

  if (!data) {
    return {
      title: "Gallery Not Found",
    };
  }

  const { album } = data;
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const ogImageUrl = `${baseURL}/api/og/generate?title=${encodeURIComponent(album.title)}`;

  return {
    title: album.title,
    description: album.description || `View ${album.title} gallery`,
    openGraph: {
      title: album.title,
      description: album.description || `View ${album.title} gallery`,
      url: `${baseURL}/gallery/${resolvedParams.token}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: album.title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: album.title,
      description: album.description || `View ${album.title} gallery`,
      images: [ogImageUrl],
    },
    authors: [
      {
        name: person.name,
        url: baseURL,
      },
    ],
    other: {
      'article:author': person.name,
      'article:published_time': album.createdAt.toISOString(),
    },
  };
}

export default async function PublicGallery({ params }: PageProps) {
  const resolvedParams = await params;
  const data = await getAlbumByToken(resolvedParams.token);

  if (!data) {
    notFound();
  }

  const { album, media } = data;

  // Convert media to gallery images format
  const galleryImages: Gallery["images"] = media
    .filter(m => m.type === 'image')
    .map(m => ({
      src: m.url,
      alt: m.filename,
      orientation: getImageOrientation(m.filename) as "horizontal" | "vertical",
    }));

  return (
    <div className="w-full">
      {/* Album Header */}
      <div className="max-w-[1200px] mx-auto px-4 pt-24 pb-8">
        <div className="flex flex-col gap-2 items-center text-center">
          <Heading variant="heading-strong-xl">{album.title}</Heading>
          {album.description && (
            <Text variant="body-default-s" onBackground="neutral-weak">
              {album.description}
            </Text>
          )}
        </div>
      </div>

      {/* Media Gallery */}
      {galleryImages.length === 0 ? (
        <div className="max-w-[1200px] mx-auto px-4 py-16">
          <div className="flex flex-col gap-4 items-center">
            <Text variant="body-default-l" onBackground="neutral-weak">
              No images in this gallery yet
            </Text>
          </div>
        </div>
      ) : (
        <GalleryView images={galleryImages} useRegularImg={true} />
      )}

      {/* Footer */}
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="flex flex-col gap-2 items-center text-center">
          <Text variant="body-default-xs" onBackground="neutral-weak">
            Gallery created on {new Date(album.createdAt).toLocaleDateString()}
          </Text>
          {album.link.expiresAt && (
            <Text variant="body-default-xs" onBackground="neutral-weak">
              Expires on {new Date(album.link.expiresAt).toLocaleDateString()}
            </Text>
          )}
        </div>
      </div>
    </div>
  );
}