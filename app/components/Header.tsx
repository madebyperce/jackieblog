'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [imageError, setImageError] = useState(false);
  
  return (
    <header className="w-full pt-10 flex justify-center">
      <div className="relative w-full max-w-[500px] h-[140px] overflow-hidden">
        <Link href="/">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center">
              <h1 className="text-3xl font-bold text-gray-700">Jackie's Adventures</h1>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src="/header.png"
                alt="Jackie's Adventures"
                className="max-h-full max-w-full object-contain"
                onError={() => setImageError(true)}
              />
            </div>
          )}
        </Link>
      </div>
    </header>
  );
} 