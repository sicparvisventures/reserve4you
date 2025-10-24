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
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Dynamic import of LightRays to avoid SSR issues with WebGL
const LightRays = dynamic(() => import('./LightRays'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gradient-to-br from-primary/10 via-primary/5 to-background" />,
});

export function HeroSection() {
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
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="grid md:grid-cols-2 gap-8 h-full items-center">
          {/* Left Column - Text Content */}
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
              Stop guessing
              <br />
              <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Start booking
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
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

          {/* Right Column - Image */}
          <div className="hidden md:flex items-center justify-center">
            <div className="relative w-full max-w-lg h-[350px] animate-in fade-in-0 zoom-in-95 duration-700 delay-300">
              <Image
                src="/aray.png"
                alt="Reserve4You"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

