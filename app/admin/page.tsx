'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import AdminLogin from '@/app/components/AdminLogin';
import PhotoUpload from '@/app/components/PhotoUpload';

interface Photo {
  _id: string;
  imageUrl: string;
  description: string;
  location: string;
  createdAt: string;
  capturedAt?: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteStatus, setDeleteStatus] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/');
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPhotos();
    }
  }, [status]);

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
      // Remove the photo from the state
      setPhotos(prev => prev.filter(photo => photo._id !== id));
      
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

  if (status === 'loading' || loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <a
          href="/"
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition flex items-center gap-2"
        >
          ← Back to Site
        </a>
      </div>
      <div className="mb-8">
        <AdminLogin />
      </div>
      <PhotoUpload />
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Photos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo._id} className="border rounded-lg p-4 space-y-2">
              <img
                src={photo.imageUrl}
                alt={photo.description}
                className="w-full h-48 object-cover rounded"
              />
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
              <button
                onClick={() => handleDelete(photo._id)}
                className={`mt-2 px-4 py-2 rounded ${
                  deleteStatus[photo._id]
                    ? deleteStatus[photo._id] === 'Deleted!'
                      ? 'bg-green-500'
                      : deleteStatus[photo._id] === 'Error!'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                    : 'bg-red-500'
                } text-white hover:opacity-90 transition-opacity w-full`}
                disabled={deleteStatus[photo._id] === 'Deleting...'}
              >
                {deleteStatus[photo._id] || 'Delete'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 