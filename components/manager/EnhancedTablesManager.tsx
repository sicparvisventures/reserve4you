'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Upload,
  Download,
  Trash2,
  Edit2,
  Table as TableIcon,
  Save,
  Loader2,
  Check,
  AlertCircle,
  FileText,
  Copy,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface Table {
  id: string;
  name: string;
  seats: number;
  is_combinable: boolean;
  group_id: string | null;
  is_active: boolean;
}

interface EnhancedTablesManagerProps {
  locationId: string;
  locationName: string;
}

export function EnhancedTablesManager({ locationId, locationName }: EnhancedTablesManagerProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [bulkImportText, setBulkImportText] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    seats: 2,
    is_combinable: false,
    group_id: '',
  });

  useEffect(() => {
    loadTables();
  }, [locationId]);

  const loadTables = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('location_id', locationId)
        .order('name');

      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      console.error('Error loading tables:', err);
      showError('Fout bij laden van tafels');
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
      seats: 2,
      is_combinable: false,
      group_id: '',
    });
  };

  const handleAddTable = async () => {
    if (!formData.name.trim()) {
      showError('Naam is verplicht');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tables')
        .insert({
          location_id: locationId,
          ...formData,
          name: formData.name.trim(),
          group_id: formData.group_id.trim() || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      
      setTables([...tables, data]);
      setIsAddDialogOpen(false);
      resetForm();
      showSuccess('Tafel succesvol toegevoegd');
    } catch (err: any) {
      console.error('Error adding table:', err);
      showError(err.message || 'Fout bij toevoegen van tafel');
    } finally {
      setSaving(false);
    }
  };

  const handleEditTable = async () => {
    if (!editingTable) return;
    if (!formData.name.trim()) {
      showError('Naam is verplicht');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tables')
        .update({
          ...formData,
          name: formData.name.trim(),
          group_id: formData.group_id.trim() || null,
        })
        .eq('id', editingTable.id)
        .select()
        .single();

      if (error) throw error;

      setTables(tables.map(t => t.id === editingTable.id ? data : t));
      setIsEditDialogOpen(false);
      setEditingTable(null);
      resetForm();
      showSuccess('Tafel succesvol bijgewerkt');
    } catch (err: any) {
      console.error('Error updating table:', err);
      showError(err.message || 'Fout bij bijwerken van tafel');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTable = async (table: Table) => {
    if (!confirm(`Weet je zeker dat je "${table.name}" wilt verwijderen?`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', table.id);

      if (error) throw error;

      setTables(tables.filter(t => t.id !== table.id));
      showSuccess('Tafel verwijderd');
    } catch (err: any) {
      console.error('Error deleting table:', err);
      showError(err.message || 'Fout bij verwijderen van tafel');
    }
  };

  const handleToggleActive = async (table: Table) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('tables')
        .update({ is_active: !table.is_active })
        .eq('id', table.id);

      if (error) throw error;

      setTables(tables.map(t => 
        t.id === table.id ? { ...t, is_active: !t.is_active } : t
      ));
      showSuccess(`Tafel ${!table.is_active ? 'geactiveerd' : 'gedeactiveerd'}`);
    } catch (err: any) {
      console.error('Error toggling table:', err);
      showError(err.message || 'Fout bij wijzigen van status');
    }
  };

  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) {
      showError('Voer tafelgegevens in');
      return;
    }

    setSaving(true);
    try {
      const lines = bulkImportText.trim().split('\n');
      const tablesToImport: any[] = [];
      const errors: string[] = [];

      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // Format: TableName, Seats, Combinable (Y/N), GroupID
        // Examples:
        // T1, 2
        // T2, 4, Y, A
        // T3, 6, N
        const parts = trimmedLine.split(',').map(p => p.trim());
        
        if (parts.length < 2) {
          errors.push(`Regel ${index + 1}: Minimaal naam en stoelen vereist`);
          return;
        }

        const name = parts[0];
        const seats = parseInt(parts[1]);
        const is_combinable = parts[2]?.toUpperCase() === 'Y' || parts[2]?.toUpperCase() === 'JA';
        const group_id = parts[3] || null;

        if (!name) {
          errors.push(`Regel ${index + 1}: Naam is verplicht`);
          return;
        }

        if (isNaN(seats) || seats < 1) {
          errors.push(`Regel ${index + 1}: Ongeldig aantal stoelen`);
          return;
        }

        tablesToImport.push({
          location_id: locationId,
          name,
          seats,
          is_combinable,
          group_id,
          is_active: true,
        });
      });

      if (errors.length > 0) {
        showError(errors.join('\n'));
        return;
      }

      if (tablesToImport.length === 0) {
        showError('Geen geldige tafels gevonden om te importeren');
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('tables')
        .insert(tablesToImport)
        .select();

      if (error) throw error;

      setTables([...tables, ...data]);
      setIsBulkImportOpen(false);
      setBulkImportText('');
      showSuccess(`${data.length} tafel(s) succesvol geïmporteerd`);
    } catch (err: any) {
      console.error('Error bulk importing tables:', err);
      showError(err.message || 'Fout bij bulk import');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const csv = tables.map(t => 
      `${t.name},${t.seats},${t.is_combinable ? 'Y' : 'N'},${t.group_id || ''}`
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${locationName.replace(/[^a-z0-9]/gi, '_')}_tables.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess('Tafels geëxporteerd');
  };

  const openEditDialog = (table: Table) => {
    setEditingTable(table);
    setFormData({
      name: table.name,
      seats: table.seats,
      is_combinable: table.is_combinable,
      group_id: table.group_id || '',
    });
    setIsEditDialogOpen(true);
  };

  const generateQuickTables = (count: number, seatsPerTable: number) => {
    setBulkImportText(
      Array.from({ length: count }, (_, i) => 
        `Tafel ${i + 1},${seatsPerTable}`
      ).join('\n')
    );
  };

  const totalSeats = tables.reduce((sum, t) => sum + (t.is_active ? t.seats : 0), 0);

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
          <div className="text-sm font-medium text-red-900 whitespace-pre-line">{errorMessage}</div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Tafelbeheer</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Beheer tafels voor {locationName} - {tables.length} tafel(s), {totalSeats} stoelen
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2" disabled={tables.length === 0}>
            <Download className="h-4 w-4" />
            Exporteren
          </Button>
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Bulk Import
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Tafel Toevoegen
          </Button>
        </div>
      </div>

      {/* Tables List */}
      {tables.length === 0 ? (
        <Card className="p-12 text-center">
          <TableIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Geen tafels geconfigureerd</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Voeg tafels toe om reserveringen te kunnen ontvangen
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Tafel Toevoegen
            </Button>
            <Button variant="outline" onClick={() => setIsBulkImportOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Bulk Import
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {tables.map((table) => (
            <Card key={table.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                    <TableIcon className="h-6 w-6 text-primary" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{table.name}</h4>
                      <Badge variant={table.is_active ? 'default' : 'secondary'} className="text-xs">
                        {table.is_active ? 'Actief' : 'Inactief'}
                      </Badge>
                      {table.is_combinable && (
                        <Badge variant="outline" className="text-xs">
                          Combineerbaar
                        </Badge>
                      )}
                      {table.group_id && (
                        <Badge variant="outline" className="text-xs">
                          Groep: {table.group_id}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {table.seats} {table.seats === 1 ? 'stoel' : 'stoelen'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(table)}
                    className="gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(table)}
                    className={cn(
                      'gap-2',
                      table.is_active ? 'text-green-600' : 'text-gray-600'
                    )}
                  >
                    {table.is_active ? 'Actief' : 'Inactief'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTable(table)}
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

      {/* Add Table Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe Tafel Toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een nieuwe tafel toe aan je restaurant
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tafelnaam</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Bijv. T1, Tafel 1, Terras 4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seats">Aantal Stoelen</Label>
              <Input
                id="seats"
                type="number"
                min="1"
                value={formData.seats}
                onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  id="combinable"
                  type="checkbox"
                  checked={formData.is_combinable}
                  onChange={(e) => setFormData({ ...formData, is_combinable: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="combinable" className="font-normal">
                  Combineerbaar met andere tafels
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group_id">Groep ID (optioneel)</Label>
              <Input
                id="group_id"
                value={formData.group_id}
                onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                placeholder="Bijv. A, Terras, VIP"
              />
              <p className="text-xs text-muted-foreground">
                Voor het combineren van tafels in dezelfde groep
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              resetForm();
            }}>
              Annuleren
            </Button>
            <Button onClick={handleAddTable} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tafel Bewerken</DialogTitle>
            <DialogDescription>
              Wijzig de instellingen van deze tafel
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Tafelnaam</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-seats">Aantal Stoelen</Label>
              <Input
                id="edit-seats"
                type="number"
                min="1"
                value={formData.seats}
                onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  id="edit-combinable"
                  type="checkbox"
                  checked={formData.is_combinable}
                  onChange={(e) => setFormData({ ...formData, is_combinable: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="edit-combinable" className="font-normal">
                  Combineerbaar met andere tafels
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-group_id">Groep ID (optioneel)</Label>
              <Input
                id="edit-group_id"
                value={formData.group_id}
                onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingTable(null);
              resetForm();
            }}>
              Annuleren
            </Button>
            <Button onClick={handleEditTable} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Wijzigingen Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Tafels Importeren</DialogTitle>
            <DialogDescription>
              Voer meerdere tafels tegelijk in met een eenvoudig formaat
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Formaat</Label>
              <div className="rounded-lg bg-muted p-3 text-sm font-mono space-y-1">
                <p>Tafelnaam, Stoelen, Combineerbaar (Y/N), Groep ID</p>
                <p className="text-muted-foreground text-xs">
                  Minimaal: Tafelnaam, Stoelen
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Voorbeelden</Label>
              <div className="rounded-lg bg-muted p-3 text-sm font-mono space-y-1">
                <p>T1, 2</p>
                <p>T2, 4, Y, A</p>
                <p>Terras 1, 6, N</p>
                <p>VIP 5, 8, Y, VIP</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quick Generate</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => generateQuickTables(5, 2)}
                >
                  5x 2-persoons
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => generateQuickTables(5, 4)}
                >
                  5x 4-persoons
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => generateQuickTables(3, 6)}
                >
                  3x 6-persoons
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-import">Tafels (één per regel)</Label>
              <Textarea
                id="bulk-import"
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                placeholder="T1, 2&#10;T2, 4, Y, A&#10;T3, 6"
                className="font-mono text-sm h-48"
              />
              <p className="text-xs text-muted-foreground">
                {bulkImportText.trim().split('\n').filter(l => l.trim()).length} tafel(s) klaar voor import
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsBulkImportOpen(false);
              setBulkImportText('');
            }}>
              Annuleren
            </Button>
            <Button onClick={handleBulkImport} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Upload className="h-4 w-4" />
              Importeren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

