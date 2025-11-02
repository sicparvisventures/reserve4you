'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowUnfollowButtonProps {
  consumerId: string;
  initialIsFollowing: boolean;
  initialFollowersCount?: number;
  onFollowChange?: ((isFollowing: boolean, newCount: number) => void) | (() => void);
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showSuccessState?: boolean;
  className?: string;
}

export function FollowUnfollowButton({
  consumerId,
  initialIsFollowing,
  initialFollowersCount,
  onFollowChange,
  variant = 'default',
  size = 'default',
  showSuccessState = true,
  className,
}: FollowUnfollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount || 0);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`/api/social/follow?consumerId=${consumerId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const data = await response.json();
          setIsFollowing(false);
          const newCount = data.followers_count || followersCount - 1;
          setFollowersCount(newCount);
          
          // Call callback if it exists
          if (onFollowChange) {
            try {
              if (onFollowChange.length === 2) {
                (onFollowChange as (isFollowing: boolean, newCount: number) => void)(false, newCount);
              } else if (onFollowChange.length === 0) {
                (onFollowChange as () => void)();
              }
            } catch (e) {
              // Callback may not accept parameters, try calling without
              try {
                (onFollowChange as () => void)();
              } catch (e2) {
                // Ignore if callback fails
              }
            }
          }
          
          if (showSuccessState) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
          }
        }
      } else {
        // Follow
        const response = await fetch('/api/social/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ consumerId }),
        });

        if (response.ok) {
          const data = await response.json();
          setIsFollowing(true);
          const newCount = data.followers_count || followersCount + 1;
          setFollowersCount(newCount);
          
          // Call callback if it exists
          if (onFollowChange) {
            try {
              if (onFollowChange.length === 2) {
                (onFollowChange as (isFollowing: boolean, newCount: number) => void)(true, newCount);
              } else if (onFollowChange.length === 0) {
                (onFollowChange as () => void)();
              }
            } catch (e) {
              // Callback may not accept parameters, try calling without
              try {
                (onFollowChange as () => void)();
              } catch (e2) {
                // Ignore if callback fails
              }
            }
          }
          
          if (showSuccessState) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
          }
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess && !isFollowing) {
    return (
      <Button
        variant="outline"
        size={size}
        className={cn('gap-2', className)}
        disabled
      >
        <Check className="h-4 w-4 text-green-600" />
        Ontvolgd
      </Button>
    );
  }

  if (showSuccess && isFollowing) {
    return (
      <Button
        variant="default"
        size={size}
        className={cn('gap-2', className)}
        disabled
      >
        <Check className="h-4 w-4" />
        Gevolgd
      </Button>
    );
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={isLoading}
      variant={isFollowing ? 'outline' : variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {isFollowing ? 'Ontvolgen...' : 'Volgen...'}
        </>
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-2" />
          Ontvolgen
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Volgen
        </>
      )}
    </Button>
  );
}

