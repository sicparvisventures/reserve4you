/**
 * Star Rating Component
 * 
 * Clean star rating display and input
 * No emojis, professional look consistent with Reserve4You branding
 */

'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  showNumber = true,
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState(0);

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= displayRating;
          const isHalf = !isFilled && starValue - 0.5 <= displayRating;

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange?.(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={cn(
                'transition-colors',
                interactive && 'cursor-pointer hover:scale-110 transition-transform',
                !interactive && 'cursor-default'
              )}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  isFilled && 'fill-yellow-500 text-yellow-500',
                  isHalf && 'fill-yellow-500/50 text-yellow-500',
                  !isFilled && !isHalf && 'text-muted-foreground/30'
                )}
              />
            </button>
          );
        })}
      </div>

      {showNumber && (
        <span className={cn('font-medium text-foreground', textSizeClasses[size])}>
          {displayRating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

/**
 * Star Rating Input Component
 * For forms where users can select a rating
 */
interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

export function StarRatingInput({ value, onChange, error }: StarRatingInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        Beoordeling *
      </label>
      <StarRating
        rating={value}
        size="lg"
        showNumber={false}
        interactive={true}
        onChange={onChange}
      />
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

