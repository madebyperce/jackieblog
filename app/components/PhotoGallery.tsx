/**
 * PhotoGallery Component
 * 
 * This component displays a gallery of photos with two view modes (grid and thumbnail)
 * and pagination. Unlike PhotoGrid, this component:
 * 
 * 1. Receives photos as props rather than fetching them directly
 * 2. Provides navigation to individual photo pages via Next.js Link
 * 3. Has a simpler UI without comments functionality
 * 4. Is designed to be used as a sub-component in other pages
 * 
 * @deprecated Consider using the unified PhotoDisplay component instead,
 * which combines functionality from both PhotoGrid and PhotoGallery.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Pagination from './Pagination';

/**
 * Photo interface representing the structure of a photo object
 */
interface Photo {
  _id: string;
  imageUrl: string;
  description: string;
  location: string;
  capturedAt: string;
  metadata?: {
    latitude?: number;
    longitude?: number;
  };
}

/**
 * Props for the PhotoGallery component
 */
interface PhotoGalleryProps {
  /** Array of photos to display */
  photos: Photo[];
  /** Number of photos to display per page in grid view */
  itemsPerPage?: number;
}

/**
 * PhotoGallery component for displaying photos with grid/thumbnail views
 * and pagination
 */
export default function PhotoGallery({ photos, itemsPerPage = 9 }: PhotoGalleryProps) {
  // Reference to the top of the gallery for scrolling
  const topRef = useRef<HTMLDivElement>(null);
  // Current page for pagination
  const [currentPage, setCurrentPage] = useState(1);
  // Current view mode (grid or thumbnail)
  const [viewMode, setViewMode] = useState<'grid' | 'thumbnail'>('grid');
  
  // Calculate total pages for pagination
  const totalPages = Math.ceil(photos.length / itemsPerPage);
  
  /**
   * Get current photos for pagination in grid mode
   * In thumbnail mode, show all photos
   */
  const indexOfLastPhoto = currentPage * itemsPerPage;
  const indexOfFirstPhoto = indexOfLastPhoto - itemsPerPage;
  const currentPhotos = viewMode === 'grid' 
    ? photos.slice(indexOfFirstPhoto, indexOfLastPhoto) 
    : photos;
  
  /**
   * Scroll to top when page changes
   */
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0; // For Safari
    };
    
    scrollToTop();
    const timeoutId = setTimeout(scrollToTop, 50);
    return () => clearTimeout(timeoutId);
  }, [currentPage]);
  
  /**
   * Handle page change in pagination
   * @param pageNumber - New page number
   */
  const handlePageChange = (pageNumber: number) => {
    console.log('Page change to:', pageNumber);
    setCurrentPage(pageNumber);
  };
  
  /**
   * Toggle between grid and thumbnail view modes
   */
  const handleViewModeToggle = () => {
    const newMode = viewMode === 'grid' ? 'thumbnail' : 'grid';
    console.log('Toggling view mode from', viewMode, 'to', newMode);
    
    setViewMode(newMode);
    
    // Reset to first page when switching to grid view
    if (viewMode === 'thumbnail') {
      setCurrentPage(1);
    }
  };

  // Determine if pagination should be shown
  const showPagination = viewMode === 'grid' && totalPages > 1;
  console.log('Should show pagination?', showPagination, 'viewMode:', viewMode, 'totalPages:', totalPages);

  return (
    <>
      <div ref={topRef} id="gallery-top"></div>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Photo Gallery</h2>
          <button
            onClick={handleViewModeToggle}
            className="px-4 py-2 bg-[#8bac98] text-white rounded hover:bg-[#7a9a87]"
            type="button"
          >
            {viewMode === 'grid' ? 'Show Thumbnails' : 'Show Grid'}
          </button>
        </div>
        
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
        }`}>
          {currentPhotos.map((photo) => (
            <div key={photo._id} className="relative">
              <Link href={`/photos/${photo._id}`}>
                <div className={`relative ${
                  viewMode === 'grid' 
                    ? 'aspect-square' 
                    : 'aspect-square'
                }`}>
                  <Image
                    src={photo.imageUrl}
                    alt={photo.description}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                {viewMode === 'grid' && (
                  <div className="mt-2">
                    <h3 className="font-medium">{photo.description}</h3>
                    <p className="text-sm text-gray-500">{photo.location}</p>
                  </div>
                )}
              </Link>
            </div>
          ))}
        </div>
        
        {/* Only render pagination in grid mode */}
        {showPagination && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </>
  );
} 