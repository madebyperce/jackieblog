'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';

interface Photo {
  _id: string;
  imageUrl: string;
  description: string;
  location: string;
  comments: Comment[];
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

export default function PhotoGrid() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const { register, handleSubmit, reset } = useForm<CommentForm>();

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

      if (response.ok) {
        reset();
        fetchPhotos();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {photos.map((photo) => (
        <div key={photo._id} className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="relative h-64">
            <Image
              src={photo.imageUrl}
              alt={photo.description}
              fill
              className="object-cover"
            />
          </div>
          
          <div className="p-4">
            <p className="text-lg font-semibold mb-2">{photo.description}</p>
            <p className="text-sm text-gray-600 mb-4">📍 {photo.location}</p>
            
            <div className="space-y-4">
              <h3 className="font-medium">Comments</h3>
              {photo.comments.map((comment) => (
                <div key={comment._id} className="bg-gray-50 p-3 rounded">
                  <p className="text-sm">{comment.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    By {comment.authorName} on {new Date(comment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
              
              <form onSubmit={handleSubmit((data) => onSubmitComment(photo._id, data))}>
                <input
                  {...register('authorName', { required: true })}
                  placeholder="Your name"
                  className="w-full mb-2 p-2 border rounded"
                />
                <textarea
                  {...register('content', { required: true })}
                  placeholder="Add a comment..."
                  className="w-full p-2 border rounded"
                  rows={3}
                />
                <button
                  type="submit"
                  className="mt-2 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
                >
                  Post Comment
                </button>
              </form>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 