import { Suspense } from 'react';
import PhotoGrid from './components/PhotoGrid';
import AdminLogin from './components/AdminLogin';
import PhotoUpload from './components/PhotoUpload';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Jackie's Photo Blog</h1>
        
        <div className="mb-8">
          <AdminLogin />
        </div>

        <div className="mb-8">
          <PhotoUpload />
        </div>

        <Suspense fallback={<div>Loading photos...</div>}>
          <PhotoGrid />
        </Suspense>
      </div>
    </main>
  );
}
