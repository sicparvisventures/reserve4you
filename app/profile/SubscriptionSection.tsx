'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  X,
  ArrowUpCircle,
  Building2,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';

interface Tenant {
  id: string;
  name: string;
  billingState: any;
  role: string;
}

interface SubscriptionSectionProps {
  tenants: Tenant[];
}

const PLANS = [
  {
    id: 'START',
    name: 'Start',
    price: 49,
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
    price: 99,
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
    price: 149,
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

export function SubscriptionSection({ tenants }: SubscriptionSectionProps) {
  const [upgradingTenant, setUpgradingTenant] = useState<string | null>(null);
  const [selectedPlanForTenant, setSelectedPlanForTenant] = useState<Record<string, string>>({});

  const handleUpgrade = async (tenantId: string, plan: string) => {
    setUpgradingTenant(tenantId);

    try {
      const response = await fetch('/api/profile/upgrade-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          plan,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout or success page
      window.location.href = url;
    } catch (error: any) {
      console.error('Upgrade error:', error);
      alert(`Fout bij upgraden: ${error.message}`);
      setUpgradingTenant(null);
    }
  };

  return (
    <div className="space-y-8">
      {tenants.map((tenant) => {
        const currentPlan = tenant.billingState?.plan || 'FREE';
        const currentStatus = tenant.billingState?.status || 'TRIALING';
        const isOwner = tenant.role === 'OWNER';
        const selectedPlan = selectedPlanForTenant[tenant.id];

        return (
          <div key={tenant.id} className="space-y-6">
            {/* Tenant Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">{tenant.name}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant={currentStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                    {currentPlan}
                  </Badge>
                  <Badge variant="outline">{currentStatus}</Badge>
                  {!isOwner && (
                    <Badge variant="outline" className="text-muted-foreground">
                      Alleen eigenaren kunnen upgraden
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/manager/${tenant.id}/dashboard`}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Naar dashboard
                </Link>
              </Button>
            </div>

            {/* Current Plan Card */}
            {currentPlan !== 'FREE' && (
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-background border-2 border-primary/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">Huidig abonnement</h3>
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-primary">
                        {PLANS.find(p => p.id === currentPlan)?.name || currentPlan}
                      </p>
                      <p className="text-base text-muted-foreground">
                        €{PLANS.find(p => p.id === currentPlan)?.price || 0} per maand
                      </p>
                      {PLANS.find(p => p.id === currentPlan)?.description && (
                        <p className="text-sm text-muted-foreground">
                          {PLANS.find(p => p.id === currentPlan)?.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {isOwner && currentPlan !== 'PLUS' && (
                    <Badge 
                      variant="outline" 
                      className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 transition-colors whitespace-nowrap"
                    >
                      <ArrowUpCircle className="h-3 w-3 mr-1" />
                      Upgrade beschikbaar
                    </Badge>
                  )}
                </div>
              </Card>
            )}

            {/* Upgrade Options */}
            {isOwner && (
              <div>
                <h3 className="text-xl font-bold mb-4">
                  {currentPlan === 'FREE' ? 'Kies een abonnement' : 'Upgrade je abonnement'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {PLANS.map((plan) => {
                    const isCurrentPlan = plan.id === currentPlan;
                    const canUpgrade = ['FREE', 'START'].includes(currentPlan) && plan.id !== 'START' ||
                                      currentPlan === 'PRO' && plan.id === 'PLUS';
                    const isDowngrade = (currentPlan === 'PLUS' && plan.id !== 'PLUS') ||
                                       (currentPlan === 'PRO' && plan.id === 'START');
                    const isPopular = plan.popular;

                    return (
                      <Card
                        key={plan.id}
                        className={`relative p-6 transition-all duration-200 flex flex-col ${
                          isCurrentPlan
                            ? 'border-2 border-primary shadow-xl scale-[1.02]'
                            : 'border border-border hover:border-primary/50 hover:shadow-lg'
                        } ${isPopular ? 'ring-2 ring-primary/20' : ''}`}
                      >
                        {/* Popular Badge */}
                        {isPopular && !isCurrentPlan && (
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
                          {isCurrentPlan && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Price */}
                        <div className="mb-6 pb-6 border-b border-border">
                          <div className="flex items-baseline">
                            <span className="text-4xl font-bold text-foreground">
                              €{plan.price}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">/maand</p>
                        </div>

                        {/* Features */}
                        <ul className="space-y-2.5 mb-4 flex-1">
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

                        {/* Action Button */}
                        <div className="mt-6">
                          {isCurrentPlan ? (
                            <Button disabled className="w-full h-12 rounded-xl" variant="outline">
                              <Check className="h-4 w-4 mr-2" />
                              Huidig plan
                            </Button>
                          ) : isDowngrade ? (
                            <Button disabled className="w-full h-12 rounded-xl" variant="ghost">
                              Niet beschikbaar
                            </Button>
                          ) : canUpgrade || currentPlan === 'FREE' ? (
                            <Button
                              onClick={() => handleUpgrade(tenant.id, plan.id)}
                              disabled={upgradingTenant === tenant.id}
                              className="w-full h-12 rounded-xl gradient-bg text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                            >
                              {upgradingTenant === tenant.id ? (
                                'Omschakelen...'
                              ) : currentPlan === 'FREE' ? (
                                'Start nu'
                              ) : (
                                <>
                                  <ArrowUpCircle className="h-5 w-5 mr-2" />
                                  Upgrade
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button disabled className="w-full h-12 rounded-xl" variant="ghost">
                              Niet beschikbaar
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {!isOwner && (
              <Card className="p-6 text-center bg-muted/30">
                <p className="text-muted-foreground">
                  Alleen de eigenaar van {tenant.name} kan het abonnement beheren.
                </p>
              </Card>
            )}
          </div>
        );
      })}

      {/* Always show upgrade options if no tenants */}
      {tenants.length === 0 && (
        <div className="space-y-6">
          <Card className="p-8 text-center bg-muted/30">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start je eerste bedrijf</h3>
            <p className="text-muted-foreground mb-6">
              Begin met onze gratis proefperiode en kies later je abonnement.
            </p>
            <Button asChild className="rounded-xl">
              <Link href="/manager/onboarding?step=1">
                Start nu gratis
              </Link>
            </Button>
          </Card>

          {/* Show upgrade plans even without tenants */}
          <div>
            <h3 className="text-xl font-bold mb-4">Kies je abonnement</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PLANS.map((plan) => {
                const isPopular = plan.popular;

                return (
                  <Card
                    key={plan.id}
                    className={`relative p-6 transition-all duration-200 flex flex-col border border-border hover:border-primary/50 hover:shadow-lg ${
                      isPopular ? 'ring-2 ring-primary/20' : ''
                    }`}
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
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-6 pb-6 border-b border-border">
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-foreground">
                          €{plan.price}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">/maand</p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-4 flex-1">
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

                    {/* Action Button */}
                    <div className="mt-6">
                      <Button
                        asChild
                        className="w-full h-12 rounded-xl gradient-bg text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
                        <Link href="/manager/onboarding?step=1">
                          Start gratis proefperiode
                        </Link>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

