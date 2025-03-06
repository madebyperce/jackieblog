import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Photo from '@/models/Photo';
import Comment from '@/models/Comment';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const photoId = params.id;
    const data = await request.json();

    // Create the comment
    const comment = await Comment.create({
      ...data,
      photoId,
      createdAt: new Date()
    });

    // Add the comment to the photo's comments array
    await Photo.findByIdAndUpdate(photoId, {
      $push: { comments: comment._id },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Error creating comment' }, { status: 500 });
  }
} 