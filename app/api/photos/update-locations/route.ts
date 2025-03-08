import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    console.log('Received request to update photo locations');
    
    // Check if environment variables are defined
    const mongodbUri = process.env.MONGODB_URI;
    const mongodbDb = process.env.MONGODB_DB;
    
    if (!mongodbUri || !mongodbDb) {
      console.error('MongoDB environment variables not defined:', { 
        MONGODB_URI: !!mongodbUri, 
        MONGODB_DB: !!mongodbDb 
      });
      
      // Provide fallback values for development if needed
      const fallbackUri = mongodbUri || 'mongodb://localhost:27017';
      const fallbackDb = mongodbDb || 'jackieblog';
      
      console.log('Using fallback MongoDB configuration for development');
      
      // Continue with fallback values
      const { db } = await connectToDatabase(fallbackUri, fallbackDb);
      
      // Rest of the function...
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
        
        return db.collection('photos').updateOne(
          { _id: photo._id },
          { $set: { metadata: photo.metadata } }
        );
      });
      
      await Promise.all(updatePromises.filter(Boolean));
      
      return NextResponse.json({ success: true, count: photos.length });
    } else {
      // Use the provided environment variables
      const { db } = await connectToDatabase(mongodbUri, mongodbDb);
      
      // Rest of the function...
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
        
        return db.collection('photos').updateOne(
          { _id: photo._id },
          { $set: { metadata: photo.metadata } }
        );
      });
      
      await Promise.all(updatePromises.filter(Boolean));
      
      return NextResponse.json({ success: true, count: photos.length });
    }
  } catch (error) {
    console.error('Error updating photo locations:', error);
    return NextResponse.json(
      { error: 'Failed to update photo locations' },
      { status: 500 }
    );
  }
} 