'use client';

import { useState, useEffect } from 'react';
import { ActivityFeed } from '@/components/social/ActivityFeed';
import { CreatePost } from '@/components/social/CreatePost';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';

export function FeedClient() {
  const [filterType, setFilterType] = useState<string>('all');
  const [user, setUser] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (authUser) {
      const { data: consumer } = await supabase
        .from('consumers')
        .select('id, name, profile_picture_url')
        .eq('auth_user_id', authUser.id)
        .single();

      if (consumer) {
        setUser({
          name: consumer.name || authUser.email?.split('@')[0] || 'Gebruiker',
          profile_picture_url: consumer.profile_picture_url,
        });
      }
    }
  };

  const handlePostSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Modern Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Feed
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Ontdek wat anderen beleven
              </p>
            </div>
            
            {/* Filter */}
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px] sm:w-[160px] h-9 border-border/60">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="post">Posts</SelectItem>
                  <SelectItem value="booking">Reserveringen</SelectItem>
                  <SelectItem value="review">Reviews</SelectItem>
                  <SelectItem value="photo">Foto's</SelectItem>
                  <SelectItem value="follow">Volgers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Create Post */}
        {user && (
          <CreatePost
            user={user}
            onPostSuccess={handlePostSuccess}
            onPostError={(error) => {
              console.error('Post error:', error);
            }}
          />
        )}

        {/* Activity Feed */}
        <ActivityFeed 
          key={refreshKey}
          showFilters={false} 
          limit={20} 
          initialFilter={filterType}
        />
      </div>
    </div>
  );
}
