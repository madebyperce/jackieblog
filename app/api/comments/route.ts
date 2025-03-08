import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Comment from '@/models/Comment';

export async function GET() {
  try {
    await dbConnect();
    
    // Fetch comments sorted by createdAt in descending order (newest first)
    // and populate the photoId field with more photo details
    const comments = await Comment.find({})
      .sort({ createdAt: -1 })
      .populate('photoId', '_id title description imageUrl') // Include more photo fields
      .lean();
    
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
} 