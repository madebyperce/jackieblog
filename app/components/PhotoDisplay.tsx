/**
 * PhotoDisplay Component
 * 
 * A unified, flexible component for displaying photos that combines functionality
 * from both PhotoGrid and PhotoGallery components.
 * 
 * Features:
 * - Multiple view modes (grid, thumbnails)
 * - Optional comments section
 * - Can fetch photos itself or receive them as props
 * - Pagination support
 * - Detailed or simplified photo display
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { format, isValid } from 'date-fns';
import Pagination from './Pagination';
import CommentSection from './CommentSection';
import { transformCoordinates } from '@/app/lib/transformCoordinates';
import { Photo } from '@/app/types';
import { getCorrectCoordinates } from '@/app/lib/coordinateUtils';

/**
 * Comment form data structure
 */
interface CommentForm {
  content: string;
  authorName: string;
}

/**
 * Props for the PhotoDisplay component
 */
interface PhotoDisplayProps {
  /** Photos to display. If not provided, component will fetch photos itself */
  photos?: Photo[];
  /** Number of photos to display per page */
  itemsPerPage?: number;
  /** Whether to show the comments section */
  showComments?: boolean;
  /** Initial view mode */
  initialViewMode?: 'grid' | 'thumbnails';
  /** Whether to fetch photos from API (if photos prop not provided) */
  fetchPhotos?: boolean;
}

/**
 * Fetches full comment data for a photo
 * @param photoId - ID of the photo to fetch comments for
 * @returns Array of comment objects
 */
