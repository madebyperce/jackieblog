import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import { headers } from 'next/headers';
import './globals.css';
import { NextAuthProvider } from '@/app/providers';
import SitePassword from './components/SitePassword';
import SparkleEffect from './components/SparkleEffect';
import Header from './components/Header';
import dynamic from 'next/dynamic';

// Dynamically import the ScrollToTop component with no SSR
const ScrollToTop = dynamic(() => import('./components/ScrollToTop'), { ssr: false });

// Initialize the font outside the component
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Jackie's Adventures",
  description: "perce made a website for her dog",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the current path to determine if we're in the admin section
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '';
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <NextAuthProvider>
          {isAdminRoute ? (
            // Admin routes don't need the site password, header, or sparkle effect
            <>{children}</>
          ) : (
            // Non-admin routes get the full layout
            <SitePassword>
              <div className="min-h-screen bg-gray-50">
                <Header />
                <main>{children}</main>
                <ScrollToTop />
              </div>
            </SitePassword>
          )}
          {!isAdminRoute && <SparkleEffect />}
        </NextAuthProvider>
      </body>
    </html>
  );
}
