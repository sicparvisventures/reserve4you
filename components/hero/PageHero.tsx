'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Dynamic import of LightRays to avoid SSR issues with WebGL
const LightRays = dynamic(() => import('./LightRays'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gradient-to-br from-primary/10 via-primary/5 to-background" />,
});

interface PageHeroProps {
  title: string | ReactNode;
  description: string;
  children?: ReactNode;
}

export function PageHero({ title, description, children }: PageHeroProps) {
  return (
    <div className="relative overflow-hidden border-b border-border h-[400px]">
      {/* Light Rays Background - Reserve4You Primary Color */}
      <div className="absolute inset-0 w-full h-full opacity-20">
        <LightRays
          raysOrigin="top-center"
          raysColor="#FF5A5F"
          raysSpeed={1.2}
          lightSpread={0.7}
          rayLength={1.1}
          followMouse={true}
          mouseInfluence={0.08}
          noiseAmount={0.05}
          distortion={0.03}
          fadeDistance={0.9}
          saturation={1.1}
          className="hero-rays"
        />
      </div>

      {/* Gradient Overlay for Better Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/92 via-background/88 to-background/85" />
      
      {/* Accent Gradients - Primary Color */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/8 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-primary/6 blur-3xl rounded-full" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="w-full">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl leading-relaxed">
            {description}
          </p>
          
          {children && (
            <div className="mt-6">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

