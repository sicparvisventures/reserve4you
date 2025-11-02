'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Calendar,
  Star,
  MapPin,
  UserPlus,
  Camera,
  Heart,
  MessageCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { UserLink } from './UserLink';

interface ActivityCardProps {
  activity: {
    id: string;
    actor_id: string;
    activity_type: string;
    target_type: string;
    target_id: string;
    metadata?: any;
    created_at: string;
    actor: {
      id: string;
      name: string;
      profile_picture_url?: string | null;
    };
    target?: {
      id?: string;
      name?: string;
      slug?: string;
      hero_image_url?: string;
      cuisine?: string;
      rating?: number;
      title?: string;
      comment?: string;
      location?: {
        id: string;
        name: string;
        slug: string;
      };
      party_size?: number;
      start_ts?: string;
      guest_name?: string;
    } | null;
    stats: {
      likes: number;
      comments: number;
    };
    user_has_liked: boolean;
  };
  onLike?: (activityId: string, liked: boolean) => void;
  onComment?: (activityId: string) => void;
}

export function ActivityCard({ activity, onLike, onComment }: ActivityCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [liked, setLiked] = useState(activity.user_has_liked);
  const [likesCount, setLikesCount] = useState(activity.stats.likes);

  const handleLike = async () => {
    setIsLiking(true);
    try {
      if (liked) {
        // Unlike
        const response = await fetch(`/api/social/feed/like?activityId=${activity.id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          const data = await response.json();
          setLiked(false);
          setLikesCount(data.like_count || likesCount - 1);
          onLike?.(activity.id, false);
        }
      } else {
        // Like
        const response = await fetch('/api/social/feed/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activityId: activity.id }),
        });
        if (response.ok) {
          const data = await response.json();
          setLiked(true);
          setLikesCount(data.like_count || likesCount + 1);
          onLike?.(activity.id, true);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case 'booking':
        return <Calendar className="h-4 w-4" />;
      case 'review':
        return <Star className="h-4 w-4" />;
      case 'photo':
        return <Camera className="h-4 w-4" />;
      case 'follow':
        return <UserPlus className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getActivityText = () => {
    const actorName = activity.actor.name;
    const targetName = activity.target?.name || activity.target?.location?.name || 'een locatie';

    switch (activity.activity_type) {
      case 'booking':
        return (
          <>
            <UserLink consumerId={activity.actor_id} name={actorName} variant="button" /> heeft een reservering gemaakt bij{' '}
            <Link
              href={`/p/${activity.target?.slug || activity.target_id}`}
              className="font-semibold hover:underline hover:text-primary transition-colors"
            >
              {targetName}
            </Link>
          </>
        );
      case 'review':
        return (
          <>
            <UserLink consumerId={activity.actor_id} name={actorName} variant="button" /> heeft{' '}
            <Link
              href={`/p/${activity.target?.location?.slug || activity.target_id}`}
              className="font-semibold hover:underline hover:text-primary transition-colors"
            >
              {targetName}
            </Link>{' '}
            beoordeeld met {activity.target?.rating || activity.metadata?.rating} sterren
          </>
        );
      case 'photo':
        return (
          <>
            <UserLink consumerId={activity.actor_id} name={actorName} variant="button" /> heeft een foto gedeeld van{' '}
            <Link
              href={`/p/${activity.target?.slug || activity.target_id}`}
              className="font-semibold hover:underline hover:text-primary transition-colors"
            >
              {targetName}
            </Link>
          </>
        );
      case 'follow':
        return (
          <>
            <UserLink consumerId={activity.actor_id} name={actorName} variant="button" /> volgt nu{' '}
            <Link
              href={`/profile/${activity.target_id}`}
              className="font-semibold hover:underline hover:text-primary transition-colors"
            >
              {activity.target?.name || 'iemand'}
            </Link>
          </>
        );
      default:
        return `${actorName} heeft een activiteit gedaan`;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={`/profile/${activity.actor_id}`}>
          <Avatar className="w-10 h-10 border-2 border-background">
            <AvatarImage src={activity.actor.profile_picture_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {getInitials(activity.actor.name)}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getActivityIcon()}
            <p className="text-sm text-foreground">
              {getActivityText()}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(activity.created_at), {
              addSuffix: true,
              locale: nl,
            })}
          </p>
        </div>
      </div>

      {/* Content */}
      {activity.target && (
        <div className="space-y-2">
          {activity.activity_type === 'review' && activity.target.title && (
            <div className="pl-0">
              <h4 className="font-semibold text-foreground">{activity.target.title}</h4>
              {activity.target.comment && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {activity.target.comment}
                </p>
              )}
            </div>
          )}

          {activity.activity_type === 'booking' && activity.metadata && (
            <div className="pl-0 space-y-1">
              {activity.metadata.party_size && (
                <p className="text-sm text-muted-foreground">
                  {activity.metadata.party_size} {activity.metadata.party_size === 1 ? 'persoon' : 'personen'}
                </p>
              )}
              {activity.metadata.date && (
                <p className="text-sm text-muted-foreground">
                  {new Date(activity.metadata.date).toLocaleDateString('nl-NL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
              )}
            </div>
          )}

          {/* Location Link */}
          {activity.target_type === 'location' && activity.target?.slug && (
            <Link
              href={`/p/${activity.target.slug}`}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <MapPin className="h-3 w-3" />
              {activity.target.name}
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={isLiking}
          className={liked ? 'text-primary' : ''}
        >
          {isLiking ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Heart className={`h-4 w-4 mr-2 ${liked ? 'fill-primary' : ''}`} />
          )}
          <span>{likesCount}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onComment?.(activity.id)}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          <span>{activity.stats.comments}</span>
        </Button>
      </div>
    </Card>
  );
}

