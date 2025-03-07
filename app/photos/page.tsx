import { Suspense } from 'react';
import PhotoGallery from '@/components/PhotoGallery';
import { getPhotos } from '@/lib/photos';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PhotosPage() {
  const photos = await getPhotos();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Loading photos...</div>}>
        <PhotoGallery photos={photos} />
      </Suspense>
      
      {/* Remove any additional pagination components that might be here */}
      {/* For example, if there's something like this:
      
      <div className="flex justify-center mt-8">
        <nav className="inline-flex rounded-md shadow">
          ... pagination buttons ...
        </nav>
      </div>
      
      It should be removed */}
    </div>
  );
} 