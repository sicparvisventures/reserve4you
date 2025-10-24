/**
 * Users Manager Component
 * Manage venue staff and external users with roles and permissions
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  XCircle,
  Key,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type UserRole = 'administrator' | 'standard' | 'viewer' | 'group_manager';

interface VenueUser {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  pin_code: string;
  role: UserRole;
  location_ids: string[];
  all_locations: boolean;
  can_view_dashboard: boolean;
  can_manage_bookings: boolean;
  can_manage_customers: boolean;
  can_manage_tables: boolean;
  can_manage_menu: boolean;
  can_manage_promotions: boolean;
  can_view_analytics: boolean;
  can_manage_settings: boolean;
  can_manage_users: boolean;
  can_manage_billing: boolean;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

interface Location {
  id: string;
  name: string;
  internal_name: string;
  slug: string;
}

interface UsersManagerProps {
  tenantId: string;
  locations: Location[];
}

const ROLE_LABELS: Record<UserRole, string> = {
  administrator: 'Administrator',
  standard: 'Standaard Gebruiker',
  viewer: 'Viewer',
  group_manager: 'Groepsbeheerder',
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  administrator: 'Volledige toegang tot alle functies en instellingen',
  standard: 'Beperkte toegang tot specifieke modules',
  viewer: 'Alleen lezen, geen wijzigingen mogelijk',
  group_manager: 'Beheer over meerdere vestigingen',
};

export function UsersManager({ tenantId, locations }: UsersManagerProps) {
  const [users, setUsers] = useState<VenueUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<VenueUser | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    pin_code: '',
    role: 'standard' as UserRole,
    location_ids: [] as string[],
    all_locations: true,
    can_view_dashboard: true,
    can_manage_bookings: false,
    can_manage_customers: false,
    can_manage_tables: false,
    can_manage_menu: false,
    can_manage_promotions: false,
    can_view_analytics: false,
    can_manage_settings: false,
    can_manage_users: false,
    can_manage_billing: false,
  });

  useEffect(() => {
    fetchUsers();
  }, [tenantId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('venue_users')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      showMessage('error', 'Fout bij laden van gebruikers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate PIN code (4 digits)
    if (!/^\d{4}$/.test(formData.pin_code)) {
      showMessage('error', 'PIN code moet exact 4 cijfers zijn');
      return;
    }

    // Validate email
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showMessage('error', 'Geldig email adres is verplicht');
      return;
    }

    // Validate password for new users
    if (!editingUser && (!formData.password || formData.password.length < 8)) {
      showMessage('error', 'Wachtwoord moet minimaal 8 karakters zijn');
      return;
    }

    try {
      if (editingUser) {
        // Update existing user via API
        const response = await fetch('/api/venue-users/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingUser.id,
            email: formData.email,
            firstName: formData.first_name,
            lastName: formData.last_name,
            phone: formData.phone,
            pinCode: formData.pin_code,
            role: formData.role,
            tenantId: tenantId,
            allLocations: formData.all_locations,
            locationIds: formData.location_ids,
            permissions: {
              can_view_dashboard: formData.can_view_dashboard,
              can_manage_bookings: formData.can_manage_bookings,
              can_manage_customers: formData.can_manage_customers,
              can_manage_tables: formData.can_manage_tables,
              can_manage_menu: formData.can_manage_menu,
              can_manage_promotions: formData.can_manage_promotions,
              can_view_analytics: formData.can_view_analytics,
              can_manage_settings: formData.can_manage_settings,
              can_manage_users: formData.can_manage_users,
              can_manage_billing: formData.can_manage_billing,
            }
          })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        
        showMessage('success', 'Gebruiker bijgewerkt!');
      } else {
        // Create new user via API
        const response = await fetch('/api/venue-users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            firstName: formData.first_name,
            lastName: formData.last_name,
            phone: formData.phone,
            pinCode: formData.pin_code,
            role: formData.role,
            tenantId: tenantId,
            allLocations: formData.all_locations,
            locationIds: formData.location_ids,
            permissions: {
              can_view_dashboard: formData.can_view_dashboard,
              can_manage_bookings: formData.can_manage_bookings,
              can_manage_customers: formData.can_manage_customers,
              can_manage_tables: formData.can_manage_tables,
              can_manage_menu: formData.can_manage_menu,
              can_manage_promotions: formData.can_manage_promotions,
              can_view_analytics: formData.can_view_analytics,
              can_manage_settings: formData.can_manage_settings,
              can_manage_users: formData.can_manage_users,
              can_manage_billing: formData.can_manage_billing,
            }
          })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        
        showMessage('success', 'Gebruiker aangemaakt met email & wachtwoord!');
      }

      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      
      // Better error messages
      let errorMsg = 'Fout bij opslaan gebruiker';
      if (error.message.includes('duplicate key')) {
        if (error.message.includes('pin_code') || error.message.includes('unique_pin_per_tenant')) {
          errorMsg = 'Deze PIN code is al in gebruik voor deze tenant';
        } else if (error.message.includes('email')) {
          errorMsg = 'Dit email adres is al in gebruik';
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      showMessage('error', errorMsg);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) return;

    try {
      const response = await fetch(`/api/venue-users/delete?id=${userId}&tenantId=${tenantId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      showMessage('success', 'Gebruiker verwijderd');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      
      // Better error messages
      let errorMsg = 'Fout bij verwijderen gebruiker';
      if (error.message.includes('not found')) {
        errorMsg = 'Gebruiker niet gevonden. Mogelijk al verwijderd of geen toegang.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      showMessage('error', errorMsg);
    }
  };

  const handleEdit = (user: VenueUser) => {
    setEditingUser(user);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      pin_code: user.pin_code,
      role: user.role,
      location_ids: user.location_ids,
      all_locations: user.all_locations,
      can_view_dashboard: user.can_view_dashboard,
      can_manage_bookings: user.can_manage_bookings,
      can_manage_customers: user.can_manage_customers,
      can_manage_tables: user.can_manage_tables,
      can_manage_menu: user.can_manage_menu,
      can_manage_promotions: user.can_manage_promotions,
      can_view_analytics: user.can_view_analytics,
      can_manage_settings: user.can_manage_settings,
      can_manage_users: user.can_manage_users,
      can_manage_billing: user.can_manage_billing,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({
      first_name: '',
      last_name: '',
      password: '',
      email: '',
      phone: '',
      pin_code: '',
      role: 'standard',
      location_ids: [],
      all_locations: true,
      can_view_dashboard: true,
      can_manage_bookings: false,
      can_manage_customers: false,
      can_manage_tables: false,
      can_manage_menu: false,
      can_manage_promotions: false,
      can_view_analytics: false,
      can_manage_settings: false,
      can_manage_users: false,
      can_manage_billing: false,
    });
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'administrator':
        return 'bg-red-100 text-red-800';
      case 'standard':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      case 'group_manager':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Gebruikers laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gebruikersbeheer</h2>
          <p className="text-muted-foreground mt-1">
            Beheer personeel en externe gebruikers met specifieke rechten
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe Gebruiker
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingUser ? 'Gebruiker Bewerken' : 'Nieuwe Gebruiker'}
              </h3>
              <Button type="button" variant="ghost" onClick={resetForm}>
                Annuleren
              </Button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Voornaam *</Label>
                <Input
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="John"
                />
              </div>

              <div className="space-y-2">
                <Label>Achternaam *</Label>
                <Input
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Doe"
                />
              </div>

              <div className="space-y-2">
                <Label>E-mail *</Label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  Voor inloggen op /staff-login met email & wachtwoord
                </p>
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <Label>Wachtwoord *</Label>
                  <Input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min. 8 karakters"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimaal 8 karakters vereist
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Telefoon</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+32 123 45 67 89"
                />
              </div>

              <div className="space-y-2">
                <Label>PIN Code * (4 cijfers)</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    required
                    type="text"
                    maxLength={4}
                    pattern="\d{4}"
                    value={formData.pin_code}
                    onChange={(e) => setFormData({ ...formData, pin_code: e.target.value.replace(/\D/g, '') })}
                    placeholder="1234"
                    className="pl-10 text-center text-2xl tracking-widest"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  4-cijferige code voor snelle login
                </p>
              </div>

              <div className="space-y-2">
                <Label>Rol *</Label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {ROLE_DESCRIPTIONS[formData.role]}
                </p>
              </div>
            </div>

            {/* Location Access */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold">Vestigingen Toegang</h4>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.all_locations}
                  onCheckedChange={(checked) => setFormData({ ...formData, all_locations: checked })}
                />
                <Label>Toegang tot alle vestigingen</Label>
              </div>

              {!formData.all_locations && (
                <div className="space-y-2">
                  <Label>Selecteer vestigingen</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                    {locations.map((location) => (
                      <label key={location.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.location_ids.includes(location.id)}
                          onChange={(e) => {
                            const newIds = e.target.checked
                              ? [...formData.location_ids, location.id]
                              : formData.location_ids.filter((id) => id !== location.id);
                            setFormData({ ...formData, location_ids: newIds });
                          }}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{location.internal_name || location.name}</span>
                          <span className="text-xs text-muted-foreground">/staff-login/{location.slug}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Permissions */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold">Rechten & Permissies</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={formData.can_view_dashboard}
                    onChange={(e) => setFormData({ ...formData, can_view_dashboard: e.target.checked })}
                  />
                  <span className="text-sm">Dashboard bekijken</span>
                </label>

                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={formData.can_manage_bookings}
                    onChange={(e) => setFormData({ ...formData, can_manage_bookings: e.target.checked })}
                  />
                  <span className="text-sm">Reserveringen beheren</span>
                </label>

                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={formData.can_manage_customers}
                    onChange={(e) => setFormData({ ...formData, can_manage_customers: e.target.checked })}
                  />
                  <span className="text-sm">Klanten beheren</span>
                </label>

                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={formData.can_manage_tables}
                    onChange={(e) => setFormData({ ...formData, can_manage_tables: e.target.checked })}
                  />
                  <span className="text-sm">Tafels beheren</span>
                </label>

                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={formData.can_manage_menu}
                    onChange={(e) => setFormData({ ...formData, can_manage_menu: e.target.checked })}
                  />
                  <span className="text-sm">Menu beheren</span>
                </label>

                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={formData.can_manage_promotions}
                    onChange={(e) => setFormData({ ...formData, can_manage_promotions: e.target.checked })}
                  />
                  <span className="text-sm">Promoties beheren</span>
                </label>

                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={formData.can_view_analytics}
                    onChange={(e) => setFormData({ ...formData, can_view_analytics: e.target.checked })}
                  />
                  <span className="text-sm">Analytics bekijken</span>
                </label>

                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={formData.can_manage_settings}
                    onChange={(e) => setFormData({ ...formData, can_manage_settings: e.target.checked })}
                  />
                  <span className="text-sm">Instellingen beheren</span>
                </label>

                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={formData.can_manage_users}
                    onChange={(e) => setFormData({ ...formData, can_manage_users: e.target.checked })}
                  />
                  <span className="text-sm">Gebruikers beheren</span>
                </label>

                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={formData.can_manage_billing}
                    onChange={(e) => setFormData({ ...formData, can_manage_billing: e.target.checked })}
                  />
                  <span className="text-sm">Facturatie beheren</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Annuleren
              </Button>
              <Button type="submit">
                {editingUser ? 'Bijwerken' : 'Aanmaken'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Users List */}
      <div className="grid grid-cols-1 gap-4">
        {users.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Geen gebruikers</h3>
            <p className="text-muted-foreground mb-4">
              Maak je eerste gebruiker aan om te beginnen
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Eerste Gebruiker Aanmaken
            </Button>
          </Card>
        ) : (
          users.map((user) => (
            <Card key={user.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      {user.first_name} {user.last_name}
                    </h3>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {ROLE_LABELS[user.role]}
                    </Badge>
                    {!user.is_active && (
                      <Badge variant="outline" className="text-red-600">
                        Inactief
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    {user.email && (
                      <div>
                        <span className="font-medium">E-mail:</span> {user.email}
                      </div>
                    )}
                    {user.phone && (
                      <div>
                        <span className="font-medium">Telefoon:</span> {user.phone}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">PIN:</span> ••••
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Vestigingen:</span>{' '}
                      {user.all_locations ? (
                        'Alle'
                      ) : (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {user.location_ids.map((locId) => {
                            const loc = locations.find((l) => l.id === locId);
                            if (!loc) return null;
                            return (
                              <Badge key={locId} variant="secondary" className="text-xs">
                                {loc.internal_name || loc.name}
                                <span className="ml-1 opacity-60">(/staff-login/{loc.slug})</span>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {user.last_login_at && (
                      <div>
                        <span className="font-medium">Laatste login:</span>{' '}
                        {new Date(user.last_login_at).toLocaleString('nl-NL')}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {user.can_view_dashboard && (
                      <Badge variant="outline" className="text-xs">
                        Dashboard
                      </Badge>
                    )}
                    {user.can_manage_bookings && (
                      <Badge variant="outline" className="text-xs">
                        Reserveringen
                      </Badge>
                    )}
                    {user.can_manage_customers && (
                      <Badge variant="outline" className="text-xs">
                        Klanten
                      </Badge>
                    )}
                    {user.can_manage_settings && (
                      <Badge variant="outline" className="text-xs">
                        Instellingen
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

