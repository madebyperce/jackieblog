import { transformCoordinates } from '@/app/lib/transformCoordinates';

/**
 * Gets corrected coordinates for Google Maps from metadata
 * @param metadata - Object containing coordinate data
 * @returns Formatted coordinate string for Google Maps
 */
export function getCorrectCoordinates(metadata: any) {
  if (!metadata) return '';
  
  // If we have coordinates string, parse it and correct
  if (metadata.coordinates) {
    const [lat, lng] = metadata.coordinates.split(',').map(parseFloat);
    if (!isNaN(lat) && !isNaN(lng)) {
      const correctedMetadata = transformCoordinates({ latitude: lat, longitude: lng });
      return `${correctedMetadata.latitude},${correctedMetadata.longitude}`;
    }
    return metadata.coordinates;
  }
  
  // If we have separate latitude and longitude
  if (metadata.latitude !== undefined && metadata.longitude !== undefined) {
    const correctedMetadata = transformCoordinates(metadata);
    return `${correctedMetadata.latitude},${correctedMetadata.longitude}`;
  }
  
  return '';
} 