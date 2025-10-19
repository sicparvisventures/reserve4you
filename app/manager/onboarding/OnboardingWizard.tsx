'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Save } from 'lucide-react';
import { StepBedrijf } from './steps/StepBedrijf';
import { StepLocatie } from './steps/StepLocatie';
import { StepTafels } from './steps/StepTafels';
import { StepPolicies } from './steps/StepPolicies';
import { StepBetaalinstellingen } from './steps/StepBetaalinstellingen';
import { StepAbonnement } from './steps/StepAbonnement';
import { StepIntegraties } from './steps/StepIntegraties';
import { StepPreview } from './steps/StepPreview';

const STEPS = [
  { number: 1, title: 'Bedrijf', description: 'Basisinformatie en branding' },
  { number: 2, title: 'Locatie', description: 'Adres en openingstijden' },
  { number: 3, title: 'Tafels & Shifts', description: 'Capaciteit en diensten' },
  { number: 4, title: 'Policies', description: 'Annulering en aanbetalingen' },
  { number: 5, title: 'Betaalinstellingen', description: 'Stripe Connect' },
  { number: 6, title: 'Abonnement', description: 'Kies je plan' },
  { number: 7, title: 'Integraties', description: 'POS koppeling (optioneel)' },
  { number: 8, title: 'Publiceren', description: 'Preview en activeren' },
];

interface OnboardingData {
  tenantId?: string;
  locationId?: string;
  tenant?: any;
  location?: any;
  tables?: any[];
  shifts?: any[];
  policy?: any;
  stripeConnect?: any;
  subscription?: any;
  posIntegration?: any;
}

