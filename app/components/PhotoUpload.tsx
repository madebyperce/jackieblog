'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UploadForm {
  description: string;
  location: string;
  image: FileList;
}

export default function PhotoUpload() {
  const { data: session, status } = useSession();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UploadForm>();
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  // Don't render anything while checking session
  if (status === 'loading') {
    return null;
  }

  // Only show the form if user is authenticated
  if (!session?.user) {
    return null;
  }

  const onSubmit = async (data: UploadForm) => {
    if (!data.image[0]) return;

    setIsUploading(true);
    try {
      console.log('Starting photo upload with data:', {
        fileName: data.image[0].name,
        fileType: data.image[0].type,
        fileSize: data.image[0].size,
        location: data.location,
        description: data.description
      });

      const formData = new FormData();
      formData.append('image', data.image[0]);
      formData.append('description', data.description);
      formData.append('location', data.location);

      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();
      console.log('Photo upload response:', {
        status: response.status,
        ok: response.ok,
        data: responseData,
        location: responseData.location,
        metadata: responseData.metadata
      });

      if (response.ok) {
        reset();
        // Refresh the page to show the new photo
        router.refresh();
      } else {
        console.error('Error response from server:', responseData);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-8">
      <div>
        <label className="block text-sm font-medium text-gray-700">Photo</label>
        <input
          type="file"
          accept="image/*"
          {...register('image', { required: 'Photo is required' })}
          className="mt-1 block w-full"
        />
        {errors.image && (
          <p className="text-red-500 text-sm mt-1">{errors.image.message}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <input
          type="text"
          {...register('description', { required: 'Description is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter photo description"
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Location</label>
        <input
          type="text"
          {...register('location', { required: 'Location is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter photo location"
        />
        {errors.location && (
          <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isUploading}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition disabled:opacity-50"
      >
        {isUploading ? 'Uploading...' : 'Upload Photo'}
      </button>
    </form>
  );
} 