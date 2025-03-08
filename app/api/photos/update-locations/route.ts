import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    // Parse request body
    const { photos } = await request.json();
    
    if (!photos || !Array.isArray(photos)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();
    const photosCollection = db.collection('photos');
    
    // Update each photo in the database
    const updatePromises = photos.map(async (photo) => {
      if (!photo._id && !photo.id) return null;
      
      // Use either _id or id, and convert to ObjectId if it's a string
      const photoId = photo._id || photo.id;
      const objectId = typeof photoId === 'string' ? new ObjectId(photoId) : photoId;
      
      return photosCollection.updateOne(
        { _id: objectId },
        { $set: { metadata: photo.metadata || {} } }
      );
    });

    // Wait for all updates to complete
    const results = await Promise.all(updatePromises);
    const updatedCount = results.filter((result: any) => result && result.modifiedCount > 0).length;

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${updatedCount} photos` 
    });
  } catch (error) {
    console.error('Error updating photo locations:', error);
    return NextResponse.json(
      { error: 'Failed to update photo locations' }, 
      { status: 500 }
    );
  }
} 