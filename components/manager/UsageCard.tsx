'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  MapPin,
  Calendar,
  CreditCard,
  ArrowUpCircle,
  ExternalLink,
} from 'lucide-react';

interface UsageData {
  plan: 'START' | 'PRO' | 'PLUS';
  status: string;
  locations: { current: number; limit: number | 'unlimited' };
  bookingsThisMonth: { current: number; limit: number | 'unlimited' };
  features: {
    deposits: boolean;
    posIntegration: boolean;
  };
}

interface UsageCardProps {
  tenantId: string;
}

export function UsageCard({ tenantId }: UsageCardProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreatingPortal, setIsCreatingPortal] = useState(false);

  useEffect(() => {
    fetchUsage();
  }, [tenantId]);

  const fetchUsage = async () => {
    try {
      const response = await fetch(`/api/manager/usage?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsCreatingPortal(true);
    try {
      const response = await fetch('/api/manager/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          returnUrl: window.location.href,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      setIsCreatingPortal(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </Card>
    );
  }

  if (!usage) {
    return null;
  }

  const getUsagePercentage = (current: number, limit: number | 'unlimited') => {
    if (limit === 'unlimited') return 0;
    return Math.round((current / limit) * 100);
  };

  const locationPercentage = getUsagePercentage(usage.locations.current, usage.locations.limit);
  const bookingPercentage = getUsagePercentage(usage.bookingsThisMonth.current, usage.bookingsThisMonth.limit);

  const isNearLimit = locationPercentage > 80 || bookingPercentage > 80;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Gebruik & Abonnement</h3>
          <div className="flex items-center gap-2">
            <Badge variant={usage.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {usage.plan}
            </Badge>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{usage.status}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleManageBilling}
          disabled={isCreatingPortal}
          className="rounded-xl"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          {isCreatingPortal ? 'Laden...' : 'Beheer abonnement'}
        </Button>
      </div>

      {/* Usage Stats */}
      <div className="space-y-4">
        {/* Locations */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Locaties</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {usage.locations.current} / {usage.locations.limit === 'unlimited' ? '∞' : usage.locations.limit}
            </span>
          </div>
          {usage.locations.limit !== 'unlimited' && (
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  locationPercentage > 80 ? 'bg-warning' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(locationPercentage, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Bookings */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Reserveringen deze maand</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {usage.bookingsThisMonth.current} / {usage.bookingsThisMonth.limit === 'unlimited' ? '∞' : usage.bookingsThisMonth.limit}
            </span>
          </div>
          {usage.bookingsThisMonth.limit !== 'unlimited' && (
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  bookingPercentage > 80 ? 'bg-warning' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(bookingPercentage, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Upgrade prompt if near limit */}
      {isNearLimit && usage.plan !== 'PLUS' && (
        <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-xl">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-warning mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">
                Je nadert je limiet
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Upgrade naar een hoger plan voor meer capaciteit
              </p>
              <Button
                size="sm"
                onClick={handleManageBilling}
                className="rounded-xl"
              >
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Upgrade nu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs font-medium text-muted-foreground mb-2">Beschikbare features:</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            Basis reserveringen
          </Badge>
          {usage.features.deposits && (
            <Badge variant="outline" className="text-xs">
              Aanbetalingen
            </Badge>
          )}
          {usage.features.posIntegration && (
            <Badge variant="outline" className="text-xs">
              POS integratie
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

