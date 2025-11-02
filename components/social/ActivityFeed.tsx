'use client';

import { useState, useEffect, useCallback } from 'react';
import { ModernFeedLayout } from './ModernFeedLayout';
import { CommentModal } from './CommentModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, RefreshCw, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
}

interface ActivityFeedProps {
  initialActivities?: Activity[];
  showFilters?: boolean;
  limit?: number;
  initialFilter?: string;
}

export function ActivityFeed({
  initialActivities = [],
  showFilters = true,
  limit = 20,
  initialFilter = 'all',
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>(initialFilter);
  const [error, setError] = useState<string | null>(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [selectedActivityOwner, setSelectedActivityOwner] = useState<string>('');

  const fetchFeed = useCallback(
    async (loadMore = false) => {
      if (loadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
        });

        if (loadMore && cursor) {
          params.append('cursor', cursor);
        }

        if (filterType !== 'all') {
          params.append('type', filterType);
        }

        const response = await fetch(`/api/social/feed?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch feed');
        }

        const data = await response.json();

        if (loadMore) {
          setActivities((prev) => [...prev, ...data.feed]);
        } else {
          setActivities(data.feed);
        }

        setHasMore(data.pagination.has_more);
        setCursor(data.pagination.cursor);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching feed:', err);
        setError(err.message || 'Failed to load feed');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [cursor, filterType, limit]
  );

  useEffect(() => {
    if (initialActivities.length === 0) {
      fetchFeed();
    } else {
      // Use initial data, but check if there's more
      setActivities(initialActivities);
      setHasMore(true); // Assume there might be more
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Refetch when filter changes
    if (initialActivities.length === 0 || filterType !== 'all') {
      setCursor(null);
      fetchFeed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  const handleRefresh = () => {
    setCursor(null);
    setActivities([]);
    fetchFeed();
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      fetchFeed(true);
    }
  };

  const handleLike = (activityId: string, liked: boolean) => {
    // Optimistic update
    setActivities((prev) =>
      prev.map((activity) => {
        if (activity.id === activityId) {
          return {
            ...activity,
            user_has_liked: liked,
            stats: {
              ...activity.stats,
              likes: liked ? activity.stats.likes + 1 : activity.stats.likes - 1,
            },
          };
        }
        return activity;
      })
    );
  };

  if (isLoading && activities.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Opnieuw proberen
        </Button>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground mb-2">Geen activiteiten om te tonen</p>
        <p className="text-sm text-muted-foreground">
          Begin met het volgen van gebruikers om hun activiteiten te zien
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="flex items-center justify-between gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle activiteiten</SelectItem>
              <SelectItem value="post">Posts</SelectItem>
              <SelectItem value="booking">Reserveringen</SelectItem>
              <SelectItem value="review">Reviews</SelectItem>
              <SelectItem value="photo">Foto's</SelectItem>
              <SelectItem value="follow">Volgers</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Activities - Modern Layout */}
      <ModernFeedLayout
        activities={activities}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        onLike={handleLike}
        onComment={(activityId) => {
          const activity = activities.find(a => a.id === activityId);
          if (activity) {
            setSelectedActivityId(activityId);
            setSelectedActivityOwner(activity.actor.name);
            setCommentModalOpen(true);
          }
        }}
      />

      {/* Comment Modal */}
      {selectedActivityId && (
        <CommentModal
          open={commentModalOpen}
          onOpenChange={(open) => {
            setCommentModalOpen(open);
            if (!open) {
              setSelectedActivityId(null);
              setSelectedActivityOwner('');
              // Refresh feed to get updated comment counts
              handleRefresh();
            }
          }}
          activityId={selectedActivityId}
          activityOwnerName={selectedActivityOwner}
        />
      )}
    </div>
  );
}

