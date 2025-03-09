'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import confetti from 'canvas-confetti';

interface Comment {
  _id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

interface Photo {
  _id: string;
  comments?: Comment[];
}

interface CommentForm {
  content: string;
  authorName: string;
}

interface CommentSectionProps {
  photo: Photo;
  onSubmitComment?: (data: CommentForm) => Promise<void>;
}

export default function CommentSection({ photo, onSubmitComment }: CommentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CommentForm>();
  
  // Ensure comments is always an array
  const comments = photo.comments || [];
  const commentCount = comments.length;

  const triggerSparkle = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('triggerSparkle called', e.currentTarget);
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const buttonCenterX = rect.left + rect.width / 2;
    const buttonCenterY = rect.top + rect.height / 2;

    console.log('Button position:', {
      rect,
      buttonCenterX,
      buttonCenterY,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      originX: buttonCenterX / window.innerWidth,
      originY: buttonCenterY / window.innerHeight
    });

    try {
      confetti({
        particleCount: 50,
        spread: 90,
        origin: {
          x: buttonCenterX / window.innerWidth,
          y: buttonCenterY / window.innerHeight
        },
        colors: ['#8bac98', '#e96440', '#deb365', '#2c3e50', '#b0807a'],
        gravity: 3,
        scalar: 0.8,
        shapes: ['star'],
        ticks: 100
      });
      console.log('Confetti triggered successfully');
    } catch (error) {
      console.error('Error triggering confetti:', error);
    }
  };

  const onSubmit = async (data: CommentForm) => {
    console.log('Comment submission started', data);
    setIsSubmitting(true);
    
    try {
      let shouldReloadPage = true;
      
      // If a custom submit handler is provided, use it
      if (onSubmitComment) {
        console.log('Using custom submit handler');
        await onSubmitComment(data);
        reset();
        // Don't return early, continue to trigger confetti
        shouldReloadPage = false; // Assume custom handler manages page state
      } else {
        console.log('Using default submit handler');
        // Otherwise use the default implementation
        const response = await fetch(`/api/photos/${photo._id}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        console.log('API response:', {
          status: response.status,
          ok: response.ok
        });

        if (!response.ok) {
          throw new Error('Failed to post comment');
        }

        // Reset form
        reset();
      }
      
      // Trigger sparkle effect regardless of which handler was used
      console.log('Looking for submit button to trigger sparkle');
      const submitButton = document.querySelector('button[type="submit"]');
      console.log('Submit button found:', submitButton);
      
      if (submitButton) {
        console.log('Attempting to trigger sparkle effect');
        // Add a small delay to ensure DOM has updated
        setTimeout(() => {
          try {
            triggerSparkle({ currentTarget: submitButton } as React.MouseEvent<HTMLButtonElement>);
          } catch (error) {
            console.error('Error in triggerSparkle:', error);
            
            // Fallback: try direct confetti call
            console.log('Trying direct confetti call as fallback');
            try {
              confetti({
                particleCount: 50,
                spread: 90,
                origin: { x: 0.5, y: 0.5 }, // Center of screen
                colors: ['#8bac98', '#e96440', '#deb365', '#2c3e50', '#b0807a'],
                gravity: 3,
                scalar: 0.8,
                shapes: ['star'],
                ticks: 100
              });
              console.log('Direct confetti call successful');
            } catch (confettiError) {
              console.error('Error in direct confetti call:', confettiError);
            }
          }
        }, 100);
        
        // Only reload the page if using the default handler
        if (shouldReloadPage) {
          // Add a delay before reloading the page to allow confetti to render
          console.log('Delaying page reload to allow confetti to render');
          setTimeout(() => {
            console.log('Reloading page');
            window.location.reload();
          }, 1000); // 1 second delay
        }
      } else {
        console.log('Submit button not found');
        // Only reload if using default handler and button not found
        if (shouldReloadPage) {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return formatInTimeZone(date, userTimeZone, 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {commentCount === 0 
            ? 'Add comment' 
            : commentCount === 1 
              ? '1 comment' 
              : `${commentCount} comments`}
        </button>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          {isExpanded ? 'Hide' : 'Show'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-4">
          {comments.length > 0 ? (
            <div className="space-y-3">
              {/* Sort comments from oldest to newest based on createdAt date */}
              {[...comments]
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((comment) => (
                <div key={comment._id} className="bg-gray-50 p-2 rounded text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{comment.authorName}</span>
                    <span className="text-gray-400 text-[10px]">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-gray-700">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-2">
            <div>
              <input
                {...register('authorName', { required: true })}
                placeholder="Your name"
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              />
              {errors.authorName && (
                <span className="text-red-500 text-[10px]">Name is required</span>
              )}
            </div>
            <div>
              <textarea
                {...register('content', { required: true })}
                placeholder="Add a comment..."
                rows={2}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              />
              {errors.content && (
                <span className="text-red-500 text-[10px]">Comment is required</span>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1 text-xs bg-[#8bac98] text-white rounded hover:bg-[#7a9a87] disabled:bg-[#c5d6cc]"
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
} 