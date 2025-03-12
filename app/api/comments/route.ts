import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

// Get MongoDB connection string from environment variable
const uri = process.env.MONGODB_URI;

// Check if the URI is defined
if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

export async function GET() {
  console.log('GET /api/comments - Starting request');
  let client;
  try {
    console.log('Attempting to connect to database...');
    client = new MongoClient(uri as string);
    await client.connect();
    console.log('Database connection successful');
    
    // Use the correct database name from your environment variables
    const dbName = process.env.MONGODB_DB || 'jackieblog';
    const database = client.db(dbName);
    
    const commentsCollection = database.collection('comments');
    const photosCollection = database.collection('photos');
    
    console.log('Fetching comments from database...');
    // Fetch comments sorted by createdAt in descending order (newest first)
    const comments = await commentsCollection.find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`Successfully fetched ${comments.length} comments`);
    
    // Get all unique photo IDs from comments
    const photoIds = Array.from(new Set(comments
      .filter(comment => comment.photoId)
      .map(comment => comment.photoId.toString())
    ));
    
    console.log(`Found ${photoIds.length} unique photo IDs`);
    
    // Fetch all photos in one query
    const photos = await photosCollection.find({
      _id: { $in: photoIds.map(id => new ObjectId(id)) }
    }).toArray();
    
    console.log(`Fetched ${photos.length} photos`);
    
    // Create a map of photo IDs to photo objects for quick lookup
    const photoMap = new Map();
    photos.forEach(photo => {
      photoMap.set(photo._id.toString(), {
        _id: photo._id.toString(),
        imageUrl: photo.imageUrl,
        description: photo.description,
        location: photo.location
      });
    });
    
    // Transform the comments to ensure proper JSON serialization
    console.log('Starting comment serialization...');
    const serializedComments = comments.map((comment: any, index: number) => {
      try {
        // Create a new object with all the properties
        const serialized: any = { ...comment };
        
        // Handle _id
        if (serialized._id && typeof serialized._id.toString === 'function') {
          serialized._id = serialized._id.toString();
        }
        
        // Handle photoId - convert to string and add photo info if available
        if (serialized.photoId) {
          const photoIdString = serialized.photoId.toString();
          const photoInfo = photoMap.get(photoIdString);
          
          if (photoInfo) {
            // Replace photoId with the full photo object
            serialized.photoId = photoInfo;
          } else {
            // Just keep the ID as a string
            serialized.photoId = photoIdString;
          }
        }
        
        // Handle createdAt
        if (serialized.createdAt instanceof Date) {
          serialized.createdAt = serialized.createdAt.toISOString();
        }
        
        return serialized;
      } catch (serializationError) {
        console.error(`Error serializing comment at index ${index}:`, serializationError);
        console.log('Problematic comment:', JSON.stringify(comment, null, 2));
        // Return a simplified version to avoid breaking the whole response
        return {
          _id: comment._id ? comment._id.toString() : 'unknown',
          content: comment.content || '',
          authorName: comment.authorName || 'Anonymous',
          createdAt: new Date().toISOString(),
          error: 'Serialization error'
        };
      }
    });
    
    console.log('Serialization complete, returning response');
    return NextResponse.json(serializedComments);
  } catch (error) {
    console.error('Error in /api/comments route:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
} 