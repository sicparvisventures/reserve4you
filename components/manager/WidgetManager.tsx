/**
 * Widget Manager Component
 * 
 * Manage embeddable widgets for external websites
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Code,
  Copy,
  Eye,
  Upload,
  Save,
  AlertCircle,
  CheckCircle2,
  Palette,
  Layout,
  Settings,
  BarChart3,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { uploadTenantLogo } from '@/lib/utils/image-upload';

interface WidgetConfig {
  id: string;
  widget_code: string;
  widget_name: string;
  theme: 'light' | 'dark' | 'auto';
  primary_color: string;
  logo_url: string | null;
  show_logo: boolean;
  logo_position: 'top' | 'left' | 'center';
  layout: 'grid' | 'list' | 'carousel';
  cards_per_row: number;
  card_style: 'modern' | 'classic' | 'minimal';
  show_promotions: boolean;
  show_cuisine: boolean;
  show_price_range: boolean;
  show_city: boolean;
  show_description: boolean;
  location_ids: string[];
  show_all_locations: boolean;
  booking_button_text: string;
  booking_button_color: string;
  button_logo_url: string | null;
  button_text: string | null;
  button_text_position: 'top' | 'bottom';
  max_width: number;
  max_height: number | null;
  custom_css: string | null;
  enable_animations: boolean;
  enable_hover_effects: boolean;
  corner_radius: number;
  track_clicks: boolean;
  is_active: boolean;
}

interface Location {
  id: string;
  name: string;
  city: string;
}

interface WidgetManagerProps {
  tenantId: string;
  tenantName: string;
  locations: Location[];
}

export function WidgetManager({ tenantId, tenantName, locations }: WidgetManagerProps) {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'design' | 'settings' | 'embed' | 'analytics'>('design');
  const [uploading, setUploading] = useState(false);
  const [uploadingButton, setUploadingButton] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const buttonFileInputRef = useRef<HTMLInputElement>(null);

  const widgetUrl = config ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/widget/${config.widget_code}` : '';
  const embedCode = config ? 
    `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget-embed.js"></script>\n<div data-r4y-widget="${config.widget_code}"></div>` : '';
  const buttonEmbedCode = config ?
    `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget-button.js"></script>\n<div data-r4y-widget-button="${config.widget_code}"></div>` : '';

  useEffect(() => {
    fetchWidgetConfig();
  }, [tenantId]);

  const fetchWidgetConfig = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('widget_configurations')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig(data);
      } else {
        // Create default widget if doesn't exist
        await createDefaultWidget();
      }
    } catch (error) {
      console.error('Error fetching widget config:', error);
      showMessage('error', 'Fout bij laden van widget configuratie');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultWidget = async () => {
    try {
      const supabase = createClient();
      const widgetCode = `widget_${tenantName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
      
      const { data, error } = await supabase
        .from('widget_configurations')
        .insert({
          tenant_id: tenantId,
          widget_name: `${tenantName} Widget`,
          widget_code: widgetCode,
          primary_color: '#FF5A5F',
          theme: 'light',
          layout: 'grid',
          cards_per_row: 3,
          show_all_locations: true,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      setConfig(data);
    } catch (error) {
      console.error('Error creating widget:', error);
      showMessage('error', 'Fout bij aanmaken van widget');
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      const supabase = createClient();
      
      console.log('[Widget Manager] Saving config:', {
        button_text: config.button_text,
        button_text_position: config.button_text_position
      });
      
      const { error } = await supabase
        .from('widget_configurations')
        .update({
          widget_name: config.widget_name,
          theme: config.theme,
          primary_color: config.primary_color,
          logo_url: config.logo_url,
          show_logo: config.show_logo,
          logo_position: config.logo_position,
          layout: config.layout,
          cards_per_row: config.cards_per_row,
          card_style: config.card_style,
          show_promotions: config.show_promotions,
          show_cuisine: config.show_cuisine,
          show_price_range: config.show_price_range,
          show_city: config.show_city,
          show_description: config.show_description,
          location_ids: config.location_ids,
          show_all_locations: config.show_all_locations,
          booking_button_text: config.booking_button_text,
          booking_button_color: config.booking_button_color,
          button_logo_url: config.button_logo_url,
          button_text: config.button_text,
          button_text_position: config.button_text_position,
          max_width: config.max_width,
          max_height: config.max_height,
          custom_css: config.custom_css,
          enable_animations: config.enable_animations,
          enable_hover_effects: config.enable_hover_effects,
          corner_radius: config.corner_radius,
          track_clicks: config.track_clicks,
          is_active: config.is_active,
        })
        .eq('id', config.id);

      if (error) throw error;
      
      // Refresh config from database to ensure we have latest
      await fetchWidgetConfig();
      
      console.log('[Widget Manager] Config saved and refreshed');
      showMessage('success', 'Widget configuratie opgeslagen!');
    } catch (error) {
      console.error('Error saving widget:', error);
      showMessage('error', 'Fout bij opslaan van configuratie');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !config) return;

    try {
      setUploading(true);
      const uploadResult = await uploadTenantLogo(file, tenantId);
      
      if ('error' in uploadResult) {
        showMessage('error', uploadResult.error);
        return;
      }
      
      setConfig({ ...config, logo_url: uploadResult.url });
      showMessage('success', 'Logo geüpload!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      showMessage('error', 'Fout bij uploaden van logo');
    } finally {
      setUploading(false);
    }
  };

  const handleButtonLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !config) return;

    try {
      setUploadingButton(true);
      const uploadResult = await uploadTenantLogo(file, tenantId);
      
      if ('error' in uploadResult) {
        showMessage('error', uploadResult.error);
        return;
      }
      
      setConfig({ ...config, button_logo_url: uploadResult.url });
      showMessage('success', 'Button logo geüpload!');
    } catch (error) {
      console.error('Error uploading button logo:', error);
      showMessage('error', 'Fout bij uploaden van button logo');
    } finally {
      setUploadingButton(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showMessage('success', `${label} gekopieerd!`);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const updateConfig = (updates: Partial<WidgetConfig>) => {
    if (!config) return;
    setConfig({ ...config, ...updates });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Widget laden...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Geen widget configuratie gevonden</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <Card className={`p-4 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <p className={message.type === 'success' ? 'text-emerald-900' : 'text-red-900'}>
              {message.text}
            </p>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Widget Configuratie</h2>
          <p className="text-muted-foreground">
            Pas je embeddable widget aan voor externe websites
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open(`/widget/preview/${config.widget_code}`, '_blank')}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('design')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'design'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Palette className="inline-block mr-2 h-4 w-4" />
            Design
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings className="inline-block mr-2 h-4 w-4" />
            Instellingen
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'embed'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Code className="inline-block mr-2 h-4 w-4" />
            Embed Code
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="inline-block mr-2 h-4 w-4" />
            Analytics
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'design' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Branding */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Branding
            </h3>

            <div className="space-y-2">
              <Label>Widget Naam</Label>
              <Input
                value={config.widget_name}
                onChange={(e) => updateConfig({ widget_name: e.target.value })}
                placeholder="Mijn Restaurant Widget"
              />
            </div>

            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                {config.logo_url && (
                  <img src={config.logo_url} alt="Logo" className="h-16 w-auto" />
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? 'Uploaden...' : 'Upload Logo'}
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Switch
                  checked={config.show_logo}
                  onCheckedChange={(checked) => updateConfig({ show_logo: checked })}
                />
                <Label>Logo tonen</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Logo Positie</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={config.logo_position}
                onChange={(e) => updateConfig({ logo_position: e.target.value as any })}
              >
                <option value="top">Boven (Gecentreerd)</option>
                <option value="left">Links</option>
                <option value="center">Gecentreerd</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Primaire Kleur</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={config.primary_color}
                  onChange={(e) => updateConfig({ primary_color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={config.primary_color}
                  onChange={(e) => updateConfig({ primary_color: e.target.value })}
                  placeholder="#FF5A5F"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Thema</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={config.theme}
                onChange={(e) => updateConfig({ theme: e.target.value as any })}
              >
                <option value="light">Licht</option>
                <option value="dark">Donker</option>
                <option value="auto">Automatisch</option>
              </select>
            </div>
          </Card>

          {/* Layout */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Layout
            </h3>

            <div className="space-y-2">
              <Label>Layout Stijl</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={config.layout}
                onChange={(e) => updateConfig({ layout: e.target.value as any })}
              >
                <option value="grid">Grid</option>
                <option value="list">Lijst</option>
                <option value="carousel">Carrousel</option>
              </select>
            </div>

            {config.layout === 'grid' && (
              <div className="space-y-2">
                <Label>Kaarten per Rij</Label>
                <Input
                  type="number"
                  min="1"
                  max="4"
                  value={config.cards_per_row}
                  onChange={(e) => updateConfig({ cards_per_row: parseInt(e.target.value) })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Kaart Stijl</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={config.card_style}
                onChange={(e) => updateConfig({ card_style: e.target.value as any })}
              >
                <option value="modern">Modern</option>
                <option value="classic">Klassiek</option>
                <option value="minimal">Minimaal</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Maximale Breedte (px)</Label>
              <Input
                type="number"
                min="320"
                max="1920"
                value={config.max_width}
                onChange={(e) => updateConfig({ max_width: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Hoek Radius (px)</Label>
              <Input
                type="number"
                min="0"
                max="24"
                value={config.corner_radius}
                onChange={(e) => updateConfig({ corner_radius: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={config.enable_animations}
                  onCheckedChange={(checked) => updateConfig({ enable_animations: checked })}
                />
                <Label>Animaties Inschakelen</Label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={config.enable_hover_effects}
                  onCheckedChange={(checked) => updateConfig({ enable_hover_effects: checked })}
                />
                <Label>Hover Effecten</Label>
              </div>
            </div>
          </Card>

          {/* Display Options */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Weergave Opties</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Promoties Tonen</Label>
                <Switch
                  checked={config.show_promotions}
                  onCheckedChange={(checked) => updateConfig({ show_promotions: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Keuken Type Tonen</Label>
                <Switch
                  checked={config.show_cuisine}
                  onCheckedChange={(checked) => updateConfig({ show_cuisine: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Prijsklasse Tonen</Label>
                <Switch
                  checked={config.show_price_range}
                  onCheckedChange={(checked) => updateConfig({ show_price_range: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Stad Tonen</Label>
                <Switch
                  checked={config.show_city}
                  onCheckedChange={(checked) => updateConfig({ show_city: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Beschrijving Tonen</Label>
                <Switch
                  checked={config.show_description}
                  onCheckedChange={(checked) => updateConfig({ show_description: checked })}
                />
              </div>
            </div>
          </Card>

          {/* Booking Button */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Reserveer Knop</h3>

            <div className="space-y-2">
              <Label>Knop Tekst</Label>
              <Input
                value={config.booking_button_text}
                onChange={(e) => updateConfig({ booking_button_text: e.target.value })}
                placeholder="Reserveren"
              />
            </div>

            <div className="space-y-2">
              <Label>Knop Kleur</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={config.booking_button_color}
                  onChange={(e) => updateConfig({ booking_button_color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={config.booking_button_color}
                  onChange={(e) => updateConfig({ booking_button_color: e.target.value })}
                  placeholder="#FF5A5F"
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3">Floating Button (voor externe website)</h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Button Logo</Label>
                  <div className="flex items-center gap-4">
                    {config.button_logo_url && (
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                        <img src={config.button_logo_url} alt="Button Logo" className="w-9 h-9 object-contain" />
                      </div>
                    )}
                    <input
                      ref={buttonFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleButtonLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => buttonFileInputRef.current?.click()}
                      disabled={uploadingButton}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadingButton ? 'Uploaden...' : config.button_logo_url ? 'Wijzig Logo' : 'Upload Logo'}
                    </Button>
                    {config.button_logo_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateConfig({ button_logo_url: null })}
                      >
                        Verwijder
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Aanbevolen: vierkant formaat (500x500px), transparante achtergrond. Logo vult volledige cirkel.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Button Tekst</Label>
                  <Input
                    value={config.button_text || ''}
                    onChange={(e) => updateConfig({ button_text: e.target.value || null })}
                    placeholder="Reserveren"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optionele tekst die naast de floating button wordt getoond (bijv. "Reserveren", "Boek nu")
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tekst Positie</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={config.button_text_position === 'top' ? 'default' : 'outline'}
                      onClick={() => updateConfig({ button_text_position: 'top' })}
                      className="justify-start"
                    >
                      Boven
                    </Button>
                    <Button
                      type="button"
                      variant={config.button_text_position === 'bottom' ? 'default' : 'outline'}
                      onClick={() => updateConfig({ button_text_position: 'bottom' })}
                      className="justify-start"
                    >
                      Onder
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Positie van de tekst label ten opzichte van de button
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Locations */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Locaties</h3>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={config.show_all_locations}
                  onCheckedChange={(checked) => updateConfig({ show_all_locations: checked })}
                />
                <Label>Alle Locaties Tonen</Label>
              </div>
            </div>

            {!config.show_all_locations && (
              <div className="space-y-2">
                <Label>Selecteer Locaties</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {locations.map(location => (
                    <div key={location.id} className="flex items-center gap-2 p-2 border rounded">
                      <input
                        type="checkbox"
                        checked={config.location_ids.includes(location.id)}
                        onChange={(e) => {
                          const newIds = e.target.checked
                            ? [...config.location_ids, location.id]
                            : config.location_ids.filter(id => id !== location.id);
                          updateConfig({ location_ids: newIds });
                        }}
                      />
                      <Label>{location.name} - {location.city}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Advanced */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Geavanceerd</h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Analytics Tracking</Label>
                <Switch
                  checked={config.track_clicks}
                  onCheckedChange={(checked) => updateConfig({ track_clicks: checked })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Widget Actief</Label>
                <Switch
                  checked={config.is_active}
                  onCheckedChange={(checked) => updateConfig({ is_active: checked })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Custom CSS (Geavanceerd)</Label>
              <Textarea
                value={config.custom_css || ''}
                onChange={(e) => updateConfig({ custom_css: e.target.value })}
                placeholder=".r4y-widget { ... }"
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Voeg custom CSS toe om het widget nog verder aan te passen
              </p>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'embed' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Standaard Widget (Full Grid)</h3>
            <p className="text-sm text-muted-foreground">
              Voor een dedicated pagina zoals /locaties. Toont direct alle restaurant kaarten.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>HTML Embed Code</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(embedCode, 'Embed code')}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Kopieer
                  </Button>
                </div>
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                  <code>{embedCode}</code>
                </pre>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Floating Button Widget</h3>
            <p className="text-sm text-muted-foreground">
              Voor elke pagina van je website. Toont een klein knopje rechtsonder dat een modal opent met alle locaties.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>HTML Button Embed Code</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(buttonEmbedCode, 'Button embed code')}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Kopieer
                  </Button>
                </div>
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                  <code>{buttonEmbedCode}</code>
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Widget Code</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(config.widget_code, 'Widget code')}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Kopieer
                  </Button>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <code className="text-sm font-mono">{config.widget_code}</code>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>API URL</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(widgetUrl, 'API URL')}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Kopieer
                  </Button>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <code className="text-sm font-mono break-all">{widgetUrl}</code>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Instructies</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Kopieer de HTML Embed Code hierboven</li>
              <li>Plak de code in je website HTML waar je het widget wilt tonen</li>
              <li>Het widget wordt automatisch geladen en gestyled volgens je instellingen</li>
              <li>Test het widget op je website en pas de instellingen aan indien nodig</li>
            </ol>
            
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => window.open('/WIDGET_CLIENT_INSTRUCTIONS.md', '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Volledige Documentatie
              </Button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'analytics' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Analytics</h3>
          <p className="text-muted-foreground">
            Analytics functionaliteit komt binnenkort beschikbaar.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Hier kun je straks statistieken zien over widget views, clicks, en conversies.
          </p>
        </Card>
      )}
    </div>
  );
}

