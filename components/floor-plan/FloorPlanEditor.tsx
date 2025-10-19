'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
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
} from '@/components/ui/dialog';
import {
  Plus,
  Save,
  Trash2,
  Edit2,
  Users,
  Grid3x3,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Circle,
  Square,
  RectangleHorizontal,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface Table {
  id: string;
  table_number: string;
  seats: number;
  position_x: number;
  position_y: number;
  shape: 'circle' | 'square' | 'rectangle';
  rotation: number;
  is_active: boolean;
  description?: string;
  floor_level: number;
}

interface FloorPlanEditorProps {
  locationId: string;
  locationName: string;
}

export function FloorPlanEditor({ locationId, locationName }: FloorPlanEditorProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  // New table form
  const [newTable, setNewTable] = useState<{
    table_number: string;
    seats: number;
    shape: 'circle' | 'square' | 'rectangle';
    description: string;
  }>({
    table_number: '',
    seats: 2,
    shape: 'circle',
    description: '',
  });

  // Load tables
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
        .order('table_number');

      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      console.error('Error loading tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (tableId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = (e.clientX - rect.left) / zoom - table.position_x;
    const offsetY = (e.clientY - rect.top) / zoom - table.position_y;

    setDraggingTable(tableId);
    setDragOffset({ x: offsetX, y: offsetY });
    setSelectedTable(tableId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingTable || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let newX = (e.clientX - rect.left) / zoom - dragOffset.x;
    let newY = (e.clientY - rect.top) / zoom - dragOffset.y;

    // Snap to grid if enabled
    if (showGrid) {
      const gridSize = 20;
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }

    // Keep within bounds
    newX = Math.max(20, Math.min(newX, 1000));
    newY = Math.max(20, Math.min(newY, 600));

    setTables(prev =>
      prev.map(t =>
        t.id === draggingTable
          ? { ...t, position_x: newX, position_y: newY }
          : t
      )
    );
  };

  const handleMouseUp = async () => {
    if (draggingTable) {
      // Save position to database
      await saveTablePositions();
      setDraggingTable(null);
    }
  };

  const saveTablePositions = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const positions = tables.map(t => ({
        table_id: t.id,
        x: t.position_x,
        y: t.position_y,
      }));

      const { error } = await supabase.rpc('update_table_positions', {
        p_positions: positions,
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error saving positions:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTable = async () => {
    try {
      const supabase = createClient();
      
      // Find next available position
      const nextX = 100 + (tables.length % 4) * 150;
      const nextY = 100 + Math.floor(tables.length / 4) * 150;

      const { data, error } = await supabase
        .from('tables')
        .insert({
          location_id: locationId,
          table_number: newTable.table_number,
          seats: newTable.seats,
          position_x: nextX,
          position_y: nextY,
          shape: newTable.shape,
          rotation: 0,
          floor_level: 1,
          is_active: true,
          description: newTable.description || null,
        })
        .select()
        .single();

      if (error) throw error;

      setTables(prev => [...prev, data]);
      setIsAddDialogOpen(false);
      setNewTable({
        table_number: '',
        seats: 2,
        shape: 'circle',
        description: '',
      });
    } catch (err) {
      console.error('Error adding table:', err);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Weet je zeker dat je deze tafel wilt verwijderen?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId);

      if (error) throw error;

      setTables(prev => prev.filter(t => t.id !== tableId));
      setSelectedTable(null);
    } catch (err) {
      console.error('Error deleting table:', err);
    }
  };

  const handleToggleActive = async (tableId: string) => {
    try {
      const supabase = createClient();
      const table = tables.find(t => t.id === tableId);
      if (!table) return;

      const { error } = await supabase
        .from('tables')
        .update({ is_active: !table.is_active })
        .eq('id', tableId);

      if (error) throw error;

      setTables(prev =>
        prev.map(t =>
          t.id === tableId ? { ...t, is_active: !t.is_active } : t
        )
      );
    } catch (err) {
      console.error('Error toggling table:', err);
    }
  };

  const getTableIcon = (shape: string) => {
    switch (shape) {
      case 'circle':
        return <Circle className="h-4 w-4" />;
      case 'square':
        return <Square className="h-4 w-4" />;
      case 'rectangle':
        return <RectangleHorizontal className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getTableSize = (seats: number, shape: string) => {
    const baseSize = 60;
    const size = Math.max(baseSize, seats * 15);
    
    if (shape === 'rectangle') {
      return { width: size * 1.5, height: size };
    }
    return { width: size, height: size };
  };

  const selectedTableData = tables.find(t => t.id === selectedTable);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Tafel Toevoegen
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid3x3 className="h-4 w-4 mr-2" />
            {showGrid ? 'Grid Aan' : 'Grid Uit'}
          </Button>

          <div className="flex items-center gap-2 border-l pl-2 ml-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              disabled={zoom >= 2}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saving && (
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Opslaan...
            </Badge>
          )}
          <Badge variant="outline">{tables.length} Tafels</Badge>
        </div>
      </div>

      {/* Canvas */}
      <div className="border border-border rounded-lg overflow-hidden bg-background">
        <div
          ref={canvasRef}
          className={cn(
            'relative bg-muted/20',
            showGrid && 'bg-grid-pattern'
          )}
          style={{
            width: '100%',
            height: '700px',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            cursor: draggingTable ? 'grabbing' : 'default',
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Tables */}
          {tables.map((table) => {
            const { width, height } = getTableSize(table.seats, table.shape);
            const isSelected = selectedTable === table.id;
            const isDragging = draggingTable === table.id;

            return (
              <div
                key={table.id}
                className={cn(
                  'absolute flex flex-col items-center justify-center cursor-move transition-all',
                  'border-2 rounded-lg',
                  isSelected && 'ring-4 ring-primary/50',
                  isDragging && 'shadow-2xl scale-105',
                  !table.is_active && 'opacity-50',
                  table.shape === 'circle' && 'rounded-full',
                  table.shape === 'square' && 'rounded-lg',
                  table.shape === 'rectangle' && 'rounded-xl'
                )}
                style={{
                  left: table.position_x,
                  top: table.position_y,
                  width,
                  height,
                  backgroundColor: table.is_active ? '#ffffff' : '#f5f5f5',
                  borderColor: isSelected ? '#FF5A5F' : '#e5e5e5',
                }}
                onMouseDown={(e) => handleMouseDown(table.id, e)}
                onClick={() => setSelectedTable(table.id)}
              >
                <span className="text-sm font-bold text-foreground">
                  {table.table_number}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {table.seats}
                </div>
              </div>
            );
          })}

          {/* Info overlay when no tables */}
          {tables.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8 bg-card border border-border rounded-lg shadow-lg">
                <Grid3x3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Geen tafels</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Klik op "Tafel Toevoegen" om te beginnen
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Properties Panel */}
      {selectedTableData && (
        <div className="p-4 bg-card border border-border rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tafel {selectedTableData.table_number}</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleActive(selectedTableData.id)}
              >
                {selectedTableData.is_active ? 'Deactiveren' : 'Activeren'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Bewerken
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteTable(selectedTableData.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Verwijderen
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Plaatsen</Label>
              <p className="font-semibold">{selectedTableData.seats}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Vorm</Label>
              <p className="font-semibold capitalize">{selectedTableData.shape}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Badge variant={selectedTableData.is_active ? 'default' : 'secondary'}>
                {selectedTableData.is_active ? 'Actief' : 'Inactief'}
              </Badge>
            </div>
          </div>

          {selectedTableData.description && (
            <div>
              <Label className="text-xs text-muted-foreground">Beschrijving</Label>
              <p className="text-sm">{selectedTableData.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Add Table Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe Tafel Toevoegen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="table_number">Tafelnummer *</Label>
              <Input
                id="table_number"
                value={newTable.table_number}
                onChange={(e) =>
                  setNewTable({ ...newTable, table_number: e.target.value })
                }
                placeholder="T1, T2, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seats">Aantal Plaatsen *</Label>
              <Input
                id="seats"
                type="number"
                min="1"
                max="20"
                value={newTable.seats}
                onChange={(e) =>
                  setNewTable({ ...newTable, seats: parseInt(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Vorm</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['circle', 'square', 'rectangle'] as const).map((shape) => (
                  <button
                    key={shape}
                    onClick={() => setNewTable({ ...newTable, shape })}
                    className={cn(
                      'flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all',
                      newTable.shape === shape
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {getTableIcon(shape)}
                    <span className="text-xs mt-2 capitalize">{shape}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschrijving (optioneel)</Label>
              <Textarea
                id="description"
                value={newTable.description}
                onChange={(e) =>
                  setNewTable({ ...newTable, description: e.target.value })
                }
                placeholder="Bijv. Bij het raam, hoek tafel..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuleren
            </Button>
            <Button
              onClick={handleAddTable}
              disabled={!newTable.table_number || !newTable.seats}
            >
              Toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSS for grid pattern */}
      <style jsx global>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
}

