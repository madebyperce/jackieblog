import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    console.log('Using existing MongoDB connection');
    return;
  }

  try {
    const opts = {
      bufferCommands: true, // Enable buffering
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    };

    console.log('Creating new MongoDB connection...');
    await mongoose.connect(MONGODB_URI!, opts);
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (error: any) {
    console.error('MongoDB connection error:', error);
    if (error?.name === 'MongoParseError') {
      console.error('MongoDB URI parsing error. Please check the connection string format.');
    }
    if (error?.name === 'MongoServerError') {
      console.error('MongoDB server error. Please check credentials and network access.');
    }
    isConnected = false;
    throw error;
  }
}

export default connectDB; 