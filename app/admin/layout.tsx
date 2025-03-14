'use client';

import { useEffect, useState } from 'react';
import { useSession, SessionProvider, signOut } from 'next-auth/react';
import AdminLogin from '../components/AdminLogin';
import AdminDashboardLayout from '../components/AdminLayout';

// Wrap the admin layout with SessionProvider
function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true when component mounts
  useEffect(() => {
    setIsClient(true);
    
    // Clear any site authentication to prevent conflicts
    if (typeof window !== 'undefined') {
      localStorage.removeItem('siteAccess');
    }
  }, []);

  // Show loading state while checking session
  if (!isClient || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8bac98]"></div>
      </div>
    );
  }

  // If not authenticated, show login form
  if (status !== 'authenticated' || !session) {
    console.log('Not authenticated, showing login form');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-6">
          <h1 className="text-xl font-bold text-center mb-6">Admin Login</h1>
          <AdminLogin />
        </div>
      </div>
    );
  }

  // Verify admin role
  const userRole = (session.user as any)?.role;
  if (userRole !== 'admin') {
    console.log('User is authenticated but not an admin, role:', userRole);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-xl font-bold text-center mb-6">Access Denied</h1>
          <p className="mb-4">You do not have admin privileges.</p>
          <button
            onClick={() => signOut({ callbackUrl: '/admin' })}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  console.log('User authenticated as admin, showing admin interface');

  // If authenticated, use the AdminDashboardLayout component
  return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
}

// Export the wrapped layout
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SessionProvider>
  );
} 