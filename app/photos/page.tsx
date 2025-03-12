import PhotoDisplay from '../components/PhotoDisplay';

export default async function PhotosPage() {
  // Fetch photos server-side
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/photos`, {
    cache: 'no-store'
  });
  const photos = await response.json();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Photo Gallery</h1>
      <PhotoDisplay 
        photos={photos} 
        showComments={false}
        initialViewMode="grid"
        itemsPerPage={12}
      />
    </div>
  );
} 