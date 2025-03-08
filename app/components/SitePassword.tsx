'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { transformCoordinates } from '../lib/transformCoordinates';
import { usePathname } from 'next/navigation';

// Utility function to correct coordinates for a collection of photos
export const correctPhotoCollection = (photos: any[]): any[] => {
  if (!photos || !Array.isArray(photos)) return photos;
  
  return photos.map(photo => {
    if (photo?.metadata) {
      // Apply transformation to metadata
      const correctedMetadata = transformCoordinates(photo.metadata);
      
      return {
        ...photo,
        metadata: correctedMetadata
      };
    }
    return photo;
  });
};

export default function SitePassword({ children }: { children: React.ReactNode }) {
  // Performance measurement
  const renderStartTime = useRef(Date.now());
  useEffect(() => {
    const renderTime = Date.now() - renderStartTime.current;
    console.log(`⏱️ SitePassword initial render took ${renderTime}ms`);
    
    // Cleanup excessive logging
    return () => {
      console.log = console.log.bind(console);
    };
  }, []);
  
  // Get the current path to check if we're in the admin area
  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith('/admin');
  
  // If we're in the admin area, don't apply site password protection
  if (isAdminPath) {
    return <>{children}</>;
  }
  
  // Track if we've initialized the component
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Function to trigger confetti effect
  const triggerConfetti = () => {
    if (!buttonRef.current) return;
    
    const confettiStartTime = Date.now();
    console.log('🎉 Starting confetti animation');
    
    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const buttonCenterX = rect.left + rect.width / 2;
    const buttonCenterY = rect.top + rect.height / 2;

    // Reduce particle count for better performance
    confetti({
      particleCount: 30, // Reduced from 50
      spread: 90,
      origin: {
        x: buttonCenterX / window.innerWidth,
        y: buttonCenterY / window.innerHeight
      },
      colors: ['#FFD700', '#FFA500', '#FF69B4', '#87CEEB', '#9B59B6'],
      gravity: 3,
      scalar: 0.8,
      shapes: ['star'],
      ticks: 80 // Reduced from 100
    });
    
    const confettiEndTime = Date.now();
    console.log(`🎉 Confetti setup took ${confettiEndTime - confettiStartTime}ms`);
  };

  // Initialize component and check localStorage only once on mount
  useEffect(() => {
    const initStartTime = Date.now();
    
    // Only check site access if we're not in the admin area
    if (!isAdminPath) {
      // Now check if user should be authenticated
      const hasAccess = localStorage.getItem('siteAccess') === 'true';
      
      // Set authentication state
      setIsAuthenticated(hasAccess);
    }
    
    // Mark as initialized
    setIsInitialized(true);
    
    const initEndTime = Date.now();
    console.log(`⏱️ SitePassword initialization took ${initEndTime - initStartTime}ms`);
  }, [isAdminPath]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const submitStartTime = Date.now();
    
    if (password === 'jackie') {
      triggerConfetti();
      
      setTimeout(() => {
        localStorage.setItem('siteAccess', 'true');
        setIsAuthenticated(true);
        
        const submitEndTime = Date.now();
        console.log(`⏱️ Password submission and authentication took ${submitEndTime - submitStartTime}ms`);
      }, 1000);
    } else {
      setError('Incorrect password');
      localStorage.removeItem('siteAccess');
      
      const submitEndTime = Date.now();
      console.log(`⏱️ Password submission (failed) took ${submitEndTime - submitStartTime}ms`);
    }
  };

  // Show loading state until initialized
  if (!isInitialized) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // If authenticated, show children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Otherwise show password form
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-75 backdrop-blur-sm">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-center mb-6">
          <Image 
            src="/header.png" 
            alt="Jackie's Adventures" 
            width={200}
            height={80}
            priority={true}
            style={{ height: 'auto', width: 'auto' }}
            className="object-contain"
          />
        </div>
        
        <p className="text-gray-600 mb-6 text-center">Please enter the password to view the site</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              autoFocus
              required
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>
          
          <div className="flex justify-center">
            <button
              ref={buttonRef}
              type="submit"
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Enter Site
            </button>
          </div>
        </form>
        
      </div>
    </div>
  );
} 