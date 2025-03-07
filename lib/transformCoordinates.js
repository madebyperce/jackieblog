/**
 * Transforms GPS coordinates to ensure western hemisphere locations have negative longitude
 * @param {Object} coordinates - Object containing latitude and longitude
 * @returns {Object} - Transformed coordinates
 */
export function transformCoordinates(coordinates) {
  if (!coordinates) return coordinates;
  
  const { latitude, longitude } = coordinates;
  
  // Create a new object to avoid mutating the input
  const transformed = { ...coordinates };
  
  // Ensure western hemisphere locations have negative longitude
  if (typeof longitude === 'number' && longitude > 0) {
    console.log(`Transforming positive longitude ${longitude} to negative`);
    transformed.longitude = -longitude;
  }
  
  return transformed;
} 