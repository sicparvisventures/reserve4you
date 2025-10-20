'use client';

import { Button } from '@/components/ui/button';
import {
  MapPin,
  Clock,
  Calendar,
  Users,
  Tag,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamic import of GridDistortion to avoid SSR issues with Three.js
const GridDistortion = dynamic(() => import('./GridDistortion'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
});

export function HeroSection() {
  return (
    <div className="relative overflow-hidden border-b border-border">
      {/* Grid Distortion Background */}
      <div className="absolute inset-0 w-full h-full opacity-30">
        <Suspense fallback={<div className="w-full h-full bg-gradient-to-br from-primary/10 via-primary/5 to-background" />}>
          <GridDistortion
            imageSrc="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80"
            grid={12}
            mouse={0.12}
            strength={0.18}
            relaxation={0.9}
            className="hero-distortion"
          />
        </Suspense>
      </div>

      {/* Gradient Overlay for Better Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/85" />
      
      {/* Accent Gradients */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-primary/5 blur-3xl rounded-full" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
            Stop guessing{' '}
            <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Start booking
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
            Ontdek de beste restaurants bij jou in de buurt en reserveer direct online.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Link href="/discover?nearby=true">
              <Button 
                variant="outline" 
                className="gap-2 bg-background/50 backdrop-blur-sm hover:bg-background/80 border-border/50"
              >
                <MapPin className="h-4 w-4" />
                Bij mij in de buurt
              </Button>
            </Link>
            <Link href="/discover?open_now=true">
              <Button 
                variant="outline" 
                className="gap-2 bg-background/50 backdrop-blur-sm hover:bg-background/80 border-border/50"
              >
                <Clock className="h-4 w-4" />
                Nu open
              </Button>
            </Link>
            <Link href="/discover?today=true">
              <Button 
                variant="outline" 
                className="gap-2 bg-background/50 backdrop-blur-sm hover:bg-background/80 border-border/50"
              >
                <Calendar className="h-4 w-4" />
                Vandaag
              </Button>
            </Link>
            <Link href="/discover?groups=true">
              <Button 
                variant="outline" 
                className="gap-2 bg-background/50 backdrop-blur-sm hover:bg-background/80 border-border/50"
              >
                <Users className="h-4 w-4" />
                Groepen
              </Button>
            </Link>
            <Link href="/discover?deals=true">
              <Button 
                variant="outline" 
                className="gap-2 bg-background/50 backdrop-blur-sm hover:bg-background/80 border-border/50"
              >
                <Tag className="h-4 w-4" />
                Deals
              </Button>
            </Link>
            <Link href="/search">
              <Button 
                variant="outline" 
                className="gap-2 bg-background/50 backdrop-blur-sm hover:bg-background/80 border-border/50"
              >
                <Search className="h-4 w-4" />
                Zoeken
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

