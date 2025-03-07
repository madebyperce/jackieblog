import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Photo from '@/models/Photo';
import { transformCoordinates } from '@/lib/transformCoordinates';
import cloudinary from '@/lib/cloudinary';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import exifr from 'exifr'; // Make sure this is installed: npm install exifr

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    // Extract EXIF metadata including GPS coordinates
    let metadata = {};
    try {
      const exifData = await exifr.parse(buffer, { gps: true });
      if (exifData) {
        // Extract GPS coordinates if available
        if (exifData.latitude !== undefined && exifData.longitude !== undefined) {
          metadata = {
            latitude: exifData.latitude,
            longitude: exifData.longitude
          };
          
          // Transform coordinates to ensure western hemisphere locations have negative longitude
          metadata = transformCoordinates(metadata);
        }
      }
    } catch (exifError) {
      console.error('Error extracting EXIF data:', exifError);
      // Continue without metadata if extraction fails
    }

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