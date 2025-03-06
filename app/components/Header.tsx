'use client';

import { useState } from 'react';

export default function Header() {
  const [imageError, setImageError] = useState(false);
  const [pngFailed, setPngFailed] = useState(false);

  console.log('Header component rendering, imageError:', imageError);

  if (imageError) {
    return (
      <header className="mb-8 flex justify-center">
        <h1 className="text-4xl font-medium text-center font-work-sans">Jackie's Adventures</h1>
      </header>
    );
  }

  return (
    <header className="mb-8 flex justify-center">
      <div className="relative w-[600px] h-[120px] border border-dashed border-gray-300">
        <img
          src={pngFailed ? "/header.jpg" : "/header.png"}
          alt="Jackie's Adventures"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onError={(e) => {
            console.error('Image failed to load:', e);
            if (!pngFailed) {
              console.log('PNG failed, trying JPG...');
              setPngFailed(true);
            } else {
              setImageError(true);
            }
          }}
          onLoad={() => {
            console.log('Image loaded successfully');
          }}
        />
      </div>
    </header>
  );
} 