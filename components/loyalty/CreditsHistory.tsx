'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Star,
  Calendar,
  UserPlus,
  Camera,
  Gift,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  Loader2,
  MapPin,
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function CreditsHistory() {
  const [credits, setCredits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async (loadMore = false) => {
    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const params = new URLSearchParams();
      if (loadMore && cursor) {
        params.append('cursor', cursor);
      }

      const response = await fetch(`/api/social/loyalty/history?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();

      if (loadMore) {
        setCredits((prev) => [...prev, ...data.credits]);
      } else {
        setCredits(data.credits);
      }

      setHasMore(data.pagination.has_more);
      setCursor(data.pagination.cursor);
    } catch (error) {
      console.error('Error fetching credits history:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'review':
        return <Star className="h-4 w-4" />;
      case 'booking':
        return <Calendar className="h-4 w-4" />;
      case 'invite':
        return <UserPlus className="h-4 w-4" />;
      case 'photo':
        return <Camera className="h-4 w-4" />;
      case 'share':
        return <Gift className="h-4 w-4" />;
      default:
        return <ArrowUpCircle className="h-4 w-4" />;
    }
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      review: 'Review geplaatst',
      booking: 'Eerste reservering',
      invite: 'Vriend uitgenodigd',
      photo: 'Foto geüpload',
      share: 'Reservering gedeeld',
      referral: 'Vriend gerefereerd',
    };
    return labels[source] || source;
  };

  const formatAmount = (amount: number) => {
    return amount > 0 ? `+${amount}` : `${amount}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-16 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  if (credits.length === 0) {
    return (
      <div className="text-center py-12">
        <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground mb-2">Nog geen credits verdiend</p>
        <p className="text-sm text-muted-foreground">
          Begin met het plaatsen van reviews of het uitnodigen van vrienden om credits te verdienen
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {credits.map((credit) => (
        <Card
          key={credit.id}
          className={cn(
            'p-4',
            credit.is_expired && 'opacity-60',
            credit.is_expiring_soon && 'border-yellow-500/50'
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  credit.amount > 0
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-red-500/10 text-red-600'
                )}
              >
                {credit.amount > 0 ? (
                  <ArrowUpCircle className="h-5 w-5" />
                ) : (
                  <ArrowDownCircle className="h-5 w-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-primary">{getSourceIcon(credit.source)}</div>
                  <p className="font-semibold">{getSourceLabel(credit.source)}</p>
                </div>

                {credit.source_details?.location && (
                  <Link
                    href={`/p/${credit.source_details.location.slug || credit.source_details.location.id}`}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-1"
                  >
                    <MapPin className="h-3 w-3" />
                    {credit.source_details.location.name}
                  </Link>
                )}

                <p className="text-xs text-muted-foreground">
                  {format(new Date(credit.created_at), 'dd MMMM yyyy, HH:mm', { locale: nl })}
                </p>

                {credit.expires_at && (
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {credit.is_expired ? 'Verlopen' : `Verloopt ${format(new Date(credit.expires_at), 'dd MMM yyyy', { locale: nl })}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              <p
                className={cn(
                  'text-lg font-bold',
                  credit.amount > 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {formatAmount(credit.amount)}
              </p>
              {credit.is_expiring_soon && !credit.is_expired && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  Verloopt binnenkort
                </Badge>
              )}
            </div>
          </div>
        </Card>
      ))}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchHistory(true)}
            disabled={isLoadingMore}
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

