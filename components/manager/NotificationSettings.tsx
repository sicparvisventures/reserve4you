'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Bell,
  Check,
  AlertCircle,
  Clock,
  Mail,
  Users,
  Settings,
  Save,
  RefreshCw,
} from 'lucide-react';

interface NotificationSettingsProps {
  tenantId: string;
  locationId?: string;
  initialSettings?: any;
}

export function NotificationSettings({ 
  tenantId, 
  locationId, 
  initialSettings 
}: NotificationSettingsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [settings, setSettings] = useState({
    notify_on_new_booking: initialSettings?.notify_on_new_booking ?? true,
    notify_on_booking_confirmed: initialSettings?.notify_on_booking_confirmed ?? true,
    notify_on_booking_cancelled: initialSettings?.notify_on_booking_cancelled ?? true,
    notify_on_booking_modified: initialSettings?.notify_on_booking_modified ?? true,
    send_booking_reminders: initialSettings?.send_booking_reminders ?? true,
    reminder_hours_before: initialSettings?.reminder_hours_before ?? 24,
    notify_tenant_owner: initialSettings?.notify_tenant_owner ?? true,
    notify_location_managers: initialSettings?.notify_location_managers ?? true,
    send_customer_confirmation: initialSettings?.send_customer_confirmation ?? true,
    send_customer_reminder: initialSettings?.send_customer_reminder ?? true,
    customer_reminder_hours_before: initialSettings?.customer_reminder_hours_before ?? 2,
  });

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/manager/notification-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          location_id: locationId || null,
          ...settings,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      showMessage('success', 'Notificatie-instellingen succesvol opgeslagen!');
      router.refresh();
    } catch (error: any) {
      showMessage('error', error.message || 'Fout bij opslaan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Notificatie-instellingen</h2>
        <p className="text-muted-foreground">
          Beheer hoe en wanneer je notificaties ontvangt over reserveringen
        </p>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Booking Event Notifications */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Reservering Notificaties</h3>
            <p className="text-sm text-muted-foreground">
              Ontvang meldingen bij belangrijke reserverings-gebeurtenissen
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="notify_new" className="text-base font-medium cursor-pointer">
                Nieuwe reserveringen
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Word op de hoogte gebracht bij elke nieuwe boeking
              </p>
            </div>
            <Switch
              id="notify_new"
              checked={settings.notify_on_new_booking}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, notify_on_new_booking: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="notify_confirmed" className="text-base font-medium cursor-pointer">
                Bevestigde reserveringen
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Melding wanneer een reservering wordt bevestigd
              </p>
            </div>
            <Switch
              id="notify_confirmed"
              checked={settings.notify_on_booking_confirmed}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, notify_on_booking_confirmed: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="notify_cancelled" className="text-base font-medium cursor-pointer">
                Geannuleerde reserveringen
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Melding wanneer een reservering wordt geannuleerd
              </p>
            </div>
            <Switch
              id="notify_cancelled"
              checked={settings.notify_on_booking_cancelled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, notify_on_booking_cancelled: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="notify_modified" className="text-base font-medium cursor-pointer">
                Gewijzigde reserveringen
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Melding wanneer reserveringsdetails worden aangepast
              </p>
            </div>
            <Switch
              id="notify_modified"
              checked={settings.notify_on_booking_modified}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, notify_on_booking_modified: checked }))
              }
            />
          </div>
        </div>
      </Card>

      {/* Reminder Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Herinneringen</h3>
            <p className="text-sm text-muted-foreground">
              Stel herinneringen in voor aankomende reserveringen
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="send_reminders" className="text-base font-medium cursor-pointer">
                Verzend herinneringen
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Stuur automatische herinneringen voor aankomende reserveringen
              </p>
            </div>
            <Switch
              id="send_reminders"
              checked={settings.send_booking_reminders}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, send_booking_reminders: checked }))
              }
            />
          </div>

          {settings.send_booking_reminders && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <Label htmlFor="reminder_hours" className="text-base font-medium">
                Herinnering verzenden (uren van tevoren)
              </Label>
              <p className="text-sm text-muted-foreground mt-1 mb-3">
                Hoeveel uur voor de reservering wil je een herinnering ontvangen?
              </p>
              <Input
                id="reminder_hours"
                type="number"
                min="1"
                max="168"
                value={settings.reminder_hours_before}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, reminder_hours_before: parseInt(e.target.value) || 24 }))
                }
                className="w-32"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Customer Notifications */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Klant Notificaties</h3>
            <p className="text-sm text-muted-foreground">
              Beheer welke notificaties klanten ontvangen
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="customer_confirmation" className="text-base font-medium cursor-pointer">
                Bevestigings e-mails
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Stuur klanten automatisch een bevestiging van hun reservering
              </p>
            </div>
            <Switch
              id="customer_confirmation"
              checked={settings.send_customer_confirmation}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, send_customer_confirmation: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="customer_reminder" className="text-base font-medium cursor-pointer">
                Klant herinneringen
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Stuur klanten een herinnering voor hun reservering
              </p>
            </div>
            <Switch
              id="customer_reminder"
              checked={settings.send_customer_reminder}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, send_customer_reminder: checked }))
              }
            />
          </div>

          {settings.send_customer_reminder && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <Label htmlFor="customer_reminder_hours" className="text-base font-medium">
                Klant herinnering timing (uren van tevoren)
              </Label>
              <p className="text-sm text-muted-foreground mt-1 mb-3">
                Hoeveel uur voor de reservering krijgen klanten een herinnering?
              </p>
              <Input
                id="customer_reminder_hours"
                type="number"
                min="1"
                max="72"
                value={settings.customer_reminder_hours_before}
                onChange={(e) => 
                  setSettings(prev => ({ 
                    ...prev, 
                    customer_reminder_hours_before: parseInt(e.target.value) || 2 
                  }))
                }
                className="w-32"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Team Notifications */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Team Notificaties</h3>
            <p className="text-sm text-muted-foreground">
              Bepaal wie in je team notificaties ontvangt
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="notify_owner" className="text-base font-medium cursor-pointer">
                Notificeer eigenaar
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Stuur notificaties naar de tenant eigenaar
              </p>
            </div>
            <Switch
              id="notify_owner"
              checked={settings.notify_tenant_owner}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, notify_tenant_owner: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="notify_managers" className="text-base font-medium cursor-pointer">
                Notificeer managers
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Stuur notificaties naar locatie managers
              </p>
            </div>
            <Switch
              id="notify_managers"
              checked={settings.notify_location_managers}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, notify_location_managers: checked }))
              }
            />
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-6 border-t">
        <Button
          onClick={handleSave}
          disabled={loading}
          size="lg"
          className="gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Opslaan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Wijzigingen Opslaan
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.refresh()}
          disabled={loading}
        >
          Annuleren
        </Button>
      </div>
    </div>
  );
}

