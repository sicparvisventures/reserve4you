'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Eye, 
  MapPin, 
  Clock, 
  Table2, 
  Shield,
  CreditCard,
  Zap,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface StepPreviewProps {
  data: any;
}

export function StepPreview({ data }: StepPreviewProps) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState('');

  // Check if all required steps are completed
  const isComplete = Boolean(
    data.tenantId &&
    data.locationId &&
    data.tables?.length > 0 &&
    data.shifts?.length > 0 &&
    data.policy &&
    data.subscription
  );

  const handlePublish = async () => {
    if (!isComplete) {
      setError('Voltooi alle verplichte stappen voordat je publiceert');
      return;
    }

    setIsPublishing(true);
    setError('');

    try {
      // Publish location via API
      const response = await fetch('/api/manager/locations/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: data.locationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish location');
      }

      // Clear onboarding data from localStorage
      localStorage.removeItem('r4y_onboarding_progress');

      // Redirect to dashboard
      router.push(`/manager/${data.tenantId}/dashboard?published=true`);
    } catch (error: any) {
      setError(error.message);
      setIsPublishing(false);
    }
  };

  const handlePreview = () => {
    // Open location preview in new tab
    window.open(`/p/${data.location?.slug}`, '_blank');
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mr-4">
            <Eye className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Preview & Publiceren</h2>
            <p className="text-muted-foreground">Controleer je instellingen en ga live!</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Completion Status */}
        <Card className={`p-6 ${isComplete ? 'border-success bg-success/5' : 'border-warning bg-warning/5'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {isComplete ? (
                <>
                  <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center mr-4">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Klaar om te publiceren!</h3>
                    <p className="text-sm text-muted-foreground">Alle verplichte stappen zijn voltooid</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-warning flex items-center justify-center mr-4">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Nog niet klaar</h3>
                    <p className="text-sm text-muted-foreground">Voltooi eerst alle verplichte stappen</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Configuration Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bedrijf */}
          <Card className="p-4">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <h4 className="font-semibold">Bedrijf</h4>
            </div>
            <p className="text-sm text-muted-foreground">{data.tenant?.name || 'Niet ingesteld'}</p>
          </Card>

          {/* Locatie */}
          <Card className="p-4">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <h4 className="font-semibold">Locatie</h4>
            </div>
            <p className="text-sm text-muted-foreground">{data.location?.name || 'Niet ingesteld'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.location?.address?.city || ''}
            </p>
          </Card>

          {/* Tafels */}
          <Card className="p-4">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                <Table2 className="h-4 w-4 text-primary" />
              </div>
              <h4 className="font-semibold">Tafels & Shifts</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.tables?.length || 0} tafels, {data.shifts?.length || 0} shifts
            </p>
          </Card>

          {/* Policies */}
          <Card className="p-4">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <h4 className="font-semibold">Policies</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.policy?.cancellationHours || 0}u annulering
              {data.policy?.depositRequired && ', Aanbetaling verplicht'}
            </p>
          </Card>

          {/* Betaling */}
          <Card className="p-4">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <h4 className="font-semibold">Betaalinstellingen</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.stripeConnect?.stripeAccountId ? 'Stripe verbonden' : 'Niet verbonden'}
            </p>
          </Card>

          {/* Abonnement */}
          <Card className="p-4">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <h4 className="font-semibold">Abonnement</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.subscription?.plan ? (
                <Badge variant="default">{data.subscription.plan}</Badge>
              ) : (
                'Niet actief'
              )}
            </p>
          </Card>
        </div>

        {/* Public URL Preview */}
        {data.location?.slug && (
          <Card className="p-6 bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Je publieke pagina:</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                className="rounded-xl"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            </div>
            <p className="text-sm font-mono text-primary">
              {typeof window !== 'undefined' ? window.location.origin : ''}/p/{data.location.slug}
            </p>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-xl">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4">
          <Button
            onClick={handlePublish}
            disabled={!isComplete || isPublishing}
            className="w-full h-14 gradient-bg text-white rounded-xl font-semibold text-lg"
          >
            {isPublishing ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Bezig met publiceren...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Publiceer mijn restaurant!
              </>
            )}
          </Button>
        </div>

        {/* Info Text */}
        <p className="text-sm text-center text-muted-foreground">
          Door te publiceren maak je je restaurant zichtbaar voor klanten en kunnen ze direct reserveren
        </p>
      </div>
    </div>
  );
}

