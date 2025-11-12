import { connectToDatabase } from "@/lib/mongodb";
import type { AlbumDocument, MediaDocument } from "@/types";
import { NextResponse } from "next/server";

// GET /api/albums - Public list of published albums
export async function GET() {
  try {
    const { db } = await connectToDatabase();

    const albums = await db
      .collection<AlbumDocument>("albums")
      .find({ isPublished: true })
      .sort({ createdAt: -1 })
      .toArray();

    if (albums.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const albumIds = albums
      .map((album) => album._id)
      .filter((id): id is NonNullable<AlbumDocument["_id"]> => Boolean(id));

    const publishedCounts = await db
      .collection<MediaDocument>("media")
      .aggregate<{ _id: NonNullable<AlbumDocument["_id"]>; count: number }>([
        { $match: { albumId: { $in: albumIds }, isPublished: true } },
        { $group: { _id: "$albumId", count: { $sum: 1 } } },
      ])
      .toArray();

    const countMap = new Map<string, number>();
    for (const entry of publishedCounts) {
      countMap.set(entry._id.toString(), entry.count);
    }

    const payload = albums.map((album) => ({
      ...album,
      isPublished: true,
      publishedMediaCount: countMap.get(album._id?.toString() ?? "") ?? 0,
    }));

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    console.error("Error fetching published albums:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch albums" },
      { status: 500 }
    );
  }
}
