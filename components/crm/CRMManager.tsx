'use client';

/**
 * CRM Manager - Reserve4You
 * 
 * Complete CRM system for managing guest profiles, preferences, and relationships
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Star, 
  Calendar, 
  Heart, 
  Search, 
  Filter,
  UserPlus,
  TrendingUp,
  Gift,
  Phone,
  Mail,
  MapPin,
  Clock,
  Edit,
  Save,
  X,
  Cake,
  PartyPopper,
  Tag,
  StickyNote
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';

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
  total_guests: number;
  vip_guests: number;
  new_guests: number;
  returning_guests: number;
  upcoming_birthdays: number;
  upcoming_anniversaries: number;
}

interface CRMManagerProps {
  locationId: string;
  locationName: string;
}

export function CRMManager({ locationId, locationName }: CRMManagerProps) {
  const [guests, setGuests] = useState<GuestProfile[]>([]);
  const [stats, setStats] = useState<CRMStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [vipFilter, setVipFilter] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<GuestProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<GuestProfile>>({});

  useEffect(() => {
    loadData();
  }, [locationId, searchQuery, vipFilter, tagFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      // Load stats
      const { data: statsData, error: statsError } = await supabase.rpc('get_location_crm_stats', {
        p_location_id: locationId,
        p_date: format(new Date(), 'yyyy-MM-dd')
      });

      if (statsError) throw statsError;
      setStats(statsData);

      // Load guests
      const { data: guestsData, error: guestsError } = await supabase.rpc('get_location_guests', {
        p_location_id: locationId,
        p_search: searchQuery || null,
        p_vip_only: vipFilter,
        p_tag_filter: tagFilter,
        p_limit: 100,
        p_offset: 0
      });

      if (guestsError) throw guestsError;
      setGuests(guestsData || []);
    } catch (error) {
      console.error('Error loading CRM data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditGuest = (guest: GuestProfile) => {
    setSelectedGuest(guest);
    setEditForm({
      birthday: guest.birthday,
      anniversary: guest.anniversary,
      dietary_preferences: guest.dietary_preferences,
      allergies: guest.allergies,
      preferred_table_type: guest.preferred_table_type,
      vip_status: guest.vip_status,
      notes: guest.notes,
      tags: guest.tags
    });
    setIsEditing(true);
  };

  const handleSaveGuest = async () => {
    if (!selectedGuest) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('update_consumer_profile', {
        p_consumer_id: selectedGuest.id,
        p_birthday: editForm.birthday || null,
        p_anniversary: editForm.anniversary || null,
        p_dietary_preferences: editForm.dietary_preferences || [],
        p_allergies: editForm.allergies || [],
        p_preferred_table_type: editForm.preferred_table_type || null,
        p_vip_status: editForm.vip_status || false,
        p_notes: editForm.notes || null,
        p_tags: editForm.tags || []
      });

      if (error) throw error;

      setIsEditing(false);
      setSelectedGuest(null);
      loadData();
    } catch (error) {
      console.error('Error updating guest:', error);
    }
  };

  const allTags = Array.from(new Set(guests.flatMap(g => g.tags || [])));

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.total_guests || 0}</div>
              <div className="text-xs text-muted-foreground">Totaal Gasten</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.vip_guests || 0}</div>
              <div className="text-xs text-muted-foreground">VIP Gasten</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.new_guests || 0}</div>
              <div className="text-xs text-muted-foreground">Nieuwe</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-info" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.returning_guests || 0}</div>
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
              <div className="text-2xl font-bold">{stats?.upcoming_birthdays || 0}</div>
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
              <div className="text-2xl font-bold">{stats?.upcoming_anniversaries || 0}</div>
              <div className="text-xs text-muted-foreground">Jubilea</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek op naam, email of telefoon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={vipFilter ? "default" : "outline"}
              size="sm"
              onClick={() => setVipFilter(!vipFilter)}
            >
              <Star className="h-4 w-4 mr-2" />
              VIP
            </Button>

            {allTags.length > 0 && (
              <select
                className="px-3 py-2 text-sm border rounded-md"
                value={tagFilter || ''}
                onChange={(e) => setTagFilter(e.target.value || null)}
              >
                <option value="">Alle Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </Card>

      {/* Guest List */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Gast Profielen
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : guests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Geen gasten gevonden</p>
          </div>
        ) : (
          <div className="space-y-3">
            {guests.map((guest) => (
              <div
                key={guest.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Name and VIP Status */}
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-base">{guest.name}</h4>
                      {guest.vip_status && (
                        <Badge className="bg-warning/20 text-warning border-warning">
                          <Star className="h-3 w-3 mr-1" />
                          VIP
                        </Badge>
                      )}
                      {guest.upcoming_birthday && (
                        <Badge className="bg-pink-500/20 text-pink-500 border-pink-500">
                          <Cake className="h-3 w-3 mr-1" />
                          Verjaardag
                        </Badge>
                      )}
                      {guest.upcoming_anniversary && (
                        <Badge className="bg-purple-500/20 text-purple-500 border-purple-500">
                          <Heart className="h-3 w-3 mr-1" />
                          Jubileum
                        </Badge>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {guest.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {guest.email}
                        </div>
                      )}
                      {guest.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {guest.phone}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {guest.lifetime_visits} bezoeken
                      </Badge>
                      {guest.average_party_size > 0 && (
                        <Badge variant="secondary">
                          Ø {guest.average_party_size} personen
                        </Badge>
                      )}
                      {guest.last_visit_date && (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(guest.last_visit_date), 'd MMM yyyy', { locale: nl })}
                        </Badge>
                      )}
                    </div>

                    {/* Tags */}
                    {guest.tags && guest.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {guest.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Preferences */}
                    {(guest.dietary_preferences?.length > 0 || guest.allergies?.length > 0 || guest.notes) && (
                      <div className="text-sm space-y-1 pt-2 border-t">
                        {guest.dietary_preferences?.length > 0 && (
                          <div className="text-muted-foreground">
                            <span className="font-medium">Dieet:</span> {guest.dietary_preferences.join(', ')}
                          </div>
                        )}
                        {guest.allergies?.length > 0 && (
                          <div className="text-red-500">
                            <span className="font-medium">Allergieën:</span> {guest.allergies.join(', ')}
                          </div>
                        )}
                        {guest.notes && (
                          <div className="text-muted-foreground flex items-start gap-1">
                            <StickyNote className="h-3 w-3 mt-0.5" />
                            {guest.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditGuest(guest)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      {isEditing && selectedGuest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-xl">Bewerk Profiel: {selectedGuest.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* VIP Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="vip"
                  checked={editForm.vip_status || false}
                  onChange={(e) => setEditForm({ ...editForm, vip_status: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="vip">VIP Status</Label>
              </div>

              {/* Birthday */}
              <div>
                <Label htmlFor="birthday">Verjaardag</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={editForm.birthday || ''}
                  onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                />
              </div>

              {/* Anniversary */}
              <div>
                <Label htmlFor="anniversary">Jubileum</Label>
                <Input
                  id="anniversary"
                  type="date"
                  value={editForm.anniversary || ''}
                  onChange={(e) => setEditForm({ ...editForm, anniversary: e.target.value })}
                />
              </div>

              {/* Dietary Preferences */}
              <div>
                <Label htmlFor="dietary">Dieetwensen (komma gescheiden)</Label>
                <Input
                  id="dietary"
                  value={editForm.dietary_preferences?.join(', ') || ''}
                  onChange={(e) => setEditForm({ 
                    ...editForm, 
                    dietary_preferences: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="Vegetarisch, Glutenvrij, etc."
                />
              </div>

              {/* Allergies */}
              <div>
                <Label htmlFor="allergies">Allergieën (komma gescheiden)</Label>
                <Input
                  id="allergies"
                  value={editForm.allergies?.join(', ') || ''}
                  onChange={(e) => setEditForm({ 
                    ...editForm, 
                    allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="Noten, Schaaldieren, etc."
                  className="border-red-200 focus:border-red-500"
                />
              </div>

              {/* Preferred Table Type */}
              <div>
                <Label htmlFor="tableType">Voorkeur Tafel Type</Label>
                <Input
                  id="tableType"
                  value={editForm.preferred_table_type || ''}
                  onChange={(e) => setEditForm({ ...editForm, preferred_table_type: e.target.value })}
                  placeholder="Raam, Terras, Bar, etc."
                />
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags">Tags (komma gescheiden)</Label>
                <Input
                  id="tags"
                  value={editForm.tags?.join(', ') || ''}
                  onChange={(e) => setEditForm({ 
                    ...editForm, 
                    tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="Stammgast, Feestganger, etc."
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notities</Label>
                <textarea
                  id="notes"
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md"
                  placeholder="Interne notities over deze gast..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSaveGuest} className="flex-1 gradient-bg">
                <Save className="h-4 w-4 mr-2" />
                Opslaan
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                Annuleren
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

