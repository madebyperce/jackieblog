import { Metadata } from 'next';
import PhotoGallery from '@/components/PhotoGallery';
import { getAllPhotos } from '@/lib/photos';

export const metadata: Metadata = {
  title: 'Photo Gallery | Jackie\'s Blog',
  description: 'Browse through Jackie\'s photo collection',
};

export default async function PhotosPage() {
  const photos = await getAllPhotos();
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Photo Gallery</h1>
      <PhotoGallery photos={photos} />
    </div>
  );
} 