import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';
import connectDB from '@/lib/mongodb';
import Photo from '@/models/Photo';
import Comment from '@/models/Comment';

interface CloudinaryResult {
  secure_url: string;
  image_metadata?: {
    GPSLatitude: string;
    GPSLongitude: string;
    GPSLatitudeRef: string;
    GPSLongitudeRef: string;
    DateTimeOriginal: string;
  };
}

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

// Convert DMS (Degrees, Minutes, Seconds) to decimal degrees
function convertDMSToDecimal(dms: string, ref: string): number {
  // Parse DMS string like "48 deg 32' 32.56\" N"
  const parts = dms.match(/(\d+) deg (\d+)' ([\d.]+)"/);
  if (!parts) return 0;

  const degrees = parseFloat(parts[1]);
  const minutes = parseFloat(parts[2]);
  const seconds = parseFloat(parts[3]);
  
  let decimal = degrees + (minutes / 60) + (seconds / 3600);
  
  // For longitude, make negative if West (W)
  // For latitude, make negative if South (S)
  if (ref === 'S' || ref === 'W') {
    decimal = -decimal;
  }

  // Log the conversion for debugging
  console.log('Converting DMS to decimal:', {
    input: {
      dms,
      ref,
      parts: {
        degrees,
        minutes,
        seconds
      }
    },
    output: {
      decimal,
      isNegative: decimal < 0
    }
  });
  
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
      
      // Log raw photo data before processing
      console.log('Processing photo:', {
        _id: photo._id.toString(),
        location: {
          userProvided: photo.location,
          hasMetadata: Boolean(photo.metadata),
          rawCoordinates: {
            latitude: photo.metadata?.latitude,
            longitude: photo.metadata?.longitude,
            latitudeType: typeof photo.metadata?.latitude,
            longitudeType: typeof photo.metadata?.longitude,
          }
        },
        dates: {
          rawCapturedAt: photo.capturedAt,
          rawCreatedAt: photo.createdAt,
          capturedAtType: typeof photo.capturedAt,
          createdAtType: typeof photo.createdAt
        }
      });

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

      console.log('Processed photo:', {
        _id: processedPhoto._id,
        location: {
          userProvided: processedPhoto.location,
          metadata: processedPhoto.metadata,
          hasCoordinates: Boolean(processedPhoto.metadata?.coordinates),
          coordinateString: processedPhoto.metadata?.coordinates
        },
        dates: {
          capturedAt: processedPhoto.capturedAt,
          createdAt: processedPhoto.createdAt
        }
      });

      return processedPhoto;
    });
    
    console.log('Fetched photos with dates:', {
      raw: photos.map(p => ({ 
        capturedAt: p.capturedAt, 
        createdAt: p.createdAt,
        isDateCaptured: p.capturedAt instanceof Date,
        isDateCreated: p.createdAt instanceof Date
      })),
      processed: processedPhotos.map(p => ({ 
        capturedAt: p.capturedAt, 
        createdAt: p.createdAt 
      }))
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
          image_metadata: true, // Extract image metadata including GPS
          colors: false, // Disable unnecessary features
          faces: false,
          quality_analysis: false,
        },
        (error: CloudinaryError | null, result?: CloudinaryResult) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else if (result) {
            console.log('Cloudinary upload result:', JSON.stringify(result, null, 2));
            resolve(result);
          } else {
            reject(new Error('No result from Cloudinary'));
          }
        }
      );

      // Write the buffer to the upload stream
      const Readable = require('stream').Readable;
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });

    // Convert GPS coordinates from DMS to decimal degrees
    const latitude = result.image_metadata?.GPSLatitude ? 
      convertDMSToDecimal(
        result.image_metadata.GPSLatitude,
        result.image_metadata.GPSLatitudeRef
      ) : undefined;

    const longitude = result.image_metadata?.GPSLongitude ?
      convertDMSToDecimal(
        result.image_metadata.GPSLongitude,
        result.image_metadata.GPSLongitudeRef
      ) : undefined;

    // Log detailed GPS extraction process
    console.log('Location metadata extraction:', {
      raw_exif: {
        all_metadata: result.image_metadata,
        gps: {
          latitude: result.image_metadata?.GPSLatitude,
          latitudeRef: result.image_metadata?.GPSLatitudeRef,
          longitude: result.image_metadata?.GPSLongitude,
          longitudeRef: result.image_metadata?.GPSLongitudeRef,
        }
      },
      parsing: {
        latitudeParsed: latitude !== undefined,
        longitudeParsed: longitude !== undefined,
        latitudeValue: latitude,
        longitudeValue: longitude,
        dmsMatch: result.image_metadata?.GPSLatitude ? 
          result.image_metadata.GPSLatitude.match(/(\d+) deg (\d+)' ([\d.]+)"/) : null
      }
    });

    // Parse the original capture date
    const parsedDate = result.image_metadata?.DateTimeOriginal
      ? (() => {
          // Convert YYYY:MM:DD HH:mm:ss to YYYY-MM-DD HH:mm:ss
          const dateStr = result.image_metadata.DateTimeOriginal.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
          console.log('Original date string:', result.image_metadata.DateTimeOriginal);
          console.log('Parsed date string:', dateStr);
          const date = new Date(dateStr);
          console.log('Created date object:', {
            date: date,
            iso: date.toISOString(),
            valid: !isNaN(date.getTime()),
            type: typeof date,
            isDate: date instanceof Date
          });
          return !isNaN(date.getTime()) ? date : new Date();
        })()
      : new Date();

    // Log the metadata we're saving
    console.log('Saving photo with metadata:', {
      coordinates: { latitude, longitude },
      capturedAt: parsedDate.toISOString(),
      capturedAtType: typeof parsedDate,
      isCapturedAtDate: parsedDate instanceof Date,
      originalDateString: result.image_metadata?.DateTimeOriginal
    });

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

    console.log('Creating photo with location data:', {
      input: {
        userLocation: location,
        hasLatitude: latitude !== undefined,
        hasLongitude: longitude !== undefined,
      },
      metadata: {
        latitude: photoData.metadata.latitude,
        longitude: photoData.metadata.longitude,
        coordinates: photoData.metadata.coordinates,
        originalLocation: photoData.metadata.originalLocation
      }
    });

    const photo = await Photo.create(photoData);

    console.log('Created photo document with location:', {
      _id: photo._id.toString(),
      location: photo.location,
      metadata: {
        saved: photo.metadata,
        hasLatitude: photo.metadata?.latitude !== undefined && photo.metadata?.latitude !== null,
        hasLongitude: photo.metadata?.longitude !== undefined && photo.metadata?.longitude !== null,
        coordinatesValid: Boolean(photo.metadata?.coordinates)
      }
    });

    // Convert MongoDB document to a plain object and handle dates
    const photoObj = JSON.parse(JSON.stringify(photo));
    const response = {
      ...photoObj,
      _id: photo._id.toString(),
      createdAt: photo.createdAt instanceof Date ? photo.createdAt.toISOString() : new Date().toISOString(),
      capturedAt: photo.capturedAt instanceof Date ? photo.capturedAt.toISOString() : parsedDate.toISOString()
    };

    console.log('Saved photo with dates:', {
      raw: { capturedAt: photo.capturedAt, createdAt: photo.createdAt },
      processed: { capturedAt: response.capturedAt, createdAt: response.createdAt }
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating photo:', error);
    return NextResponse.json(
      { error: 'Error creating photo' },
      { status: 500 }
    );
  }
} 