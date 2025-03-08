import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../lib/mongodb';
import { MongoClient } from 'mongodb';

export async function GET(req: Request) {
  try {
    console.log('Debugging database connection');
    
    // Log all environment variables related to MongoDB
    console.log('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI ? 
        `${process.env.MONGODB_URI.substring(0, 20)}...` : undefined,
      MONGODB_DB: process.env.MONGODB_DB,
      VERCEL_ENV: process.env.VERCEL_ENV,
    });
    
    // Get MongoDB connection
    const { db, client } = await connectToDatabase();
    
    // Get database information
    const adminDb = client.db().admin();
    const serverInfo = await adminDb.serverInfo();
    
    // List all databases the user has access to
    let databasesList = [];
    try {
      const dbList = await adminDb.listDatabases();
      databasesList = dbList.databases.map(db => ({
        name: db.name,
        sizeOnDisk: db.sizeOnDisk
      }));
    } catch (error) {
      console.error('Failed to list databases:', error);
      databasesList = [{ name: 'Failed to list databases', error: String(error) }];
    }
    
    // Get current database info
    const currentDbName = db.databaseName;
    
    // List collections in the current database
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Get stats for each collection
    const collectionStats = await Promise.all(
      collectionNames.map(async (name) => {
        try {
          const count = await db.collection(name).countDocuments();
          const sample = await db.collection(name).find().limit(1).toArray();
          return { 
            name, 
            count,
            hasDocuments: count > 0,
            sampleFields: sample.length > 0 ? Object.keys(sample[0]) : []
          };
        } catch (error) {
          return { name, error: 'Failed to get stats' };
        }
      })
    );
    
    // Try to connect to the production database directly
    let prodDbInfo = null;
    try {
      // This assumes your production database is named 'jackieblog'
      // If it's different, you'll need to change this
      const prodDbName = 'jackieblog';
      const prodDb = client.db(prodDbName);
      
      // List collections in the production database
      const prodCollections = await prodDb.listCollections().toArray();
      const prodCollectionNames = prodCollections.map(c => c.name);
      
      // Check for photos collection
      if (prodCollectionNames.includes('photos')) {
        const photoCount = await prodDb.collection('photos').countDocuments();
        const photoSample = await prodDb.collection('photos')
          .find()
          .limit(1)
          .toArray();
        
        prodDbInfo = {
          name: prodDbName,
          collections: prodCollectionNames,
          photoCount,
          hasPhotoSample: photoSample.length > 0,
          samplePhotoFields: photoSample.length > 0 ? Object.keys(photoSample[0]) : []
        };
      } else {
        prodDbInfo = {
          name: prodDbName,
          collections: prodCollectionNames,
          photoCount: 0,
          hasPhotoSample: false
        };
      }
    } catch (error) {
      console.error('Failed to check production database:', error);
      prodDbInfo = { error: String(error) };
    }
    
    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      serverInfo: {
        version: serverInfo.version,
        gitVersion: serverInfo.gitVersion
      },
      connection: {
        uri: process.env.MONGODB_URI ? 
          `${process.env.MONGODB_URI.substring(0, 20)}...` : 'Not set',
        dbName: process.env.MONGODB_DB || 'Not set'
      },
      currentDatabase: {
        name: currentDbName,
        collections: collectionNames,
        collectionStats
      },
      availableDatabases: databasesList,
      productionDatabase: prodDbInfo
    });
  } catch (error: any) {
    console.error('Debug connection failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: error.stack,
        name: error.name
      },
      { status: 500 }
    );
  }
} 