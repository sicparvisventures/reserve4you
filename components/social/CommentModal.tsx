'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Send, Heart, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { UserLink } from './UserLink';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  consumer: {
    id: string;
    name: string;
    profile_picture_url?: string | null;
  };
}

interface CommentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityId: string;
  activityOwnerName: string;
  initialComments?: Comment[];
}

export function CommentModal({
  open,
  onOpenChange,
  activityId,
  activityOwnerName,
  initialComments = [],
}: CommentModalProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      fetchComments();
      // Focus textarea after a brief delay
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open, activityId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/social/feed/${activityId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || posting) return;

    setPosting(true);
    try {
      const response = await fetch('/api/social/feed/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId,
          commentText: newComment.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments((prev) => [...prev, data.comment]);
        setNewComment('');
        textareaRef.current?.focus();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setPosting(false);
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
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Reacties</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nog geen reacties</p>
              <p className="text-sm text-muted-foreground mt-2">
                Wees de eerste om te reageren
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <Avatar className="w-8 h-8 border border-border">
                  <AvatarImage src={comment.consumer.profile_picture_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(comment.consumer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <UserLink
                      consumerId={comment.consumer.id}
                      name={comment.consumer.name}
                      variant="button"
                      className="font-semibold text-sm"
                    />
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: nl,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                    {comment.comment_text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 pb-6 pt-4 border-t">
          <div className="flex items-start gap-3">
            <Textarea
              ref={textareaRef}
              placeholder="Schrijf een reactie..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePostComment();
                }
              }}
              className="min-h-[80px] resize-none"
              maxLength={1000}
            />
            <Button
              onClick={handlePostComment}
              disabled={!newComment.trim() || posting}
              size="icon"
              className="h-[80px] w-[80px] flex-shrink-0"
            >
              {posting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {newComment.length}/1000
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

