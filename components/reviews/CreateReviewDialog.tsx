/**
 * Create Review Dialog Component
 * 
 * Form for customers to leave reviews
 * Clean design consistent with Reserve4You branding
 */

'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StarRatingInput } from './StarRating';
import { Loader2 } from 'lucide-react';

interface CreateReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  locationName: string;
  onReviewCreated?: () => void;
}

export function CreateReviewDialog({
  open,
  onOpenChange,
  locationId,
  locationName,
  onReviewCreated,
}: CreateReviewDialogProps) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      setError('Review tekst is verplicht');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          rating,
          title: title.trim() || null,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Er ging iets mis');
      }

      // Reset form
      setRating(5);
      setTitle('');
      setComment('');
      
      // Notify parent
      onReviewCreated?.();
    } catch (err: any) {
      setError(err.message || 'Er ging iets mis bij het plaatsen van je review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Review schrijven voor {locationName}</DialogTitle>
          <DialogDescription>
            Deel je ervaring met andere gasten
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <StarRatingInput
            value={rating}
            onChange={setRating}
            error={error && !rating ? 'Selecteer een beoordeling' : ''}
          />

          {/* Title (Optional) */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Titel (optioneel)
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Vat je ervaring samen"
              maxLength={100}
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Je review *
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Vertel ons over je ervaring..."
              rows={6}
              maxLength={1000}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/1000 tekens
            </p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Review plaatsen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

