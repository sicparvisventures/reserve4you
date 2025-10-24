'use client';

/**
 * Waitlist Manager - Reserve4You
 * 
 * Professional waitlist management with auto-notify,
 * priority sorting, and conversion tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Users, Clock, Calendar, Phone, Mail, Plus, Bell, Check, X, 
  AlertCircle, TrendingUp, Filter, Search, ArrowUpDown 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface WaitlistEntry {
  id: string;
  guest_name: string;
  guest_phone?: string;
  guest_email?: string;
  party_size: number;
  preferred_date: string;
  preferred_time_start: string;
  preferred_time_end?: string;
  status: 'waiting' | 'notified' | 'converted' | 'expired' | 'cancelled';
  notes?: string;
  priority: number;
  notified_at?: string;
  expires_at?: string;
  created_at: string;
  waiting_time: number;
  location_name: string;
}

interface WaitlistManagerProps {
  locationId: string;
  locationName: string;
}

export function WaitlistManager({ locationId, locationName }: WaitlistManagerProps) {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [filteredWaitlist, setFilteredWaitlist] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('waiting');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_phone: '',
    guest_email: '',
    party_size: 2,
    preferred_date: format(new Date(), 'yyyy-MM-dd'),
    preferred_time_start: '19:00',
    preferred_time_end: '21:00',
    notes: '',
    priority: 0,
  });

  // Load waitlist
  const loadWaitlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_location_waitlist', {
        p_location_id: locationId,
        p_status: statusFilter === 'all' ? null : statusFilter
      });

      if (error) throw error;
      setWaitlist(data || []);
    } catch (error) {
      console.error('Error loading waitlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [locationId, statusFilter]);

  useEffect(() => {
    loadWaitlist();
  }, [loadWaitlist]);

  // Filter waitlist
  useEffect(() => {
    let filtered = waitlist;
    
    if (searchQuery) {
      filtered = filtered.filter(entry =>
        entry.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.guest_phone?.includes(searchQuery) ||
        entry.guest_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredWaitlist(filtered);
  }, [waitlist, searchQuery]);

  // Add to waitlist
  const handleAdd = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('add_to_waitlist', {
        p_location_id: locationId,
        p_guest_name: formData.guest_name,
        p_guest_phone: formData.guest_phone || null,
        p_guest_email: formData.guest_email || null,
        p_party_size: formData.party_size,
        p_preferred_date: formData.preferred_date,
        p_preferred_time_start: formData.preferred_time_start,
        p_preferred_time_end: formData.preferred_time_end || null,
        p_notes: formData.notes || null,
        p_priority: formData.priority
      });

      if (error) throw error;

      if (data.success) {
        setShowAddDialog(false);
        loadWaitlist();
        // Reset form
        setFormData({
          guest_name: '',
          guest_phone: '',
          guest_email: '',
          party_size: 2,
          preferred_date: format(new Date(), 'yyyy-MM-dd'),
          preferred_time_start: '19:00',
          preferred_time_end: '21:00',
          notes: '',
          priority: 0,
        });
      }
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      alert('Fout bij toevoegen aan wachtlijst');
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Wachtlijst</h2>
            <p className="text-muted-foreground">
              Beheer wachtende gasten voor {locationName}
            </p>
          </div>
          
          <Button onClick={() => setShowAddDialog(true)} className="gradient-bg">
            <Plus className="h-4 w-4 mr-2" />
            Toevoegen aan Wachtlijst
          </Button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center p-3 rounded-lg bg-warning/10">
            <div className="text-2xl font-bold text-warning">
              {waitlist.filter(e => e.status === 'waiting').length}
            </div>
            <div className="text-xs text-muted-foreground">Wachtend</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-info/10">
            <div className="text-2xl font-bold text-info">
              {waitlist.filter(e => e.status === 'notified').length}
            </div>
            <div className="text-xs text-muted-foreground">Genotificeerd</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-success/10">
            <div className="text-2xl font-bold text-success">
              {waitlist.filter(e => e.status === 'converted').length}
            </div>
            <div className="text-xs text-muted-foreground">Geconverteerd</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">
              {waitlist.length > 0 
                ? Math.round(waitlist.filter(e => e.status === 'converted').length / waitlist.length * 100)
                : 0}%
            </div>
            <div className="text-xs text-muted-foreground">Conversie Rate</div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek op naam, telefoon, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
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
        </div>
      </Card>

      {/* Waitlist Table */}
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
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Probeer een andere zoekopdracht' : 'Voeg gasten toe aan de wachtlijst'}
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
                  {/* Guest Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{entry.guest_name}</h3>
                      <Badge className={getStatusColor(entry.status)}>
                        {entry.status}
                      </Badge>
                      {entry.priority > 0 && (
                        <Badge variant="outline" className="border-primary text-primary">
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
                    
                    {entry.notes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        {entry.notes}
                      </p>
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

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Toevoegen aan Wachtlijst</DialogTitle>
            <DialogDescription>
              Voeg een gast toe aan de wachtlijst voor {locationName}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guest_name">Naam *</Label>
                <Input
                  id="guest_name"
                  value={formData.guest_name}
                  onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="party_size">Aantal Personen *</Label>
                <Input
                  id="party_size"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.party_size}
                  onChange={(e) => setFormData({ ...formData, party_size: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guest_phone">Telefoon</Label>
                <Input
                  id="guest_phone"
                  value={formData.guest_phone}
                  onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                  placeholder="+31 6 12345678"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="guest_email">Email</Label>
                <Input
                  id="guest_email"
                  type="email"
                  value={formData.guest_email}
                  onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preferred_date">Datum *</Label>
                <Input
                  id="preferred_date"
                  type="date"
                  value={formData.preferred_date}
                  onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preferred_time_start">Van *</Label>
                <Input
                  id="preferred_time_start"
                  type="time"
                  value={formData.preferred_time_start}
                  onChange={(e) => setFormData({ ...formData, preferred_time_start: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preferred_time_end">Tot</Label>
                <Input
                  id="preferred_time_end"
                  type="time"
                  value={formData.preferred_time_end}
                  onChange={(e) => setFormData({ ...formData, preferred_time_end: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notities</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Extra informatie..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioriteit</Label>
              <Select
                value={formData.priority.toString()}
                onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Normaal</SelectItem>
                  <SelectItem value="1">Hoog</SelectItem>
                  <SelectItem value="2">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuleren
            </Button>
            <Button onClick={handleAdd} disabled={!formData.guest_name || formData.party_size < 1}>
              Toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

