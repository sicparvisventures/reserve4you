'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, X, Crown } from 'lucide-react';

interface StepAbonnementProps {
  data: any;
  updateData: (key: string, value: any) => void;
  onNext: () => void;
}

const PLANS = [
  {
    id: 'FREE',
    name: 'Free',
    price: '€0',
    period: 'altijd gratis',
    description: 'Start vandaag nog',
    features: [
      '1 locatie',
      '50 reserveringen per maand',
      'Basis reserveringssysteem',
      'E-mail bevestigingen',
      'Publieke restaurant pagina',
    ],
    limitations: [
      'Geen aanbetalingen',
      'Geen SMS notificaties',
      'Beperkte statistieken',
      'R4Y branding zichtbaar',
    ],
  },
  {
    id: 'START',
    name: 'Start',
    price: '€49',
    period: 'per maand',
    description: 'Basis reserveringssysteem',
    features: [
      'Basis reserveringssysteem',
      'Kalender overzicht',
      'Email notificaties',
      'Basis support',
    ],
    limitations: [
      'Geen aanbetalingen',
      'Geen wachtlijst',
      'Geen team members',
      'Geen SMS notificaties',
    ],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: '€99',
    period: 'per maand',
    description: 'Voor groeiende restaurants',
    popular: true,
    features: [
      'Alles van Start',
      'Aanbetalingen',
      'Wachtlijst',
      'Team members (3)',
      'SMS notificaties',
      'Prioriteit support',
    ],
    limitations: [],
  },
  {
    id: 'PLUS',
    name: 'Plus',
    price: '€149',
    period: 'per maand',
    description: 'Voor professionele horeca',
    features: [
      'Alles van Pro',
      'Onbeperkte team members',
      'Geavanceerde rapportages',
      'API toegang',
      'White-label opties',
      'Dedicated account manager',
      '24/7 support',
    ],
    limitations: [],
  },
];

export function StepAbonnement({ data, updateData, onNext }: StepAbonnementProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>(data.subscription?.plan || 'PRO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSelectPlan = async () => {
    const plan = PLANS.find(p => p.id === selectedPlan);
    
    // If Enterprise, show contact message
    if (plan?.isContactUs) {
      alert('Neem contact met ons op via sales@reserve4you.com voor een Enterprise abonnement.');
      return;
    }

    // If FREE, skip Stripe and just activate
    if (selectedPlan === 'FREE') {
      updateData('subscription', { plan: 'FREE', status: 'ACTIVE' });
      onNext();
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Create Stripe Checkout session
      const response = await fetch('/api/manager/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: data.tenantId,
          plan: selectedPlan,
          successUrl: `${window.location.origin}/manager/onboarding?step=7&success=true`,
          cancelUrl: `${window.location.origin}/manager/onboarding?step=6&cancelled=true`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error: any) {
      setError(error.message);
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Stay on FREE trial, skip to next step
    updateData('subscription', { plan: 'FREE', status: 'TRIALING' });
    onNext();
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mr-4">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Kies je abonnement</h2>
            <p className="text-muted-foreground">Selecteer het plan dat bij je past - Wijzig op elk moment</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const isPopular = plan.popular;
            const isEnterprise = plan.isContactUs;

            return (
              <Card
                key={plan.id}
                className={`relative p-6 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-2 border-primary shadow-xl scale-[1.02]'
                    : 'border border-border hover:border-primary/50 hover:shadow-lg'
                } ${isPopular ? 'ring-2 ring-primary/20' : ''}`}
                onClick={() => !isEnterprise && setSelectedPlan(plan.id)}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-primary text-white text-xs font-semibold rounded-full shadow-md">
                      Meest Gekozen
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  </div>
                  {isSelected && !isEnterprise && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="mb-6 pb-6 border-b border-border">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{plan.period}</p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-success mr-2.5 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground/90">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Limitations */}
                {plan.limitations && plan.limitations.length > 0 && (
                  <ul className="space-y-2 pt-4 mt-4 border-t border-border">
                    {plan.limitations.map((limitation, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <X className="h-4 w-4 text-muted-foreground/50 mr-2.5 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Enterprise CTA */}
                {isEnterprise && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <a
                      href="mailto:sales@reserve4you.com"
                      className="block w-full py-2.5 text-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/5 rounded-lg"
                    >
                      Neem Contact Op
                    </a>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Info Banner */}
        <div className="p-4 bg-muted/50 border border-border rounded-xl">
          <p className="text-sm text-foreground">
            <strong className="text-foreground">Niet zeker welk plan?</strong>{' '}
            <span className="text-muted-foreground">
              Start gratis met Free en upgrade later. Of kies Starter voor directe toegang tot alle basis features. 
              Voor groeiende restaurants is Growth perfect met aanbetalingen en meerdere locaties.
            </span>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-xl">
            <p className="text-destructive text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {selectedPlan === 'FREE' ? (
            <Button
              onClick={handleSelectPlan}
              className="flex-1 h-12 gradient-bg text-white rounded-xl font-semibold"
            >
              Start Gratis met {PLANS.find(p => p.id === selectedPlan)?.name}
            </Button>
          ) : selectedPlan === 'ENTERPRISE' ? (
            <Button
              onClick={() => window.location.href = 'mailto:sales@reserve4you.com'}
              className="flex-1 h-12 gradient-bg text-white rounded-xl font-semibold"
            >
              Neem Contact Op voor Enterprise
            </Button>
          ) : (
            <>
              <Button
                onClick={handleSelectPlan}
                disabled={isSubmitting}
                className="flex-1 h-12 gradient-bg text-white rounded-xl font-semibold"
              >
                {isSubmitting ? 'Bezig met verwerken...' : `Doorgaan met ${PLANS.find(p => p.id === selectedPlan)?.name}`}
              </Button>
              <Button
                onClick={handleSkip}
                variant="outline"
                className="h-12 px-6 rounded-xl font-semibold border-border"
              >
                Blijf op Gratis Trial
              </Button>
            </>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-xs text-center text-muted-foreground">
          {selectedPlan === 'FREE' 
            ? 'Geen betaalgegevens vereist - Start meteen'
            : 'Veilig betalen via Stripe - Annuleer op elk moment - Geld terug garantie'}
        </p>
      </div>
    </div>
  );
}
