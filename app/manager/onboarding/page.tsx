import { Suspense } from 'react';
import { OnboardingWizard } from './OnboardingWizard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Restaurant Onboarding - Reserve4You',
  description: 'Start met Reserve4You en zet je restaurant online',
};

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <OnboardingWizard />
    </Suspense>
  );
}

