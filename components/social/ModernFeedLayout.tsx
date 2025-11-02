'use client';

import { useState, useCallback } from 'react';
import { ModernActivityCard } from './ModernActivityCard';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
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
  target?: any;
  stats: {
    likes: number;
    comments: number;
  };
  user_has_liked: boolean;
  photo?: {
    id: string;
    photo_url: string;
    caption?: string | null;
  } | null;
}

interface ModernFeedLayoutProps {
  activities: Activity[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onLike: (activityId: string, liked: boolean) => void;
  onComment: (activityId: string) => void;
}

export function ModernFeedLayout({
  activities,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  onLike,
  onComment,
}: ModernFeedLayoutProps) {
  // Separate activities by type for mosaic layout
  // Show photos in grid if they have photo data and are photo-type posts (without text)
  const photoActivities = activities.filter(a => 
    (a.activity_type === 'photo' || a.activity_type === 'post') && 
    a.photo && 
    !a.metadata?.text // Don't show in grid if it has text content (show as full card)
  );
  const otherActivities = activities.filter(a => 
    !((a.activity_type === 'photo' || a.activity_type === 'post') && a.photo && !a.metadata?.text)
  );

  if (isLoading && activities.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-96 bg-muted/30 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <p className="text-muted-foreground mb-2 text-lg">Geen activiteiten om te tonen</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Begin met het volgen van gebruikers om hun activiteiten te zien, of deel je eigen momenten
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Photo Grid - Mosaic Layout */}
      {photoActivities.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {photoActivities.map((activity) => (
            <ModernActivityCard
              key={activity.id}
              activity={activity}
              variant="photo-grid"
              onLike={onLike}
              onComment={onComment}
            />
          ))}
        </div>
      )}

      {/* Other Activities - Full Width Cards */}
      {otherActivities.length > 0 && (
        <div className="space-y-4">
          {otherActivities.map((activity) => (
            <ModernActivityCard
              key={activity.id}
              activity={activity}
              variant="full-width"
              onLike={onLike}
              onComment={onComment}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-6">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="min-w-[120px]"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Laden...
              </>
            ) : (
              'Meer laden'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

