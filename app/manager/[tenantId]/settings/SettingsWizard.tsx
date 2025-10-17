'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Save } from 'lucide-react';
import { StepBedrijf } from '@/app/manager/onboarding/steps/StepBedrijf';
import { StepLocatie } from '@/app/manager/onboarding/steps/StepLocatie';
import { StepTafels } from '@/app/manager/onboarding/steps/StepTafels';
import { StepPolicies } from '@/app/manager/onboarding/steps/StepPolicies';
import { StepBetaalinstellingen } from '@/app/manager/onboarding/steps/StepBetaalinstellingen';
import { StepAbonnement } from '@/app/manager/onboarding/steps/StepAbonnement';
import { StepIntegraties } from '@/app/manager/onboarding/steps/StepIntegraties';

const STEPS = [
  { number: 1, title: 'Bedrijf', description: 'Basisinformatie en branding' },
  { number: 2, title: 'Locatie', description: 'Adres en openingstijden' },
  { number: 3, title: 'Tafels', description: 'Tafelindeling en capaciteit' },
  { number: 4, title: 'Diensten', description: 'Shifts en openingstijden' },
  { number: 5, title: 'Policies', description: 'Annulering en aanbetalingen' },
  { number: 6, title: 'Betaalinstellingen', description: 'Stripe Connect' },
  { number: 7, title: 'Abonnement', description: 'Beheer je plan' },
  { number: 8, title: 'Integraties', description: 'POS koppeling' },
];

interface SettingsWizardProps {
  tenantId: string;
  initialTenant: any;
  initialLocation: any;
  initialTables: any[];
  initialShifts: any[];
  initialPolicy: any;
  initialBilling: any;
  initialPosIntegration: any;
  allLocations: any[];
}

export function SettingsWizard({ 
  tenantId, 
  initialTenant, 
  initialLocation,
  initialTables,
  initialShifts,
  initialPolicy,
  initialBilling,
  initialPosIntegration,
  allLocations,
}: SettingsWizardProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentStep = parseInt(searchParams.get('step') || '1', 10);
  
  // Transform tables to match frontend format (is_combinable → combinable)
  const formattedTables = initialTables.map(table => ({
    name: table.name,
    seats: table.seats,
    combinable: table.is_combinable,
    groupId: table.group_id || '',
  }));

  // Transform shifts to match frontend format (days_of_week array → separate entries)
  const formattedShifts = initialShifts.map(shift => ({
    name: shift.name,
    startTime: shift.start_time,
    endTime: shift.end_time,
    daysOfWeek: shift.days_of_week || [],
    maxParallel: shift.max_parallel,
  }));
  
  const [data, setData] = useState({
    tenantId: tenantId,
    tenant: initialTenant,
    location: initialLocation,
    locationId: initialLocation?.id,
    tables: formattedTables,
    shifts: formattedShifts,
    policy: initialPolicy,
    billing: initialBilling,
    stripeConnect: null,
    subscription: initialBilling,
    posIntegration: initialPosIntegration,
    allLocations: allLocations,
  });

  const updateData = (key: string, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const goToStep = (step: number) => {
    router.push(`/manager/${tenantId}/settings?step=${step}`);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      goToStep(currentStep + 1);
    } else {
      // Last step, go back to dashboard
      router.push(`/manager/${tenantId}/dashboard`);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    } else {
      router.push(`/manager/${tenantId}/dashboard`);
    }
  };

  const renderStep = () => {
    // Reuse onboarding steps
    // The steps will CREATE new resources if they don't exist
    // or UPDATE existing ones if data is present
    const stepProps = {
      data,
      updateData,
      onNext: handleNext,
    };

    switch (currentStep) {
      case 1:
        return <StepBedrijf {...stepProps} />;
      case 2:
        return <StepLocatie {...stepProps} />;
      case 3:
        return <StepTafels {...stepProps} />; // Tables & Shifts combined for now
      case 4:
        return <StepTafels {...stepProps} />; // TODO: Create separate StepShifts component
      case 5:
        return <StepPolicies {...stepProps} />;
      case 6:
        return <StepBetaalinstellingen {...stepProps} />;
      case 7:
        return <StepAbonnement {...stepProps} />;
      case 8:
        return <StepIntegraties {...stepProps} />;
      default:
        return <div>Ongeldige stap</div>;
    }
  };

  const handleLocationChange = (locationId: string) => {
    router.push(`/manager/${tenantId}/settings?step=${currentStep}&locationId=${locationId}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Instellingen</h1>
            <p className="text-muted-foreground mt-1">
              Beheer je restaurant instellingen
            </p>
            {data.location && (
              <p className="text-sm text-muted-foreground mt-2">
                📍 {data.location.name} • {data.location.address_json?.city || data.location.city}
              </p>
            )}
          </div>
          
          {/* Location Selector (if multiple locations) */}
          {allLocations.length > 1 && (
            <div className="mx-4">
              <select
                value={data.locationId || ''}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {allLocations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <Button
            variant="outline"
            onClick={() => router.push(`/manager/${tenantId}/dashboard`)}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar Dashboard
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <button
                onClick={() => goToStep(step.number)}
                className={`flex flex-col items-center group cursor-pointer transition-all ${
                  currentStep >= step.number ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-all ${
                    currentStep === step.number
                      ? 'gradient-bg text-white shadow-lg scale-110'
                      : currentStep > step.number
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <div className="text-center">
                  <div className={`text-xs font-medium ${currentStep === step.number ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step.title}
                  </div>
                </div>
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-all ${
                    currentStep > step.number ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <Card className="p-8 rounded-2xl shadow-lg">
        {renderStep()}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          className="rounded-xl"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? 'Naar Dashboard' : 'Vorige'}
        </Button>

        {currentStep < STEPS.length && (
          <Button
            onClick={handleNext}
            className="gradient-bg text-white rounded-xl"
          >
            Volgende
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

