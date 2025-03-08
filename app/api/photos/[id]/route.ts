import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Photo from '@/models/Photo';
import cloudinary from '@/lib/cloudinary';
import { transformCoordinates } from '@/lib/transformCoordinates';
import Comment from '@/models/Comment';

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

    // Get the photo ID from the URL
    const photoId = params.id;
    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 });
    }

    // Connect to the database
    await connectDB();

    // Delete the photo
    const deletedPhoto = await Photo.findByIdAndDelete(photoId);

    if (!deletedPhoto) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Return success
    return NextResponse.json({ success: true, message: 'Photo deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo', details: error.message },
      { status: 500 }
    );
  }
}

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

    // Get the photo ID from the URL
    const photoId = params.id;
    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 });
    }

    // Parse the request body
    const updates = await request.json();
    
    // Validate the updates
    const validUpdates: { [key: string]: any } = {};
    if (updates.description !== undefined) {
      validUpdates.description = updates.description;
    }
    if (updates.location !== undefined) {
      validUpdates.location = updates.location;
    }

    if (Object.keys(validUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    // Connect to the database
    await connectDB();

    // Update the photo
    const updatedPhoto = await Photo.findByIdAndUpdate(
      photoId,
      { $set: validUpdates },
      { new: true, runValidators: true }
    );

    if (!updatedPhoto) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Return the updated photo
    return NextResponse.json({
      _id: updatedPhoto._id.toString(),
      imageUrl: updatedPhoto.imageUrl,
      description: updatedPhoto.description,
      location: updatedPhoto.location,
      capturedAt: updatedPhoto.capturedAt instanceof Date 
        ? updatedPhoto.capturedAt.toISOString() 
        : updatedPhoto.capturedAt,
      metadata: updatedPhoto.metadata
    });
  } catch (error: any) {
    console.error('Error updating photo:', error);
    return NextResponse.json(
      { error: 'Failed to update photo', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const photoId = params.id;
    
    await connectDB();
    
    // Explicitly type the result as any to handle Mongoose document conversion
    const photo: any = await Photo.findById(photoId)
      .populate({
        path: 'comments',
        model: Comment,
        options: { sort: { createdAt: -1 } }
      })
      .lean();
    
    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }
    
    // Transform MongoDB document to a plain object
    const transformedPhoto = {
      _id: photo._id.toString(),
      imageUrl: photo.imageUrl,
      description: photo.description,
      location: photo.location,
      capturedAt: photo.capturedAt instanceof Date ? photo.capturedAt.toISOString() : photo.capturedAt,
      createdAt: photo.createdAt instanceof Date ? photo.createdAt.toISOString() : photo.createdAt,
      metadata: photo.metadata,
      comments: photo.comments ? photo.comments.map((comment: any) => ({
        _id: comment._id.toString(),
        content: comment.content,
        authorName: comment.authorName,
        createdAt: comment.createdAt instanceof Date ? comment.createdAt.toISOString() : comment.createdAt
      })) : []
    };
    
    return NextResponse.json(transformedPhoto);
  } catch (error) {
    console.error('Error fetching photo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photo' },
      { status: 500 }
    );
  }
} 