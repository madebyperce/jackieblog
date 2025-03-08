import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: Request) {
  try {
    console.log('Cleaning up database');
    
    // Get MongoDB connection
    const { db } = await connectToDatabase();
    
    // Use the photos collection
    const photosCollection = 'photos';
    
    // Find sample photos by their descriptions
    const sampleDescriptions = [
      'Golden Gate Bridge at sunset',
      'Central Park in autumn',
      'Space Needle view',
      'Sample photo for testing'
    ];
    
    // Delete sample photos
    const deleteResult = await db.collection(photosCollection).deleteMany({
      description: { $in: sampleDescriptions }
    });
    
    console.log(`Deleted ${deleteResult.deletedCount} sample photos`);
    
    // Get remaining photos
    const remainingPhotos = await db.collection(photosCollection)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`Remaining photos: ${remainingPhotos.length}`);
    
    // Also clean up the dev_photos collection if it exists
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (collectionNames.includes('dev_photos')) {
      await db.collection('dev_photos').drop();
      console.log('Dropped dev_photos collection');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database cleaned up successfully',
      deletedCount: deleteResult.deletedCount,
      remainingPhotos: remainingPhotos.length,
      photoSamples: remainingPhotos.slice(0, 3).map(p => ({
        _id: p._id.toString(),
        description: p.description,
        location: p.location
      }))
    });
  } catch (error: any) {
    console.error('Database cleanup failed:', error);
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