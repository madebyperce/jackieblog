/**
 * Photo interface representing the structure of a photo object
 */
export interface Photo {
  _id: string;
  imageUrl: string;
  description: string;
  location: string;
  createdAt: string;
  capturedAt: string;
  metadata?: {
    latitude?: number;
    longitude?: number;
    location?: string;
    coordinates?: string;
  };
  comments?: Array<{
    _id: string;
    content: string;
    authorName: string;
    createdAt: string;
  }>;
}

/**
 * Comment interface representing the structure of a comment object
 */
export interface Comment {
  _id: string;
  content: string;
  authorName: string;
  createdAt: string;
  photoId: string | Photo;
}

/**
 * Comment form data structure
 */
export interface CommentForm {
  content: string;
  authorName: string;
} 