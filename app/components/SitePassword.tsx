'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { transformCoordinates } from '../lib/transformCoordinates';
import { usePathname } from 'next/navigation';

// Remove the test helper function and keep only the essential code
export default function SitePassword({ children }: { children: React.ReactNode }) {
  // Performance measurement
  const renderStartTime = useRef(Date.now());
  const childRenderStart = useRef<number | null>(null);
  
  useEffect(() => {
    const renderTime = Date.now() - renderStartTime.current;
    console.log(`⏱️ SitePassword initial render took ${renderTime}ms`);
    
    // Measure children render time if we're authenticated
    if (childRenderStart.current !== null) {
      requestAnimationFrame(() => {
        const childRenderEnd = performance.now();
        console.log(`⏱️ Children render took ${childRenderEnd - childRenderStart.current!}ms`);
      });
    }
    
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
      colors: ['#8bac98', '#e96440', '#deb365', '#2c3e50', '#b0807a'],
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
      // Measure localStorage read performance
      const localStorageReadStart = performance.now();
      const hasAccess = localStorage.getItem('siteAccess') === 'true';
      const localStorageReadEnd = performance.now();
      console.log(`⏱️ localStorage read took ${localStorageReadEnd - localStorageReadStart}ms`);
      
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
      
      console.log(`⏱️ Starting intentional delay of 1000ms at ${Date.now() - submitStartTime}ms`);
      
      setTimeout(() => {
        const beforeStateChange = Date.now();
        console.log(`⏱️ About to change authentication state at ${beforeStateChange - submitStartTime}ms`);
        
        // Measure localStorage write performance
        const localStorageWriteStart = performance.now();
        localStorage.setItem('siteAccess', 'true');
        const localStorageWriteEnd = performance.now();
        console.log(`⏱️ localStorage write took ${localStorageWriteEnd - localStorageWriteStart}ms`);
        
        // Measure state update performance
        const stateUpdateStart = performance.now();
        childRenderStart.current = performance.now(); // Set the child render start time
        setIsAuthenticated(true);
        
        // Use requestAnimationFrame to measure when the UI actually updates
        requestAnimationFrame(() => {
          const stateUpdateEnd = performance.now();
          console.log(`⏱️ State update and render took ${stateUpdateEnd - stateUpdateStart}ms`);
        });
        
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
    // If we're rendering children for the first time, set the start time
    if (childRenderStart.current === null) {
      childRenderStart.current = performance.now();
    }
    
    return <>{children}</>;
  }

  // Otherwise show password form - with performance optimized background
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Separate background layer without blur for better performance */}
      <div className="fixed inset-0 bg-gray-800 bg-opacity-75"></div>
      
      <div className="relative z-10 max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
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
              className="px-3 py-1 text-xs bg-[#8bac98] text-white rounded hover:bg-[#7a9a87]"
            >
              Enter Site
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 