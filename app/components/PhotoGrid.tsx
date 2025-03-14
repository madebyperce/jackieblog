/**
 * PhotoGrid Component
 * 
 * This component displays a grid of photos with comments functionality.
 * It fetches photos directly from the API and provides a grid/thumbnail toggle view.
 * 
 * @deprecated Consider using the unified PhotoDisplay component instead,
 * which combines functionality from both PhotoGrid and PhotoGallery.
 * 
 * Key features:
 * - Self-fetching photos from API
 * - Grid and thumbnail view modes
 * - Comments functionality
 * - Pagination
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import Map from './Map';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import CommentSection from './CommentSection';
import Pagination from './Pagination';

/**
 * Photo interface representing the structure of a photo object
 */
interface Photo {
  _id: string;
  imageUrl: string;
  description: string;
  location: string;
  createdAt: string;
  capturedAt: string;
  metadata?: {
    latitude?: number;
    longitude?: number;
    location?: string;
    coordinates?: string;
  };
  comments: Array<{
    _id: string;
    content: string;
    authorName: string;
    createdAt: string;
  }>;
}

/**
 * Comment form data structure
 */
interface Comment {
  _id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

/**
 * Comment form data structure
 */
interface CommentForm {
  content: string;
  authorName: string;
}

/**
 * Formats a date string into a human-readable format
 * @param dateString - ISO date string to format
 * @returns Formatted date string
 */
function formatDate(dateString: string) {
  try {
    if (!dateString) {
      return 'No date available';
    }
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date string:', dateString);
      return 'Invalid date';
    }
    
    // Shorter date format without minutes
    const formatted = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      timeZone: 'America/Los_Angeles'
    }).format(date);
    
    return formatted;
  } catch (error) {
    console.error('Error formatting date:', error, 'Date string:', dateString);
    return 'Invalid date';
  }
}

