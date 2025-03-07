import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Photo from '@/models/Photo';
import cloudinary from '@/lib/cloudinary';

// Function to transform coordinates (moved inline to avoid import issues)
function transformCoordinates(metadata: any): any {
  if (!metadata) return metadata;
  
  // If metadata has longitude and it's positive, make it negative
  if (typeof metadata.longitude === 'number' && metadata.longitude > 0) {
    // Check if this is likely a western hemisphere location (North America)
    // Most of North America is between latitudes 24° and 50° N
    const isLikelyWesternHemisphere = 
      typeof metadata.latitude === 'number' && 
      metadata.latitude >= 24 && 
      metadata.latitude <= 50;
    
    if (isLikelyWesternHemisphere) {
      console.log(`Transforming positive longitude ${metadata.longitude} to negative`);
      metadata.longitude = -metadata.longitude;
    }
  }
  
  return metadata;
}

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

    await connectDB();

    // Get the photo first to get its Cloudinary URL
    const photo = await Photo.findById(params.id);
    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Extract public_id from Cloudinary URL
    const urlParts = photo.imageUrl.split('/');
    const publicId = `${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1].split('.')[0]}`;

    // Delete from Cloudinary
    await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error: any, result: any) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    // Delete from MongoDB
    await Photo.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: 'Error deleting photo' },
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

    const body = await request.json();
    const { description, location, metadata } = body;

    await connectDB();

    // Get the existing photo
    const existingPhoto = await Photo.findById(params.id);
    if (!existingPhoto) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Prepare update object
    const updateData: any = {};
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    
    // Handle metadata updates
    if (metadata) {
      // Transform coordinates if present
      const transformedMetadata = transformCoordinates(metadata);
      updateData.metadata = transformedMetadata;
    }

    // Update the photo
    const photo = await Photo.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    );

    return NextResponse.json(photo);
  } catch (error) {
    console.error('Error updating photo:', error);
    return NextResponse.json(
      { error: 'Error updating photo' },
      { status: 500 }
    );
  }
} 