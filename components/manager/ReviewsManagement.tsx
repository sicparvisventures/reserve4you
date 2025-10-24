/**
 * Reviews Management Component for Location Dashboard
 * 
 * Allows location owners/managers to:
 * - View all reviews for their location
 * - Reply to reviews
 * - See review statistics
 */

'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/reviews/StarRating';
import { 
  MessageSquare, 
  TrendingUp, 
  CheckCircle, 
  Reply,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  is_verified: boolean;
  created_at: string;
  consumer: {
    name: string;
  };
  reply?: {
    id: string;
    comment: string;
    created_at: string;
  };
}

interface ReviewsManagementProps {
  locationId: string;
  locationName: string;
}

export function ReviewsManagement({ locationId, locationName }: ReviewsManagementProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });

  useEffect(() => {
    loadReviews();
  }, [locationId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews?locationId=${locationId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        calculateStats(data.reviews || []);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reviewsList: Review[]) => {
    const total = reviewsList.length;
    const sum = reviewsList.reduce((acc, r) => acc + r.rating, 0);
    const average = total > 0 ? sum / total : 0;
    
    const distribution = reviewsList.reduce((acc, r) => {
      acc[r.rating as keyof typeof acc] = (acc[r.rating as keyof typeof acc] || 0) + 1;
      return acc;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    setStats({ total, average, distribution });
  };

  const openReplyDialog = (review: Review) => {
    setSelectedReview(review);
    setReplyText(review.reply?.comment || '');
    setReplyDialogOpen(true);
    setError('');
  };

  const handleSubmitReply = async () => {
    if (!selectedReview || !replyText.trim()) {
      setError('Reactie mag niet leeg zijn');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const response = await fetch(`/api/reviews/${selectedReview.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: replyText.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Er ging iets mis');
      }

      // Reload reviews
      await loadReviews();
      setReplyDialogOpen(false);
      setSelectedReview(null);
      setReplyText('');
    } catch (err: any) {
      setError(err.message || 'Er ging iets mis bij het plaatsen van je reactie');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async (reviewId: string) => {
    if (!confirm('Weet je zeker dat je deze reactie wilt verwijderen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete reply');
      }

      await loadReviews();
    } catch (error) {
      console.error('Error deleting reply:', error);
      alert('Er ging iets mis bij het verwijderen van de reactie');
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Totaal Reviews</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gemiddelde</p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-3xl font-bold">{stats.average.toFixed(1)}</p>
                <StarRating rating={stats.average} size="sm" showNumber={false} />
              </div>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">5-Sterren</p>
              <p className="text-3xl font-bold mt-2">{stats.distribution[5]}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Verdeling beoordelingen</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.distribution[rating as keyof typeof stats.distribution];
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

            return (
              <div key={rating} className="flex items-center gap-3">
                <span className="text-sm font-medium w-8">{rating} ★</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Alle Reviews</h3>

        {reviews.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              Nog geen reviews ontvangen.
            </p>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="p-6">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {review.consumer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{review.consumer.name}</p>
                        {review.is_verified && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Geverifieerd
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), 'dd MMMM yyyy', { locale: nl })}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size="sm" showNumber={false} />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openReplyDialog(review)}
                >
                  <Reply className="mr-2 h-3 w-3" />
                  {review.reply ? 'Reactie bewerken' : 'Reageren'}
                </Button>
              </div>

              {/* Review Content */}
              <div className="space-y-2 mb-4">
                {review.title && (
                  <h4 className="font-semibold">{review.title}</h4>
                )}
                <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
              </div>

              {/* Existing Reply */}
              {review.reply && (
                <div className="mt-4 p-4 bg-primary/5 border-l-2 border-primary rounded-r-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">Je reactie</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteReply(review.id)}
                    >
                      Verwijderen
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.reply.comment}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(review.reply.created_at), 'dd MMM yyyy', { locale: nl })}
                  </p>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Reageren op review</DialogTitle>
            <DialogDescription>
              Schrijf een professionele reactie op deze review
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4">
              {/* Show original review */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <StarRating rating={selectedReview.rating} size="sm" showNumber={false} />
                  <span className="text-sm font-semibold">{selectedReview.consumer.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedReview.comment}</p>
              </div>

              {/* Reply textarea */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Je reactie *
                </label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Bedank de klant voor de review en ga in op hun feedback..."
                  rows={6}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {replyText.length}/1000 tekens
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReplyDialogOpen(false)}
              disabled={submitting}
            >
              Annuleren
            </Button>
            <Button onClick={handleSubmitReply} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedReview?.reply ? 'Reactie bijwerken' : 'Reactie plaatsen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

