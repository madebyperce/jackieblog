import connectDB from '@/lib/mongodb';
import Photo from '@/models/Photo';

/**
 * Fetch all photos from the database
 * @returns {Promise<Array>} Array of photo objects
 */
export async function getAllPhotos() {
  try {
    await connectDB();
    const photos = await Photo.find({})
      .sort({ capturedAt: -1 })
      .lean();
    
    return JSON.parse(JSON.stringify(photos));
  } catch (error) {
    console.error('Error fetching photos:', error);
    return [];
  }
}

/**
 * Fetch a single photo by ID
 * @param {string} id - Photo ID
 * @returns {Promise<Object|null>} Photo object or null if not found
 */
export async function getPhotoById(id) {
  try {
    await connectDB();
    const photo = await Photo.findById(id).lean();
    
    if (!photo) return null;
    
    return JSON.parse(JSON.stringify(photo));
  } catch (error) {
    console.error(`Error fetching photo with ID ${id}:`, error);
    return null;
  }
}

/**
 * Fetch photos by author ID
 * @param {string} authorId - Author ID
 * @returns {Promise<Array>} Array of photo objects
 */
export async function getPhotosByAuthor(authorId) {
  try {
    await connectDB();
    const photos = await Photo.find({ authorId })
      .sort({ capturedAt: -1 })
      .lean();
    
    return JSON.parse(JSON.stringify(photos));
  } catch (error) {
    console.error(`Error fetching photos for author ${authorId}:`, error);
    return [];
  }
} 