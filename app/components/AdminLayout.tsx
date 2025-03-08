'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  
  // Function to check if a link is active
  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(path);
  };

  if (!session) {
    return null; // Let the parent layout handle authentication
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top navigation bar */}
      <header className="bg-blue-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">Admin</h1>
          <button
            onClick={async () => {
              await signOut({ redirect: true, callbackUrl: '/' });
            }}
            className="bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </header>
      
      {/* Main navigation */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <ul className="flex flex-wrap">
            <li>
              <Link 
                href="/admin" 
                className={`px-4 py-3 inline-block hover:bg-blue-50 border-b-2 ${
                  isActive('/admin')
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent hover:border-blue-500'
                } transition`}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/photos" 
                className={`px-4 py-3 inline-block hover:bg-blue-50 border-b-2 ${
                  isActive('/admin/photos') 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent hover:border-blue-500'
                } transition`}
              >
                Photos
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/comments" 
                className={`px-4 py-3 inline-block hover:bg-blue-50 border-b-2 ${
                  isActive('/admin/comments') 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent hover:border-blue-500'
                } transition`}
              >
                Comments
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/transform-locations" 
                className={`px-4 py-3 inline-block hover:bg-blue-50 border-b-2 ${
                  isActive('/admin/transform-locations') 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent hover:border-blue-500'
                } transition`}
              >
                Fix Locations
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="container mx-auto p-6 max-w-6xl">
        <div className="bg-white rounded-lg shadow-md p-6">
          {children}
        </div>
      </main>
    </div>
  );
} 