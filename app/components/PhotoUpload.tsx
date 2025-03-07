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
  details?: string;
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
      // Validate file type and size
      const file = data.image[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
      if (!validTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Supported types are: ${validTypes.join(', ')}`);
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 10MB');
      }

      const formData = new FormData();
      formData.append('image', file);
      formData.append('description', data.description);
      formData.append('location', data.location);

      console.log('Uploading file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      });

      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });

      let responseData;
      try {
        const textResponse = await response.text();
        try {
          responseData = JSON.parse(textResponse);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', textResponse);
          throw new Error('Server returned an invalid response format');
        }
      } catch (parseError: any) {
        console.error('Error handling response:', parseError);
        throw new Error(`Server error: ${parseError.message}`);
      }

      if (response.ok) {
        console.log('Upload successful:', responseData);
        reset();
        setUploadStatus({
          type: 'success',
          message: 'Photo uploaded successfully!'
        });
        router.refresh();
      } else {
        console.error('Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          error: responseData.error,
          details: responseData.details,
          name: responseData.name,
          http_code: responseData.http_code
        });
        
        let errorMessage = 'Failed to upload photo';
        let errorDetails = '';
        
        if (responseData.error) {
          errorMessage = responseData.error;
          if (responseData.details) {
            errorDetails = responseData.details;
          }
          if (responseData.name === 'Error' && responseData.http_code) {
            errorDetails += ` (Status: ${responseData.http_code})`;
          }
        }
        
        setUploadStatus({
          type: 'error',
          message: errorMessage,
          details: errorDetails
        });
      }
    } catch (error: any) {
      console.error('Upload error:', {
        message: error.message,
        stack: error.stack
      });
      setUploadStatus({
        type: 'error',
        message: 'An error occurred while uploading the photo',
        details: error.message
      });
    } finally {
      setIsUploading(false);
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
          <p className="font-medium">{uploadStatus.message}</p>
          {uploadStatus.details && (
            <p className="text-sm mt-1 opacity-80">{uploadStatus.details}</p>
          )}
        </div>
      )}
    </div>
  );
} 