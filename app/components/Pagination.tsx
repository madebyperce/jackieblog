import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange
}: PaginationProps) {
  // Create an array of page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex justify-center">
      <nav className="inline-flex rounded-md shadow">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-2 text-sm font-medium rounded-l-md ${
            currentPage === 1
              ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
              : 'text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          Previous
        </button>

        {/* Page numbers */}
        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-4 py-2 text-sm font-medium ${
              currentPage === page
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 text-sm font-medium rounded-r-md ${
            currentPage === totalPages
              ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
              : 'text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          Next
        </button>
      </nav>
    </div>
  );
} 