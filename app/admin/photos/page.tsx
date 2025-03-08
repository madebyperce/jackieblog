'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Pagination from '../../components/Pagination';

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

// Fetch photos from the same API endpoint that PhotoGallery uses
const fetchPhotos = async (): Promise<Photo[]> => {
  try {
    console.log('Fetching photos from API...');
    const response = await fetch('/api/photos');
    
    if (!response.ok) {
      console.error('API response not OK:', {
        status: response.status,
        statusText: response.statusText
      });
      
      // Try to get error details if available
      try {
        const errorData = await response.json();
        console.error('Error details:', errorData);
      } catch (parseError) {
        console.error('Could not parse error response');
      }
      
      throw new Error(`Failed to fetch photos: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Fetched ${data.photos?.length || 0} photos from API`);
    return data.photos || [];
  } catch (error) {
    console.error('Error fetching photos:', error);
    return [];
  }
};

// Update photo function
const updatePhoto = async (photoId: string, updates: { description?: string; location?: string }): Promise<boolean> => {
  try {
    const response = await fetch(`/api/photos/${photoId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update photo: ${response.status} ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error updating photo:', error);
    return false;
  }
};

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  
  // State for editing
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Increased items per page since we're showing smaller photos
  const itemsPerPage = 24;
  
  // Fetch photos on component mount
  useEffect(() => {
    const getPhotos = async () => {
      setLoading(true);
      try {
        const data = await fetchPhotos();
        setPhotos(data);
      } catch (error) {
        console.error('Error fetching photos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getPhotos();
  }, []);
  
  // Filter photos based on search query
  const filteredPhotos = photos.filter(photo => 
    photo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    photo.location.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort photos based on sort order
  const sortedPhotos = [...filteredPhotos].sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime();
    } else if (sortOrder === 'oldest') {
      return new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime();
    }
    // For 'popular' we would typically use a view count or likes
    return 0;
  });
  
  // Get current photos for pagination
  const indexOfLastPhoto = currentPage * itemsPerPage;
  const indexOfFirstPhoto = indexOfLastPhoto - itemsPerPage;
  const currentPhotos = Array.isArray(sortedPhotos) 
    ? sortedPhotos.slice(indexOfFirstPhoto, indexOfLastPhoto)
    : [];
  
  const totalPages = Math.ceil(Array.isArray(sortedPhotos) ? sortedPhotos.length / itemsPerPage : 0);
  
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Cancel any ongoing editing when changing pages
    setEditingPhotoId(null);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
    // Cancel any ongoing editing when searching
    setEditingPhotoId(null);
  };
  
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value);
    // Cancel any ongoing editing when sorting
    setEditingPhotoId(null);
  };
  
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete photo: ${response.status} ${response.statusText}`);
      }
      
      // Update local state
      setPhotos(photos.filter(photo => photo._id !== photoId));
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo. Please try again.');
    }
  };
  
  // Start editing a photo
  const handleEditClick = (photo: Photo) => {
    setEditingPhotoId(photo._id);
    setEditDescription(photo.description);
    setEditLocation(photo.location);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingPhotoId(null);
    setEditDescription('');
    setEditLocation('');
  };
  
  // Save edited photo
  const handleSaveEdit = async (photoId: string) => {
    setIsSaving(true);
    
    try {
      const success = await updatePhoto(photoId, {
        description: editDescription,
        location: editLocation
      });
      
      if (success) {
        // Update local state
        setPhotos(photos.map(photo => 
          photo._id === photoId 
            ? { ...photo, description: editDescription, location: editLocation }
            : photo
        ));
        
        // Exit edit mode
        setEditingPhotoId(null);
      } else {
        alert('Failed to update photo. Please try again.');
      }
    } catch (error) {
      console.error('Error saving photo:', error);
      alert('Failed to update photo. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // View full photo in a modal
  const handleViewFullPhoto = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

  return (
    <>
      <h1 className="text-lg font-medium mb-4">Manage Photos</h1>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <button className="bg-blue-600 text-white px-3 py-1.5 text-xs rounded-md hover:bg-blue-700">
              Upload New Photo
            </button>
          </div>
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Search photos..." 
              className="border border-gray-300 rounded-md px-2 py-1 text-xs"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <select 
              className="border border-gray-300 rounded-md px-2 py-1 text-xs"
              value={sortOrder}
              onChange={handleSortChange}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500 text-sm">Loading photos...</p>
          </div>
        ) : currentPhotos.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-2">
            <p className="text-gray-500 text-sm">No photos found</p>
            <p className="text-xs text-gray-400">Upload photos to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {currentPhotos.map((photo) => (
              <div key={photo._id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                {/* Photo container with fixed width but auto height to maintain aspect ratio */}
                <div className="w-full" style={{ maxWidth: '150px', margin: '0 auto' }}>
                  <div className="relative" style={{ width: '100%', paddingBottom: '100%' }}>
                    <Image
                      src={photo.imageUrl}
                      alt={photo.description}
                      fill
                      className="object-contain"
                      sizes="150px"
                    />
                  </div>
                </div>
                <div className="p-3">
                  {editingPhotoId === photo._id ? (
                    // Edit mode
                    <div className="space-y-1">
                      <div>
                        <label htmlFor={`description-${photo._id}`} className="block text-xs font-medium text-gray-700">
                          Description
                        </label>
                        <input
                          id={`description-${photo._id}`}
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="mt-0.5 block w-full border border-gray-300 rounded-md shadow-sm p-1 text-xs"
                          placeholder="Photo description"
                        />
                      </div>
                      <div>
                        <label htmlFor={`location-${photo._id}`} className="block text-xs font-medium text-gray-700">
                          Location
                        </label>
                        <input
                          id={`location-${photo._id}`}
                          type="text"
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          className="mt-0.5 block w-full border border-gray-300 rounded-md shadow-sm p-1 text-xs"
                          placeholder="Photo location"
                        />
                      </div>
                      <div className="flex justify-end space-x-1 mt-1">
                        <button
                          onClick={handleCancelEdit}
                          className="px-1.5 py-0.5 border border-gray-300 rounded text-xs"
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(photo._id)}
                          className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-xs"
                          disabled={isSaving}
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <h3 className="font-medium text-xs truncate" title={photo.description}>{photo.description}</h3>
                      <p className="text-xs text-gray-500 truncate" title={photo.location}>{photo.location}</p>
                      <div className="mt-1 flex space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-800 text-xs"
                          onClick={() => handleEditClick(photo)}
                        >
                          Edit
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-800 text-xs"
                          onClick={() => handleDeletePhoto(photo._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
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