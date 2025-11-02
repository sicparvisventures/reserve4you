'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { UserLink } from './UserLink';

interface Like {
  id: string;
  created_at: string;
  consumer: {
    id: string;
    name: string;
    profile_picture_url?: string | null;
  };
}

interface LikesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityId: string;
}

export function LikesModal({
  open,
  onOpenChange,
  activityId,
}: LikesModalProps) {
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLikes();
    }
  }, [open, activityId]);

  const fetchLikes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/social/feed/${activityId}/likes`);
      if (response.ok) {
        const data = await response.json();
        setLikes(data.likes || []);
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
    } finally {
      setLoading(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Mensen die dit leuk vinden</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : likes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nog geen likes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {likes.map((like) => (
                <div key={like.id} className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarImage src={like.consumer.profile_picture_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(like.consumer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <UserLink
                      consumerId={like.consumer.id}
                      name={like.consumer.name}
                      variant="button"
                      className="font-semibold text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(like.created_at), {
                        addSuffix: true,
                        locale: nl,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

