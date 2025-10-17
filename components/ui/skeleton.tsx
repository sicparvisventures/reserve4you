/**
 * Skeleton Component
 * 
 * Loading placeholder with shimmer animation.
 * Used throughout the app for async content.
 */

import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-muted/50',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };

