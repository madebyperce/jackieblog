import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../lib/mongodb';

export async function GET(req: Request) {
  try {
    console.log('Testing photos collection');
    
    // Get MongoDB connection
    const { db } = await connectToDatabase();
    
    // Use the photos collection
    const photosCollection = 'photos';
    
    // Get all photos
    const allPhotos = await db.collection(photosCollection)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    // Group photos by description to identify potential duplicates or sample data
    const photosByDescription: Record<string, number> = {};
    allPhotos.forEach(photo => {
      const desc = photo.description || 'No description';
      photosByDescription[desc] = (photosByDescription[desc] || 0) + 1;
    });
    
    // Get a sample of each unique photo
    const uniquePhotos = [];
    const seenDescriptions = new Set();
    
    for (const photo of allPhotos) {
      const desc = photo.description || 'No description';
      if (!seenDescriptions.has(desc)) {
        seenDescriptions.add(desc);
        uniquePhotos.push({
          _id: photo._id.toString(),
          description: desc,
          location: photo.location,
          imageUrl: photo.imageUrl,
          createdAt: photo.createdAt
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      totalPhotos: allPhotos.length,
      uniqueDescriptions: Object.keys(photosByDescription).length,
      photosByDescription,
      samplePhotos: uniquePhotos.slice(0, 10)
    });
  } catch (error: any) {
    console.error('Test photos failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: error.stack,
        name: error.name
      },
      { status: 500 }
    );
  }
} 