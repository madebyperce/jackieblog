'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Photo {
  _id: string;
  imageUrl: string;
  description: string;
  location: string;
  createdAt: string;
  capturedAt?: string;
}

export default function PhotoManager() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteStatus, setDeleteStatus] = useState<{ [key: string]: string }>({});
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    setDeleteStatus(prev => ({ ...prev, [id]: 'Deleting...' }));
    
    try {
      const response = await fetch(`/api/photos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }

      setDeleteStatus(prev => ({ ...prev, [id]: 'Deleted!' }));
      setPhotos(prev => prev.filter(photo => photo._id !== id));
      router.refresh();
      
      // Clear the status after 2 seconds
      setTimeout(() => {
        setDeleteStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[id];
          return newStatus;
        });
      }, 2000);
    } catch (error) {
      console.error('Error deleting photo:', error);
      setDeleteStatus(prev => ({ ...prev, [id]: 'Error!' }));
    }
  };

  const handleUpdate = async (id: string, data: { description?: string; location?: string }) => {
    try {
      const response = await fetch(`/api/photos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update photo');
      }

      const updatedPhoto = await response.json();
      setPhotos(prev => prev.map(photo => 
        photo._id === id ? { ...photo, ...updatedPhoto } : photo
      ));
      setEditingPhoto(null);
      router.refresh();
    } catch (error) {
      console.error('Error updating photo:', error);
      alert('Failed to update photo');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading photos...</div>;
  }

  if (photos.length === 0) {
    return <div className="text-center py-8">No photos uploaded yet.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Manage Photos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((photo) => (
          <div key={photo._id} className="border rounded-lg overflow-hidden bg-white shadow">
            <img
              src={photo.imageUrl}
              alt={photo.description}
              className="w-full h-48 object-cover"
            />
            <div className="p-4 space-y-3">
              {editingPhoto === photo._id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleUpdate(photo._id, {
                      description: formData.get('description') as string,
                      location: formData.get('location') as string,
                    });
                  }}
                  className="space-y-3"
                >
                  <input
                    type="text"
                    name="description"
                    defaultValue={photo.description}
                    className="w-full p-2 border rounded"
                    placeholder="Description"
                  />
                  <input
                    type="text"
                    name="location"
                    defaultValue={photo.location}
                    className="w-full p-2 border rounded"
                    placeholder="Location"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPhoto(null)}
                      className="flex-1 bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="font-medium">{photo.description}</p>
                  <p className="text-sm text-gray-600">{photo.location}</p>
                  <p className="text-sm text-gray-600">
                    Created: {new Date(photo.createdAt).toLocaleString()}
                  </p>
                  {photo.capturedAt && (
                    <p className="text-sm text-gray-600">
                      Captured: {new Date(photo.capturedAt).toLocaleString()}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPhoto(photo._id)}
                      className="flex-1 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(photo._id)}
                      className={`flex-1 px-3 py-1 rounded text-white ${
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
        ))}
      </div>
    </div>
  );
} 