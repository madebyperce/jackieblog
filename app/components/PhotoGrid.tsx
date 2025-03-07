'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import Map from './Map';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import CommentSection from './CommentSection';

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

interface Comment {
  _id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

interface CommentForm {
  content: string;
  authorName: string;
}

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
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'thumbnails'>('grid');
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const photosPerPage = 10;
  const { register, handleSubmit, reset } = useForm<CommentForm>();

  // Preload thumbnails
  useEffect(() => {
    photos.forEach(photo => {
      const img = new window.Image();
      img.src = photo.imageUrl;
    });
  }, [photos]);

  // Function to find the page number for a specific photo
  const findPhotoPage = (photoId: string) => {
    const photoIndex = photos.findIndex(p => p._id === photoId);
    if (photoIndex === -1) return 1;
    return Math.floor(photoIndex / photosPerPage) + 1;
  };

  // Handle thumbnail click
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

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/photos');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch photos');
      }
      
      // Log detailed information about the first photo
      if (data && data.length > 0) {
        console.log('First photo data:', {
          _id: data[0]._id,
          dates: {
            capturedAt: data[0].capturedAt,
            createdAt: data[0].createdAt
          },
          location: {
            userProvided: data[0].location,
            hasMetadata: Boolean(data[0].metadata),
            coordinates: data[0].metadata?.coordinates,
            latitude: data[0].metadata?.latitude,
            longitude: data[0].metadata?.longitude
          }
        });
      }
      
      setPhotos(data || []);
      setError('');
    } catch (error) {
      console.error('Error fetching photos:', error);
      setError('Failed to load photos. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

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

  const toggleComments = (photoId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [photoId]: !prev[photoId]
    }));
  };

  // Calculate pagination
  const indexOfLastPhoto = currentPage * photosPerPage;
  const indexOfFirstPhoto = indexOfLastPhoto - photosPerPage;
  const currentPhotos = photos.slice(indexOfFirstPhoto, indexOfLastPhoto);
  const totalPages = Math.ceil(photos.length / photosPerPage);

  if (isLoading) {
    return <div className="text-center">Loading photos...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  if (photos.length === 0) {
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
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {photos.map((photo) => (
            <div
              key={photo._id}
              className="relative w-[100px] h-[100px] cursor-pointer hover:opacity-90 transition-opacity duration-200"
              onClick={() => handleThumbnailClick(photo._id)}
            >
              <Image
                src={photo.imageUrl}
                alt={photo.description}
                fill
                className="object-cover rounded"
                sizes="100px"
                priority={true}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 max-w-[500px] mx-auto">
          {currentPhotos.map((photo) => (
            <div 
              key={photo._id} 
              id={`photo-${photo._id}`}
              className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg scroll-mt-8"
            >
              <div className="relative w-[500px]">
                <Image
                  src={photo.imageUrl}
                  alt={photo.description}
                  width={500}
                  height={375}
                  className="w-full"
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
      
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8 max-w-[500px] mx-auto">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                currentPage === page
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 