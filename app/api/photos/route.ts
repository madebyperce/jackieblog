import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary/types';
import { connectToDatabase, getCollectionName } from '../../lib/mongodb';
import { NextRequest } from 'next/server';
import { MongoClient } from 'mongodb';

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

// Get MongoDB connection string from environment variable
const uri = process.env.MONGODB_URI;

// Check if the URI is defined
if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

export async function GET(request: Request) {
  let client;
  try {
    // Parse the URL to get query parameters
    const url = new URL(request.url);
    const includeComments = url.searchParams.get('includeComments') === 'true';
    
    console.log('GET /api/photos - includeComments:', includeComments);
    
    // Use the non-null assertion operator (!) to tell TypeScript that uri is definitely not undefined
    // Or use type assertion to cast it to string
    client = new MongoClient(uri as string);
    await client.connect();

    // Use the correct database name from your environment variables
    const dbName = process.env.MONGODB_DB || 'jackieblog';
    const database = client.db(dbName);
    
    const photosCollection = database.collection('photos');
    const commentsCollection = database.collection('comments');
    
    console.log('Using collections: photos and comments');
    
    // Fetch all photos
    const photos = await photosCollection.find({}).toArray();
    
    console.log(`Found ${photos.length} photos in photos collection`);
    
    // If includeComments is true, fetch and attach comments to each photo
    if (includeComments && photos.length > 0) {
      console.log('Fetching comments for photos...');
      
      // Fetch all comments
      const allComments = await commentsCollection.find({}).toArray();
      console.log(`Found ${allComments.length} comments in comments collection`);
      
      // Create a map of photoId to comments
      const commentsByPhotoId = new Map();
      for (const comment of allComments) {
        const photoId = comment.photoId?.toString();
        if (photoId) {
          if (!commentsByPhotoId.has(photoId)) {
            commentsByPhotoId.set(photoId, []);
          }
          commentsByPhotoId.get(photoId).push({
            _id: comment._id.toString(),
            content: comment.content,
            authorName: comment.authorName,
            createdAt: comment.createdAt,
            photoId: photoId
          });
        }
      }
      
      // Process photos to ensure proper JSON serialization
      const processedPhotos = photos.map(photo => {
        // Create a new object with all properties
        const processedPhoto: any = { 
          ...photo,
          _id: photo._id.toString()
        };
        
        // Add comments if available
        if (includeComments) {
          processedPhoto.comments = commentsByPhotoId.get(processedPhoto._id) || [];
        }
        
        // Convert dates to strings
        if (processedPhoto.createdAt instanceof Date) {
          processedPhoto.createdAt = processedPhoto.createdAt.toISOString();
        }
        if (processedPhoto.capturedAt instanceof Date) {
          processedPhoto.capturedAt = processedPhoto.capturedAt.toISOString();
        }
        
        return processedPhoto;
      });
      
      console.log('Successfully processed photos');
      
      // Return the processed photos
      return NextResponse.json(processedPhotos);
    } else {
      // Just convert ObjectIds to strings
      const processedPhotos = photos.map(photo => {
        // Create a new object with all properties
        const processedPhoto: any = { 
          ...photo,
          _id: photo._id.toString()
        };
        
        // Convert dates to strings
        if (processedPhoto.createdAt instanceof Date) {
          processedPhoto.createdAt = processedPhoto.createdAt.toISOString();
        }
        if (processedPhoto.capturedAt instanceof Date) {
          processedPhoto.capturedAt = processedPhoto.capturedAt.toISOString();
        }
        
        return processedPhoto;
      });
      
      console.log('Successfully processed photos');
      
      // Return the processed photos
      return NextResponse.json(processedPhotos);
    }
    
    // Make sure we're returning an array directly
    return NextResponse.json(photos);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos from database' },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}

export async function POST(request: Request) {
  try {
    // Check environment variables first
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.error('Missing Cloudinary environment variables:', {
        hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
      });
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: 'Missing Cloudinary credentials'
      }, { status: 500 });
    }

    // First check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('Authentication failed: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Then validate form data
    let formData;
    try {
      formData = await request.formData();
    } catch (formError: any) {
      console.error('Error parsing form data:', formError);
      return NextResponse.json({ 
        error: 'Failed to parse form data',
        details: formError.message 
      }, { status: 400 });
    }

    const image = formData.get('image') as File;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;

    console.log('Received form data:', {
      hasImage: !!image,
      imageType: image?.type,
      imageSize: image?.size,
      description: description?.length,
      location: location?.length
    });

    if (!image || !description || !location) {
      console.log('Missing required fields:', {
        image: !image,
        description: !description,
        location: !location
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert the file to a buffer
    let buffer;
    try {
      console.log('Converting file to buffer...');
      const bytes = await image.arrayBuffer();
      buffer = Buffer.from(bytes);
      console.log('Buffer created, size:', buffer.length);
    } catch (bufferError: any) {
      console.error('Error creating buffer:', bufferError);
      return NextResponse.json({ 
        error: 'Failed to process image file',
        details: bufferError.message 
      }, { status: 500 });
    }

    // Upload to Cloudinary with metadata extraction
    let result: CloudinaryResult;
    try {
      console.log('Starting Cloudinary upload with config:', {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
        imageType: image.type,
        imageSize: image.size
      });

      try {
        // Upload directly using base64
        const base64Data = buffer.toString('base64');
        const uploadResponse = await cloudinary.uploader.upload(
          `data:${image.type};base64,${base64Data}`,
          {
            folder: 'jackie-blog',
            resource_type: 'auto',
            image_metadata: true
          }
        );

        if (!uploadResponse) {
          throw new Error('No response from Cloudinary');
        }

        result = uploadResponse as CloudinaryResult;
        console.log('Upload successful:', {
          publicId: result.public_id,
          url: result.secure_url,
          hasMetadata: !!result.image_metadata
        });
      } catch (directUploadError: any) {
        console.error('Direct upload error:', {
          error: directUploadError,
          message: directUploadError.message,
          name: directUploadError.name,
          http_code: directUploadError.http_code
        });
        throw directUploadError;
      }

    } catch (uploadError: any) {
      console.error('Cloudinary upload failed:', {
        error: uploadError,
        message: uploadError.message,
        name: uploadError.name,
        http_code: uploadError.http_code,
        stack: uploadError.stack
      });
      return NextResponse.json({ 
        error: 'Failed to upload to Cloudinary',
        details: uploadError.message,
        name: uploadError.name,
        http_code: uploadError.http_code
      }, { status: 500 });
    }

    // Convert GPS coordinates from DMS to decimal degrees if available
    let latitude, longitude;
    try {
      console.log('Processing image metadata:', {
        hasGPSData: !!(result.image_metadata?.GPSLatitude || result.image_metadata?.GPSLongitude),
        rawLatitude: result.image_metadata?.GPSLatitude,
        rawLongitude: result.image_metadata?.GPSLongitude
      });

      latitude = result.image_metadata?.GPSLatitude ? 
        convertDMSToDecimal(
          result.image_metadata.GPSLatitude,
          result.image_metadata.GPSLatitudeRef || 'N'
        ) : undefined;

      longitude = result.image_metadata?.GPSLongitude ?
        convertDMSToDecimal(
          result.image_metadata.GPSLongitude,
          result.image_metadata.GPSLongitudeRef || 'E'
        ) : undefined;

      console.log('Converted coordinates:', { latitude, longitude });
    } catch (gpsError: any) {
      console.error('Error processing GPS data:', gpsError);
      // Don't return error here, just log it as GPS data is optional
    }

    // Parse the original capture date
    let parsedDate;
    try {
      parsedDate = result.image_metadata?.DateTimeOriginal
        ? (() => {
            const dateStr = result.image_metadata.DateTimeOriginal.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
            const date = new Date(dateStr);
            console.log('Parsed date:', {
              original: result.image_metadata.DateTimeOriginal,
              converted: dateStr,
              parsed: date,
              isValid: !isNaN(date.getTime())
            });
            return !isNaN(date.getTime()) ? date : new Date();
          })()
        : new Date();
    } catch (dateError: any) {
      console.error('Error parsing date:', dateError);
      parsedDate = new Date(); // Use current date as fallback
    }

    // Connect to MongoDB
    let db;
    try {
      console.log('Connecting to MongoDB...');
      const dbConnection = await connectToDatabase();
      db = dbConnection.db;
    } catch (dbError: any) {
      console.error('MongoDB connection error:', dbError);
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: dbError.message 
      }, { status: 500 });
    }
    
    // When saving to database, use the appropriate collection name
    const photosCollection = getCollectionName('photos');
    
    // Save to database with metadata if available
    let photo;
    try {
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

      console.log(`Creating photo document in ${photosCollection}:`, {
        hasImageUrl: !!photoData.imageUrl,
        metadata: photoData.metadata
      });

      if (photoData.metadata && typeof photoData.metadata.longitude === 'number' && photoData.metadata.longitude > 0) {
        console.log(`Transforming positive longitude ${photoData.metadata.longitude} to negative during upload`);
        photoData.metadata.longitude = -photoData.metadata.longitude;
      }

      // Insert the photo directly using the MongoDB driver
      const insertResult = await db.collection(photosCollection).insertOne(photoData);
      photo = { _id: insertResult.insertedId, ...photoData };
      console.log('Photo document created:', { id: photo._id });
    } catch (saveError: any) {
      console.error('Error saving to database:', saveError);
      return NextResponse.json({ 
        error: 'Failed to save photo to database',
        details: saveError.message 
      }, { status: 500 });
    }

    // Convert MongoDB document to a plain object and handle dates
    try {
      const response = {
        ...photo,
        _id: photo._id.toString(),
        createdAt: photo.createdAt instanceof Date ? photo.createdAt.toISOString() : new Date().toISOString(),
        capturedAt: photo.capturedAt instanceof Date ? photo.capturedAt.toISOString() : parsedDate.toISOString()
      };

      console.log('Sending response:', {
        id: response._id,
        hasImageUrl: !!response.imageUrl
      });

      return NextResponse.json(response);
    } catch (responseError: any) {
      console.error('Error formatting response:', responseError);
      return NextResponse.json({ 
        error: 'Failed to format response',
        details: responseError.message 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error creating photo:', {
      error,
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return NextResponse.json(
      { 
        error: 'Error creating photo',
        details: error.message,
        name: error.name
      },
      { status: 500 }
    );
  }
} 