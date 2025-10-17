'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { tenantCreateSchema } from '@/lib/validation/manager';
import { Store, Palette } from 'lucide-react';

interface StepBedrijfProps {
  data: any;
  updateData: (key: string, value: any) => void;
  onNext: () => void;
}

export function StepBedrijf({ data, updateData, onNext }: StepBedrijfProps) {
  const [formData, setFormData] = useState({
    name: data.tenant?.name || '',
    brandColor: data.tenant?.brandColor || '#FF5A5F',
    description: data.tenant?.description || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate with Zod
      const validated = tenantCreateSchema.parse(formData);

      // Create tenant via API
      const response = await fetch('/api/manager/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create tenant');
      }

      const tenant = await response.json();
      
      // Save tenant data
      updateData('tenant', tenant);
      updateData('tenantId', tenant.id);
      
      // Move to next step
      onNext();
    } catch (error: any) {
      if (error.errors) {
        // Zod validation errors
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          if (err.path) {
            fieldErrors[err.path[0]] = err.message;
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
            <Store className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Bedrijfsinformatie</h2>
            <p className="text-muted-foreground">Start met de basisinformatie van je bedrijf</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bedrijfsnaam */}
        <div>
          <Label htmlFor="name" className="text-base font-medium">
            Bedrijfsnaam *
          </Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Bijv. La Bella Italia"
            className="mt-2 h-12 rounded-xl"
            required
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Dit is de naam die klanten zullen zien
          </p>
        </div>

        {/* Brand Color */}
        <div>
          <Label htmlFor="brandColor" className="text-base font-medium">
            Merkkleur
          </Label>
          <div className="flex items-center gap-4 mt-2">
            <div className="relative">
              <input
                id="brandColor"
                type="color"
                value={formData.brandColor}
                onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                className="w-20 h-12 rounded-xl cursor-pointer border-2 border-border"
              />
              <Palette className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-white pointer-events-none mix-blend-difference" />
            </div>
            <Input
              type="text"
              value={formData.brandColor}
              onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
              placeholder="#FF5A5F"
              className="h-12 rounded-xl flex-1 font-mono"
            />
          </div>
          {errors.brandColor && (
            <p className="text-sm text-destructive mt-1">{errors.brandColor}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Deze kleur wordt gebruikt in je publieke restaurant pagina
          </p>
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
            placeholder="Een korte beschrijving van je bedrijf..."
            className="mt-2 w-full min-h-[120px] px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
            maxLength={500}
          />
          <div className="flex justify-between mt-1">
            <p className="text-sm text-muted-foreground">
              Voor intern gebruik
            </p>
            <p className="text-sm text-muted-foreground">
              {formData.description.length}/500
            </p>
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

