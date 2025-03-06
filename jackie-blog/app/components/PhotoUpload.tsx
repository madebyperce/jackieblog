'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';

interface UploadForm {
  description: string;
  location: string;
  image: FileList;
}

export default function PhotoUpload() {
  const { data: session } = useSession();
  const { register, handleSubmit, reset } = useForm<UploadForm>();
  const [isUploading, setIsUploading] = useState(false);

  if (!session) {
    return null;
  }

  const onSubmit = async (data: UploadForm) => {
    if (!data.image[0]) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', data.image[0]);
      formData.append('description', data.description);
      formData.append('location', data.location);

      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        reset();
        // You might want to trigger a photo refresh here
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
          {...register('image', { required: true })}
          className="mt-1 block w-full"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <input
          type="text"
          {...register('description', { required: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter photo description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Location</label>
        <input
          type="text"
          {...register('location', { required: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter photo location"
        />
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