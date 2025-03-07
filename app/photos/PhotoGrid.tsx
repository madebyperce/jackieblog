import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Photo {
  _id: string;
  imageUrl: string;
  description: string;
  location: string;
  capturedAt: string;
}

interface PhotoGridProps {
  photos: Photo[];
  itemsPerPage?: number;
}

// Simple Pagination component
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void 
}) => {
  return (
    <div className="pagination">
      <button 
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 1}
        className="pagination-button"
      >
        Previous
      </button>
      <span className="pagination-info">
        Page {currentPage} of {totalPages}
      </span>
      <button 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}
        className="pagination-button"
      >
        Next
      </button>
    </div>
  );
};

const PhotoGrid: React.FC<PhotoGridProps> = ({ 
  photos, 
  itemsPerPage = 12 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(photos.length / itemsPerPage);
  
  // Reset to page 1 when photos change
  useEffect(() => {
    setCurrentPage(1);
  }, [photos]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const visiblePhotos = photos.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="photo-grid-container">
      <div className="photo-grid grid-view">
        {visiblePhotos.map((photo) => (
          <div key={photo._id} className="photo-item">
            <Link href={`/photos/${photo._id}`}>
              <div className="photo-wrapper">
                <Image 
                  src={photo.imageUrl} 
                  alt={photo.description || 'Photo'} 
                  width={300} 
                  height={300}
                  className="photo-image"
                  priority={false}
                />
                <div className="photo-info">
                  {photo.location && <p className="photo-location">{photo.location}</p>}
                  {photo.description && <p className="photo-description">{photo.description}</p>}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="pagination-container">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default PhotoGrid; 