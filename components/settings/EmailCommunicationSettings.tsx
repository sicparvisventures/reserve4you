'use client';

/**
 * Email Communication Settings - Reserve4You
 * Complete email system configuration and template management
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Mail,
  Send,
  Eye,
  Edit,
  Save,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Settings,
  FileText,
  BarChart3,
  TestTube2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface EmailSettings {
  id?: string;
  tenant_id: string;
  provider: 'resend' | 'smtp';
  from_email: string;
  from_name: string;
  reply_to_email?: string;
  resend_api_key?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure?: boolean;
  smtp_username?: string;
  smtp_password?: string;
  enable_booking_confirmation: boolean;
  enable_booking_reminders: boolean;
  enable_manager_notifications: boolean;
  enable_cancellation_emails: boolean;
  reminder_24h_enabled: boolean;
  reminder_2h_enabled: boolean;
}

interface EmailTemplate {
  id: string;
  tenant_id: string;
  template_type: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  language: string;
  variables: string[];
  is_active: boolean;
}

interface EmailStats {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_failed: number;
  open_rate: number;
  by_template: Record<string, number>;
}

interface EmailCommunicationSettingsProps {
  tenantId: string;
}

export function EmailCommunicationSettings({ tenantId }: EmailCommunicationSettingsProps) {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editedTemplate, setEditedTemplate] = useState<Partial<EmailTemplate>>({});
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      // Load email settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('email_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (!settingsError && settingsData) {
        setSettings(settingsData as EmailSettings);
      } else {
        // Create default settings
        setSettings({
          tenant_id: tenantId,
          provider: 'resend',
          from_email: 'no-reply@reserve4you.com',
          from_name: 'Reserve4You',
          reply_to_email: '',
          enable_booking_confirmation: true,
          enable_booking_reminders: true,
          enable_manager_notifications: true,
          enable_cancellation_emails: true,
          reminder_24h_enabled: true,
          reminder_2h_enabled: true,
        });
      }

      // Load templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('template_type');

      if (!templatesError) {
        setTemplates(templatesData as EmailTemplate[]);
      }

      // Load stats
      const { data: statsData, error: statsError } = await supabase.rpc('get_email_stats', {
        p_tenant_id: tenantId,
        p_days: 30,
      });

      if (!statsError) {
        setStats(statsData as EmailStats);
      }
    } catch (error) {
      console.error('Error loading email data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('email_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Instellingen opgeslagen!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: error.message || 'Fout bij opslaan' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings) return;

    setIsTesting(true);
    setMessage(null);

    try {
      // Test by trying to send a test email
      if (!testEmail) {
        setMessage({ type: 'error', text: 'Voer een test email adres in' });
        return;
      }

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          recipientEmail: testEmail,
          recipientName: 'Test',
          templateType: 'booking_confirmation',
          variables: {
            guest_name: 'Test Gebruiker',
            date: new Date().toLocaleDateString('nl-NL'),
            time: '19:00',
            party_size: '2',
            location_name: 'Test Restaurant',
            location_address: 'Test Straat 1',
            location_phone: '+31 6 12345678',
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Test mislukt');
      }

      setMessage({ type: 'success', text: 'Test email verzonden!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditedTemplate(template);
    setIsEditingTemplate(true);
  };

  const handleSaveTemplate = async () => {
    if (!editedTemplate || !selectedTemplate) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('email_templates')
        .update({
          name: editedTemplate.name,
          subject: editedTemplate.subject,
          html_content: editedTemplate.html_content,
          text_content: editedTemplate.text_content,
          is_active: editedTemplate.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedTemplate.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Template opgeslagen!' });
      setIsEditingTemplate(false);
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving template:', error);
      setMessage({ type: 'error', text: error.message || 'Fout bij opslaan' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Instellingen
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="h-4 w-4 mr-2" />
            Statistieken
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Provider Selection */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Provider
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setSettings(s => s ? { ...s, provider: 'resend' } : null)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    settings?.provider === 'resend' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <h4 className="font-semibold mb-1">Resend (Aanbevolen)</h4>
                  <p className="text-sm text-muted-foreground">Modern email API, tracking included</p>
                </div>
                <div
                  onClick={() => setSettings(s => s ? { ...s, provider: 'smtp' } : null)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    settings?.provider === 'smtp' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <h4 className="font-semibold mb-1">SMTP (Combell)</h4>
                  <p className="text-sm text-muted-foreground">Gebruik je eigen mailserver</p>
                </div>
              </div>

              {/* Resend Settings */}
              {settings?.provider === 'resend' && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="resend_api_key">Resend API Key</Label>
                    <Input
                      id="resend_api_key"
                      type="password"
                      value={settings?.resend_api_key || ''}
                      onChange={(e) => setSettings(s => s ? { ...s, resend_api_key: e.target.value } : null)}
                      placeholder="re_..."
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Get your API key from <a href="https://resend.com/api-keys" target="_blank" className="text-primary underline">resend.com/api-keys</a>
                    </p>
                  </div>
                </div>
              )}

              {/* SMTP Settings */}
              {settings?.provider === 'smtp' && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtp_host">SMTP Host</Label>
                      <Input
                        id="smtp_host"
                        value={settings?.smtp_host || ''}
                        onChange={(e) => setSettings(s => s ? { ...s, smtp_host: e.target.value } : null)}
                        placeholder="smtp.combell.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp_port">Port</Label>
                      <Input
                        id="smtp_port"
                        type="number"
                        value={settings?.smtp_port || 587}
                        onChange={(e) => setSettings(s => s ? { ...s, smtp_port: parseInt(e.target.value) } : null)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtp_username">Username</Label>
                      <Input
                        id="smtp_username"
                        value={settings?.smtp_username || ''}
                        onChange={(e) => setSettings(s => s ? { ...s, smtp_username: e.target.value } : null)}
                        placeholder="your-email@domain.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp_password">Password</Label>
                      <Input
                        id="smtp_password"
                        type="password"
                        value={settings?.smtp_password || ''}
                        onChange={(e) => setSettings(s => s ? { ...s, smtp_password: e.target.value } : null)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id="smtp_secure"
                      checked={settings?.smtp_secure || false}
                      onCheckedChange={(checked) => setSettings(s => s ? { ...s, smtp_secure: checked } : null)}
                    />
                    <Label htmlFor="smtp_secure">SSL/TLS Secure Connection</Label>
                  </div>
                </div>
              )}

              {/* From Address */}
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from_name">Afzender Naam</Label>
                    <Input
                      id="from_name"
                      value={settings?.from_name || ''}
                      onChange={(e) => setSettings(s => s ? { ...s, from_name: e.target.value } : null)}
                      placeholder="Reserve4You"
                    />
                  </div>
                  <div>
                    <Label htmlFor="from_email">Afzender Email</Label>
                    <Input
                      id="from_email"
                      type="email"
                      value={settings?.from_email || ''}
                      onChange={(e) => setSettings(s => s ? { ...s, from_email: e.target.value } : null)}
                      placeholder="no-reply@reserve4you.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="reply_to_email">Reply-To Email (optioneel)</Label>
                  <Input
                    id="reply_to_email"
                    type="email"
                    value={settings?.reply_to_email || ''}
                    onChange={(e) => setSettings(s => s ? { ...s, reply_to_email: e.target.value } : null)}
                    placeholder="support@reserve4you.com"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Email Features */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Email Functies</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Booking Bevestigingen</div>
                  <p className="text-sm text-muted-foreground">Verstuur bevestiging bij nieuwe reservering</p>
                </div>
                <Switch
                  checked={settings?.enable_booking_confirmation || false}
                  onCheckedChange={(checked) => setSettings(s => s ? { ...s, enable_booking_confirmation: checked } : null)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Booking Herinneringen</div>
                  <p className="text-sm text-muted-foreground">Verstuur herinneringen voor reserveringen</p>
                </div>
                <Switch
                  checked={settings?.enable_booking_reminders || false}
                  onCheckedChange={(checked) => setSettings(s => s ? { ...s, enable_booking_reminders: checked } : null)}
                />
              </div>

              {settings?.enable_booking_reminders && (
                <div className="ml-8 space-y-3 pl-4 border-l-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">24 uur voor reservering</div>
                    <Switch
                      checked={settings?.reminder_24h_enabled || false}
                      onCheckedChange={(checked) => setSettings(s => s ? { ...s, reminder_24h_enabled: checked } : null)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">2 uur voor reservering</div>
                    <Switch
                      checked={settings?.reminder_2h_enabled || false}
                      onCheckedChange={(checked) => setSettings(s => s ? { ...s, reminder_2h_enabled: checked } : null)}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Manager Notificaties</div>
                  <p className="text-sm text-muted-foreground">Alert manager bij nieuwe reservering</p>
                </div>
                <Switch
                  checked={settings?.enable_manager_notifications || false}
                  onCheckedChange={(checked) => setSettings(s => s ? { ...s, enable_manager_notifications: checked } : null)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Annulering Bevestigingen</div>
                  <p className="text-sm text-muted-foreground">Verstuur bevestiging bij annulering</p>
                </div>
                <Switch
                  checked={settings?.enable_cancellation_emails || false}
                  onCheckedChange={(checked) => setSettings(s => s ? { ...s, enable_cancellation_emails: checked } : null)}
                />
              </div>
            </div>
          </Card>

          {/* Test Connection */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <TestTube2 className="h-5 w-5" />
              Test Email
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="test_email">Test Email Adres</Label>
                <Input
                  id="test_email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="je@email.com"
                />
              </div>

              <Button onClick={handleTestConnection} disabled={isTesting || !testEmail}>
                <Send className="h-4 w-4 mr-2" />
                {isTesting ? 'Verzenden...' : 'Test Email Verzenden'}
              </Button>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button onClick={handleSaveSettings} disabled={isSaving} className="gradient-bg">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          {templates.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">Nog geen templates</p>
              <Button
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.rpc('create_default_email_templates', { p_tenant_id: tenantId });
                  loadData();
                }}
              >
                Maak Default Templates
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.template_type}</p>
                    </div>
                    <Badge variant={template.is_active ? 'default' : 'secondary'}>
                      {template.is_active ? 'Actief' : 'Inactief'}
                    </Badge>
                  </div>

                  <div className="text-sm mb-4">
                    <strong>Onderwerp:</strong> {template.subject}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Bewerken
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-6">
          {stats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.total_sent}</div>
                    <div className="text-sm text-muted-foreground">Verzonden</div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">{stats.total_delivered}</div>
                    <div className="text-sm text-muted-foreground">Afgeleverd</div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.total_opened}</div>
                    <div className="text-sm text-muted-foreground">Geopend</div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-destructive">{stats.total_failed}</div>
                    <div className="text-sm text-muted-foreground">Mislukt</div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning">{stats.open_rate}%</div>
                    <div className="text-sm text-muted-foreground">Open Rate</div>
                  </div>
                </Card>
              </div>

              {stats.by_template && (
                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Per Template Type</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.by_template).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm">{type}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nog geen statistieken beschikbaar</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Template Editor Modal */}
      {isEditingTemplate && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-xl">Template Bewerken: {selectedTemplate.name}</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsEditingTemplate(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="template_name">Template Naam</Label>
                <Input
                  id="template_name"
                  value={editedTemplate.name || ''}
                  onChange={(e) => setEditedTemplate({ ...editedTemplate, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="template_subject">Onderwerp</Label>
                <Input
                  id="template_subject"
                  value={editedTemplate.subject || ''}
                  onChange={(e) => setEditedTemplate({ ...editedTemplate, subject: e.target.value })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Beschikbare variabelen: {selectedTemplate.variables.map(v => `{${v}}`).join(', ')}
                </p>
              </div>

              <div>
                <Label htmlFor="template_html">HTML Inhoud</Label>
                <textarea
                  id="template_html"
                  value={editedTemplate.html_content || ''}
                  onChange={(e) => setEditedTemplate({ ...editedTemplate, html_content: e.target.value })}
                  className="w-full min-h-[300px] px-3 py-2 text-sm border rounded-md font-mono"
                />
              </div>

              <div>
                <Label htmlFor="template_text">Plain Text Inhoud (optioneel)</Label>
                <textarea
                  id="template_text"
                  value={editedTemplate.text_content || ''}
                  onChange={(e) => setEditedTemplate({ ...editedTemplate, text_content: e.target.value })}
                  className="w-full min-h-[150px] px-3 py-2 text-sm border rounded-md"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="template_active"
                  checked={editedTemplate.is_active !== false}
                  onCheckedChange={(checked) => setEditedTemplate({ ...editedTemplate, is_active: checked })}
                />
                <Label htmlFor="template_active">Template Actief</Label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSaveTemplate} disabled={isSaving} className="flex-1 gradient-bg">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Opslaan...' : 'Opslaan'}
              </Button>
              <Button variant="outline" onClick={() => setIsEditingTemplate(false)} className="flex-1">
                Annuleren
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

