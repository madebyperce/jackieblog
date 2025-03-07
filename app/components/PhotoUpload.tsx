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

interface UploadStatus {
  type: 'success' | 'error' | null;
  message: string;
}

export default function PhotoUpload() {
  const { data: session } = useSession();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UploadForm>();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ type: null, message: '' });
  const router = useRouter();

  // Don't render anything if user is not authenticated
  if (!session?.user) {
    return null;
  }

  const onSubmit = async (data: UploadForm) => {
    if (!data.image[0]) return;

    setIsUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      const formData = new FormData();
      formData.append('image', data.image[0]);
      formData.append('description', data.description);
      formData.append('location', data.location);

      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();

      if (response.ok) {
        reset();
        setUploadStatus({
          type: 'success',
          message: 'Photo uploaded successfully!'
        });
        router.refresh();
      } else {
        setUploadStatus({
          type: 'error',
          message: responseData.error || 'Failed to upload photo'
        });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setUploadStatus({
        type: 'error',
        message: 'An error occurred while uploading the photo'
      });
    } finally {
      setIsUploading(false);
      // Clear success message after 3 seconds
      if (uploadStatus.type === 'success') {
        setTimeout(() => {
          setUploadStatus({ type: null, message: '' });
        }, 3000);
      }
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
          <input
            type="file"
            accept="image/*"
            {...register('image', { required: 'Photo is required' })}
            className="w-full p-2 border rounded text-sm"
          />
          {errors.image && (
            <p className="text-red-500 text-sm mt-1">{errors.image.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            {...register('description', { required: 'Description is required' })}
            className="w-full p-2 border rounded"
            placeholder="Enter photo description"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            {...register('location', { required: 'Location is required' })}
            className="w-full p-2 border rounded"
            placeholder="Enter photo location"
          />
          {errors.location && (
            <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Upload Photo'}
        </button>
      </form>

      {uploadStatus.type && (
        <div
          className={`p-4 rounded ${
            uploadStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {uploadStatus.message}
        </div>
      )}
    </div>
  );
} 