/**
 * Reviews Display Component
 * 
 * Shows reviews for a location with filtering, sorting, and pagination
 * Clean design consistent with Reserve4You branding
 */

'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StarRating } from './StarRating';
import { MessageSquare, ThumbsUp, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CreateReviewDialog } from './CreateReviewDialog';

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
    user: {
      name: string;
    };
  };
  helpful_votes_count?: number;
}

interface ReviewsDisplayProps {
  locationId: string;
  locationName: string;
  averageRating?: number;
  reviewCount?: number;
  canLeaveReview?: boolean;
}

export function ReviewsDisplay({
  locationId,
  locationName,
  averageRating,
  reviewCount = 0,
  canLeaveReview = false,
}: ReviewsDisplayProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [locationId, filterRating]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      let url = `/api/reviews?locationId=${locationId}`;
      if (filterRating) {
        url += `&rating=${filterRating}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewCreated = () => {
    loadReviews();
    setCreateDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-4">Reviews</h2>
            
            {averageRating && reviewCount > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
                  <div>
                    <StarRating rating={averageRating} size="lg" showNumber={false} />
                    <p className="text-sm text-muted-foreground mt-1">
                      Gebaseerd op {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Nog geen reviews. Wees de eerste om een review achter te laten!
              </p>
            )}
          </div>

          {canLeaveReview && (
            <Button onClick={() => setCreateDialogOpen(true)} size="lg">
              <MessageSquare className="mr-2 h-4 w-4" />
              Schrijf een review
            </Button>
          )}
        </div>

        {/* Filter by Rating */}
        {reviewCount > 0 && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm font-medium mb-3">Filter op beoordeling:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterRating === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterRating(null)}
              >
                Alles
              </Button>
              {[5, 4, 3, 2, 1].map((rating) => (
                <Button
                  key={rating}
                  variant={filterRating === rating ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterRating(rating)}
                >
                  {rating} ★
                </Button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Reviews List */}
      {loading ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">Reviews laden...</p>
        </Card>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
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
                            Geverifieerd bezoek
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
              </div>

              {/* Review Content */}
              <div className="space-y-2">
                {review.title && (
                  <h4 className="font-semibold">{review.title}</h4>
                )}
                <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
              </div>

              {/* Owner Reply */}
              {review.reply && (
                <div className="mt-4 pl-4 border-l-2 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Reactie van {locationName}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.reply.created_at), 'dd MMM yyyy', { locale: nl })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.reply.comment}</p>
                </div>
              )}

              {/* Helpful Button */}
              <div className="mt-4 pt-4 border-t">
                <Button variant="ghost" size="sm">
                  <ThumbsUp className="mr-2 h-3 w-3" />
                  Nuttig {review.helpful_votes_count ? `(${review.helpful_votes_count})` : ''}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            Geen reviews gevonden{filterRating ? ' voor deze beoordeling' : ''}.
          </p>
        </Card>
      )}

      {/* Create Review Dialog */}
      <CreateReviewDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        locationId={locationId}
        locationName={locationName}
        onReviewCreated={handleReviewCreated}
      />
    </div>
  );
}

