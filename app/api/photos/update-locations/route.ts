import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    console.log('Received request to update photo locations');
    
    // Get MongoDB connection
    const { db } = await connectToDatabase();
    
    // Use the photos collection directly
    const photosCollection = 'photos';
    console.log(`Using collection: ${photosCollection}`);
    
    // Parse request body
    const { photos } = await req.json();
    
    if (!photos || !Array.isArray(photos)) {
      return NextResponse.json(
        { error: 'Invalid request: photos array is required' },
        { status: 400 }
      );
    }
    
    // Update each photo in the database
    const updatePromises = photos.map(async (photo) => {
      if (!photo._id) return null;
      
      return db.collection(photosCollection).updateOne(
        { _id: photo._id },
        { $set: { metadata: photo.metadata } }
      );
    });
    
    await Promise.all(updatePromises.filter(Boolean));
    
    return NextResponse.json({ 
      success: true, 
      count: photos.length,
      collection: photosCollection
    });
  } catch (error) {
    console.error('Error updating photo locations:', error);
    return NextResponse.json(
      { error: 'Failed to update photo locations' },
      { status: 500 }
    );
  }
} 