'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';

interface Comment {
  _id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

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
  };
}

export default function PhotoManager() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteStatus, setDeleteStatus] = useState<{ [key: string]: string }>({});
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCommentContent, setEditCommentContent] = useState('');
  const [transformingLocations, setTransformingLocations] = useState(false);
  const [transformResult, setTransformResult] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/photos');
      const data = await response.json();
      setPhotos(data);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    setDeleteStatus(prev => ({ ...prev, [photoId]: 'Deleting...' }));
    
    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPhotos(photos.filter(photo => photo._id !== photoId));
        router.refresh();
        setDeleteStatus(prev => ({ ...prev, [photoId]: 'Deleted!' }));
      } else {
        throw new Error('Failed to delete photo');
      }
      
      // Clear the status after 2 seconds
      setTimeout(() => {
        setDeleteStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[photoId];
          return newStatus;
        });
      }, 2000);
    } catch (error) {
      console.error('Error deleting photo:', error);
      setDeleteStatus(prev => ({ ...prev, [photoId]: 'Error!' }));
    }
  };

  const handleUpdate = async (photoId: string) => {
    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: editDescription,
          location: editLocation,
        }),
      });

      if (response.ok) {
        const updatedPhotos = photos.map(photo => {
          if (photo._id === photoId) {
            return { ...photo, description: editDescription, location: editLocation };
          }
          return photo;
        });
        setPhotos(updatedPhotos);
        setEditingPhoto(null);
        router.refresh();
      } else {
        throw new Error('Failed to update photo');
      }
    } catch (error) {
      console.error('Error updating photo:', error);
      alert('Failed to update photo');
    }
  };

  const handleDeleteComment = async (photoId: string, commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/photos/${photoId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedPhotos = photos.map(photo => {
          if (photo._id === photoId) {
            return {
              ...photo,
              comments: photo.comments.filter(comment => comment._id !== commentId)
            };
          }
          return photo;
        });
        setPhotos(updatedPhotos);
        router.refresh();
      } else {
        throw new Error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  const handleUpdateComment = async (photoId: string, commentId: string) => {
    try {
      const response = await fetch(`/api/photos/${photoId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editCommentContent,
        }),
      });

      if (response.ok) {
        const updatedPhotos = photos.map(photo => {
          if (photo._id === photoId) {
            return {
              ...photo,
              comments: photo.comments.map(comment => {
                if (comment._id === commentId) {
                  return { ...comment, content: editCommentContent };
                }
                return comment;
              })
            };
          }
          return photo;
        });
        setPhotos(updatedPhotos);
        setEditingComment(null);
        router.refresh();
      } else {
        throw new Error('Failed to update comment');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment');
    }
  };

  const debugLocations = () => {
    console.log('Debugging photo coordinates:');
    photos.forEach(photo => {
      console.log(`Photo ID: ${photo._id}`);
      console.log(`User-entered location: ${photo.location || 'undefined'}`);
      
      if (photo.metadata && typeof photo.metadata.latitude === 'number' && typeof photo.metadata.longitude === 'number') {
        console.log(`Latitude: ${photo.metadata.latitude}`);
        console.log(`Longitude: ${photo.metadata.longitude}`);
      } else {
        console.log('No coordinates found in metadata');
      }
      console.log('---');
    });
  };

  const handleTransformAllLocations = async () => {
    if (!confirm('Are you sure you want to apply a -1 transformation to all positive longitude values? This operation cannot be undone.')) {
      return;
    }

    setTransformingLocations(true);
    setTransformResult(null);

    try {
      // First try the original endpoint
      let response = await fetch('/api/photos/transform-locations', {
        method: 'POST',
      });

      let data = await response.json();

      // If no photos were transformed, try the alternative Mongoose endpoint
      if (response.ok && data.message.includes('transformed 0')) {
        console.log('First attempt transformed 0 photos, trying alternative method...');
        
        response = await fetch('/api/photos/transform-mongoose', {
          method: 'POST',
        });
        
        data = await response.json();
      }

      if (response.ok) {
        setTransformResult(`Success: ${data.message}`);
        // Refresh photos to show updated locations
        fetchPhotos();
      } else {
        throw new Error(data.error || 'Failed to transform locations');
      }
    } catch (error) {
      console.error('Error transforming locations:', error);
      setTransformResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTransformingLocations(false);
    }
  };

  const handleViewModeToggle = () => {
    alert('Toggle button clicked');
    // rest of the function
  };

  if (loading) {
    return <div className="text-center py-8">Loading photos...</div>;
  }

  if (photos.length === 0) {
    return <div className="text-center py-8">No photos uploaded yet.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Manage Photos</h2>
        <div className="space-x-2">
          <button
            onClick={debugLocations}
            className="px-4 py-2 rounded text-white bg-gray-500 hover:bg-gray-600"
          >
            Debug Locations
          </button>
          <button
            onClick={handleTransformAllLocations}
            disabled={transformingLocations}
            className={`px-4 py-2 rounded text-white ${
              transformingLocations ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {transformingLocations ? 'Processing...' : 'Fix All Locations'}
          </button>
        </div>
      </div>

      {transformResult && (
        <div className={`p-4 rounded ${
          transformResult.startsWith('Success') 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {transformResult}
        </div>
      )}

      {photos.map(photo => (
        <div key={photo._id} className="border rounded-lg p-6 space-y-4 bg-white shadow">
          <div className="flex items-start gap-6">
            <div className="relative w-48 h-48 flex-shrink-0">
              <Image
                src={photo.imageUrl}
                alt={photo.description}
                fill
                className="object-cover rounded"
              />
            </div>
            <div className="flex-grow space-y-4">
              {editingPhoto === photo._id ? (
                <>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Description"
                  />
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Location"
                  />
                  <div className="space-x-2">
                    <button
                      onClick={() => handleUpdate(photo._id)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingPhoto(null)}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-lg">{photo.description}</p>
                  <p className="text-gray-600">{photo.location}</p>
                  
                  {/* Display GPS coordinates if available */}
                  {photo.metadata?.latitude !== undefined && photo.metadata?.longitude !== undefined && (
                    <p className="text-sm text-gray-500">
                      GPS: {photo.metadata.latitude.toFixed(6)}, {photo.metadata.longitude.toFixed(6)}
                    </p>
                  )}
                  
                  <p className="text-sm text-gray-500">
                    Captured: {format(new Date(photo.capturedAt), 'PPP')}
                  </p>
                  <div className="space-x-2">
                    <button
                      onClick={() => {
                        setEditingPhoto(photo._id);
                        setEditDescription(photo.description);
                        setEditLocation(photo.location);
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(photo._id)}
                      className={`bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ${
                        deleteStatus[photo._id]
                          ? deleteStatus[photo._id] === 'Deleted!'
                            ? 'bg-green-500'
                            : deleteStatus[photo._id] === 'Error!'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                          : 'bg-red-500 hover:bg-red-600'
                      }`}
                      disabled={deleteStatus[photo._id] === 'Deleting...'}
                    >
                      {deleteStatus[photo._id] || 'Delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Comments section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Comments ({photo.comments.length})</h3>
            <div className="space-y-4">
              {photo.comments.map(comment => (
                <div key={comment._id} className="bg-gray-50 p-4 rounded">
                  {editingComment === comment._id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editCommentContent}
                        onChange={(e) => setEditCommentContent(e.target.value)}
                        className="w-full p-2 border rounded"
                        rows={3}
                      />
                      <div className="space-x-2">
                        <button
                          onClick={() => handleUpdateComment(photo._id, comment._id)}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingComment(null)}
                          className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{comment.authorName}</p>
                          <p className="text-gray-600">{comment.content}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(comment.createdAt), 'PPP')}
                          </p>
                        </div>
                        <div className="space-x-2">
                          <button
                            onClick={() => {
                              setEditingComment(comment._id);
                              setEditCommentContent(comment.content);
                            }}
                            className="text-blue-500 hover:text-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComment(photo._id, comment._id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 