'use client';

// TEMPORARY DEBUG VERSION - Add this to see what's happening
// Replace StepLocatie.tsx with this temporarily to debug

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { locationCreateSchema } from '@/lib/validation/manager';
import { MapPin, Clock } from 'lucide-react';

interface StepLocatieProps {
  data: any;
  updateData: (key: string, value: any) => void;
  onNext: () => void;
}

const DAYS_OF_WEEK = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

export function StepLocatie({ data, updateData, onNext }: StepLocatieProps) {
  const [formData, setFormData] = useState({
    name: data.location?.name || '',
    slug: data.location?.slug || '',
    address: data.location?.address || {
      street: '',
      number: '',
      city: '',
      postalCode: '',
      country: 'NL',
    },
    phone: data.location?.phone || '',
    email: data.location?.email || '',
    cuisine: data.location?.cuisine || '',
    priceRange: data.location?.priceRange || '€€',
    description: data.location?.description || '',
    slotMinutes: data.location?.slotMinutes || 90,
    bufferMinutes: data.location?.bufferMinutes || 15,
    openingHours: data.location?.openingHours || DAYS_OF_WEEK.map((_, index) => ({
      dayOfWeek: index,
      openTime: index === 0 ? '00:00' : '11:00',
      closeTime: index === 0 ? '00:00' : '22:00',
      isClosed: index === 0, // Sunday closed by default
    })),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (message: string) => {
    console.log('🔍 DEBUG:', message);
    setDebugInfo(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    setFormData({ ...formData, name, slug });
  };

  const handleOpeningHourChange = (index: number, field: string, value: any) => {
    const newOpeningHours = [...formData.openingHours];
    newOpeningHours[index] = { ...newOpeningHours[index], [field]: value };
    setFormData({ ...formData, openingHours: newOpeningHours });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setDebugInfo([]);
    
    addDebug('🚀 Submit button clicked');
    addDebug(`📋 Tenant ID: ${data.tenantId || 'MISSING!'}`);

    try {
      // Check if tenantId exists
      if (!data.tenantId) {
        throw new Error('TenantId ontbreekt! Ga terug naar stap 1.');
      }

      const payload = {
        ...formData,
        tenantId: data.tenantId,
      };

      addDebug('✅ Payload prepared');
      console.log('📦 Full payload:', JSON.stringify(payload, null, 2));

      // Validate with Zod
      addDebug('🔍 Validating with Zod...');
      const validated = locationCreateSchema.parse(payload);
      addDebug('✅ Zod validation passed');

      // Create location via API
      addDebug('🌐 Calling API /api/manager/locations');
      const response = await fetch('/api/manager/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });

      addDebug(`📡 Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        addDebug(`❌ Response body: ${errorText}`);
        
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText };
        }
        
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const location = await response.json();
      addDebug(`✅ Location created: ${location.id}`);
      console.log('🎉 Created location:', location);
      
      // Save location data
      updateData('location', location);
      updateData('locationId', location.id);
      
      addDebug('✅ Data saved, moving to next step');
      // Move to next step
      onNext();
    } catch (error: any) {
      addDebug(`❌ ERROR: ${error.message}`);
      console.error('💥 Full error:', error);
      
      if (error.errors) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          if (err.path) {
            fieldErrors[err.path.join('.')] = err.message;
            addDebug(`❌ Field error: ${err.path.join('.')} - ${err.message}`);
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: error.message });
      }
    } finally {
      setIsSubmitting(false);
      addDebug(`✅ Submit finished (isSubmitting: ${isSubmitting})`);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mr-4">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Locatie informatie</h2>
            <p className="text-muted-foreground">Voeg je eerste restaurant locatie toe</p>
          </div>
        </div>
      </div>

      {/* DEBUG INFO BOX */}
      {debugInfo.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🔍 Debug Log:</h3>
          <div className="space-y-1 text-xs font-mono text-blue-800 dark:text-blue-200">
            {debugInfo.map((info, i) => (
              <div key={i}>{info}</div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SAME FORM FIELDS AS ORIGINAL... */}
        {/* Restaurant Name */}
        <div>
          <Label htmlFor="locationName" className="text-base font-medium">
            Restaurant naam *
          </Label>
          <Input
            id="locationName"
            type="text"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Bijv. La Bella Italia Amsterdam Centrum"
            className="mt-2 h-12 rounded-xl"
            required
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name}</p>
          )}
        </div>

        {/* Slug */}
        <div>
          <Label htmlFor="slug" className="text-base font-medium">
            URL slug *
          </Label>
          <div className="flex items-center mt-2">
            <span className="text-muted-foreground mr-2">reserve4you.com/p/</span>
            <Input
              id="slug"
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="la-bella-italia-centrum"
              className="h-12 rounded-xl flex-1"
              required
            />
          </div>
          {errors.slug && (
            <p className="text-sm text-destructive mt-1">{errors.slug}</p>
          )}
        </div>

        {/* Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label className="text-base font-medium">Adres *</Label>
          </div>
          <div>
            <Input
              type="text"
              value={formData.address.street}
              onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
              placeholder="Straatnaam"
              className="h-12 rounded-xl"
              required
            />
          </div>
          <div>
            <Input
              type="text"
              value={formData.address.number}
              onChange={(e) => setFormData({ ...formData, address: { ...formData.address, number: e.target.value } })}
              placeholder="Huisnummer"
              className="h-12 rounded-xl"
              required
            />
          </div>
          <div>
            <Input
              type="text"
              value={formData.address.postalCode}
              onChange={(e) => setFormData({ ...formData, address: { ...formData.address, postalCode: e.target.value } })}
              placeholder="Postcode"
              className="h-12 rounded-xl"
              required
            />
          </div>
          <div>
            <Input
              type="text"
              value={formData.address.city}
              onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
              placeholder="Stad"
              className="h-12 rounded-xl"
              required
            />
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone" className="text-base font-medium">
              Telefoonnummer *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+31 20 123 4567"
              className="mt-2 h-12 rounded-xl"
              required
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-base font-medium">
              E-mailadres *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="info@restaurant.nl"
              className="mt-2 h-12 rounded-xl"
              required
            />
          </div>
        </div>

        {/* Cuisine & Price Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cuisine" className="text-base font-medium">
              Keuken type
            </Label>
            <Input
              id="cuisine"
              type="text"
              value={formData.cuisine}
              onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
              placeholder="Bijv. Italiaans, Frans, Japans"
              className="mt-2 h-12 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="priceRange" className="text-base font-medium">
              Prijsklasse
            </Label>
            <select
              id="priceRange"
              value={formData.priceRange}
              onChange={(e) => setFormData({ ...formData, priceRange: e.target.value as any })}
              className="mt-2 w-full h-12 px-4 rounded-xl border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            >
              <option value="€">€ (Budget)</option>
              <option value="€€">€€ (Middel)</option>
              <option value="€€€">€€€ (Hoog)</option>
              <option value="€€€€">€€€€ (Luxe)</option>
            </select>
          </div>
        </div>

        {/* Opening Hours */}
        <div>
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 text-primary mr-2" />
            <Label className="text-base font-medium">Openingstijden</Label>
          </div>
          <div className="space-y-3">
            {formData.openingHours.map((hours, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium">
                  {DAYS_OF_WEEK[index]}
                </div>
                <input
                  type="checkbox"
                  checked={!hours.isClosed}
                  onChange={(e) => handleOpeningHourChange(index, 'isClosed', !e.target.checked)}
                  className="w-5 h-5 rounded border-border"
                />
                <Input
                  type="time"
                  value={hours.openTime}
                  onChange={(e) => handleOpeningHourChange(index, 'openTime', e.target.value)}
                  disabled={hours.isClosed}
                  className="h-10 rounded-xl"
                />
                <span className="text-muted-foreground">tot</span>
                <Input
                  type="time"
                  value={hours.closeTime}
                  onChange={(e) => handleOpeningHourChange(index, 'closeTime', e.target.value)}
                  disabled={hours.isClosed}
                  className="h-10 rounded-xl"
                />
                {hours.isClosed && (
                  <span className="text-sm text-muted-foreground">Gesloten</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Reservation Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="slotMinutes" className="text-base font-medium">
              Reservering duur (minuten)
            </Label>
            <Input
              id="slotMinutes"
              type="number"
              min="15"
              max="240"
              step="15"
              value={formData.slotMinutes}
              onChange={(e) => setFormData({ ...formData, slotMinutes: parseInt(e.target.value) })}
              className="mt-2 h-12 rounded-xl"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Standaard tijd per reservering
            </p>
          </div>
          <div>
            <Label htmlFor="bufferMinutes" className="text-base font-medium">
              Buffer tijd (minuten)
            </Label>
            <Input
              id="bufferMinutes"
              type="number"
              min="0"
              max="60"
              step="5"
              value={formData.bufferMinutes}
              onChange={(e) => setFormData({ ...formData, bufferMinutes: parseInt(e.target.value) })}
              className="mt-2 h-12 rounded-xl"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Tijd tussen reserveringen
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="text-base font-medium">
            Beschrijving (optioneel)
          </Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Vertel iets over je restaurant..."
            className="mt-2 w-full min-h-[120px] px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
            maxLength={1000}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Deze beschrijving verschijnt op je publieke pagina
          </p>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-xl">
            <p className="text-destructive text-sm font-semibold">{errors.general}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 gradient-bg text-white rounded-xl font-semibold"
          >
            {isSubmitting ? 'Opslaan...' : 'Opslaan en doorgaan'}
          </Button>
        </div>
      </form>
    </div>
  );
}

