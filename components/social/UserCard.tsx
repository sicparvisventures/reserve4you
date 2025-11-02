'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserMinus, Star, Users } from 'lucide-react';
import { FollowUnfollowButton } from './FollowUnfollowButton';
import { cn } from '@/lib/utils';

interface UserCardProps {
  consumerId: string;
  name: string;
  profilePictureUrl?: string | null;
  bio?: string | null;
  stats?: {
    followers?: number;
    following?: number;
    reviews?: number;
  };
  isFollowing?: boolean;
  showFollowButton?: boolean;
  badges?: Array<{
    badge_type: string;
  }>;
  className?: string;
  onClick?: () => void;
  onFollowChange?: () => void;
}

export function UserCard({
  consumerId,
  name,
  profilePictureUrl,
  bio,
  stats,
  isFollowing = false,
  showFollowButton = true,
  badges,
  className,
  onClick,
  onFollowChange,
}: UserCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Card
      className={cn(
        'p-4 hover:shadow-md transition-shadow',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-4">
        <Link href={`/profile/${consumerId}`} onClick={(e) => e.stopPropagation()}>
          <Avatar className="w-12 h-12 border-2 border-background">
            <AvatarImage src={profilePictureUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            href={`/profile/${consumerId}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:underline"
          >
            <h3 className="font-semibold text-foreground truncate">{name}</h3>
          </Link>

          {bio && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{bio}</p>
          )}

          {stats && (stats.followers !== undefined || stats.reviews !== undefined) && (
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              {stats.followers !== undefined && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{stats.followers}</span>
                </div>
              )}
              {stats.reviews !== undefined && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  <span>{stats.reviews}</span>
                </div>
              )}
            </div>
          )}

          {badges && badges.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {badges.slice(0, 3).map((badge, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {badge.badge_type}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {showFollowButton && (
          <div onClick={(e) => e.stopPropagation()}>
            <FollowUnfollowButton
              consumerId={consumerId}
              initialIsFollowing={isFollowing}
              size="sm"
              variant="outline"
            />
          </div>
        )}
      </div>
    </Card>
  );
}

