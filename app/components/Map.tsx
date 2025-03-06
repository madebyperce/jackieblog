'use client';

import Image from 'next/image';
import { useState } from 'react';

interface MapProps {
  location: string;
  latitude?: number;
  longitude?: number;
}

export default function Map({ location, latitude, longitude }: MapProps) {
  // Ensure Western longitudes are negative
  const adjustedLongitude = longitude && longitude > 0 ? -longitude : longitude;

  // Use coordinates if available, otherwise use location name
  const mapLocation = latitude && adjustedLongitude 
    ? `${latitude.toFixed(6)},${adjustedLongitude.toFixed(6)}` // Format coordinates with 6 decimal places
    : location.replace(/Mt\./g, 'Mount').replace(/\s+/g, '+').concat(', USA');

  return (
    <a 
      href={`https://www.google.com/maps/search/?api=1&query=${mapLocation}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center ml-2 text-gray-600 hover:text-gray-900 transition-colors"
      title={`View ${location} on map`}
    >
      <span 
        role="img" 
        aria-label="map"
        className="inline-block transition-transform duration-300 hover:rotate-12 hover:scale-110"
      >
        🗺️
      </span>
    </a>
  );
} 