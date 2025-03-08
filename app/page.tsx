import PhotoDisplay from './components/PhotoDisplay';

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <PhotoDisplay 
        fetchPhotos={true} 
        showComments={true} 
        initialViewMode="grid"
      />
    </main>
  );
} 