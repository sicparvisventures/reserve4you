'use client';

import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { UserLink } from './UserLink';
import { LikesModal } from './LikesModal';
import { cn } from '@/lib/utils';

interface ModernActivityCardProps {
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
    } | null;
    photo?: {
      id: string;
      photo_url: string;
      caption?: string | null;
    } | null;
    stats: {
      likes: number;
      comments: number;
    };
    user_has_liked: boolean;
  };
  variant?: 'full-width' | 'photo-grid';
  onLike?: (activityId: string, liked: boolean) => void;
  onComment?: (activityId: string) => void;
}

export function ModernActivityCard({
  activity,
  variant = 'full-width',
  onLike,
  onComment,
}: ModernActivityCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [liked, setLiked] = useState(activity.user_has_liked);
  const [likesCount, setLikesCount] = useState(activity.stats.likes);
  const [likesModalOpen, setLikesModalOpen] = useState(false);

  const handleLike = async () => {
    setIsLiking(true);
    try {
      if (liked) {
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Photo Grid Variant - Minimal card for mosaic
  if (variant === 'photo-grid' && activity.photo) {
    return (
      <Link href={`/p/${activity.target?.slug || activity.target_id}`}>
        <div className="group relative aspect-square rounded-xl overflow-hidden bg-muted/30 cursor-pointer hover:opacity-90 transition-opacity">
          <Image
            src={activity.photo.photo_url}
            alt={activity.photo.caption || activity.target?.name || 'Photo'}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end">
            <div className="w-full p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="w-5 h-5 border border-white/20">
                  <AvatarImage src={activity.actor.profile_picture_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {getInitials(activity.actor.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium truncate">{activity.actor.name}</span>
              </div>
              {activity.photo.caption && (
                <p className="text-xs truncate">{activity.photo.caption}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3" fill="currentColor" />
                  <span className="text-xs">{likesCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  <span className="text-xs">{activity.stats.comments}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Full Width Variant - Rich card with all details
  const hasPhoto = activity.photo || (activity.activity_type === 'photo' && activity.target?.hero_image_url);
  const photoUrl = activity.photo?.photo_url || activity.target?.hero_image_url;

  return (
    <div className="bg-background border border-border/50 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${activity.actor_id}`}>
            <Avatar className="w-10 h-10 border-2 border-background ring-2 ring-border/50">
              <AvatarImage src={activity.actor.profile_picture_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {getInitials(activity.actor.name)}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <UserLink consumerId={activity.actor_id} name={activity.actor.name} variant="button" />
              <span className="text-sm text-muted-foreground">
                {activity.activity_type === 'booking' && 'heeft gereserveerd'}
                {activity.activity_type === 'review' && 'heeft beoordeeld'}
                {activity.activity_type === 'photo' && 'heeft een foto gedeeld'}
                {activity.activity_type === 'follow' && 'volgt nu'}
                {activity.activity_type === 'post' && 'heeft een post gedeeld'}
              </span>
            </div>
            
            {activity.target && activity.activity_type !== 'post' && (
              <Link
                href={`/p/${activity.target?.slug || activity.target_id}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                <MapPin className="h-3 w-3" />
                {activity.target?.name || 'een locatie'}
              </Link>
            )}
            {activity.activity_type === 'post' && activity.metadata?.location_id && activity.target && (
              <Link
                href={`/p/${activity.target?.slug || activity.metadata.location_id}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                <MapPin className="h-3 w-3" />
                {activity.target?.name || 'een locatie'}
              </Link>
            )}
            
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(activity.created_at), {
                addSuffix: true,
                locale: nl,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Photo */}
      {hasPhoto && photoUrl && (
        <div className="relative w-full aspect-[4/3] bg-muted/30">
          <Image
            src={photoUrl}
            alt={activity.photo?.caption || activity.target?.name || 'Photo'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
          />
          {activity.photo?.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <p className="text-white text-sm">{activity.photo.caption}</p>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 pt-3 space-y-3">
        {/* Post text content */}
        {activity.activity_type === 'post' && activity.metadata?.text && (
          <div>
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
              {activity.metadata.text}
            </p>
          </div>
        )}

        {/* Photo caption for photo posts */}
        {activity.activity_type === 'photo' && activity.metadata?.text && !hasPhoto && (
          <div>
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
              {activity.metadata.text}
            </p>
          </div>
        )}

        {activity.activity_type === 'review' && activity.target?.title && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-primary fill-primary" />
              <span className="text-sm font-semibold">{activity.target.title}</span>
            </div>
            {activity.target.comment && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {activity.target.comment}
              </p>
            )}
          </div>
        )}

        {activity.activity_type === 'booking' && activity.metadata && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {activity.metadata.party_size && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{activity.metadata.party_size} {activity.metadata.party_size === 1 ? 'persoon' : 'personen'}</span>
              </div>
            )}
            {activity.metadata.date && (
              <span>
                {new Date(activity.metadata.date).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.preventDefault();
                handleLike();
              }}
              disabled={isLiking}
              className={cn(
                "flex items-center gap-2 h-9 px-3 rounded-lg transition-colors",
                "hover:bg-muted/50 disabled:opacity-50",
                liked && "text-primary"
              )}
            >
              {isLiking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={cn("h-4 w-4", liked && "fill-primary")} />
              )}
            </button>
            {likesCount > 0 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setLikesModalOpen(true);
                }}
                className="h-9 px-2 text-sm font-medium hover:underline text-muted-foreground hover:text-foreground transition-colors"
              >
                {likesCount}
              </button>
            )}
            {likesCount === 0 && (
              <span className="h-9 px-2 text-sm font-medium text-muted-foreground">
                {likesCount}
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onComment?.(activity.id);
            }}
            className="h-9 px-3"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">{activity.stats.comments}</span>
          </Button>
        </div>
      </div>

      {/* Likes Modal */}
      {likesModalOpen && (
        <LikesModal
          open={likesModalOpen}
          onOpenChange={setLikesModalOpen}
          activityId={activity.id}
        />
      )}
    </div>
  );
}

