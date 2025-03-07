import { v2 as cloudinary } from 'cloudinary';

// Log configuration status
console.log('Configuring Cloudinary:', {
  hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
  hasApiKey: !!process.env.CLOUDINARY_API_KEY,
  hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
  cloudName: process.env.CLOUDINARY_CLOUD_NAME
});

if (!process.env.CLOUDINARY_CLOUD_NAME || 
    !process.env.CLOUDINARY_API_KEY || 
    !process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Please define Cloudinary environment variables');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Test configuration
try {
  const testConfig = cloudinary.config();
  if (!testConfig.cloud_name || !testConfig.api_key || !testConfig.api_secret) {
    throw new Error('Invalid Cloudinary configuration');
  }
  console.log('Cloudinary configured successfully:', {
    cloudName: testConfig.cloud_name,
    hasApiKey: !!testConfig.api_key,
    hasApiSecret: !!testConfig.api_secret,
    isSecure: testConfig.secure
  });
} catch (error) {
  console.error('Error testing Cloudinary configuration:', error);
  throw error; // Re-throw to prevent app from starting with invalid config
}

export default cloudinary; 