'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, TrendingUp, Clock, Gift } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CreditsHistory } from './CreditsHistory';
import { cn } from '@/lib/utils';

interface CreditsDisplayProps {
  initialBalance?: number;
  showHistoryButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export function CreditsDisplay({
  initialBalance = 0,
  showHistoryButton = true,
  size = 'md',
  variant = 'default',
  className,
}: CreditsDisplayProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [isLoading, setIsLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [details, setDetails] = useState<{
    balance: number;
    total_earned: number;
    expiring_soon: number;
    expires_in_30_days: boolean;
  } | null>(null);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/social/loyalty/credits');
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
        setDetails(data);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Zap className="h-4 w-4 text-primary" />
        <span className={cn('font-semibold', sizeClasses[size])}>
          {isLoading ? '...' : balance}
        </span>
        <span className={cn('text-muted-foreground', sizeClasses[size])}>FlowCredits</span>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className={cn('p-4 space-y-3', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">FlowCredits</p>
              <p className="text-2xl font-bold">
                {isLoading ? '...' : balance}
              </p>
            </div>
          </div>
          {details && details.expires_in_30_days && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              {details.expiring_soon} verlopen binnenkort
            </Badge>
          )}
        </div>

        {details && details.total_earned > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Totaal verdiend</span>
            <span className="font-semibold">{details.total_earned}</span>
          </div>
        )}

        {(!details || details.total_earned === 0) && (
          <div className="text-sm text-muted-foreground pt-2 border-t">
            <p>Verdien credits door reviews te plaatsen, vrienden uit te nodigen en activiteiten te delen!</p>
          </div>
        )}

        {showHistoryButton && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setHistoryOpen(true)}
          >
            <Gift className="h-4 w-4 mr-2" />
            Transactiegeschiedenis
          </Button>
        )}

        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>FlowCredits Geschiedenis</DialogTitle>
              <DialogDescription>
                Bekijk al je credits transacties
              </DialogDescription>
            </DialogHeader>
            <CreditsHistory />
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  // Default variant
  return (
    <>
      <Card className={cn('p-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">FlowCredits</p>
              <p className="text-xl font-bold">
                {isLoading ? '...' : balance}
              </p>
            </div>
          </div>
          {showHistoryButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHistoryOpen(true)}
            >
              Geschiedenis
            </Button>
          )}
        </div>

        {details && details.expires_in_30_days && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{details.expiring_soon} credits verlopen binnen 30 dagen</span>
            </div>
          </div>
        )}

        {(!details || balance === 0) && (
          <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
            <p>Verdien credits door reviews te plaatsen, vrienden uit te nodigen en activiteiten te delen!</p>
          </div>
        )}
      </Card>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>FlowCredits Geschiedenis</DialogTitle>
            <DialogDescription>
              Bekijk al je credits transacties en verdien mogelijkheden
            </DialogDescription>
          </DialogHeader>
          <CreditsHistory />
        </DialogContent>
      </Dialog>
    </>
  );
}