const fetchCommentsForPhoto = async (photoId: string) => {
  try {
    const response = await fetch(`/api/photos/${photoId}/comments`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.status}`);
    }
    
    const data = await response.json();
    return data.comments || [];
  } catch (error) {
    console.error(`Error fetching comments for photo ${photoId}:`, error);
    return [];
  }
};

export default function PhotoDisplay({
  photos: initialPhotos,
  itemsPerPage = 10,
  showComments = false,
  initialViewMode = 'grid',
  fetchPhotos = false
}: PhotoDisplayProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos || []);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'thumbnails' | 'carousel'>(initialViewMode);
  const [currentPage, setCurrentPage] = useState(1);
  const { register, handleSubmit, reset } = useForm<CommentForm>();
  const topRef = useRef<HTMLDivElement>(null);
  const [allComments, setAllComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    if (fetchPhotos) {
      fetchPhotosFromMongoDB();
    }
  }, [fetchPhotos]);

  const fetchPhotosFromMongoDB = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Make a fetch request to your API endpoint that connects to MongoDB
      const response = await fetch('/api/photos');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch photos: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API response:', result); // Debug: Log the entire response
      
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
      
      // Now we can safely map over the array - preserve ALL fields from the photo object
      const formattedPhotos = photosArray.map((photo: any) => ({
        _id: photo._id || photo.id,
        description: photo.description || '',
        imageUrl: photo.imageUrl || '',
        location: photo.location || '',
        createdAt: photo.createdAt || '',
        capturedAt: photo.capturedAt || '',
        metadata: photo.metadata || {},
        comments: photo.comments || []
      }));
      
      // Sort photos from newest to oldest based on capturedAt date
      const sortedPhotos = formattedPhotos.sort((a: any, b: any) => {
        const dateA = new Date(a.capturedAt || a.createdAt).getTime();
        const dateB = new Date(b.capturedAt || b.createdAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      
      setPhotos(sortedPhotos);
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch photos');
    } finally {
      setLoading(false);
    }
  };

  // Sort photos when they're provided as props
  useEffect(() => {
    if (initialPhotos && initialPhotos.length > 0) {
      const sortedPhotos = [...initialPhotos].sort((a, b) => {
        const dateA = new Date(a.capturedAt || a.createdAt).getTime();
        const dateB = new Date(b.capturedAt || b.createdAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      setPhotos(sortedPhotos);
    }
  }, [initialPhotos]);

  // Debug: Log the photos state to see if it's being updated
  useEffect(() => {
    console.log('Photos state updated:', photos.length, 'photos');
    if (photos.length > 0) {
      console.log('First photo in state:', photos[0]);
    }
  }, [photos]);

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
    return Math.floor(photoIndex / itemsPerPage) + 1;
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
   * Fetches photos from the API
   */
  const fetchPhotosFromAPI = async () => {
    try {
      setLoading(true);
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
      
      // Sort photos from newest to oldest
      const sortedPhotos = photosArray.sort((a: any, b: any) => {
        const dateA = new Date(a.capturedAt || a.createdAt).getTime();
        const dateB = new Date(b.capturedAt || b.createdAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      
      setPhotos(sortedPhotos);
      setError('');
    } catch (error) {
      console.error('Error fetching photos:', error);
      setError('Failed to load photos. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Get current photos for pagination
  const indexOfLastPhoto = currentPage * itemsPerPage;
  const indexOfFirstPhoto = indexOfLastPhoto - itemsPerPage;
  // Ensure photos is an array before calling slice
  const currentPhotos = Array.isArray(photos) 
    ? (view === 'grid' ? photos.slice(indexOfFirstPhoto, indexOfLastPhoto) : photos)
    : [];
  // Calculate total pages
  const totalPages = Math.ceil(Array.isArray(photos) ? photos.length / itemsPerPage : 0);

  // Fetch all comments at once instead of per photo
  useEffect(() => {
    const fetchAllComments = async () => {
      try {
        setCommentsLoading(true);
        console.log('Fetching all comments...');
        
        // Add more detailed logging
        console.log('Making fetch request to /api/comments');
        const response = await fetch('/api/comments');
        console.log('Fetch response received:', response.status, response.statusText);
        
        if (!response.ok) {
          console.error('Response not OK:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          throw new Error(`Failed to fetch comments: ${response.status}`);
        }
        
        const comments = await response.json();
        console.log(`Fetched ${comments.length} comments`);
        console.log('First comment sample:', comments.length > 0 ? JSON.stringify(comments[0]) : 'No comments');
        
        setAllComments(comments);
      } catch (error) {
        console.error('Error fetching comments:', error);
        // Try an alternative approach if the main one fails
        console.log('Attempting to fetch comments directly from photos...');
        try {
          // Fetch photos with populated comments
          const photosResponse = await fetch('/api/photos?includeComments=true');
          if (photosResponse.ok) {
            const photosData = await photosResponse.json();
            console.log('Successfully fetched photos with comments');
            
            // Extract all comments from photos
            const extractedComments: any[] = [];
            photosData.forEach((photo: any) => {
              if (photo.comments && Array.isArray(photo.comments)) {
                photo.comments.forEach((comment: any) => {
                  // Add photoId to each comment
                  extractedComments.push({
                    ...comment,
                    photoId: photo._id
                  });
                });
              }
            });
            
            console.log(`Extracted ${extractedComments.length} comments from photos`);
            setAllComments(extractedComments);
          }
        } catch (fallbackError) {
          console.error('Fallback approach also failed:', fallbackError);
        }
      } finally {
        setCommentsLoading(false);
      }
    };
    
    fetchAllComments();
  }, []);

  // After submitting a comment, refresh all comments
  const refreshComments = async () => {
    try {
      const response = await fetch('/api/comments');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }
      
      const comments = await response.json();
      setAllComments(comments);
    } catch (error) {
      console.error('Error refreshing comments:', error);
    }
  };

  /**
   * Safely formats a date string, with fallbacks for invalid dates
   * @param dateString - The date string to format
   * @returns Formatted date string or fallback text
   */
  function safeFormatDate(dateString: string | undefined) {
    if (!dateString) return 'No date';
    
    try {
      // Handle MongoDB date format which might be nested
      let dateValue = dateString;
      if (typeof dateString === 'object' && dateString && '$date' in dateString) {
        const mongoDate = dateString as unknown as { $date: string | number };
        dateValue = new Date(mongoDate.$date).toISOString();
      }
      
      const date = new Date(dateValue);
      if (!isValid(date)) return 'Unknown date';
      
      // Format with time included
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Date formatting error:', error, 'Date string:', dateString);
      return 'Unknown date';
    }
  }

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
      
      // Refresh all comments after posting a new one
      await refreshComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

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

  /**
   * Toggles between grid and thumbnail view modes
   */
  const handleViewModeToggle = () => {
    setView(view === 'grid' ? 'thumbnails' : 'grid');
    
    // Reset to first page when switching to grid view
    if (view === 'thumbnails') {
      setCurrentPage(1);
    }
  };

  // Get comments for a specific photo
  const getCommentsForPhoto = (photoId: string) => {
    return allComments.filter(comment => {
      // Check different possible formats of photoId
      return (
        comment.photoId === photoId || 
        (comment.photoId && comment.photoId._id === photoId) ||
        (comment.photoId && comment.photoId.toString() === photoId) ||
        (comment.photoId && typeof comment.photoId === 'object' && comment.photoId.$oid === photoId)
      );
    });
  };

  // Loading state
  if (loading) {
    return <div className="text-center">Loading photos...</div>;
  }

  // Error state
  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  // Empty state
  if (!Array.isArray(photos) || photos.length === 0) {
    return <div className="text-gray-500 text-center">No photos yet</div>;
  }

  return (
    <div className="container mx-auto px-4 pt-2 pb-8">
      <div ref={topRef} id="gallery-top"></div>
      
      <div className="flex justify-center mb-8">
        <button
          onClick={handleViewModeToggle}
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
          {currentPhotos.map((photo) => {
            // Get comments for this photo from our allComments state
            const photoComments = getCommentsForPhoto(photo._id);
            
            // Create a processed photo with the comments
            const processedPhoto = {
              ...photo,
              comments: photoComments.map(comment => ({
                ...comment,
                _id: comment._id,
                formattedDate: comment.createdAt ? safeFormatDate(comment.createdAt) : 'No date'
              }))
            };
            
            return (
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
                          href={`https://www.google.com/maps/search/?api=1&query=${getCorrectCoordinates(photo.metadata)}`}
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
                    {/* Display coordinates directly if no coordinates string but lat/long exist */}
                    {!photo.metadata?.coordinates && photo.metadata?.latitude && photo.metadata?.longitude && (
                      <>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${getCorrectCoordinates(photo.metadata)}`}
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
                      {photo.capturedAt && isValid(new Date(photo.capturedAt)) 
                        ? format(new Date(photo.capturedAt), 'MMM d, yyyy')
                        : photo.createdAt && isValid(new Date(photo.createdAt))
                          ? format(new Date(photo.createdAt), 'MMM d, yyyy')
                          : 'No date available'}
                    </span>
                  </div>
                  
                  {/* Show loading state while fetching comments */}
                  {commentsLoading ? (
                    <div className="mt-4 text-sm text-gray-500">Loading comments...</div>
                  ) : (
                    <CommentSection 
                      photo={processedPhoto} 
                      onSubmitComment={(data: CommentForm) => onSubmitComment(photo._id, data)}
                    />
                  )}
                </div>
              </div>
            );
          })}
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