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
    <div className="relative overflow-hidden border-b border-border h-[450px] md:h-[420px]">
      {/* Background Image - heray.png met 60% opacity */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/heray.png"
          alt="Reserve4You Hero Background"
          fill
          className="object-cover"
          style={{ opacity: 0.6 }}
          priority
          quality={90}
        />
      </div>

      {/* Gradient Overlay voor leesbaarheid - Multi-layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/85" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/98 via-transparent to-transparent" />
      
      {/* Subtle Warm Accent Gradients */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-primary/6 via-accent-sunset/4 to-transparent blur-3xl" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-primary/5 via-secondary-amber/3 to-transparent blur-3xl" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-8 h-full items-center">
          {/* Left Column - Text Content */}
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight drop-shadow-lg">
              Stop guessing
              <br />
              <span className="text-primary drop-shadow-lg">
                Start booking
              </span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/90 mb-6 max-w-2xl leading-relaxed drop-shadow-md font-medium">
              Ontdek de beste restaurants bij jou in de buurt en reserveer direct online.
            </p>
          </div>

          {/* Right Column - Filter Selection Card */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md bg-white/80 backdrop-blur-lg border border-border/60 rounded-xl p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Selecteer filters
                </h3>
                {selectedFilters.size > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {selectedFilters.size} {selectedFilters.size === 1 ? 'filter' : 'filters'}
                  </span>
                )}
              </div>

              {/* Filter Buttons Grid - Compact 2 columns */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {filterOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedFilters.has(option.key);
                  
                  return (
                    <button
                      key={option.key}
                      onClick={() => toggleFilter(option.key)}
                      className={`
                        relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg
                        border-2 transition-all duration-200 group
                        ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary shadow-md shadow-primary/20 scale-[1.02]'
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
                      
                      <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                      <span className={`text-[10px] font-medium text-center leading-tight ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}

                {/* Zoeken Button (goes to /search) */}
                <button
                  onClick={() => router.push('/search')}
                  className="
                    relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg
                    border-2 transition-all duration-200 group
                    bg-background/50 border-border/50 hover:border-primary/30 hover:bg-background/80
                  "
                >
                  <SearchIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  <span className="text-[10px] font-medium text-center leading-tight text-foreground">
                    Zoeken
                  </span>
                </button>
              </div>

              {/* Search Action Button - Compact */}
              <Button
                onClick={handleSearch}
                className="w-full gap-2 shadow-lg hover:shadow-xl transition-shadow h-10"
              >
                {selectedFilters.size > 0 ? (
                  <>
                    Zoek met {selectedFilters.size} {selectedFilters.size === 1 ? 'filter' : 'filters'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Toon alle restaurants
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