export default function PhotoGrid() {
  // State variables
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'thumbnails'>('grid');
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const photosPerPage = 10;
  const { register, handleSubmit, reset } = useForm<CommentForm>();

  /**
   * Preloads image thumbnails for better user experience
   */
  useEffect(() => {
    if (Array.isArray(photos)) {
      photos.forEach(photo => {
        const img = new window.Image();
        img.src = photo.imageUrl;
      });
    }
  }, [photos]);

  /**
   * Finds the page number for a specific photo
   * @param photoId - ID of the photo to find
   * @returns Page number containing the photo
   */
  const findPhotoPage = (photoId: string) => {
    if (!Array.isArray(photos)) return 1;
    const photoIndex = photos.findIndex(p => p._id === photoId);
    if (photoIndex === -1) return 1;
    return Math.floor(photoIndex / photosPerPage) + 1;
  };

  /**
   * Handles thumbnail click to navigate to the full photo view
   * @param photoId - ID of the clicked photo
   */
  const handleThumbnailClick = (photoId: string) => {
    const targetPage = findPhotoPage(photoId);
    setCurrentPage(targetPage);
    setView('grid');
    // Scroll to the clicked photo after a short delay to allow view transition
    setTimeout(() => {
      const photoElement = document.getElementById(`photo-${photoId}`);
      if (photoElement) {
        photoElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  /**
   * Fetches photos from the API on component mount
   */
  useEffect(() => {
    fetchPhotos();
  }, []);

  /**
   * Fetches photos from the API
   */
  const fetchPhotos = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/photos');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch photos');
      }
      
      // Check if data is in the expected format
      let photosArray = [];
      
      if (Array.isArray(data)) {
        photosArray = data;
      } else if (data && data.photos && Array.isArray(data.photos)) {
        photosArray = data.photos;
      } else {
        console.error('Unexpected API response format:', data);
        photosArray = [];
      }
      
      // Log detailed information about the first photo
      if (photosArray.length > 0) {
        console.log('First photo data:', {
          _id: photosArray[0]._id,
          dates: {
            capturedAt: photosArray[0].capturedAt,
            createdAt: photosArray[0].createdAt
          },
          location: {
            userProvided: photosArray[0].location,
            hasMetadata: Boolean(photosArray[0].metadata),
            coordinates: photosArray[0].metadata?.coordinates,
            latitude: photosArray[0].metadata?.latitude,
            longitude: photosArray[0].metadata?.longitude
          }
        });
      }
      
      setPhotos(photosArray);
      setError('');
    } catch (error) {
      console.error('Error fetching photos:', error);
      setError('Failed to load photos. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Submits a new comment for a photo
   * @param photoId - ID of the photo to comment on
   * @param data - Comment form data
   */
  const onSubmitComment = async (photoId: string, data: CommentForm) => {
    try {
      const response = await fetch(`/api/photos/${photoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      reset();
      await fetchPhotos(); // Refresh photos to show new comment
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  /**
   * Toggles the visibility of comments for a photo
   * @param photoId - ID of the photo to toggle comments for
   */
  const toggleComments = (photoId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [photoId]: !prev[photoId]
    }));
  };

  // Get current photos for pagination
  const indexOfLastPhoto = currentPage * photosPerPage;
  const indexOfFirstPhoto = indexOfLastPhoto - photosPerPage;
  // Ensure photos is an array before calling slice
  const currentPhotos = Array.isArray(photos) 
    ? photos.slice(indexOfFirstPhoto, indexOfLastPhoto)
    : [];
  // Fix the parentheses in the totalPages calculation
  const totalPages = Math.ceil(Array.isArray(photos) ? photos.length / photosPerPage : 0);

  /**
   * Logs view mode changes (for debugging)
   */
  useEffect(() => {
    console.log('View mode changed:', view);
  }, [view]);

  /**
   * Handles page changes with smooth scrolling
   * @param pageNumber - New page number
   */
  const handlePageChange = (pageNumber: number) => {
    // Update the current page
    setCurrentPage(pageNumber);
    
    // Scroll to the top of the page
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Additional fallbacks for better browser compatibility
    setTimeout(() => {
      // Standard scroll methods
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0; // For Safari
      
      // Try to scroll the container if it exists
      const container = document.querySelector('.container');
      if (container) {
        container.scrollTop = 0;
      }
    }, 100);
  };

  if (isLoading) {
    return <div className="text-center">Loading photos...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  if (!Array.isArray(photos) || photos.length === 0) {
    return <div className="text-gray-500 text-center">No photos yet</div>;
  }

  return (
    <div className="container mx-auto px-4 pt-2 pb-8">
      <div className="flex justify-center mb-8">
        <button
          onClick={() => setView(view === 'grid' ? 'thumbnails' : 'grid')}
          className="text-[11px] text-gray-400 px-3 py-1.5 rounded italic hover:text-gray-600 transition-colors duration-200"
        >
          {view === 'grid' ? 'show thumbnails' : 'show full size'}
        </button>
      </div>

      {view === 'thumbnails' ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1 sm:gap-2">
          {photos.map((photo) => (
            <div
              key={photo._id}
              className="relative aspect-square w-full cursor-pointer hover:opacity-90 transition-opacity duration-200"
              onClick={() => handleThumbnailClick(photo._id)}
            >
              <Image
                src={photo.imageUrl}
                alt={photo.description}
                fill
                className="object-cover rounded"
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 16.67vw, (max-width: 1280px) 12.5vw, 10vw"
                priority={true}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 w-full max-w-[500px] mx-auto">
          {currentPhotos.map((photo) => (
            <div 
              key={photo._id} 
              id={`photo-${photo._id}`}
              className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg scroll-mt-8"
            >
              <div className="relative w-full">
                <Image
                  src={photo.imageUrl}
                  alt={photo.description}
                  width={500}
                  height={500}
                  className="w-full h-auto"
                  sizes="(max-width: 500px) 100vw, 500px"
                  priority={currentPage === 1}
                />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-gray-800">{photo.description}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{photo.location}</span>
                  {photo.metadata?.coordinates && (
                    <>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${photo.metadata.coordinates}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open map"
                        className="inline-block transform transition-all duration-200 hover:scale-125 hover:rotate-12 text-gray-500"
                      >
                        🗺️
                      </a>
                      <span className="text-gray-400">•</span>
                    </>
                  )}
                  <span className="text-gray-500 font-light">
                    {format(new Date(photo.capturedAt), 'MMM d, yyyy')}
                  </span>
                </div>
                <CommentSection photo={photo} />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {view !== 'thumbnails' && totalPages > 1 && (
        <div className="pagination-container mt-16">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
} 