import { MongoClient, Db } from 'mongodb';

// Connection cache
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * Connect to MongoDB
 * @param uri MongoDB connection URI
 * @param dbName Database name
 * @returns MongoDB client and database
 */
export async function connectToDatabase(
  uri: string = process.env.MONGODB_URI || 'mongodb://localhost:27017',
  dbName: string = process.env.MONGODB_DB || 'jackieblog'
): Promise<{ client: MongoClient; db: Db }> {
  // Log connection attempt with partial URI for security
  const uriStart = uri.substring(0, 15) + '...';
  console.log(`Connecting to MongoDB: ${uriStart}, DB: ${dbName}`);
  
  // Check environment variables
  if (!uri) {
    console.error('MONGODB_URI is not defined in environment variables');
    throw new Error('Please define the MONGODB_URI environment variable');
  }
  
  if (!dbName) {
    console.error('MONGODB_DB is not defined in environment variables');
    throw new Error('Please define the MONGODB_DB environment variable');
  }

  // If we have a cached connection, return it
  if (cachedClient && cachedDb) {
    console.log('Using cached MongoDB connection');
    return { client: cachedClient, db: cachedDb };
  }

  // Create a new connection
  try {
    // Connect with a timeout
    const client = await MongoClient.connect(uri, {
      // Add any connection options here
    });
    
    const db = client.db(dbName);
    
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