'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Award,
  MapPin,
  Star,
  Euro,
  ChevronLeft,
  ChevronRight,
  Tag,
  Calendar,
  TrendingUp,
  Eye,
  MousePointerClick,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnzeKeuzeLocation {
  id: string;
  name: string;
  slug: string;
  description: string;
  cuisine_type: string;
  price_range: number;
  address_line1: string;
  city: string;
  banner_image_url?: string;
  hero_image_url?: string;
  average_rating: number;
  review_count: number;
  onze_keuze_rank: number;
  has_deals: boolean;
  weekly_views?: number;
  weekly_clicks?: number;
}

interface OnzeKeuzeCarouselProps {
  locations: OnzeKeuzeLocation[];
}

export function OnzeKeuzeCarousel({ locations }: OnzeKeuzeCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Auto-advance carousel with progress bar
  useEffect(() => {
    if (!isAutoPlaying || isPaused || locations.length <= 1) return;

    const duration = 6000; // 6 seconds per slide
    const startTime = Date.now();

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
    }, 50);

    const slideInterval = setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % locations.length);
        setProgress(0);
        setIsTransitioning(false);
      }, 300);
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(slideInterval);
    };
  }, [isAutoPlaying, isPaused, locations.length, currentIndex]);

  const goToSlide = useCallback((index: number) => {
    if (index === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setProgress(0);
      setIsAutoPlaying(false);
      setIsTransitioning(false);
    }, 300);
  }, [currentIndex]);

  const goToPrevious = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + locations.length) % locations.length);
      setProgress(0);
      setIsAutoPlaying(false);
      setIsTransitioning(false);
    }, 300);
  }, [locations.length]);

  const goToNext = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % locations.length);
      setProgress(0);
      setIsAutoPlaying(false);
      setIsTransitioning(false);
    }, 300);
  }, [locations.length]);

  if (!locations || locations.length === 0) {
    return null;
  }

  const currentLocation = locations[currentIndex];
  const imageUrl = currentLocation.banner_image_url || currentLocation.hero_image_url;

  return (
    <section className="relative overflow-hidden">
      {/* Animated Background - Reserve4You Colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-primary/5 animate-gradient-shift" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,90,95,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,90,95,0.08),transparent_50%)]" />
      
      {/* Top Border with Gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 lg:py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 md:mb-10">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
              Onze Keuze
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-0.5 font-medium">
              Top 10 deze week - Meest populair
            </p>
          </div>

          {/* Navigation Arrows - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              disabled={isTransitioning}
              className="rounded-full h-10 w-10 border-2 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              disabled={isTransitioning}
              className="rounded-full h-10 w-10 border-2 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Carousel Container */}
        <div
          className="relative group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Progress Bar */}
          {isAutoPlaying && !isPaused && locations.length > 1 && (
            <div className="absolute -top-1 left-0 right-0 h-1 bg-muted/20 rounded-full overflow-hidden z-20">
              <div 
                className="h-full bg-primary transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <Card className={cn(
            "overflow-hidden border-2 shadow-2xl transition-all duration-500",
            "border-primary/20 hover:border-primary/30",
            "bg-gradient-to-br from-white via-white to-primary/[0.02]",
            isTransitioning && "scale-[0.98] opacity-90"
          )}>
            <div className="flex flex-col md:flex-row">
              {/* Image Section */}
              <div className="md:w-1/2 relative h-[280px] sm:h-[320px] md:h-[500px] lg:h-[550px]">
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt={currentLocation.name}
                      className={cn(
                        "w-full h-full object-cover transition-all duration-700",
                        isTransitioning && "scale-110 blur-sm"
                      )}
                    />
                    {/* Premium Vignette Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/30" />
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 flex items-center justify-center relative overflow-hidden">
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,90,95,0.3),transparent_70%)] animate-pulse" />
                    </div>
                    <div className="text-center relative z-10">
                      <Award className="h-20 w-20 md:h-24 md:w-24 mx-auto text-primary/40 mb-4 animate-pulse" />
                      <p className="text-muted-foreground font-semibold text-lg">Onze Keuze Locatie</p>
                    </div>
                  </div>
                )}

                {/* Multi-Layer Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />

                {/* Onze Keuze Badge with Rank */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 animate-in slide-in-from-left duration-500">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary rounded-lg blur-md opacity-75" />
                    <Badge className="relative bg-primary text-white border-0 shadow-xl px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base font-bold flex items-center gap-2 backdrop-blur-sm">
                      <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="tracking-wide">#{currentLocation.onze_keuze_rank}</span>
                    </Badge>
                  </div>
                </div>

                {/* Deals Badge */}
                {currentLocation.has_deals && (
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 animate-in slide-in-from-right duration-500">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 rounded-lg blur-md opacity-75" />
                      <Badge className="relative bg-gradient-to-r from-primary to-primary/80 text-white border-0 shadow-xl px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm backdrop-blur-sm">
                        <Tag className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                        <span className="font-semibold">Aanbieding</span>
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Navigation Arrows - Mobile (On Image) */}
                <div className="md:hidden absolute inset-0 flex items-center justify-between px-2 sm:px-3 pointer-events-none">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToPrevious}
                    disabled={isTransitioning}
                    className="pointer-events-auto rounded-full bg-white/95 backdrop-blur-md hover:bg-white hover:scale-110 border-2 shadow-lg transition-all duration-300 disabled:opacity-50 h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNext}
                    disabled={isTransitioning}
                    className="pointer-events-auto rounded-full bg-white/95 backdrop-blur-md hover:bg-white hover:scale-110 border-2 shadow-lg transition-all duration-300 disabled:opacity-50 h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              </div>

              {/* Content Section */}
              <div className="md:w-1/2 p-5 sm:p-6 md:p-8 lg:p-10 xl:p-12 flex flex-col justify-between bg-gradient-to-br from-white via-white to-primary/[0.01]">
                <div className={cn(
                  "transition-all duration-500",
                  isTransitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
                )}>
                  {/* Restaurant Name with Gradient */}
                  <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 md:mb-5 leading-tight">
                    <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                      {currentLocation.name}
                    </span>
                  </h3>

                  {/* Metadata - Enhanced Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 mb-4 sm:mb-5 md:mb-6 lg:mb-7">
                    {currentLocation.cuisine_type && (
                      <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 font-semibold shadow-sm">
                        {currentLocation.cuisine_type}
                      </Badge>
                    )}
                    {currentLocation.price_range && (
                      <Badge variant="outline" className="gap-0.5 px-2 sm:px-3 py-0.5 sm:py-1 border-2 font-semibold shadow-sm">
                        {Array.from({ length: currentLocation.price_range }).map((_, i) => (
                          <Euro key={i} className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                        ))}
                      </Badge>
                    )}
                    {currentLocation.average_rating > 0 && (
                      <div className="flex items-center gap-1 sm:gap-1.5 bg-primary/10 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-primary/20 shadow-sm">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-primary fill-primary" />
                        <span className="text-xs sm:text-sm font-bold text-primary">
                          {currentLocation.average_rating.toFixed(1)}
                        </span>
                        {currentLocation.review_count > 0 && (
                          <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                            ({currentLocation.review_count})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description - Better Typography */}
                  {currentLocation.description && (
                    <p className="text-sm sm:text-base md:text-lg text-foreground/75 mb-4 sm:mb-5 md:mb-6 lg:mb-8 line-clamp-2 sm:line-clamp-3 md:line-clamp-4 leading-relaxed font-medium">
                      {currentLocation.description}
                    </p>
                  )}

                  {/* Location - Enhanced */}
                  <div className="flex items-start gap-2 sm:gap-2.5 text-muted-foreground mb-5 sm:mb-6 md:mb-8 lg:mb-10 p-2.5 sm:p-3 rounded-lg bg-muted/30 border border-border/50">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0 text-primary mt-0.5" />
                    <span className="text-xs sm:text-sm md:text-base font-medium">
                      {currentLocation.address_line1}
                      {currentLocation.city && `, ${currentLocation.city}`}
                    </span>
                  </div>
                </div>

                {/* CTA Buttons - Premium Styling */}
                <div className={cn(
                  "flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-4 transition-all duration-700 delay-100",
                  isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
                )}>
                  <Link href={`/p/${currentLocation.slug}`} className="flex-1">
                    <Button
                      size="lg"
                      className="w-full h-11 sm:h-12 md:h-13 lg:h-14 bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] font-bold text-sm sm:text-base md:text-lg group"
                    >
                      <Calendar className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 group-hover:scale-110 transition-transform" />
                      Reserveren Nu
                    </Button>
                  </Link>
                  <Link href={`/p/${currentLocation.slug}`} className="flex-1 sm:flex-initial sm:min-w-[140px] md:min-w-[160px]">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full h-11 sm:h-12 md:h-13 lg:h-14 border-2 border-primary text-primary hover:bg-primary/5 hover:border-primary font-semibold text-sm sm:text-base md:text-lg transition-all duration-300"
                    >
                      Meer Info
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          {/* Dots Navigation - Enhanced */}
          {locations.length > 1 && (
            <div className="flex items-center justify-center gap-2 sm:gap-2.5 mt-6 sm:mt-7 md:mt-8">
              {locations.map((location, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  disabled={isTransitioning}
                  className={cn(
                    'group relative transition-all duration-300 rounded-full disabled:cursor-not-allowed',
                    index === currentIndex
                      ? 'w-10 h-2 sm:w-12 sm:h-2.5'
                      : 'w-2 h-2 sm:w-2.5 sm:h-2.5 hover:w-3 hover:h-2 sm:hover:w-4 sm:hover:h-2.5'
                  )}
                  aria-label={`Go to ${location.name}`}
                >
                  {index === currentIndex ? (
                    <>
                      <div className="absolute inset-0 bg-primary rounded-full blur-sm opacity-50" />
                      <div className="relative w-full h-full bg-primary rounded-full shadow-md" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-muted-foreground/25 group-hover:bg-primary/50 rounded-full transition-all duration-300" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Progress Indicator with Stats */}
        {locations.length > 1 && (
          <div className="text-center mt-3 sm:mt-4 md:mt-5">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-muted/50 border border-border/50">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-foreground">
                  {currentIndex + 1} / {locations.length}
                </span>
              </div>
              <div className="w-px h-2.5 sm:h-3 bg-border" />
              <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium">
                Top Deze Week
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom Border with Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </section>
  );
}

