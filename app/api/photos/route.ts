import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';
import { UploadApiResponse, UploadApiErrorResponse, UploadResponseCallback } from 'cloudinary/types';
import connectDB from '@/lib/mongodb';
import Photo from '@/models/Photo';
import Comment from '@/models/Comment';

type CloudinaryResult = UploadApiResponse & {
  image_metadata?: {
    GPSLatitude: string;
    GPSLongitude: string;
    GPSLatitudeRef: string;
    GPSLongitudeRef: string;
    DateTimeOriginal: string;
  };
};

interface CloudinaryError {
  message: string;
}

interface MongoPhoto {
  _id: any;
  imageUrl: string;
  description: string;
  location: string;
  createdAt: Date | string;
  capturedAt: Date | string;
  comments?: MongoComment[];
  metadata?: {
    latitude?: number;
    longitude?: number;
  };
}

interface MongoComment {
  _id: any;
  content: string;
  authorName: string;
  createdAt: Date | string;
}

// Helper function to convert DMS (Degrees, Minutes, Seconds) to decimal degrees
function convertDMSToDecimal(dms: string, ref: string): number | undefined {
  // Example format: "40 deg 26' 46.56" N"
  const match = dms.match(/(\d+) deg (\d+)' ([\d.]+)"/);
  if (!match) return undefined;

  const degrees = parseFloat(match[1]);
  const minutes = parseFloat(match[2]);
  const seconds = parseFloat(match[3]);

  let decimal = degrees + (minutes / 60) + (seconds / 3600);

  // If ref is S or W, negate the value
  if (ref === 'S' || ref === 'W') {
    decimal = -decimal;
  }

  return decimal;
}

export async function GET() {
  try {
    await connectDB();
    // Make sure Comment model is loaded before using populate
    await import('@/models/Comment');
    const photos = (await Photo.find()
      .populate('comments')
      .sort({ capturedAt: -1 })
      .lean()) as unknown as MongoPhoto[];

    // Process photos to ensure dates are properly formatted
    const processedPhotos = photos.map(photo => {
      // Convert MongoDB document to a plain object
      const photoObj = JSON.parse(JSON.stringify(photo));
      
      // Ensure dates and location data are properly formatted
      const processedPhoto = {
        ...photoObj,
        _id: photo._id.toString(),
        capturedAt: photo.capturedAt ? new Date(photo.capturedAt).toISOString() : undefined,
        createdAt: photo.createdAt ? new Date(photo.createdAt).toISOString() : new Date().toISOString(),
        location: photo.location,
        metadata: {
          ...photo.metadata,
          coordinates: photo.metadata?.latitude && photo.metadata?.longitude
            ? `${photo.metadata.latitude},${photo.metadata.longitude}`
            : null
        },
        comments: photo.comments?.map((comment: MongoComment) => ({
          ...comment,
          _id: comment._id.toString(),
          createdAt: comment.createdAt ? new Date(comment.createdAt).toISOString() : new Date().toISOString()
        })) || []
      };

      return processedPhoto;
    });

    return NextResponse.json(processedPhotos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json({ error: 'Error fetching photos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // First check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Then validate form data
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;

    if (!image || !description || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert the file to a buffer
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary with metadata extraction
    const result = await new Promise<CloudinaryResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'jackie-blog',
          resource_type: 'auto',
          image_metadata: true,
        },
        ((err: UploadApiErrorResponse | undefined, result?: UploadApiResponse) => {
          if (err || !result) {
            console.error('Cloudinary upload error:', err);
            reject(err || new Error('No result from Cloudinary'));
          } else {
            resolve(result as CloudinaryResult);
          }
        }) as UploadResponseCallback
      );

      // Write the buffer to the upload stream
      const Readable = require('stream').Readable;
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });

    // Convert GPS coordinates from DMS to decimal degrees if available
    const latitude = result.image_metadata?.GPSLatitude ? 
      convertDMSToDecimal(
        result.image_metadata.GPSLatitude,
        result.image_metadata.GPSLatitudeRef || 'N'
      ) : undefined;

    const longitude = result.image_metadata?.GPSLongitude ?
      convertDMSToDecimal(
        result.image_metadata.GPSLongitude,
        result.image_metadata.GPSLongitudeRef || 'E'
      ) : undefined;

    // Parse the original capture date
    const parsedDate = result.image_metadata?.DateTimeOriginal
      ? (() => {
          // Convert YYYY:MM:DD HH:mm:ss to YYYY-MM-DD HH:mm:ss
          const dateStr = result.image_metadata.DateTimeOriginal.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
          const date = new Date(dateStr);
          return !isNaN(date.getTime()) ? date : new Date();
        })()
      : new Date();

    // Ensure MongoDB connection before saving
    await connectDB();
    
    // Save to database with metadata if available
    const photoData = {
      imageUrl: result.secure_url,
      description,
      location,
      createdAt: new Date(),
      capturedAt: new Date(parsedDate),
      metadata: {
        latitude: latitude || null,
        longitude: longitude || null,
        originalLocation: location,
        coordinates: latitude && longitude ? `${latitude},${longitude}` : null,
      }
    };

    const photo = await Photo.create(photoData);

    // Convert MongoDB document to a plain object and handle dates
    const photoObj = JSON.parse(JSON.stringify(photo));
    const response = {
      ...photoObj,
      _id: photo._id.toString(),
      createdAt: photo.createdAt instanceof Date ? photo.createdAt.toISOString() : new Date().toISOString(),
      capturedAt: photo.capturedAt instanceof Date ? photo.capturedAt.toISOString() : parsedDate.toISOString()
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error creating photo:', error);
    return NextResponse.json(
      { error: error.message || 'Error creating photo' },
      { status: 500 }
    );
  }
} 