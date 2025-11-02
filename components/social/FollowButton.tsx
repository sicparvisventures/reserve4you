'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';

interface FollowButtonProps {
  consumerId: string;
  initialIsFollowing: boolean;
  initialFollowersCount?: number;
  onFollowChange?: (isFollowing: boolean, newCount: number) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function FollowButton({
  consumerId,
  initialIsFollowing,
  initialFollowersCount,
  onFollowChange,
  variant = 'default',
  size = 'default',
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
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
          onFollowChange?.(false, newCount);
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
          onFollowChange?.(true, newCount);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleToggle}
      disabled={isLoading}
      variant={isFollowing ? 'outline' : variant}
      size={size}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="h-4 w-4 mr-2" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      {isFollowing ? 'Ontvolgen' : 'Volgen'}
    </Button>
  );
}

