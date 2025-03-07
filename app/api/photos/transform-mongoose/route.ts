import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Photo from '@/models/Photo';

export async function POST(request: Request) {
  try {
    console.log('Starting location transformation process using Mongoose');
    
    // Connect to the database
    await connectDB();
    console.log('Connected to MongoDB via Mongoose');
    
    // Get all photos
    console.log('Fetching photos from database...');
    const photos = await Photo.find({});
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
            photo.metadata.longitude = newLng;
            await photo.save();
            
            console.log(`Successfully updated photo ${photo._id}`);
            updatedCount++;
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
  }
} 