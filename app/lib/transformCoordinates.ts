/**
 * Utility function to transform GPS coordinates
 * Ensures that longitude values for western hemisphere locations are properly negative
 */
export function transformCoordinates(metadata: any): any {
  if (!metadata) return metadata;
  
  // Create a copy of the metadata to avoid mutating the original
  const result = { ...metadata };
  
  // If metadata has longitude and it's positive, make it negative
  if (typeof result.longitude === 'number' && result.longitude > 0) {
    // Check if this is likely a western hemisphere location (North America)
    // Most of North America is between latitudes 25° and 50° N
    const isLikelyWesternHemisphere = 
      typeof result.latitude === 'number' && 
      result.latitude >= 24 && 
      result.latitude <= 50;
    
    if (isLikelyWesternHemisphere) {
      console.log(`Transforming positive longitude ${result.longitude} to negative`);
      result.longitude = -result.longitude;
    }
  }
  
  // If metadata has coordinates string, parse and transform it
  if (typeof result.coordinates === 'string') {
    const [lat, lng] = result.coordinates.split(',').map(parseFloat);
    if (!isNaN(lat) && !isNaN(lng) && lng > 0) {
      // Check if this is likely a western hemisphere location
      const isLikelyWesternHemisphere = lat >= 24 && lat <= 50;
      
      if (isLikelyWesternHemisphere) {
        console.log(`Transforming positive longitude ${lng} to negative in coordinates string`);
        result.coordinates = `${lat},${-lng}`;
      }
    }
  }
  
  return result;
} 