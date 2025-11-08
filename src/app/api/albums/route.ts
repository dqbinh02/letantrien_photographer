import { connectToDatabase } from "@/lib/mongodb";
import type { AlbumDocument, AlbumFormData } from "@/types";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const albums = await db
      .collection<AlbumDocument>("albums")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, data: albums });
  } catch (error) {
    console.error("Error fetching albums:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch albums" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AlbumFormData = await request.json();
    const { title, description, coverImage, images } = body;

    if (!title || !description || !coverImage) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const album: Omit<AlbumDocument, "_id"> = {
      title,
      description,
      coverImage,
      images: images || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<AlbumDocument>("albums").insertOne(album as AlbumDocument);

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId, ...album },
    });
  } catch (error) {
    console.error("Error creating album:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create album" },
      { status: 500 }
    );
  }
}
