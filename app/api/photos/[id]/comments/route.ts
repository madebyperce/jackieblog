import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Photo from '@/models/Photo';
import Comment from '@/models/Comment';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Find all comments for the specified photo
    const comments = await Comment.find({ photoId: params.id })
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean(); // Convert to plain JavaScript objects
    
    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { content, authorName } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Create the comment
    const comment = await Comment.create({
      content,
      authorName: authorName || 'Anonymous',
      createdAt: new Date(),
      photoId: params.id
    });

    // Add the comment to the photo's comments array
    const photo = await Photo.findByIdAndUpdate(
      params.id,
      { $push: { comments: comment._id } },
      { new: true }
    ).populate('comments');

    if (!photo) {
      await Comment.findByIdAndDelete(comment._id);
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Error creating comment' },
      { status: 500 }
    );
  }
} 