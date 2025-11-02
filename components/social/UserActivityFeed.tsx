'use client';

import { useState, useEffect } from 'react';
import { ActivityCard } from './ActivityCard';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface UserActivityFeedProps {
  consumerId: string;
  limit?: number;
}

export function UserActivityFeed({ consumerId, limit = 10 }: UserActivityFeedProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchUserActivities();
  }, [consumerId]);

  const fetchUserActivities = async () => {
    setIsLoading(true);
    try {
      // Fetch feed and filter by actor_id
      const response = await fetch(`/api/social/feed?limit=50`);
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      // Filter activities for this user
      const userActivities = data.feed.filter(
        (activity: any) => activity.actor_id === consumerId
      );
      setActivities(userActivities.slice(0, limit));
      setHasMore(userActivities.length > limit);
    } catch (error) {
      console.error('Error fetching user activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Geen activiteit om te tonen</p>
          <p className="text-sm mt-2">Activiteiten verschijnen hier zodra ze beschikbaar zijn</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
}

