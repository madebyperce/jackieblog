/**
 * Utility functions for transforming GPS coordinates
 * Ensures that longitude values for western hemisphere locations are properly negative
 */

/**
 * Transform coordinates for a single point
 * Function overloads to support different parameter styles
 */

// Overload 1: Accept an object with latitude and longitude properties
export function transformCoordinates(coords: { latitude: number, longitude: number }): { latitude: number, longitude: number };
// Overload 2: Accept separate lat and lng parameters
export function transformCoordinates(lat: number, lng: number): { lat: number, lng: number };

// Implementation that handles both overloads
export function transformCoordinates(
  latOrCoords: number | { latitude: number, longitude: number },
  lngParam?: number
): { lat?: number, lng?: number, latitude?: number, longitude?: number } {
  // Case 1: Object parameter
  if (typeof latOrCoords === 'object') {
    const { latitude, longitude } = latOrCoords;
    
    // Check if this is likely a US location with incorrect positive longitude
    if (latitude >= 24 && latitude <= 50 && longitude > 0) {
      console.log(`Transforming positive longitude ${longitude} to negative`);
      return { latitude, longitude: -longitude };
    }
    
    // Return unchanged coordinates
    return { latitude, longitude };
  }
  
  // Case 2: Separate parameters
  else if (typeof latOrCoords === 'number' && typeof lngParam === 'number') {
    const lat = latOrCoords;
    const lng = lngParam;
    
    // Check if this is likely a US location with incorrect positive longitude
    if (lat >= 24 && lat <= 50 && lng > 0) {
      console.log(`Transforming positive longitude ${lng} to negative`);
      return { lat, lng: -lng };
    }
    
    // Return unchanged coordinates
    return { lat, lng };
  }
  
  // Invalid parameters
  console.error('Invalid parameters passed to transformCoordinates');
  return {};
}

/**
 * Transform metadata object containing coordinates
 * @param metadata Object containing latitude and longitude properties
 * @returns Transformed metadata object
 */
export function transformMetadata(metadata: any): any {
  if (!metadata) return metadata;
  
  // Create a copy of the metadata to avoid mutating the original
  const result = { ...metadata };
  
  // If metadata has longitude and it's positive, make it negative
  if (typeof result.latitude === 'number' && 
      typeof result.longitude === 'number') {
    const transformed = transformCoordinates(result.latitude, result.longitude);
    if ('lat' in transformed && 'lng' in transformed) {
      result.latitude = transformed.lat;
      result.longitude = transformed.lng;
    }
  }
  
  // If metadata has coordinates string, parse and transform it
  if (typeof result.coordinates === 'string') {
    const [lat, lng] = result.coordinates.split(',').map(parseFloat);
    if (!isNaN(lat) && !isNaN(lng)) {
      const transformed = transformCoordinates(lat, lng);
      if ('lat' in transformed && 'lng' in transformed) {
        result.coordinates = `${transformed.lat},${transformed.lng}`;
      }
    }
  }
  
  return result;
}

/**
 * Correct a collection of photos by transforming their coordinates
 * @param photos Array of photo objects
 * @returns Array of corrected photo objects
 */
export function correctPhotoCollection(photos: any[]): any[] {
  if (!photos || !Array.isArray(photos)) {
    return [];
  }
  
  return photos.map(photo => {
    // Skip photos without metadata or coordinates
    if (!photo.metadata || typeof photo.metadata.latitude !== 'number' || typeof photo.metadata.longitude !== 'number') {
      return photo;
    }
    
    // Apply coordinate transformation
    const transformed = transformCoordinates(photo.metadata.latitude, photo.metadata.longitude);
    
    // Create a new photo object with corrected coordinates
    return {
      ...photo,
      metadata: {
        ...photo.metadata,
        latitude: 'lat' in transformed ? transformed.lat : photo.metadata.latitude,
        longitude: 'lng' in transformed ? transformed.lng : photo.metadata.longitude
      }
    };
  });
} 