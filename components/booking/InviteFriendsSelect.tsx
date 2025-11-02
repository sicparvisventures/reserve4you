'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Check, UserPlus, Users, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface Friend {
  id: string;
  name: string;
  email: string;
  profile_picture_url?: string | null;
  bio?: string | null;
}

interface InviteFriendsSelectProps {
  selectedFriendIds: string[];
  onSelectionChange: (friendIds: string[]) => void;
  className?: string;
}

export function InviteFriendsSelect({
  selectedFriendIds,
  onSelectionChange,
  className,
}: InviteFriendsSelectProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/social/following');
      if (!response.ok) {
        throw new Error('Fout bij ophalen van vrienden');
      }
      const data = await response.json();
      setFriends(data.friends || []);
    } catch (err: any) {
      console.error('Error loading friends:', err);
      setError(err.message || 'Kon vrienden niet laden');
    } finally {
      setLoading(false);
    }
  };

  const toggleFriend = (friendId: string) => {
    if (selectedFriendIds.includes(friendId)) {
      onSelectionChange(selectedFriendIds.filter(id => id !== friendId));
    } else {
      onSelectionChange([...selectedFriendIds, friendId]);
    }
  };

  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Vrienden uitnodigen (optioneel)</span>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Vrienden uitnodigen (optioneel)</span>
        </div>
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Vrienden uitnodigen (optioneel)</span>
        </div>
        <div className="rounded-lg bg-muted border border-border p-4 text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Je volgt nog geen vrienden. Volg anderen om ze uit te nodigen voor reserveringen.
          </p>
        </div>
      </div>
    );
  }

  const displayedFriends = isExpanded ? friends : friends.slice(0, 4);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">Vrienden uitnodigen (optioneel)</span>
        </div>
        {selectedFriendIds.length > 0 && (
          <span className="text-xs text-primary font-medium">
            {selectedFriendIds.length} {selectedFriendIds.length === 1 ? 'vriend' : 'vrienden'} geselecteerd
          </span>
        )}
      </div>

      <div className="space-y-2">
        {displayedFriends.map((friend) => {
          const isSelected = selectedFriendIds.includes(friend.id);
          return (
            <button
              key={friend.id}
              onClick={() => toggleFriend(friend.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                'hover:border-primary hover:bg-primary/5',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card'
              )}
            >
              {/* Profile picture */}
              <div className="relative shrink-0">
                {friend.profile_picture_url ? (
                  <img
                    src={friend.profile_picture_url}
                    alt={friend.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-background"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-background">
                    <span className="text-primary font-semibold text-sm">
                      {friend.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {isSelected && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              {/* Friend info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {friend.name}
                </p>
                {friend.bio && (
                  <p className="text-xs text-muted-foreground truncate">
                    {friend.bio}
                  </p>
                )}
              </div>
            </button>
          );
        })}

        {friends.length > 4 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-primary hover:text-primary hover:bg-primary/10"
          >
            {isExpanded ? (
              <>
                Toon minder
              </>
            ) : (
              <>
                Toon {friends.length - 4} meer vrienden
              </>
            )}
          </Button>
        )}
      </div>

      {selectedFriendIds.length > 0 && (
        <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
          <p className="text-xs text-primary font-medium">
            {selectedFriendIds.length} {selectedFriendIds.length === 1 ? 'vriend wordt' : 'vrienden worden'} uitgenodigd voor deze reservering
          </p>
        </div>
      )}
    </div>
  );
}

