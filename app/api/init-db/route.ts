import { NextResponse } from 'next/server';
import { connectToDatabase, getCollectionName } from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

// Sample photo data
const samplePhotos = [
  {
    _id: new ObjectId(),
    imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29',
    description: 'Golden Gate Bridge at sunset',
    location: 'San Francisco, CA',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    capturedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    metadata: {
      latitude: 37.8199,
      longitude: -122.4783,
      originalLocation: 'San Francisco, CA',
      coordinates: '37.8199,-122.4783',
    }
  },
  {
    _id: new ObjectId(),
    imageUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856',
    description: 'Central Park in autumn',
    location: 'New York, NY',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    capturedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    metadata: {
      latitude: 40.7812,
      longitude: -73.9665,
      originalLocation: 'New York, NY',
      coordinates: '40.7812,-73.9665',
    }
  },
  {
    _id: new ObjectId(),
    imageUrl: 'https://images.unsplash.com/photo-1542223616-9de9adb5e3e8',
    description: 'Space Needle view',
    location: 'Seattle, WA',
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
    capturedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    metadata: {
      latitude: 47.6205,
      longitude: -122.3493,
      originalLocation: 'Seattle, WA',
      coordinates: '47.6205,-122.3493',
    }
  }
];

export async function GET(req: Request) {
  try {
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    console.log(`Initializing database in ${isDevelopment ? 'development' : 'production'} mode`);
    
    // Get the URL parameters
    const url = new URL(req.url);
    const forceReset = url.searchParams.get('reset') === 'true';
    
    // Get MongoDB connection
    const { db } = await connectToDatabase();
    
    // Get the appropriate collection name based on environment
    const photosCollection = getCollectionName('photos');
    console.log(`Using collection: ${photosCollection}`);
    
    // Create photos collection if it doesn't exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes(photosCollection)) {
      console.log(`Creating collection: ${photosCollection}`);
      await db.createCollection(photosCollection);
    }
    
    // Check if there are any photos
    const photoCount = await db.collection(photosCollection).countDocuments();
    
    // In development or if force reset is requested, we might want to reset the data
    if (forceReset) {
      console.log(`Force reset requested, dropping existing photos from ${photosCollection}`);
      await db.collection(photosCollection).deleteMany({});
    }
    
    // Add sample photos if needed
    if (photoCount === 0 || forceReset) {
      console.log(`Adding sample photos to ${photosCollection}`);
      await db.collection(photosCollection).insertMany(samplePhotos);
      console.log(`${samplePhotos.length} sample photos added to ${photosCollection}`);
    } else {
      console.log(`Collection ${photosCollection} already has ${photoCount} photos, skipping initialization`);
    }
    
    // Get updated photo count
    const updatedPhotoCount = await db.collection(photosCollection).countDocuments();
    
    // Get the actual photos for verification
    const photos = await db.collection(photosCollection)
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      environment: isDevelopment ? 'development' : 'production',
      databaseName: db.databaseName,
      collection: photosCollection,
      photoCount: updatedPhotoCount,
      collections: collectionNames,
      samplePhotos: photos.map(p => ({
        _id: p._id.toString(),
        description: p.description,
        location: p.location,
        imageUrl: p.imageUrl
      }))
    });
  } catch (error: any) {
    console.error('Database initialization failed:', error);
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