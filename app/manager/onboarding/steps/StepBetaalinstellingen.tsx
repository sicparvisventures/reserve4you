'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Check, AlertCircle } from 'lucide-react';

interface StepBetaalinstellingenProps {
  data: any;
  updateData: (key: string, value: any) => void;
  onNext: () => void;
}

export function StepBetaalinstellingen({ data, updateData, onNext }: StepBetaalinstellingenProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const isConnected = data.stripeConnect?.stripeAccountId;

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    setError('');

    try {
      // Create Stripe Connect account link
      const response = await fetch('/api/manager/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: data.locationId,
          returnUrl: `${window.location.origin}/manager/onboarding?step=5&connected=true`,
          refreshUrl: `${window.location.origin}/manager/onboarding?step=5&connected=false`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create Stripe Connect link');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe
      window.location.href = url;
    } catch (error: any) {
      setError(error.message);
      setIsConnecting(false);
    }
  };

  const handleSkip = () => {
    // Skip Stripe Connect for now (can be set up later)
    onNext();
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mr-4">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Betaalinstellingen</h2>
            <p className="text-muted-foreground">Verbind je Stripe account voor betalingen</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Stripe Connect Status */}
        {isConnected ? (
          <div className="p-6 border-2 border-success bg-success/5 rounded-xl">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center mr-4">
                <Check className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Stripe verbonden</h3>
                <p className="text-sm text-muted-foreground">Je account is succesvol gekoppeld</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Account ID: {data.stripeConnect.stripeAccountId}
            </p>
          </div>
        ) : (
          <div className="p-6 border border-border rounded-xl">
            <h3 className="text-lg font-semibold mb-2">Waarom Stripe Connect?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Ontvang aanbetalingen direct op je eigen bankrekening</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Beveiligde betalingsverwerking volgens PCI DSS standaard</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Automatische no-show fee incasso</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Directe toegang tot je betalingsgegevens via Stripe Dashboard</span>
              </li>
            </ul>

            <Button
              onClick={handleConnectStripe}
              disabled={isConnecting}
              className="w-full h-12 gradient-bg text-white rounded-xl font-semibold mb-3"
            >
              {isConnecting ? 'Verbinden...' : 'Verbind met Stripe'}
            </Button>

            <div className="flex items-start p-4 bg-info/10 border border-info/20 rounded-xl">
              <AlertCircle className="h-5 w-5 text-info mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Let op</p>
                <p className="text-muted-foreground">
                  Je hebt een Stripe account nodig. Als je er nog geen hebt, kun je er gratis een aanmaken tijdens het verbindingsproces.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-xl">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1 h-12 rounded-xl"
          >
            Overslaan (later instellen)
          </Button>
          {isConnected && (
            <Button
              onClick={onNext}
              className="flex-1 h-12 gradient-bg text-white rounded-xl font-semibold"
            >
              Doorgaan
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Je kunt deze instelling later altijd wijzigen in je dashboard
        </p>
      </div>
    </div>
  );
}

