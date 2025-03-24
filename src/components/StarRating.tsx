import React from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export default function StarRating({
  rating,
  onRatingChange,
  size = 'md',
  disabled = false
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const starSize = sizeClasses[size];

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onRatingChange(star)}
          className={`${starSize} ${disabled ? 'cursor-default' : 'cursor-pointer'} transition-colors duration-150`}
        >
          <svg
            className={`${starSize} ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } ${!disabled && star > rating ? 'hover:text-yellow-300' : ''}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </button>
      ))}
    </div>
  );
} 