'use client';

import { useState, useEffect } from 'react';
import { transformCoordinates, correctPhotoCollection } from '@/app/lib/transformCoordinates';
import { useSession } from 'next-auth/react';

export default function TransformLocationsPage() {
  const { data: session, status } = useSession();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [transforming, setTransforming] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transformedCount, setTransformedCount] = useState(0);

  // Load photos from the database using the same approach as PhotoDisplay
  const loadPhotos = async () => {
    if (!session) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/photos');
      if (!response.ok) {
        throw new Error(`Failed to fetch photos: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API response:', result);
      
      // Check if the data is an array or if it's nested in a property
      let photosArray;
      if (Array.isArray(result)) {
        photosArray = result;
      } else if (result.photos && Array.isArray(result.photos)) {
        photosArray = result.photos;
      } else if (result.data && Array.isArray(result.data)) {
        photosArray = result.data;
      } else {
        console.error('Unexpected API response format:', result);
        throw new Error('Received invalid data format from API');
      }
      
      console.log(`Processing ${photosArray.length} photos from API`);
      
      // Now we can safely map over the array
      const formattedPhotos = photosArray.map((photo: any) => ({
        _id: photo._id || photo.id,
        title: photo.title || photo.description || 'Untitled',
        description: photo.description || '',
        imageUrl: photo.imageUrl || '',
        location: photo.location || '',
        createdAt: photo.createdAt || '',
        capturedAt: photo.capturedAt || '',
        metadata: photo.metadata || {}
      }));
      
      setPhotos(formattedPhotos);
    } catch (err) {
      console.error('Error loading photos:', err);
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  // Transform all photo locations
  const transformAllLocations = async () => {
    if (!session) return;
    
    setTransforming(true);
    setSuccess(false);
    setError(null);
    let transformed = 0;
    
    try {
      // Apply the transformation to all photos
      const correctedPhotos = correctPhotoCollection(photos);
      
      // Count how many photos were actually transformed
      correctedPhotos.forEach((photo: any, index: number) => {
        if (photo.metadata?.longitude !== photos[index].metadata?.longitude) {
          transformed++;
        }
      });
      
      // Save the corrected photos back to the database
      const response = await fetch('/api/photos/transform-locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photos: correctedPhotos }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update photo locations');
      }
      
      setTransformedCount(transformed);
      setSuccess(true);
      setPhotos(correctedPhotos);
    } catch (err) {
      console.error('Error transforming locations:', err);
      setError(err instanceof Error ? err.message : 'Failed to transform locations');
    } finally {
      setTransforming(false);
    }
  };

  // Load photos when session is ready
  useEffect(() => {
    if (status === 'authenticated') {
      loadPhotos();
    }
  }, [status]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Transform Photo Locations</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <p className="mb-4">
          This tool will correct longitude values for photos that were incorrectly saved with positive values
          instead of negative values for locations in the USA.
        </p>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={loadPhotos}
            disabled={loading || status !== 'authenticated'}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Photos'}
          </button>
          
          <button
            onClick={transformAllLocations}
            disabled={transforming || loading || photos.length === 0 || status !== 'authenticated'}
            className="px-4 py-2 bg-[#8bac98] text-white rounded hover:bg-[#7a9a87] disabled:opacity-50"
          >
            {transforming ? 'Transforming...' : 'Transform All Locations'}
          </button>
        </div>
        
        {error && (
          <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">
            Error: {error}
          </div>
        )}
        
        {success && (
          <div className="p-4 mb-4 bg-green-100 text-green-700 rounded">
            Successfully transformed {transformedCount} photo locations!
          </div>
        )}
        
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Photos: {photos.length}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border">ID</th>
                  <th className="py-2 px-4 border">Title</th>
                  <th className="py-2 px-4 border">Latitude</th>
                  <th className="py-2 px-4 border">Longitude</th>
                  <th className="py-2 px-4 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {photos.map((photo) => {
                  const needsTransform = 
                    photo.metadata?.latitude >= 24 && 
                    photo.metadata?.latitude <= 50 && 
                    photo.metadata?.longitude > 0;
                  
                  return (
                    <tr key={photo._id} className={needsTransform ? "bg-yellow-50" : ""}>
                      <td className="py-2 px-4 border">{photo._id}</td>
                      <td className="py-2 px-4 border">{photo.title || photo.description || 'Untitled'}</td>
                      <td className="py-2 px-4 border">{photo.metadata?.latitude?.toFixed(6) || 'N/A'}</td>
                      <td className="py-2 px-4 border">{photo.metadata?.longitude?.toFixed(6) || 'N/A'}</td>
                      <td className="py-2 px-4 border">
                        {needsTransform ? (
                          <span className="text-orange-500 font-medium">Needs correction</span>
                        ) : (
                          <span className="text-green-500">OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {photos.length === 0 && !loading && status === 'authenticated' && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">
                      No photos found
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">
                      Loading photos...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 