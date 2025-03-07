'use client';

import { useSession } from 'next-auth/react';
import AdminLogin from '@/app/components/AdminLogin';
import PhotoUpload from '@/app/components/PhotoUpload';
import PhotoManager from '@/app/components/PhotoManager';

export default function AdminPage() {
  const { data: session, status } = useSession();

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
          <AdminLogin />
        </div>
      </div>
    );
  }

  // Show admin dashboard if authenticated
  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <a
          href="/"
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition"
        >
          ← Back to Site
        </a>
      </div>
      <div className="mb-8">
        <AdminLogin />
      </div>
      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-bold mb-4">Upload New Photo</h2>
          <PhotoUpload />
        </section>
        <section>
          <PhotoManager />
        </section>
      </div>
    </div>
  );
} 