import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

// Get MongoDB connection string from environment variable
const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

export async function POST(request: Request) {
  let client;
  
  try {
    console.log('Starting location transformation process');
    
    // Connect to MongoDB
    client = new MongoClient(uri as string);
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');
    
    const dbName = process.env.MONGODB_DB || 'jackieblog';
    console.log(`Using database: ${dbName}`);
    
    const db = client.db(dbName);
    const photosCollection = db.collection('photos');
    
    // Get all photos
    console.log('Fetching photos from database...');
    const photos = await photosCollection.find({}).toArray();
    console.log(`Found ${photos.length} photos to process`);
    
    let updatedCount = 0;
    
    // Process each photo
    for (const photo of photos) {
      console.log(`Processing photo ID: ${photo._id}`);
      
      // Check if the photo has metadata with coordinates
      if (photo.metadata && typeof photo.metadata.longitude === 'number') {
        const lat = photo.metadata.latitude;
        let lng = photo.metadata.longitude;
        
        console.log(`Original coordinates: lat=${lat}, lng=${lng}`);
        
        // Apply -1 transformation to longitude if it's positive
        if (lng > 0) {
          const newLng = -lng;
          
          console.log(`Transforming longitude from ${lng} to ${newLng}`);
          
          try {
            // Update the photo's longitude in the database
            const updateResult = await photosCollection.updateOne(
              { _id: new ObjectId(photo._id) },
              { $set: { "metadata.longitude": newLng } }
            );
            
            console.log(`Update result: ${JSON.stringify(updateResult)}`);
            
            if (updateResult.modifiedCount > 0) {
              console.log(`Successfully updated photo ${photo._id}`);
              updatedCount++;
            } else {
              console.log(`Failed to update photo ${photo._id} - no documents modified`);
            }
          } catch (updateError) {
            console.error(`Error updating photo ${photo._id}:`, updateError);
          }
        } else {
          console.log(`Longitude is already negative (${lng}), no transformation needed`);
        }
      } else {
        console.log(`Photo ${photo._id} has no coordinates in metadata`);
      }
    }
    
    console.log(`Successfully transformed ${updatedCount} photo coordinates`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully transformed ${updatedCount} photo coordinates` 
    });
  } catch (error) {
    console.error('Error transforming coordinates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to transform coordinates: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  } finally {
    // Close the connection
    if (client) {
      try {
        await client.close();
        console.log('MongoDB connection closed');
      } catch (closeError) {
        console.error('Error closing MongoDB connection:', closeError);
      }
    }
  }
} 