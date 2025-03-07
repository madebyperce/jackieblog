'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function PhotoGallery({ photos }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (!photos || photos.length === 0) {
    return <div className="text-center py-10">No photos found</div>;
  }

  const openPhotoDetail = (photo) => {
    setSelectedPhoto(photo);
  };

  const closePhotoDetail = () => {
    setSelectedPhoto(null);
  };

  return (
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div 
            key={photo._id} 
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
            onClick={() => openPhotoDetail(photo)}
          >
            <div className="relative h-48">
              <Image
                src={photo.imageUrl}
                alt={photo.description || 'Photo'}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <p className="text-gray-600 text-sm truncate">{photo.location || 'Unknown location'}</p>
              <p className="text-gray-500 text-xs">{formatDate(photo.capturedAt)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={closePhotoDetail}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-[50vh]">
              <Image
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.description || 'Photo'}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                className="object-contain"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{selectedPhoto.location || 'Unknown location'}</h3>
              <p className="text-gray-700 mb-4">{selectedPhoto.description || 'No description'}</p>
              <div className="flex justify-between items-center">
                <p className="text-gray-500">{formatDate(selectedPhoto.capturedAt)}</p>
                <Link href={`/photos/${selectedPhoto._id}`} className="text-blue-600 hover:underline">
                  View details
                </Link>
              </div>
              {selectedPhoto.metadata && selectedPhoto.metadata.latitude && (
                <div className="mt-4 text-sm text-gray-500">
                  <p>Location: {selectedPhoto.metadata.latitude}, {selectedPhoto.metadata.longitude}</p>
                </div>
              )}
            </div>
            <button 
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
              onClick={closePhotoDetail}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 