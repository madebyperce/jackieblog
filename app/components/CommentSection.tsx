import { useState, useCallback } from 'react';
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
  comments: Comment[];
}

interface CommentForm {
  content: string;
  authorName: string;
}

interface Props {
  photo: Photo;
}

export default function CommentSection({ photo }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState(photo.comments);
  const { register, handleSubmit, reset } = useForm<CommentForm>();
  const [submitting, setSubmitting] = useState(false);

  const triggerSparkle = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const buttonCenterX = rect.left + rect.width / 2;
    const buttonCenterY = rect.top + rect.height / 2;

    confetti({
      particleCount: 50,
      spread: 90,
      origin: {
        x: buttonCenterX / window.innerWidth,
        y: buttonCenterY / window.innerHeight
      },
      colors: ['#FFD700', '#FFA500', '#FF69B4', '#87CEEB', '#9B59B6'],
      gravity: 3,
      scalar: 0.8,
      shapes: ['star'],
      ticks: 100
    });
  }, []);

  const onSubmit = async (data: CommentForm, e: any) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/photos/${photo._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      const newComment = await response.json();
      setComments(prevComments => [...prevComments, newComment]);
      reset();
      
      // Trigger sparkle effect on the submit button
      if (e?.target) {
        const submitButton = e.target.querySelector('button[type="submit"]');
        if (submitButton) {
          triggerSparkle({ currentTarget: submitButton } as React.MouseEvent<HTMLButtonElement>);
        }
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCommentDate = (dateString: string) => {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return formatInTimeZone(
      new Date(dateString),
      userTimeZone,
      'MMM d, yyyy h:mm a'
    );
  };

  return (
    <div className="space-y-4 mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs font-medium text-gray-600 hover:text-gray-900"
      >
        {expanded 
          ? "Collapse comments"
          : comments.length
            ? `${comments.length} comment${comments.length === 1 ? '' : 's'}`
            : 'Add comment'}
      </button>

      {expanded && (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment._id} className="bg-gray-50 p-2.5 rounded">
              <p className="text-xs text-gray-700">{comment.content}</p>
              <div className="mt-1.5 text-xs">
                <span className="font-medium text-gray-600">
                  {comment.authorName || 'Anonymous'}
                </span>
                <span className="text-gray-400 mx-1">•</span>
                <span className="text-gray-500">
                  {formatCommentDate(comment.createdAt)}
                </span>
              </div>
            </div>
          ))}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
            <input
              type="text"
              {...register('authorName')}
              placeholder="Your name (optional)"
              className="w-full p-2 text-xs border rounded focus:ring-1 focus:ring-gray-400"
            />
            <textarea
              {...register('content', { required: true })}
              placeholder="Add a comment..."
              rows={3}
              className="w-full p-2 text-xs border rounded focus:ring-1 focus:ring-gray-400"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gray-100 text-gray-600 py-1.5 px-3 rounded text-xs font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors duration-200"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
} 