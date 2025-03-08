import { MongoClient, Db } from 'mongodb';

// Connection cache
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

// Default database name
const DEFAULT_DB_NAME = 'jackieblog';

/**
 * Connect to MongoDB
 * @param uri MongoDB connection URI
 * @param dbName Database name
 * @returns MongoDB client and database
 */
export async function connectToDatabase(
  uri: string = process.env.MONGODB_URI || 'mongodb://localhost:27017',
  dbName: string = process.env.MONGODB_DB || DEFAULT_DB_NAME
): Promise<{ client: MongoClient; db: Db }> {
  // Log detailed environment info
  console.log('Detailed environment info:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    MONGODB_URI_SET: !!process.env.MONGODB_URI,
    MONGODB_URI_PREFIX: process.env.MONGODB_URI ? 
      process.env.MONGODB_URI.substring(0, 20) + '...' : 'not set',
    MONGODB_DB_SET: !!process.env.MONGODB_DB,
    MONGODB_DB: process.env.MONGODB_DB || 'not set',
    DEFAULT_DB_NAME,
    REQUESTED_DB_NAME: dbName
  });
  
  // Use the same database name for both environments
  const effectiveDbName = dbName || DEFAULT_DB_NAME;
  
  // Log connection attempt with partial URI for security
  const uriStart = uri.substring(0, 20) + '...';
  console.log(`Connecting to MongoDB: ${uriStart}, DB: ${effectiveDbName}`);
  
  // Check environment variables
  if (!uri) {
    console.error('MONGODB_URI is not defined in environment variables');
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  // If we have a cached connection, return it
  if (cachedClient && cachedDb) {
    console.log('Using cached MongoDB connection');
    
    // Verify the connection is still alive
    try {
      await cachedClient.db().admin().ping();
      console.log('Cached connection is still alive');
      
      // Check if the cached DB is the one we want
      if (cachedDb.databaseName !== effectiveDbName) {
        console.log(`Cached DB name (${cachedDb.databaseName}) doesn't match requested DB name (${effectiveDbName}), switching databases`);
        cachedDb = cachedClient.db(effectiveDbName);
      }
      
      return { client: cachedClient, db: cachedDb };
    } catch (error) {
      console.log('Cached connection is no longer valid, creating a new one');
      cachedClient = null;
      cachedDb = null;
    }
  }

  // Create a new connection
  try {
    console.log('Creating new MongoDB connection');
    // Connect with a timeout
    const client = await MongoClient.connect(uri, {
      // Add any connection options here
    });
    
    const db = client.db(effectiveDbName);
    
    // Test the connection
    await db.command({ ping: 1 });
    console.log('MongoDB connection test successful');
    
    // List collections to verify access
    const collections = await db.listCollections().toArray();
    console.log(`Available collections in ${effectiveDbName}: ${collections.map(c => c.name).join(', ') || 'none'}`);
    
    // Try to check if photos collection exists and has documents
    if (collections.some(c => c.name === 'photos')) {
      try {
        const photoCount = await db.collection('photos').countDocuments();
        console.log(`Found ${photoCount} documents in photos collection`);
        
        if (photoCount > 0) {
          const sample = await db.collection('photos').find().limit(1).toArray();
          console.log('Sample photo fields:', Object.keys(sample[0]).join(', '));
        }
      } catch (error) {
        console.error('Error checking photos collection:', error);
      }
    } else {
      console.log('No photos collection found in this database');
    }
    
    // Cache the connection
    cachedClient = client;
    cachedDb = db;
    
    console.log('Successfully connected to MongoDB');
    return { client, db };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

/**
 * Get the collection name - always returns the same name regardless of environment
 * @param baseCollectionName The collection name
 * @returns The same collection name
 */
export function getCollectionName(baseCollectionName: string): string {
  return baseCollectionName;
} 