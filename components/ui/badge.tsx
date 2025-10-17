/**
 * Badge Component
 * 
 * Used for statuses, labels, categories, etc.
 * Follows R4Y design system with rounded-full and consistent colors.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary/10 text-primary hover:bg-primary/20',
        secondary:
          'border-transparent bg-muted text-muted-foreground hover:bg-muted/80',
        success:
          'border-transparent bg-success/10 text-success hover:bg-success/20',
        warning:
          'border-transparent bg-warning/10 text-[#D97706] hover:bg-warning/20',
        error:
          'border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20',
        info:
          'border-transparent bg-info/10 text-info hover:bg-info/20',
        outline:
          'border-border bg-transparent text-foreground hover:bg-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

