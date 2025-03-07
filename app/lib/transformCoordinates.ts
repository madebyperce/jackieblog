/**
 * Utility function to transform GPS coordinates
 * Ensures that longitude values for western hemisphere locations are properly negative
 */
export function transformCoordinates(metadata: any): any {
  if (!metadata) return metadata;
  
  // If metadata has longitude and it's positive, make it negative
  if (typeof metadata.longitude === 'number' && metadata.longitude > 0) {
    // Check if this is likely a western hemisphere location (North America)
    // Most of North America is between latitudes 25° and 50° N
    const isLikelyWesternHemisphere = 
      typeof metadata.latitude === 'number' && 
      metadata.latitude >= 24 && 
      metadata.latitude <= 50;
    
    if (isLikelyWesternHemisphere) {
      console.log(`Transforming positive longitude ${metadata.longitude} to negative`);
      metadata.longitude = -metadata.longitude;
    }
  }
  
  return metadata;
} 