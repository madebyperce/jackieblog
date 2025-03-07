'use client';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  return (
    <div className="flex justify-center mt-8 space-x-2">
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded ${
            currentPage === page 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {page}
        </button>
      ))}
    </div>
  );
} 