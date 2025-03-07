import React from 'react';
import PhotoGrid from './PhotoGrid';

interface Photo {
  _id: string;
  imageUrl: string;
  description: string;
  location: string;
  capturedAt: string;
}

interface PhotosPageProps {
  photos: Photo[];
}

const PhotosPage: React.FC<PhotosPageProps> = ({ photos }) => {
  return (
    <div className="photos-page">
      <h1>Photos</h1>
      <PhotoGrid photos={photos} />
    </div>
  );
};

export default PhotosPage; 