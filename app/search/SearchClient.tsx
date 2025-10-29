'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MapPin, 
  Clock, 
  Calendar, 
  Users, 
  Tag,
  Filter,
  ArrowRight
} from 'lucide-react';

interface SearchClientProps {
  initialQuery?: string;
}

export function SearchClient({ initialQuery = '' }: SearchClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [query, setQuery] = useState(initialQuery);
  const [selectedFilters, setSelectedFilters] = useState<{
    nearby?: boolean;
    openNow?: boolean;
    today?: boolean;
    groups?: boolean;
    deals?: boolean;
  }>({});

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (query) params.set('query', query);
    if (selectedFilters.nearby) params.set('nearby', 'true');
    if (selectedFilters.openNow) params.set('open_now', 'true');
    if (selectedFilters.today) params.set('today', 'true');
    if (selectedFilters.groups) params.set('groups', 'true');
    if (selectedFilters.deals) params.set('deals', 'true');
    
    startTransition(() => {
      router.push(`/discover?${params.toString()}`);
    });
  };

  const toggleFilter = (filter: keyof typeof selectedFilters) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  const quickSearches = [
    { label: 'Italiaans', query: 'Italiaans', icon: '🍝' },
    { label: 'Sushi', query: 'Sushi', icon: '🍣' },
    { label: 'Frans', query: 'Frans', icon: '🥖' },
    { label: 'Grieks', query: 'Grieks', icon: '🇬🇷' },
    { label: 'Mexicaans', query: 'Mexicaans', icon: '🌮' },
    { label: 'Thais', query: 'Thais', icon: '🍜' },
  ];

  return (
    <div className="space-y-8">
      {/* Main Search Bar */}
      <Card className="p-6 bg-background/60 backdrop-blur-sm border-2 border-primary/20 shadow-lg">
        <div className="space-y-6">
          {/* Search Input */}
          <div>
            <Label htmlFor="search" className="text-base font-semibold mb-3 block">
              Wat zoek je?
            </Label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
              <Input
                id="search"
                type="text"
                placeholder="Restaurant naam, gerecht, keuken type, locatie..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-14 h-14 text-lg"
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              <Filter className="inline h-4 w-4 mr-2" />
              Filters
            </Label>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={selectedFilters.nearby ? "default" : "outline"}
                size="lg"
                onClick={() => toggleFilter('nearby')}
                className="gap-2"
              >
                <MapPin className="h-5 w-5" />
                Bij mij in de buurt
              </Button>
              <Button
                variant={selectedFilters.openNow ? "default" : "outline"}
                size="lg"
                onClick={() => toggleFilter('openNow')}
                className="gap-2"
              >
                <Clock className="h-5 w-5" />
                Nu open
              </Button>
              <Button
                variant={selectedFilters.today ? "default" : "outline"}
                size="lg"
                onClick={() => toggleFilter('today')}
                className="gap-2"
              >
                <Calendar className="h-5 w-5" />
                Vandaag beschikbaar
              </Button>
              <Button
                variant={selectedFilters.groups ? "default" : "outline"}
                size="lg"
                onClick={() => toggleFilter('groups')}
                className="gap-2"
              >
                <Users className="h-5 w-5" />
                Groepen
              </Button>
              <Button
                variant={selectedFilters.deals ? "default" : "outline"}
                size="lg"
                onClick={() => toggleFilter('deals')}
                className="gap-2"
              >
                <Tag className="h-5 w-5" />
                Speciale deals
              </Button>
            </div>
          </div>

          {/* Search Button */}
          <Button
            size="lg"
            onClick={handleSearch}
            disabled={isPending}
            className="w-full h-14 text-lg font-semibold gap-3"
          >
            {isPending ? 'Zoeken...' : 'Zoeken'}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </Card>

      {/* Quick Searches */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Populaire zoekopdrachten
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickSearches.map((item) => (
            <button
              key={item.query}
              onClick={() => {
                setQuery(item.query);
                startTransition(() => {
                  router.push(`/discover?query=${encodeURIComponent(item.query)}`);
                });
              }}
              className="group"
            >
              <Card className="p-6 hover:border-primary hover:shadow-lg transition-all text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {item.label}
                </p>
              </Card>
            </button>
          ))}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-background border-primary/20">
          <MapPin className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Bij jou in de buurt
          </h3>
          <p className="text-sm text-muted-foreground">
            Vind restaurants binnen 25km van jouw locatie
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-primary/5 to-background border-primary/20">
          <Clock className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Direct reserveren
          </h3>
          <p className="text-sm text-muted-foreground">
            Zie welke restaurants nu open zijn en direct beschikbaar
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-primary/5 to-background border-primary/20">
          <Tag className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Speciale aanbiedingen
          </h3>
          <p className="text-sm text-muted-foreground">
            Profiteer van exclusieve deals en kortingen
          </p>
        </Card>
      </div>
    </div>
  );
}

