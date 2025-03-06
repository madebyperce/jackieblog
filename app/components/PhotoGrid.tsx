'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import Map from './Map';

interface Photo {
  _id: string;
  imageUrl: string;
  description: string;
  location: string;
  createdAt: string;
  capturedAt: string;
  comments: Comment[];
  metadata?: {
    latitude?: number;
    longitude?: number;
    location?: string;
  };
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
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const photosPerPage = 10;
  const { register, handleSubmit, reset } = useForm<CommentForm>();

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-8">
        {currentPhotos.map((photo) => (
          <div key={photo._id} className="bg-white rounded-lg shadow-sm overflow-hidden max-w-[500px] mx-auto">
            <div className="relative w-full">
              <Image
                src={photo.imageUrl}
                alt={photo.description}
                width={500}
                height={500}
                className="w-full"
                style={{ height: 'auto' }}
              />
            </div>
            
            <div className="p-3">
              <div className="space-y-1.5">
                <p className="text-[15px] leading-snug text-gray-900 font-medium">{photo.description}</p>
                <div className="flex items-center text-xs text-gray-500 gap-2">
                  <span className="font-medium">{formatDate(photo.capturedAt)}</span>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1">
                    <span className="truncate">{photo.location}</span>
                    {photo.metadata?.latitude && photo.metadata?.longitude && (
                      <Map 
                        location={photo.location} 
                        latitude={photo.metadata?.latitude} 
                        longitude={photo.metadata?.longitude}
                      />
                    )}
                  </span>
                </div>
              </div>
              
              <div className="mt-3 border-t border-gray-100 pt-2">
                <button
                  onClick={() => toggleComments(photo._id)}
                  className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {photo.comments?.length ? `Comments (${photo.comments.length})` : 'Add comment'}
                </button>
                
                {expandedComments[photo._id] && (
                  <div className="mt-2 space-y-2">
                    {photo.comments?.map((comment) => (
                      <div key={comment._id} className="bg-gray-50 p-2 rounded text-sm">
                        <p className="text-xs text-gray-700 leading-relaxed">{comment.content}</p>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">
                          {comment.authorName || 'Anonymous'} • {formatDate(comment.createdAt)}
                        </p>
                      </div>
                    ))}
                    
                    <form onSubmit={handleSubmit((data) => onSubmitComment(photo._id, data))} className="mt-3 space-y-2">
                      <input
                        {...register('authorName', { required: false })}
                        placeholder="Your name (optional)"
                        className="w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                      />
                      <textarea
                        {...register('content', { required: true })}
                        placeholder="Add a comment..."
                        className="w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                        rows={2}
                      />
                      <button
                        type="submit"
                        className="w-full bg-gray-100 text-gray-700 py-1.5 px-3 rounded text-xs font-medium hover:bg-gray-200 transition"
                      >
                        Post Comment
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1.5 rounded text-xs font-medium ${
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