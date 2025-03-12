'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function AdminPage() {
  const router = useRouter();
  const { status } = useSession();
  
  // Only redirect to photos admin page if authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/admin/photos');
    }
  }, [status, router]);
  
  // The actual content will be handled by the layout
  // This is just a placeholder that will be shown briefly before redirect
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Admin Dashboard</h1>
      <p>Welcome to the admin dashboard. Redirecting to photos management...</p>
    </div>
  );
} 