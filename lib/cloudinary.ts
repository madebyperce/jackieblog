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

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test configuration
try {
  const testConfig = cloudinary.config();
  console.log('Cloudinary configured successfully:', {
    cloudName: testConfig.cloud_name,
    hasApiKey: !!testConfig.api_key,
    hasApiSecret: !!testConfig.api_secret
  });
} catch (error) {
  console.error('Error testing Cloudinary configuration:', error);
}

export default cloudinary; 