export function OnboardingWizard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenantIdParam = searchParams.get('tenantId'); // For adding new location to existing tenant
  const currentStep = parseInt(searchParams.get('step') || '1', 10);
  const [data, setData] = useState<OnboardingData>({});
  const [isSaving, setIsSaving] = useState(false);

  // Load saved progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('r4y_onboarding_progress');
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved progress:', e);
      }
    }
    
    // If tenantId is provided, we're adding a new location to existing tenant
    if (tenantIdParam) {
      setData(prev => ({ ...prev, tenantId: tenantIdParam }));
    }
  }, [tenantIdParam]);

  // Save progress to localStorage whenever data changes
  useEffect(() => {
    if (Object.keys(data).length > 0) {
      localStorage.setItem('r4y_onboarding_progress', JSON.stringify(data));
    }
  }, [data]);

  const updateData = (key: string, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const goToStep = (step: number) => {
    const params = new URLSearchParams();
    params.set('step', step.toString());
    if (data.tenantId) {
      params.set('tenantId', data.tenantId);
    }
    router.push(`/manager/onboarding?${params.toString()}`);
  };

  const handleNext = () => {
    // If adding new location (tenantId exists), skip certain steps
    if (data.tenantId) {
      // From step 5, go directly to step 8 (skip 6 and 7)
      if (currentStep === 5) {
        goToStep(8);
        return;
      }
      // From step 8, go back to dashboard
      if (currentStep === 8) {
        router.push(`/manager/${data.tenantId}/dashboard`);
        return;
      }
    }
    
    // Normal flow
    if (currentStep < STEPS.length) {
      goToStep(currentStep + 1);
    } else if (data.tenantId) {
      router.push(`/manager/${data.tenantId}/dashboard`);
    }
  };

  const handleBack = () => {
    // If adding new location (tenantId exists) and on step 2, go back to dashboard
    if (data.tenantId && currentStep === 2) {
      router.push(`/manager/${data.tenantId}/dashboard`);
    } else if (currentStep > 1) {
      goToStep(currentStep - 1);
    } else {
      router.push('/manager');
    }
  };

  const handleSaveAndExit = () => {
    setIsSaving(true);
    // Data is already saved to localStorage
    setTimeout(() => {
      if (data.tenantId) {
        router.push(`/manager/${data.tenantId}/dashboard`);
      } else {
        router.push('/manager');
      }
    }, 500);
  };

  const renderStep = () => {
    // If tenantId exists (adding new location), skip certain steps
    if (data.tenantId) {
      // Redirect from step 1 to step 2
      if (currentStep === 1) {
        router.push(`/manager/onboarding?step=2&tenantId=${data.tenantId}`);
        return <div>Redirecting...</div>;
      }
      
      // Skip step 6 (subscription) - redirect to step 8 (preview)
      if (currentStep === 6) {
        router.push(`/manager/onboarding?step=8&tenantId=${data.tenantId}`);
        return <div>Redirecting...</div>;
      }
      
      // Skip step 7 (integrations) - redirect to step 8 (preview)
      if (currentStep === 7) {
        router.push(`/manager/onboarding?step=8&tenantId=${data.tenantId}`);
        return <div>Redirecting...</div>;
      }
    }

    switch (currentStep) {
      case 1:
        return <StepBedrijf data={data} updateData={updateData} onNext={handleNext} />;
      case 2:
        return <StepLocatie data={data} updateData={updateData} onNext={handleNext} />;
      case 3:
        return <StepTafels data={data} updateData={updateData} onNext={handleNext} />;
      case 4:
        return <StepPolicies data={data} updateData={updateData} onNext={handleNext} />;
      case 5:
        return <StepBetaalinstellingen data={data} updateData={updateData} onNext={handleNext} />;
      case 6:
        return <StepAbonnement data={data} updateData={updateData} onNext={handleNext} />;
      case 7:
        return <StepIntegraties data={data} updateData={updateData} onNext={handleNext} />;
      case 8:
        return <StepPreview data={data} />;
      default:
        return <div>Ongeldige stap</div>;
    }
  };

  // Filter steps: hide step 1, 6, and 7 if adding new location (tenantId exists)
  const visibleSteps = data.tenantId 
    ? STEPS.filter(s => s.number > 1 && s.number !== 6 && s.number !== 7) 
    : STEPS;

  return (
    <div className="min-h-screen gradient-bg-subtle py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-foreground">
              {data.tenantId ? 'Nieuwe Vestiging Toevoegen' : 'Restaurant Onboarding'}
            </h1>
            <Button
              variant="outline"
              onClick={handleSaveAndExit}
              disabled={isSaving}
              className="rounded-xl"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Opslaan...' : 'Opslaan & later verder'}
            </Button>
          </div>
          <p className="text-muted-foreground">
            {data.tenantId 
              ? 'Configureer je nieuwe vestiging' 
              : 'Voltooi alle stappen om je restaurant te activeren'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 animate-fade-in">
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-8 left-0 right-0 h-0.5 bg-border">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ 
                  width: `${((currentStep - (data.tenantId ? 2 : 1)) / (visibleSteps.length - 1)) * 100}%` 
                }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {visibleSteps.map((step) => (
                <button
                  key={step.number}
                  onClick={() => step.number <= currentStep && goToStep(step.number)}
                  className={`flex flex-col items-center group ${
                    step.number <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                  disabled={step.number > currentStep}
                >
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-lg mb-2 transition-all duration-300 ${
                      step.number === currentStep
                        ? 'gradient-bg text-white shadow-lg scale-110'
                        : step.number < currentStep
                        ? 'bg-primary text-white'
                        : 'bg-card border-2 border-border text-muted-foreground'
                    }`}
                  >
                    {step.number < currentStep ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="text-center hidden md:block">
                    <div className={`text-sm font-medium ${
                      step.number <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 max-w-[100px]">
                      {step.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-8 mb-8 animate-fade-in shadow-lg">
          {renderStep()}
        </Card>

        {/* Navigation Buttons */}
        {currentStep !== 8 && (
          <div className="flex justify-between animate-fade-in">
            <Button
              variant="outline"
              onClick={handleBack}
              className="rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug
            </Button>
            <Button
              onClick={handleNext}
              className="gradient-bg text-white rounded-xl"
            >
              Volgende
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

