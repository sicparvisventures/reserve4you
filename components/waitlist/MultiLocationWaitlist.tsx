'use client';

/**
 * Multi-Location Waitlist - Reserve4You
 * 
 * Combined waitlist view for all locations
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, Clock, Calendar, Phone, Mail, Building2, Filter, Search,
  Bell, Check, X, AlertCircle, TrendingUp
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Location {
  id: string;
  name: string;
}

interface WaitlistEntry {
  id: string;
  location_id: string;
  location_name: string;
  guest_name: string;
  guest_phone?: string;
  guest_email?: string;
  party_size: number;
  preferred_date: string;
  preferred_time_start: string;
  preferred_time_end?: string;
  status: string;
  notes?: string;
  priority: number;
  notified_at?: string;
  expires_at?: string;
  created_at: string;
  waiting_time: number;
}

interface MultiLocationWaitlistProps {
  tenantId: string;
  locations: Location[];
}

export function MultiLocationWaitlist({ tenantId, locations }: MultiLocationWaitlistProps) {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [filteredWaitlist, setFilteredWaitlist] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('waiting');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Load waitlist
  const loadWaitlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error} = await supabase.rpc('get_tenant_waitlist', {
        p_tenant_id: tenantId,
        p_status: statusFilter === 'all' ? null : statusFilter,
        p_date: dateFilter === 'all' ? null : dateFilter
      });

      if (error) throw error;
      setWaitlist(data || []);
    } catch (error) {
      console.error('Error loading waitlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, statusFilter, dateFilter]);

  useEffect(() => {
    loadWaitlist();
  }, [loadWaitlist]);

  // Filter waitlist
  useEffect(() => {
    let filtered = waitlist;
    
    if (selectedLocationId !== 'all') {
      filtered = filtered.filter(e => e.location_id === selectedLocationId);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(entry =>
        entry.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.guest_phone?.includes(searchQuery) ||
        entry.guest_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.location_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredWaitlist(filtered);
  }, [waitlist, selectedLocationId, searchQuery]);

  // Update status
  const handleUpdateStatus = async (waitlistId: string, newStatus: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('update_waitlist_status', {
        p_waitlist_id: waitlistId,
        p_new_status: newStatus
      });

      if (error) throw error;
      if (data.success) {
        loadWaitlist();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Fout bij updaten status');
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-warning/10 text-warning border-warning/20';
      case 'notified': return 'bg-info/10 text-info border-info/20';
      case 'converted': return 'bg-success/10 text-success border-success/20';
      case 'expired': return 'bg-muted text-muted-foreground border-border';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return '';
    }
  };

  // Format waiting time
  const formatWaitTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}u ${minutes}m`;
    return `${minutes}m`;
  };

  // Stats
  const stats = {
    total: filteredWaitlist.length,
    waiting: filteredWaitlist.filter(e => e.status === 'waiting').length,
    notified: filteredWaitlist.filter(e => e.status === 'notified').length,
    converted: filteredWaitlist.filter(e => e.status === 'converted').length,
    conversionRate: filteredWaitlist.length > 0
      ? Math.round(filteredWaitlist.filter(e => e.status === 'converted').length / filteredWaitlist.length * 100)
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <Card className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Totaal</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-warning/10">
            <div className="text-2xl font-bold text-warning">{stats.waiting}</div>
            <div className="text-xs text-muted-foreground">Wachtend</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-info/10">
            <div className="text-2xl font-bold text-info">{stats.notified}</div>
            <div className="text-xs text-muted-foreground">Genotificeerd</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-success/10">
            <div className="text-2xl font-bold text-success">{stats.converted}</div>
            <div className="text-xs text-muted-foreground">Geconverteerd</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <div className="text-2xl font-bold text-primary">{stats.conversionRate}%</div>
            <div className="text-xs text-muted-foreground">Conversie</div>
          </div>
        </div>

        {/* Location chips */}
        {selectedLocationId === 'all' && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            {locations.map(location => {
              const locationCount = waitlist.filter(e => e.location_id === location.id && e.status === 'waiting').length;
              if (locationCount === 0) return null;
              return (
                <Badge
                  key={location.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => setSelectedLocationId(location.id)}
                >
                  <Building2 className="h-3 w-3 mr-1" />
                  {location.name} ({locationCount})
                </Badge>
              );
            })}
          </div>
        )}
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Locaties</SelectItem>
              {locations.map(location => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="waiting">Wachtend</SelectItem>
              <SelectItem value="notified">Genotificeerd</SelectItem>
              <SelectItem value="converted">Geconverteerd</SelectItem>
              <SelectItem value="expired">Verlopen</SelectItem>
              <SelectItem value="cancelled">Geannuleerd</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Datums</SelectItem>
              <SelectItem value={format(new Date(), 'yyyy-MM-dd')}>Vandaag</SelectItem>
              <SelectItem value={format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')}>Morgen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Waitlist */}
      <Card className="p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laden...</p>
          </div>
        ) : filteredWaitlist.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Geen entries gevonden</h3>
            <p className="text-muted-foreground">
              Probeer een andere filter combinatie
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWaitlist.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{entry.guest_name}</h3>
                      <Badge className={getStatusColor(entry.status)}>
                        {entry.status}
                      </Badge>
                      <Badge variant="outline" className="border-primary">
                        <Building2 className="h-3 w-3 mr-1" />
                        {entry.location_name}
                      </Badge>
                      {entry.priority > 0 && (
                        <Badge variant="outline" className="border-warning text-warning">
                          Prioriteit {entry.priority}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{entry.party_size} personen</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(entry.preferred_date), 'd MMM yyyy', { locale: nl })}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {entry.preferred_time_start.substring(0, 5)}
                          {entry.preferred_time_end && ` - ${entry.preferred_time_end.substring(0, 5)}`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <span>Wacht {formatWaitTime(entry.waiting_time)}</span>
                      </div>
                    </div>
                    
                    {(entry.guest_phone || entry.guest_email) && (
                      <div className="flex flex-wrap gap-3 mt-2 text-sm">
                        {entry.guest_phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{entry.guest_phone}</span>
                          </div>
                        )}
                        {entry.guest_email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{entry.guest_email}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {entry.status === 'waiting' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(entry.id, 'notified')}
                          className="border-info text-info hover:bg-info/10"
                        >
                          <Bell className="h-4 w-4 mr-1" />
                          Notificeer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(entry.id, 'converted')}
                          className="border-success text-success hover:bg-success/10"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Converteer
                        </Button>
                      </>
                    )}
                    
                    {entry.status === 'notified' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(entry.id, 'converted')}
                        className="border-success text-success hover:bg-success/10"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Converteer
                      </Button>
                    )}
                    
                    {['waiting', 'notified'].includes(entry.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(entry.id, 'cancelled')}
                        className="border-destructive text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Annuleer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

