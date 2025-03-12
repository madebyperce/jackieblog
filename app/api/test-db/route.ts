import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../lib/mongodb';

export async function GET() {
  try {
    console.log('Testing MongoDB connection');
    
    // Get MongoDB connection
    const { db, client } = await connectToDatabase();
    
    // Test the connection
    const pingResult = await db.command({ ping: 1 });
    
    // List collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Get stats for each collection
    const collectionStats = await Promise.all(
      collectionNames.map(async (name) => {
        try {
          const count = await db.collection(name).countDocuments();
          return { name, count };
        } catch (error) {
          return { name, error: 'Failed to count documents' };
        }
      })
    );
    
    // Get server info
    const serverInfo = await db.admin().serverInfo();
    
    return NextResponse.json({
      success: true,
      ping: pingResult,
      collections: collectionStats,
      serverInfo: {
        version: serverInfo.version,
        gitVersion: serverInfo.gitVersion
      },
      databaseName: db.databaseName,
      connectionInfo: {
        host: client.options.hosts?.[0]?.host || 'unknown',
        port: client.options.hosts?.[0]?.port || 'unknown'
      }
    });
  } catch (error: any) {
    console.error('MongoDB connection test failed:', error);
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