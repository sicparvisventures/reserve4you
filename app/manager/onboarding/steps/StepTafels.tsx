'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { tablesBulkCreateSchema, shiftsBulkCreateSchema } from '@/lib/validation/manager';
import { Table2, Clock, Plus, Trash2, Layers } from 'lucide-react';

interface StepTafelsProps {
  data: any;
  updateData: (key: string, value: any) => void;
  onNext: () => void;
}

const DAYS_OF_WEEK = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];

export function StepTafels({ data, updateData, onNext }: StepTafelsProps) {
  const [tables, setTables] = useState(data.tables || [
    { name: 'Resource 1', seats: 2, combinable: false, groupId: '' },
    { name: 'Resource 2', seats: 2, combinable: false, groupId: '' },
  ]);
  
  // Ensure shifts always have daysOfWeek array
  const [shifts, setShifts] = useState(() => {
    const defaultShifts = [
      { name: 'Lunch', startTime: '12:00', endTime: '15:00', daysOfWeek: [1, 2, 3, 4, 5], maxParallel: 20 },
      { name: 'Diner', startTime: '18:00', endTime: '22:00', daysOfWeek: [1, 2, 3, 4, 5, 6], maxParallel: 30 },
    ];
    
    if (!data.shifts || data.shifts.length === 0) {
      return defaultShifts;
    }
    
    // Ensure each shift has daysOfWeek array
    return data.shifts.map((shift: any) => ({
      ...shift,
      daysOfWeek: Array.isArray(shift.daysOfWeek) ? shift.daysOfWeek : [1, 2, 3, 4, 5],
    }));
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addTable = () => {
    setTables([...tables, { name: `Resource ${tables.length + 1}`, seats: 2, combinable: false, groupId: '' }]);
  };

  const removeTable = (index: number) => {
    setTables(tables.filter((_: any, i: number) => i !== index));
  };

  const updateTable = (index: number, field: string, value: any) => {
    const newTables = [...tables];
    newTables[index] = { ...newTables[index], [field]: value };
    setTables(newTables);
  };

  const addShift = () => {
    setShifts([...shifts, { name: 'Nieuwe shift', startTime: '12:00', endTime: '15:00', daysOfWeek: [1, 2, 3, 4, 5], maxParallel: 20 }]);
  };

  const removeShift = (index: number) => {
    setShifts(shifts.filter((_: any, i: number) => i !== index));
  };

  const updateShift = (index: number, field: string, value: any) => {
    const newShifts = [...shifts];
    newShifts[index] = { ...newShifts[index], [field]: value };
    setShifts(newShifts);
  };

  const toggleDayOfWeek = (shiftIndex: number, day: number) => {
    const shift = shifts[shiftIndex];
    const currentDays = Array.isArray(shift.daysOfWeek) ? shift.daysOfWeek : [1, 2, 3, 4, 5];
    const newDaysOfWeek = currentDays.includes(day)
      ? currentDays.filter((d: number) => d !== day)
      : [...currentDays, day].sort();
    updateShift(shiftIndex, 'daysOfWeek', newDaysOfWeek);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate with Zod
      const validatedTables = tablesBulkCreateSchema.parse({
        locationId: data.locationId,
        tables: tables,
      });
      const validatedShifts = shiftsBulkCreateSchema.parse({
        locationId: data.locationId,
        shifts: shifts,
      });

      // Create tables via API
      const tablesResponse = await fetch('/api/manager/tables/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedTables),
      });

      if (!tablesResponse.ok) {
        const error = await tablesResponse.json();
        throw new Error(error.error || 'Failed to create tables');
      }

      const createdTables = await tablesResponse.json();

      // Create shifts via API
      const shiftsResponse = await fetch('/api/manager/shifts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedShifts),
      });

      if (!shiftsResponse.ok) {
        const error = await shiftsResponse.json();
        throw new Error(error.error || 'Failed to create shifts');
      }

      const createdShifts = await shiftsResponse.json();
      
      // Save data
      updateData('tables', createdTables);
      updateData('shifts', createdShifts);
      
      // Move to next step
      onNext();
    } catch (error: any) {
      if (error.errors) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          if (err.path) {
            fieldErrors[err.path.join('.')] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: error.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mr-4">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Resources & Diensten</h2>
            <p className="text-muted-foreground">Configureer je capaciteit en beschikbaarheid</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Resources Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Label className="text-lg font-semibold">Resources (Tafels / Kamers / Stoelen)</Label>
            <Button type="button" variant="outline" onClick={addTable} className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Resource toevoegen
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Voeg je bookbare resources toe. Dit kunnen tafels, kamers, behandelstoelen, of andere bookbare eenheden zijn.
          </p>
          <div className="space-y-3">
            {tables.map((table: any, index: number) => (
              <Card key={index} className="p-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="text"
                    value={table.name}
                    onChange={(e) => updateTable(index, 'name', e.target.value)}
                    placeholder="Bijv. Tafel 1, Kamer 2, Stoel A"
                    className="h-10 rounded-xl flex-1"
                  />
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={table.seats}
                    onChange={(e) => updateTable(index, 'seats', parseInt(e.target.value))}
                    placeholder="Capaciteit"
                    className="h-10 rounded-xl w-24"
                  />
                  <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={table.combinable}
                      onChange={(e) => updateTable(index, 'combinable', e.target.checked)}
                      className="w-4 h-4 rounded border-border"
                    />
                    Combineerbaar
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTable(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Shifts Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Label className="text-lg font-semibold">Diensten / Shifts</Label>
            <Button type="button" variant="outline" onClick={addShift} className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Shift toevoegen
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Definieer je beschikbare tijdsblokken. Bijvoorbeeld: Lunch (12:00-15:00), Diner (18:00-22:00), of Ochtend/Middag shifts.
          </p>
          <div className="space-y-4">
            {shifts.map((shift: any, index: number) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <Input
                      type="text"
                      value={shift.name}
                      onChange={(e) => updateShift(index, 'name', e.target.value)}
                      placeholder="Shift naam"
                      className="h-10 rounded-xl flex-1"
                    />
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={shift.startTime}
                        onChange={(e) => updateShift(index, 'startTime', e.target.value)}
                        className="h-10 rounded-xl w-32"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="time"
                        value={shift.endTime}
                        onChange={(e) => updateShift(index, 'endTime', e.target.value)}
                        className="h-10 rounded-xl w-32"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeShift(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground mr-2">Dagen:</span>
                    {DAYS_OF_WEEK.map((day, dayIndex) => {
                      const daysOfWeek = Array.isArray(shift.daysOfWeek) ? shift.daysOfWeek : [1, 2, 3, 4, 5];
                      return (
                        <button
                          key={dayIndex}
                          type="button"
                          onClick={() => toggleDayOfWeek(index, dayIndex)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                            daysOfWeek.includes(dayIndex)
                              ? 'bg-primary text-white'
                              : 'bg-card border border-border text-muted-foreground hover:border-primary'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-xl">
            <p className="text-destructive text-sm">{errors.general}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || tables.length === 0 || shifts.length === 0}
            className="w-full h-12 gradient-bg text-white rounded-xl font-semibold"
          >
            {isSubmitting ? 'Opslaan...' : 'Opslaan en doorgaan'}
          </Button>
        </div>
      </form>
    </div>
  );
}

