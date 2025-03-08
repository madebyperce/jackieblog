'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface Photo {
  _id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
}

interface Comment {
  _id: string;
  content: string;
  authorName: string;
  createdAt: string;
  photoId?: Photo;
}

// Fetch comments from the API
const fetchComments = async (): Promise<Comment[]> => {
  try {
    console.log('Fetching comments from API...');
    const response = await fetch('/api/comments');
    
    if (!response.ok) {
      console.error('API response not OK:', {
        status: response.status,
        statusText: response.statusText
      });
      
      // Try to get error details if available
      try {
        const errorData = await response.json();
        console.error('Error details:', errorData);
      } catch (parseError) {
        console.error('Could not parse error response');
      }
      
      throw new Error(`Failed to fetch comments: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Fetched ${data.length || 0} comments from API`);
    
    // If the API returns comments without populated photoId, fetch the photos separately
    const commentsWithPhotoInfo = await Promise.all(data.map(async (comment: Comment) => {
      // If photoId is just a string (not populated), fetch the photo info
      if (comment.photoId && typeof comment.photoId === 'string') {
        try {
          const photoResponse = await fetch(`/api/photos/${comment.photoId}`);
          if (photoResponse.ok) {
            const photoData = await photoResponse.json();
            return {
              ...comment,
              photoId: photoData
            };
          }
        } catch (error) {
          console.error(`Error fetching photo for comment ${comment._id}:`, error);
        }
      }
      return comment;
    }));
    
    return commentsWithPhotoInfo || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    
    // Fallback: try to get comments from photos
    try {
      console.log('Attempting fallback: fetching photos with comments...');
      const photosResponse = await fetch('/api/photos?includeComments=true');
      if (photosResponse.ok) {
        const photosData = await photosResponse.json();
        
        // Extract comments from photos
        const extractedComments: Comment[] = [];
        photosData.forEach((photo: any) => {
          if (photo.comments && Array.isArray(photo.comments)) {
            photo.comments.forEach((comment: any) => {
              extractedComments.push({
                ...comment,
                photoId: {
                  _id: photo._id,
                  description: photo.description,
                  imageUrl: photo.imageUrl
                }
              });
            });
          }
        });
        
        console.log(`Extracted ${extractedComments.length} comments from photos`);
        return extractedComments;
      }
    } catch (fallbackError) {
      console.error('Fallback approach also failed:', fallbackError);
    }
    
    return [];
  }
};

// Delete comment
const deleteComment = async (commentId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete comment: ${response.status} ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
};

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch comments on component mount
  useEffect(() => {
    const getComments = async () => {
      setLoading(true);
      try {
        const data = await fetchComments();
        setComments(data);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getComments();
  }, []);

  // Filter comments based on search query
  const filteredComments = comments.filter(comment => {
    // Search query filter
    if (searchQuery && !comment.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !comment.authorName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Handle search query change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    const success = await deleteComment(commentId);
    if (success) {
      setComments(comments.filter(comment => comment._id !== commentId));
    } else {
      alert('Failed to delete comment. Please try again.');
    }
  };

  // Start editing a comment
  const handleEditClick = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditContent(comment.content);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  // Save edited comment
  const handleSaveEdit = async (commentId: string) => {
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editContent }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update comment: ${response.status} ${response.statusText}`);
      }

      // Update local state
      setComments(comments.map(comment => 
        comment._id === commentId 
          ? { ...comment, content: editContent }
          : comment
      ));
      
      // Exit edit mode
      setEditingCommentId(null);
    } catch (error) {
      console.error('Error saving comment:', error);
      alert('Failed to update comment. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Get photo title or fallback
  const getPhotoTitle = (comment: Comment) => {
    if (!comment.photoId) return 'Unknown Photo';
    
    if (typeof comment.photoId === 'string') {
      return `Photo ID: ${comment.photoId}`;
    }
    
    if (comment.photoId?.title) return comment.photoId.title;
    if (comment.photoId?.description) return comment.photoId.description;
    return 'Unknown Photo';
  };

  // Get photo ID safely
  const getPhotoId = (comment: Comment): string | undefined => {
    if (!comment.photoId) return undefined;
    
    if (typeof comment.photoId === 'string') {
      return comment.photoId;
    }
    
    return comment.photoId._id;
  };

  // Handle view photo click - opens the main page and scrolls to the specific photo
  const handleViewPhotoClick = (photoId: string) => {
    // Open the main page in a new tab
    const newWindow = window.open('/', '_blank');
    
    // If the window opened successfully, add a script to scroll to the photo
    if (newWindow) {
      // Create a script element to run in the new window
      newWindow.addEventListener('load', function() {
        // Create a script element
        const script = newWindow.document.createElement('script');
        script.textContent = `
          // Function to find the photo and scroll to it
          function findAndScrollToPhoto() {
            // Try to find the photo element
            const photoElement = document.getElementById('photo-${photoId}');
            if (photoElement) {
              // Scroll to the photo
              photoElement.scrollIntoView({ behavior: 'smooth' });
              // Highlight the photo briefly
              photoElement.style.boxShadow = '0 0 0 4px #3b82f6';
              setTimeout(() => {
                photoElement.style.boxShadow = '';
              }, 2000);
              return true;
            }
            return false;
          }

          // First try to find the photo on the current page
          let foundOnCurrentPage = findAndScrollToPhoto();
          if (foundOnCurrentPage) {
            console.log('Found photo on current page');
          } else {
            // If not found, try to find which page the photo is on
            function findPhotoPage() {
              // Get all photos
              const photos = Array.from(document.querySelectorAll('[id^="photo-"]'));
              const photoIds = photos.map(p => p.id.replace('photo-', ''));
              
              // If the photo isn't in the current view, we need to check pagination
              const pagination = document.querySelector('.pagination-container');
              if (!pagination) {
                console.log('No pagination found');
                return;
              }
              
              // Try each page until we find the photo
              const pageButtons = Array.from(pagination.querySelectorAll('button')).filter(b => !isNaN(parseInt(b.textContent || '')));
              
              // Function to click a page button and check for the photo
              async function tryPage(pageNum) {
                console.log('Trying page', pageNum);
                // Find the button for this page
                const button = pageButtons.find(b => b.textContent?.trim() === pageNum.toString());
                if (!button) return false;
                
                // Click the button
                button.click();
                
                // Wait for the page to update
                return new Promise(resolve => {
                  setTimeout(() => {
                    resolve(findAndScrollToPhoto());
                  }, 500);
                });
              }
              
              // Try each page sequentially
              async function checkAllPages() {
                for (let i = 1; i <= pageButtons.length; i++) {
                  const found = await tryPage(i);
                  if (found) {
                    console.log('Found photo on page', i);
                    return true;
                  }
                }
                console.log('Photo not found on any page');
                return false;
              }
              
              // Start checking pages
              checkAllPages();
            }
            
            // Wait a moment for the page to fully render, then try to find the photo
            setTimeout(findPhotoPage, 1000);
          }
        `;
        
        // Append the script to the new window's document
        newWindow.document.body.appendChild(script);
      });
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Manage Comments</h1>
      
      <div className="space-y-4">
        <div className="flex justify-end items-center mb-4">
          <div>
            <input 
              type="text" 
              placeholder="Search comments..." 
              className="border border-gray-300 rounded-md px-3 py-2"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading comments...</p>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">No comments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comment
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Photo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredComments.map((comment) => (
                  <tr key={comment._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{comment.authorName}</div>
                    </td>
                    <td className="px-6 py-4">
                      {editingCommentId === comment._id ? (
                        <div>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-2"
                            rows={3}
                          />
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 text-sm"
                              disabled={isSaving}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(comment._id)}
                              className="text-blue-600 text-sm"
                              disabled={isSaving}
                            >
                              {isSaving ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900">{comment.content}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {comment.photoId && (
                        <div className="flex items-center mt-2">
                          <div className="w-12 h-12 relative mr-2 flex-shrink-0 overflow-hidden rounded">
                            {typeof comment.photoId !== 'string' && comment.photoId.imageUrl ? (
                              <Image
                                src={comment.photoId.imageUrl}
                                alt={getPhotoTitle(comment)}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                                <span>No img</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-600 truncate">{getPhotoTitle(comment)}</p>
                            <button
                              onClick={() => getPhotoId(comment) && handleViewPhotoClick(getPhotoId(comment)!)}
                              disabled={!getPhotoId(comment)}
                              className="text-xs text-blue-500 hover:underline disabled:text-gray-400 disabled:no-underline"
                            >
                              {getPhotoId(comment) ? 'View Photo' : 'No Photo Link'}
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(comment.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!editingCommentId && (
                        <button 
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() => handleEditClick(comment)}
                        >
                          Edit
                        </button>
                      )}
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteComment(comment._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
} 