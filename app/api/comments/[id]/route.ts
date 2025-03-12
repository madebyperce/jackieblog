import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Comment from '@/models/Comment';

// Update a comment
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the comment ID from the URL
    const commentId = params.id;
    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    // Parse the request body
    const updates = await request.json();
    
    // Validate the updates
    const validUpdates: { [key: string]: any } = {};
    if (updates.content !== undefined) {
      validUpdates.content = updates.content;
    }

    if (Object.keys(validUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    // Connect to the database
    await dbConnect();

    // Update the comment
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { $set: validUpdates },
      { new: true, runValidators: true }
    ).populate('photoId', 'title');

    if (!updatedComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Return the updated comment
    return NextResponse.json(updatedComment);
  } catch (error: any) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment', details: error.message },
      { status: 500 }
    );
  }
}

// Delete a comment
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the comment ID from the URL
    const commentId = params.id;
    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    // Connect to the database
    await dbConnect();

    // Find the comment first to get the photoId
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    
    // Get the photoId from the comment
    const photoId = comment.photoId;
    
    // Delete the comment
    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    
    // Also remove the comment from the photo's comments array
    if (photoId) {
      const Photo = require('@/models/Photo').default;
      await Photo.findByIdAndUpdate(
        photoId,
        { $pull: { comments: commentId } }
      );
    }

    // Return success
    return NextResponse.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment', details: error.message },
      { status: 500 }
    );
  }
} 