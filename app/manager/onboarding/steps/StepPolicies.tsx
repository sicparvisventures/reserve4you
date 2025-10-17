'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup } from '@/components/ui/radio-group';
import { policyCreateSchema } from '@/lib/validation/manager';
import { ShieldCheck, Euro, Clock, XCircle } from 'lucide-react';

interface StepPoliciesProps {
  data: any;
  updateData: (key: string, value: any) => void;
  onNext: () => void;
}

export function StepPolicies({ data, updateData, onNext }: StepPoliciesProps) {
  const [formData, setFormData] = useState({
    cancellationHours: data.policy?.cancellationHours || 24,
    noShowFeeCents: data.policy?.noShowFeeCents || 2500, // €25
    depositRequired: data.policy?.depositRequired || false,
    depositType: data.policy?.depositType || 'FIXED',
    depositValue: data.policy?.depositValue || 1000, // €10 or 10%
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate with Zod
      const validated = policyCreateSchema.parse({
        ...formData,
        locationId: data.locationId,
      });

      // Create policy via API
      const response = await fetch('/api/manager/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create policy');
      }

      const policy = await response.json();
      
      // Save policy data
      updateData('policy', policy);
      
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

  const formatEuro = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mr-4">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Beleid & Policies</h2>
            <p className="text-muted-foreground">Stel je annulerings- en betalingsbeleid in</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Cancellation Policy */}
        <div className="border border-border rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 text-primary mr-2" />
            <Label className="text-lg font-semibold">Annuleringsbeleid</Label>
          </div>
          <div>
            <Label htmlFor="cancellationHours" className="text-base font-medium">
              Minimum annuleringstijd (uren) *
            </Label>
            <Input
              id="cancellationHours"
              type="number"
              min="0"
              max="168"
              value={formData.cancellationHours}
              onChange={(e) => setFormData({ ...formData, cancellationHours: parseInt(e.target.value) })}
              className="mt-2 h-12 rounded-xl"
              required
            />
            {errors.cancellationHours && (
              <p className="text-sm text-destructive mt-1">{errors.cancellationHours}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Gasten moeten minimaal {formData.cancellationHours} uur van tevoren annuleren
            </p>
          </div>
        </div>

        {/* No-Show Fee */}
        <div className="border border-border rounded-xl p-6">
          <div className="flex items-center mb-4">
            <XCircle className="h-5 w-5 text-primary mr-2" />
            <Label className="text-lg font-semibold">No-show kosten</Label>
          </div>
          <div>
            <Label htmlFor="noShowFeeCents" className="text-base font-medium">
              No-show fee *
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-muted-foreground">€</span>
              <Input
                id="noShowFeeCents"
                type="number"
                min="0"
                max="1000"
                step="0.50"
                value={(formData.noShowFeeCents / 100).toFixed(2)}
                onChange={(e) => setFormData({ ...formData, noShowFeeCents: Math.round(parseFloat(e.target.value) * 100) })}
                className="h-12 rounded-xl flex-1"
                required
              />
            </div>
            {errors.noShowFeeCents && (
              <p className="text-sm text-destructive mt-1">{errors.noShowFeeCents}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Dit bedrag wordt in rekening gebracht bij no-show: {formatEuro(formData.noShowFeeCents)}
            </p>
          </div>
        </div>

        {/* Deposit */}
        <div className="border border-border rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Euro className="h-5 w-5 text-primary mr-2" />
            <Label className="text-lg font-semibold">Aanbetaling</Label>
          </div>
          
          <div className="mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.depositRequired}
                onChange={(e) => setFormData({ ...formData, depositRequired: e.target.checked })}
                className="w-5 h-5 rounded border-border"
              />
              <span className="text-base font-medium">Aanbetaling vereisen</span>
            </label>
            <p className="text-sm text-muted-foreground mt-2 ml-8">
              Gasten moeten een aanbetaling doen om de reservering te bevestigen
            </p>
          </div>

          {formData.depositRequired && (
            <div className="space-y-4 mt-4 pl-8 border-l-2 border-primary/20">
              <div>
                <Label className="text-base font-medium mb-2 block">Type aanbetaling</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="depositType"
                      checked={formData.depositType === 'FIXED'}
                      onChange={() => setFormData({ ...formData, depositType: 'FIXED' })}
                      className="w-4 h-4"
                    />
                    <span>Vast bedrag per persoon</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="depositType"
                      checked={formData.depositType === 'PERCENT'}
                      onChange={() => setFormData({ ...formData, depositType: 'PERCENT' })}
                      className="w-4 h-4"
                    />
                    <span>Percentage van totaal</span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="depositValue" className="text-base font-medium">
                  {formData.depositType === 'FIXED' ? 'Bedrag per persoon' : 'Percentage'}
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  {formData.depositType === 'FIXED' ? (
                    <>
                      <span className="text-muted-foreground">€</span>
                      <Input
                        id="depositValue"
                        type="number"
                        min="0"
                        max="100"
                        step="0.50"
                        value={(formData.depositValue / 100).toFixed(2)}
                        onChange={(e) => setFormData({ ...formData, depositValue: Math.round(parseFloat(e.target.value) * 100) })}
                        className="h-12 rounded-xl flex-1"
                        required
                      />
                    </>
                  ) : (
                    <>
                      <Input
                        id="depositValue"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.depositValue}
                        onChange={(e) => setFormData({ ...formData, depositValue: parseInt(e.target.value) })}
                        className="h-12 rounded-xl flex-1"
                        required
                      />
                      <span className="text-muted-foreground">%</span>
                    </>
                  )}
                </div>
                {errors.depositValue && (
                  <p className="text-sm text-destructive mt-1">{errors.depositValue}</p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  {formData.depositType === 'FIXED'
                    ? `Gasten betalen ${formatEuro(formData.depositValue)} per persoon`
                    : `Gasten betalen ${formData.depositValue}% van het totale bedrag`
                  }
                </p>
              </div>
            </div>
          )}
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

