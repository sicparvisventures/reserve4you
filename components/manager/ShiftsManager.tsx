'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  Edit2,
  Clock,
  Calendar,
  Save,
  Loader2,
  Check,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface Shift {
  id: string;
  name: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  slot_minutes: number;
  buffer_minutes: number;
  max_parallel: number | null;
  is_active: boolean;
}

interface ShiftsManagerProps {
  locationId: string;
  locationName: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Zondag', short: 'Zo' },
  { value: 1, label: 'Maandag', short: 'Ma' },
  { value: 2, label: 'Dinsdag', short: 'Di' },
  { value: 3, label: 'Woensdag', short: 'Wo' },
  { value: 4, label: 'Donderdag', short: 'Do' },
  { value: 5, label: 'Vrijdag', short: 'Vr' },
  { value: 6, label: 'Zaterdag', short: 'Za' },
];

export function ShiftsManager({ locationId, locationName }: ShiftsManagerProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    days_of_week: [] as number[],
    start_time: '11:00',
    end_time: '22:00',
    slot_minutes: 90,
    buffer_minutes: 15,
    max_parallel: null as number | null,
  });

  useEffect(() => {
    loadShifts();
  }, [locationId]);

  const loadShifts = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('location_id', locationId)
        .order('name');

      if (error) throw error;
      setShifts(data || []);
    } catch (err) {
      console.error('Error loading shifts:', err);
      showError('Fout bij laden van diensten');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      days_of_week: [],
      start_time: '11:00',
      end_time: '22:00',
      slot_minutes: 90,
      buffer_minutes: 15,
      max_parallel: null,
    });
  };

  const handleAddShift = async () => {
    if (!formData.name.trim()) {
      showError('Naam is verplicht');
      return;
    }
    if (formData.days_of_week.length === 0) {
      showError('Selecteer minimaal één dag');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('shifts')
        .insert({
          location_id: locationId,
          ...formData,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      
      setShifts([...shifts, data]);
      setIsAddDialogOpen(false);
      resetForm();
      showSuccess('Dienst succesvol toegevoegd');
    } catch (err: any) {
      console.error('Error adding shift:', err);
      showError(err.message || 'Fout bij toevoegen van dienst');
    } finally {
      setSaving(false);
    }
  };

  const handleEditShift = async () => {
    if (!editingShift) return;
    if (!formData.name.trim()) {
      showError('Naam is verplicht');
      return;
    }
    if (formData.days_of_week.length === 0) {
      showError('Selecteer minimaal één dag');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('shifts')
        .update(formData)
        .eq('id', editingShift.id)
        .select()
        .single();

      if (error) throw error;

      setShifts(shifts.map(s => s.id === editingShift.id ? data : s));
      setIsEditDialogOpen(false);
      setEditingShift(null);
      resetForm();
      showSuccess('Dienst succesvol bijgewerkt');
    } catch (err: any) {
      console.error('Error updating shift:', err);
      showError(err.message || 'Fout bij bijwerken van dienst');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShift = async (shift: Shift) => {
    if (!confirm(`Weet je zeker dat je "${shift.name}" wilt verwijderen?`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shift.id);

      if (error) throw error;

      setShifts(shifts.filter(s => s.id !== shift.id));
      showSuccess('Dienst verwijderd');
    } catch (err: any) {
      console.error('Error deleting shift:', err);
      showError(err.message || 'Fout bij verwijderen van dienst');
    }
  };

  const handleToggleActive = async (shift: Shift) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('shifts')
        .update({ is_active: !shift.is_active })
        .eq('id', shift.id);

      if (error) throw error;

      setShifts(shifts.map(s => 
        s.id === shift.id ? { ...s, is_active: !s.is_active } : s
      ));
      showSuccess(`Dienst ${!shift.is_active ? 'geactiveerd' : 'gedeactiveerd'}`);
    } catch (err: any) {
      console.error('Error toggling shift:', err);
      showError(err.message || 'Fout bij wijzigen van status');
    }
  };

  const handleDuplicateShift = (shift: Shift) => {
    setFormData({
      name: `${shift.name} (kopie)`,
      days_of_week: [...shift.days_of_week],
      start_time: shift.start_time,
      end_time: shift.end_time,
      slot_minutes: shift.slot_minutes,
      buffer_minutes: shift.buffer_minutes,
      max_parallel: shift.max_parallel,
    });
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (shift: Shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      days_of_week: [...shift.days_of_week],
      start_time: shift.start_time,
      end_time: shift.end_time,
      slot_minutes: shift.slot_minutes,
      buffer_minutes: shift.buffer_minutes,
      max_parallel: shift.max_parallel,
    });
    setIsEditDialogOpen(true);
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort((a, b) => a - b)
    }));
  };

  const getDaysDisplay = (days: number[]) => {
    if (days.length === 7) return 'Alle dagen';
    if (days.length === 0) return 'Geen dagen';
    
    const sortedDays = [...days].sort((a, b) => a - b);
    
    // Check for weekdays (Mon-Fri)
    if (sortedDays.length === 5 && 
        sortedDays.every(d => [1, 2, 3, 4, 5].includes(d))) {
      return 'Ma-Vr';
    }
    
    // Check for weekend
    if (sortedDays.length === 2 && 
        sortedDays.every(d => [0, 6].includes(d))) {
      return 'Za-Zo';
    }
    
    return sortedDays.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.short || '').join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-start gap-3">
          <Check className="h-5 w-5 text-green-600 mt-0.5" />
          <span className="text-sm font-medium text-green-900">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <span className="text-sm font-medium text-red-900">{errorMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Openingstijden & Diensten</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configureer de openingstijden en diensten voor {locationName}
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Dienst Toevoegen
        </Button>
      </div>

      {/* Shifts List */}
      {shifts.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Geen diensten geconfigureerd</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Voeg diensten toe om beschikbaarheid voor reserveringen in te stellen
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Eerste Dienst Toevoegen
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {shifts.map((shift) => (
            <Card key={shift.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-lg">{shift.name}</h4>
                    <Badge variant={shift.is_active ? 'default' : 'secondary'}>
                      {shift.is_active ? 'Actief' : 'Inactief'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Dagen</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium">{getDaysDisplay(shift.days_of_week)}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-muted-foreground mb-1">Tijden</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-muted-foreground mb-1">Reserveringsduur</p>
                      <span className="font-medium">{shift.slot_minutes} minuten</span>
                    </div>

                    <div>
                      <p className="text-muted-foreground mb-1">Buffer</p>
                      <span className="font-medium">{shift.buffer_minutes} minuten</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicateShift(shift)}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(shift)}
                    className="gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(shift)}
                    className={cn(
                      'gap-2',
                      shift.is_active ? 'text-green-600' : 'text-gray-600'
                    )}
                  >
                    {shift.is_active ? 'Actief' : 'Inactief'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteShift(shift)}
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Shift Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nieuwe Dienst Toevoegen</DialogTitle>
            <DialogDescription>
              Configureer een nieuwe dienst met openingstijden en beschikbaarheid
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Naam Dienst</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Bijv. Lunch, Dinner, Happy Hour"
              />
            </div>

            <div className="space-y-2">
              <Label>Dagen van de Week</Label>
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={formData.days_of_week.includes(day.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleDay(day.value)}
                    className="flex-col h-auto py-2"
                  >
                    <span className="text-xs font-semibold">{day.short}</span>
                  </Button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, days_of_week: [1, 2, 3, 4, 5] })}
                >
                  Ma-Vr
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, days_of_week: [0, 1, 2, 3, 4, 5, 6] })}
                >
                  Alle Dagen
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, days_of_week: [] })}
                >
                  Wissen
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Starttijd</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">Eindtijd</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slot_minutes">Reserveringsduur (minuten)</Label>
                <Input
                  id="slot_minutes"
                  type="number"
                  min="15"
                  step="15"
                  value={formData.slot_minutes}
                  onChange={(e) => setFormData({ ...formData, slot_minutes: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Standaard duur van een reservering
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buffer_minutes">Buffer (minuten)</Label>
                <Input
                  id="buffer_minutes"
                  type="number"
                  min="0"
                  step="5"
                  value={formData.buffer_minutes}
                  onChange={(e) => setFormData({ ...formData, buffer_minutes: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Tijd tussen reserveringen
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              resetForm();
            }}>
              Annuleren
            </Button>
            <Button onClick={handleAddShift} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shift Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dienst Bewerken</DialogTitle>
            <DialogDescription>
              Wijzig de instellingen van deze dienst
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Naam Dienst</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Bijv. Lunch, Dinner, Happy Hour"
              />
            </div>

            <div className="space-y-2">
              <Label>Dagen van de Week</Label>
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={formData.days_of_week.includes(day.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleDay(day.value)}
                    className="flex-col h-auto py-2"
                  >
                    <span className="text-xs font-semibold">{day.short}</span>
                  </Button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, days_of_week: [1, 2, 3, 4, 5] })}
                >
                  Ma-Vr
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, days_of_week: [0, 1, 2, 3, 4, 5, 6] })}
                >
                  Alle Dagen
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start_time">Starttijd</Label>
                <Input
                  id="edit-start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-end_time">Eindtijd</Label>
                <Input
                  id="edit-end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-slot_minutes">Reserveringsduur (minuten)</Label>
                <Input
                  id="edit-slot_minutes"
                  type="number"
                  min="15"
                  step="15"
                  value={formData.slot_minutes}
                  onChange={(e) => setFormData({ ...formData, slot_minutes: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-buffer_minutes">Buffer (minuten)</Label>
                <Input
                  id="edit-buffer_minutes"
                  type="number"
                  min="0"
                  step="5"
                  value={formData.buffer_minutes}
                  onChange={(e) => setFormData({ ...formData, buffer_minutes: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingShift(null);
              resetForm();
            }}>
              Annuleren
            </Button>
            <Button onClick={handleEditShift} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Wijzigingen Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

