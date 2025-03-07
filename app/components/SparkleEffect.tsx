'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function SparkleEffect() {
  useEffect(() => {
    // Add global click handler
    const handleClick = (e: MouseEvent) => {
      // Only skip comment submission buttons
      if (e.target instanceof Element) {
        const targetElement = e.target as Element;
        
        // Check if it's a submit button inside a form
        const isSubmitButton = 
          (targetElement.tagName === 'BUTTON' && 
           targetElement.getAttribute('type') === 'submit') ||
          (targetElement.closest('button') && 
           targetElement.closest('button')?.getAttribute('type') === 'submit');
        
        // Skip only if it's a submit button or inside a textarea (while typing)
        if (isSubmitButton || targetElement.tagName === 'TEXTAREA') {
          return;
        }
      }
      
      // Calculate the origin based on click position
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      // Use a more subtle effect for regular clicks - just 3 stars
      confetti({
        particleCount: 3,
        spread: 70,
        origin: { x, y },
        colors: ['#FFD700', '#FF69B4', '#87CEEB'],
        gravity: 2,
        scalar: 0.7,
        shapes: ['star'],
        ticks: 80
      });
    };
    
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);
  
  // No visible DOM elements needed
  return null;
} 