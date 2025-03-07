// Find the section where the photo is being created/saved
// This might be after processing the uploaded file and extracting metadata

// Before saving the photo to the database, add this code:
if (metadata && typeof metadata.longitude === 'number' && metadata.longitude > 0) {
  console.log(`Transforming positive longitude ${metadata.longitude} to negative during upload`);
  metadata.longitude = -metadata.longitude;
}

// Then continue with saving the photo 

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Photo from '@/models/Photo';
import cloudinary from '@/lib/cloudinary';

// Modern App Router configuration
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set an appropriate timeout for file uploads

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;
    const capturedAt = formData.get('capturedAt') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'jackie-blog' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Convert buffer to stream and pipe to uploadStream
      const Readable = require('stream').Readable;
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });

    // Connect to database
    await connectDB();

    // Process coordinates to ensure western hemisphere locations have negative longitude
    let metadata = {};
    if (uploadResponse.metadata && uploadResponse.metadata.gps) {
      const { latitude, longitude } = uploadResponse.metadata.gps;
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        // If it's likely a US location (latitude between 24-50) and longitude is positive
        if (latitude >= 24 && latitude <= 50 && longitude > 0) {
          metadata = {
            latitude,
            longitude: -longitude // Apply negative transformation
          };
        } else {
          metadata = { latitude, longitude };
        }
      }
    }

    // Create new photo document
    const newPhoto = new Photo({
      imageUrl: uploadResponse.secure_url,
      description,
      location,
      capturedAt: capturedAt || new Date().toISOString(),
      metadata,
      authorId: session.user.id,
      authorName: session.user.name,
    });

    await newPhoto.save();

    return NextResponse.json(newPhoto);
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Error uploading photo' },
      { status: 500 }
    );
  }
} 