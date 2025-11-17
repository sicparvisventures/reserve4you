'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Clock,
  Calendar,
  Users,
  Tag,
  Search as SearchIcon,
  ArrowRight,
  Check,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Dynamic import of LightRays to avoid SSR issues with WebGL
const LightRays = dynamic(() => import('./LightRays'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gradient-to-br from-primary/10 via-primary/5 to-background" />,
});

interface FilterOption {
  key: string;
  label: string;
  icon: React.ElementType;
  param: string;
}

const filterOptions: FilterOption[] = [
  { key: 'nearby', label: 'Bij mij in de buurt', icon: MapPin, param: 'nearby' },
  { key: 'open_now', label: 'Nu open', icon: Clock, param: 'open_now' },
  { key: 'today', label: 'Vandaag', icon: Calendar, param: 'today' },
  { key: 'groups', label: 'Groepen', icon: Users, param: 'groups' },
  { key: 'deals', label: 'Deals', icon: Tag, param: 'deals' },
];

export function HeroSection() {
  const router = useRouter();
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());

  const toggleFilter = (filterKey: string) => {
    setSelectedFilters((prev) => {
      const newFilters = new Set(prev);
      if (newFilters.has(filterKey)) {
        newFilters.delete(filterKey);
      } else {
        newFilters.add(filterKey);
      }
      return newFilters;
    });
  };

  const handleSearch = () => {
    if (selectedFilters.size === 0) {
      // No filters selected, go to discover page
      router.push('/discover');
      return;
    }

    // Build query string from selected filters
    const params = new URLSearchParams();
    filterOptions.forEach((option) => {
      if (selectedFilters.has(option.key)) {
        params.set(option.param, 'true');
      }
    });

    router.push(`/discover?${params.toString()}`);
  };

  return (
    <div className="relative overflow-hidden border-b border-border h-screen min-h-[100vh]">
      {/* Background Image - heray.png met 70% opacity */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/heray.png"
          alt="Reserve4You Hero Background"
          fill
          className="object-cover"
          style={{ opacity: 0.7 }}
          priority
          quality={90}
        />
      </div>

      {/* Light Gradient Overlay voor tekst leesbaarheid */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/40 via-background/30 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full py-8 sm:py-10 lg:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 h-full items-center">
          {/* Filter Selection Card - First on mobile, Right on desktop */}
          <div className="flex flex-col items-center justify-center order-1 md:order-2 gap-4 md:gap-0">
            <div className="w-full max-w-md bg-white/85 backdrop-blur-lg border border-border/60 rounded-2xl p-4 sm:p-5 lg:p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Selecteer filters
                </h3>
                {selectedFilters.size > 0 && (
                  <span className="text-[11px] sm:text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {selectedFilters.size} {selectedFilters.size === 1 ? 'filter' : 'filters'}
                  </span>
                )}
              </div>

              {/* Filter Buttons Grid - Compact 2 columns */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 mb-3 sm:mb-4">
                {filterOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedFilters.has(option.key);
                  
                  return (
                    <button
                      key={option.key}
                      onClick={() => toggleFilter(option.key)}
                      className={`
                        relative flex flex-col items-center justify-center gap-1 sm:gap-1.5 p-2.5 sm:p-3.5 rounded-lg
                        border transition-all duration-200 group min-h-[60px] sm:min-h-[70px]
                        ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary shadow-md shadow-primary/20 scale-[1.01]'
                            : 'bg-background/50 border-border/50 hover:border-primary/30 hover:bg-background/80'
                        }
                      `}
                    >
                      {/* Selected Checkmark */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full p-0.5">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      )}
                      
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                      <span className={`text-[11px] sm:text-xs font-medium text-center leading-tight ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}

                {/* Zoeken Button (goes to /search) */}
                <button
                  onClick={() => router.push('/search')}
                  className="
                    relative flex flex-col items-center justify-center gap-1 sm:gap-1.5 p-2.5 sm:p-3.5 rounded-lg
                    border transition-all duration-200 group min-h-[60px] sm:min-h-[70px]
                    bg-background/50 border-border/50 hover:border-primary/30 hover:bg-background/80
                  "
                >
                  <SearchIcon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-foreground" />
                  <span className="text-[11px] sm:text-xs font-medium text-center leading-tight text-foreground">
                    Zoeken
                  </span>
                </button>
              </div>

              {/* Search Action Button - Compact */}
              <Button
                onClick={handleSearch}
                className="w-full gap-2 shadow-lg hover:shadow-xl transition-shadow h-11 sm:h-12 text-sm sm:text-base font-semibold"
              >
                {selectedFilters.size > 0 ? (
                  <>
                    Zoek met {selectedFilters.size} {selectedFilters.size === 1 ? 'filter' : 'filters'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Toon alle locaties
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
            
            {/* Logo - Only visible on mobile, below filters */}
            <div className="flex items-center justify-center md:hidden pt-2">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                <Image
                  src="/raylogo.png"
                  alt="Reserve4You"
                  fill
                  className="object-contain drop-shadow-lg"
                  priority
                  sizes="(max-width: 768px) 96px, 0px"
                />
              </div>
            </div>
          </div>

          {/* Left Column - Text Content - Second on mobile, Left on desktop */}
          <div className="flex flex-col justify-start pt-2 sm:pt-4 md:pt-6 lg:pt-8 order-2 md:order-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-3 sm:mb-4 leading-tight drop-shadow-lg">
              Stop guessing
              <br />
              <span className="text-primary drop-shadow-lg">
                Start booking
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-foreground/90 mb-4 sm:mb-6 max-w-2xl leading-relaxed drop-shadow-md font-medium">
              Van diner tot trimmer, van dokter tot trainer – Reserve4You, jouw boekingspartner.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

