'use client';

/**
 * Multi-Location CRM - Reserve4You
 * 
 * CRM overview across all locations for a tenant
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Star, 
  TrendingUp, 
  UserPlus,
  Search,
  Calendar,
  Cake,
  Heart,
  Mail,
  Phone,
  MapPin,
  Clock,
  Gift,
  Filter,
  Download,
  Tag,
  StickyNote
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
}

interface GuestProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday: string | null;
  anniversary: string | null;
  dietary_preferences: string[];
  allergies: string[];
  preferred_table_type: string | null;
  vip_status: boolean;
  lifetime_visits: number;
  lifetime_spend_cents: number;
  average_party_size: number;
  favorite_location_id: string | null;
  notes: string | null;
  tags: string[];
  last_visit_date: string | null;
  preferred_booking_time: string | null;
  total_bookings: number;
  upcoming_birthday: boolean;
  upcoming_anniversary: boolean;
}

interface CRMStats {
  date: string;
  total_guests: number;
  vip_guests: number;
  new_guests: number;
  returning_guests: number;
  upcoming_birthdays: number;
  upcoming_anniversaries: number;
  locations: {
    id: string;
    name: string;
    total_guests: number;
    vip_guests: number;
  }[];
}

interface UpcomingOccasion {
  consumer_id: string;
  consumer_name: string;
  consumer_email: string;
  consumer_phone: string;
  occasion_type: 'birthday' | 'anniversary';
  occasion_date: string;
  favorite_location_id: string | null;
  vip_status: boolean;
  lifetime_visits: number;
}

interface MultiLocationCRMProps {
  tenantId: string;
  locations: Location[];
}

export function MultiLocationCRM({ tenantId, locations }: MultiLocationCRMProps) {
  const [stats, setStats] = useState<CRMStats | null>(null);
  const [occasions, setOccasions] = useState<UpcomingOccasion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'guests' | 'occasions'>('overview');

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      // Load tenant-wide stats
      const { data: statsData, error: statsError } = await supabase.rpc('get_tenant_crm_stats', {
        p_tenant_id: tenantId,
        p_date: format(new Date(), 'yyyy-MM-dd')
      });

      if (statsError) throw statsError;
      setStats(statsData);

      // Load upcoming occasions
      const { data: occasionsData, error: occasionsError } = await supabase.rpc('get_upcoming_occasions', {
        p_tenant_id: tenantId,
        p_days_ahead: 30
      });

      if (occasionsError) throw occasionsError;
      setOccasions(occasionsData || []);
    } catch (error) {
      console.error('Error loading CRM data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOccasions = occasions.filter(occasion => {
    if (selectedLocationId !== 'all' && occasion.favorite_location_id !== selectedLocationId) {
      return false;
    }
    if (searchQuery && !occasion.consumer_name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const locationMap = locations.reduce((acc, loc) => {
    acc[loc.id] = loc.name;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <TrendingUp className="h-4 w-4 mr-2" />
            Overzicht
          </TabsTrigger>
          <TabsTrigger value="guests">
            <Users className="h-4 w-4 mr-2" />
            Alle Gasten
          </TabsTrigger>
          <TabsTrigger value="occasions">
            <Gift className="h-4 w-4 mr-2" />
            Speciale Momenten
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stats ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-info" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.total_guests}</div>
                      <div className="text-xs text-muted-foreground">Totaal</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Star className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.vip_guests}</div>
                      <div className="text-xs text-muted-foreground">VIP</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <UserPlus className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.new_guests}</div>
                      <div className="text-xs text-muted-foreground">Nieuw</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.returning_guests}</div>
                      <div className="text-xs text-muted-foreground">Terugkerend</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                      <Cake className="h-5 w-5 text-pink-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.upcoming_birthdays}</div>
                      <div className="text-xs text-muted-foreground">Verjaardagen</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.upcoming_anniversaries}</div>
                      <div className="text-xs text-muted-foreground">Jubilea</div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Locations Breakdown */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Per Locatie
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.locations.map((location) => (
                    <div
                      key={location.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="font-semibold mb-2">{location.name}</div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Totaal Gasten</span>
                        <Badge variant="secondary">{location.total_guests}</Badge>
                      </div>
                      {location.vip_guests > 0 && (
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-muted-foreground">VIP Gasten</span>
                          <Badge variant="outline" className="border-warning text-warning">
                            <Star className="h-3 w-3 mr-1" />
                            {location.vip_guests}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* All Guests Tab */}
        <TabsContent value="guests" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Alle Gasten</h3>
              <div className="flex gap-2">
                <select
                  className="px-3 py-2 text-sm border rounded-md"
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                >
                  <option value="all">Alle Locaties</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Selecteer een specifieke locatie om gasten te bekijken</p>
              <p className="text-sm mt-2">Of ga naar een locatie pagina voor gedetailleerd CRM beheer</p>
            </div>
          </Card>
        </TabsContent>

        {/* Special Occasions Tab */}
        <TabsContent value="occasions" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Aankomende Speciale Momenten
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Zoek gast..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
                <select
                  className="px-3 py-2 text-sm border rounded-md"
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                >
                  <option value="all">Alle Locaties</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredOccasions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Geen aankomende speciale momenten</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOccasions.map((occasion) => (
                  <div
                    key={`${occasion.consumer_id}-${occasion.occasion_type}`}
                    className={`p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                      occasion.occasion_type === 'birthday' 
                        ? 'border-pink-500/20 bg-pink-500/5' 
                        : 'border-purple-500/20 bg-purple-500/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{occasion.consumer_name}</h4>
                          {occasion.vip_status && (
                            <Badge className="bg-warning/20 text-warning border-warning">
                              <Star className="h-3 w-3 mr-1" />
                              VIP
                            </Badge>
                          )}
                          <Badge className={
                            occasion.occasion_type === 'birthday'
                              ? 'bg-pink-500/20 text-pink-500 border-pink-500'
                              : 'bg-purple-500/20 text-purple-500 border-purple-500'
                          }>
                            {occasion.occasion_type === 'birthday' ? (
                              <><Cake className="h-3 w-3 mr-1" /> Verjaardag</>
                            ) : (
                              <><Heart className="h-3 w-3 mr-1" /> Jubileum</>
                            )}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(occasion.occasion_date), 'd MMMM yyyy', { locale: nl })}
                          </div>
                          {occasion.consumer_email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {occasion.consumer_email}
                            </div>
                          )}
                          {occasion.consumer_phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {occasion.consumer_phone}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="secondary">
                            {occasion.lifetime_visits} bezoeken
                          </Badge>
                          {occasion.favorite_location_id && locationMap[occasion.favorite_location_id] && (
                            <Badge variant="outline">
                              <MapPin className="h-3 w-3 mr-1" />
                              {locationMap[occasion.favorite_location_id]}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button size="sm" className="gradient-bg">
                        <Mail className="h-4 w-4 mr-2" />
                        Contact
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

