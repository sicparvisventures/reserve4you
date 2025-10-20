'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  Star,
  Calendar,
  Clock,
  Percent,
  DollarSign,
  Tag,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Promotion {
  id: string;
  title: string;
  description: string;
  terms_conditions: string | null;
  discount_type: 'percentage' | 'fixed_amount' | 'special_offer' | 'buy_one_get_one' | 'happy_hour';
  discount_value: number | null;
  valid_from: string;
  valid_until: string | null;
  valid_days: string[];
  valid_hours: { start: string; end: string } | null;
  image_url: string | null;
  thumbnail_url: string | null;
  max_redemptions: number | null;
  current_redemptions: number;
  min_party_size: number | null;
  max_party_size: number | null;
  is_active: boolean;
  is_featured: boolean;
  priority: number;
  created_at: string;
}

interface PromotionsManagerProps {
  locationId: string;
  locationName: string;
}

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentage korting', icon: Percent },
  { value: 'fixed_amount', label: 'Vast bedrag korting', icon: DollarSign },
  { value: 'special_offer', label: 'Speciale aanbieding', icon: Sparkles },
  { value: 'buy_one_get_one', label: 'Koop 1 krijg 1 gratis', icon: Tag },
  { value: 'happy_hour', label: 'Happy Hour', icon: Clock },
];

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Ma' },
  { value: 'tuesday', label: 'Di' },
  { value: 'wednesday', label: 'Wo' },
  { value: 'thursday', label: 'Do' },
  { value: 'friday', label: 'Vr' },
  { value: 'saturday', label: 'Za' },
  { value: 'sunday', label: 'Zo' },
];

export function PromotionsManager({ locationId, locationName }: PromotionsManagerProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    terms_conditions: '',
    discount_type: 'percentage' as const,
    discount_value: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    valid_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    valid_hours_enabled: false,
    valid_hours_start: '17:00',
    valid_hours_end: '19:00',
    max_redemptions: '',
    min_party_size: '',
    max_party_size: '',
    is_active: true,
    is_featured: false,
    priority: '0',
    image_url: '',
  });

  useEffect(() => {
    fetchPromotions();
  }, [locationId]);

  const fetchPromotions = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('location_id', locationId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const supabase = createClient();
      
      const promotionData = {
        location_id: locationId,
        title: formData.title,
        description: formData.description,
        terms_conditions: formData.terms_conditions || null,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value ? parseFloat(formData.discount_value) : null,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        valid_days: formData.valid_days,
        valid_hours: formData.valid_hours_enabled 
          ? { start: formData.valid_hours_start, end: formData.valid_hours_end }
          : null,
        image_url: formData.image_url || null,
        max_redemptions: formData.max_redemptions ? parseInt(formData.max_redemptions) : null,
        min_party_size: formData.min_party_size ? parseInt(formData.min_party_size) : null,
        max_party_size: formData.max_party_size ? parseInt(formData.max_party_size) : null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        priority: parseInt(formData.priority) || 0,
      };

      if (editingPromotion) {
        const { error } = await supabase
          .from('promotions')
          .update(promotionData)
          .eq('id', editingPromotion.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('promotions')
          .insert([promotionData]);
        
        if (error) throw error;
      }

      await fetchPromotions();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving promotion:', error);
      alert('Er is een fout opgetreden bij het opslaan van de promotie');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze promotie wilt verwijderen?')) return;
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchPromotions();
    } catch (error) {
      console.error('Error deleting promotion:', error);
      alert('Er is een fout opgetreden bij het verwijderen van de promotie');
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      title: promotion.title,
      description: promotion.description,
      terms_conditions: promotion.terms_conditions || '',
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value?.toString() || '',
      valid_from: promotion.valid_from.split('T')[0],
      valid_until: promotion.valid_until ? promotion.valid_until.split('T')[0] : '',
      valid_days: promotion.valid_days,
      valid_hours_enabled: !!promotion.valid_hours,
      valid_hours_start: promotion.valid_hours?.start || '17:00',
      valid_hours_end: promotion.valid_hours?.end || '19:00',
      max_redemptions: promotion.max_redemptions?.toString() || '',
      min_party_size: promotion.min_party_size?.toString() || '',
      max_party_size: promotion.max_party_size?.toString() || '',
      is_active: promotion.is_active,
      is_featured: promotion.is_featured,
      priority: promotion.priority.toString(),
      image_url: promotion.image_url || '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPromotion(null);
    setFormData({
      title: '',
      description: '',
      terms_conditions: '',
      discount_type: 'percentage',
      discount_value: '',
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '',
      valid_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      valid_hours_enabled: false,
      valid_hours_start: '17:00',
      valid_hours_end: '19:00',
      max_redemptions: '',
      min_party_size: '',
      max_party_size: '',
      is_active: true,
      is_featured: false,
      priority: '0',
      image_url: '',
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const supabase = createClient();
      
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${locationId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('promotion-images')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('promotion-images')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Er is een fout opgetreden bij het uploaden van de afbeelding');
    } finally {
      setUploading(false);
    }
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      valid_days: prev.valid_days.includes(day)
        ? prev.valid_days.filter(d => d !== day)
        : [...prev.valid_days, day]
    }));
  };

  const getDiscountTypeIcon = (type: string) => {
    const discountType = DISCOUNT_TYPES.find(dt => dt.value === type);
    return discountType?.icon || Tag;
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Promoties & Deals</h2>
          <p className="text-muted-foreground mt-1">
            Beheer aanbiedingen voor {locationName}
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nieuwe Promotie
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPromotion ? 'Promotie Bewerken' : 'Nieuwe Promotie'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Titel *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Bijv. Happy Hour"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Beschrijving *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Beschrijf de promotie..."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="terms">Voorwaarden</Label>
                  <Textarea
                    id="terms"
                    value={formData.terms_conditions}
                    onChange={(e) => setFormData(prev => ({ ...prev, terms_conditions: e.target.value }))}
                    placeholder="Optionele voorwaarden..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Discount Type */}
              <div>
                <Label>Type Korting *</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {DISCOUNT_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, discount_type: type.value as any }))}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          formData.discount_type === type.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Icon className="h-5 w-5 mb-2" />
                        <p className="text-sm font-medium">{type.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Discount Value */}
              {(['percentage', 'fixed_amount'].includes(formData.discount_type)) && (
                <div>
                  <Label htmlFor="discount_value">
                    {formData.discount_type === 'percentage' ? 'Percentage (%)' : 'Bedrag (€)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_value: e.target.value }))}
                    placeholder={formData.discount_type === 'percentage' ? '50' : '10.00'}
                  />
                </div>
              )}

              {/* Validity Period */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valid_from">Geldig vanaf *</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData(prev => ({ ...prev, valid_from: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="valid_until">Geldig tot</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                  />
                </div>
              </div>

              {/* Valid Days */}
              <div>
                <Label>Geldige Dagen</Label>
                <div className="flex gap-2 mt-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all font-medium ${
                        formData.valid_days.includes(day.value)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Valid Hours */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.valid_hours_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, valid_hours_enabled: checked }))}
                  />
                  <Label>Geldig alleen tussen bepaalde uren</Label>
                </div>
                
                {formData.valid_hours_enabled && (
                  <div className="grid grid-cols-2 gap-4 ml-10">
                    <div>
                      <Label htmlFor="start_time">Van</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.valid_hours_start}
                        onChange={(e) => setFormData(prev => ({ ...prev, valid_hours_start: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">Tot</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.valid_hours_end}
                        onChange={(e) => setFormData(prev => ({ ...prev, valid_hours_end: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <Label htmlFor="image">Afbeelding</Label>
                {formData.image_url ? (
                  <div className="mt-2 relative">
                    <img
                      src={formData.image_url}
                      alt="Promotion"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                    >
                      Verwijderen
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    {uploading && <p className="text-sm text-muted-foreground mt-2">Uploaden...</p>}
                  </div>
                )}
              </div>

              {/* Advanced Options */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="max_redemptions">Max. gebruik</Label>
                  <Input
                    id="max_redemptions"
                    type="number"
                    value={formData.max_redemptions}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_redemptions: e.target.value }))}
                    placeholder="Onbeperkt"
                  />
                </div>
                <div>
                  <Label htmlFor="min_party">Min. personen</Label>
                  <Input
                    id="min_party"
                    type="number"
                    value={formData.min_party_size}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_party_size: e.target.value }))}
                    placeholder="Geen"
                  />
                </div>
                <div>
                  <Label htmlFor="max_party">Max. personen</Label>
                  <Input
                    id="max_party"
                    type="number"
                    value={formData.max_party_size}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_party_size: e.target.value }))}
                    placeholder="Geen"
                  />
                </div>
              </div>

              {/* Status & Priority */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label>Actief</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                  />
                  <Label>Uitgelicht (toon op homepage)</Label>
                </div>

                <div>
                  <Label htmlFor="priority">Prioriteit (hoger = eerst getoond)</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  Annuleren
                </Button>
                <Button type="submit" className="flex-1">
                  {editingPromotion ? 'Opslaan' : 'Aanmaken'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Promotions List */}
      {promotions.length === 0 ? (
        <Card className="p-12 text-center">
          <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nog geen promoties
          </h3>
          <p className="text-muted-foreground mb-6">
            Maak je eerste promotie aan om klanten te trekken
          </p>
          <Button onClick={() => {resetForm(); setDialogOpen(true);}} className="gap-2">
            <Plus className="h-4 w-4" />
            Eerste Promotie Aanmaken
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {promotions.map((promotion) => {
            const Icon = getDiscountTypeIcon(promotion.discount_type);
            const isExpired = promotion.valid_until && new Date(promotion.valid_until) < new Date();
            
            return (
              <Card key={promotion.id} className="p-6">
                <div className="flex gap-6">
                  {/* Image */}
                  {promotion.image_url ? (
                    <img
                      src={promotion.image_url}
                      alt={promotion.title}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-foreground">
                            {promotion.title}
                          </h3>
                          {promotion.is_featured && (
                            <Badge variant="default" className="gap-1">
                              <Star className="h-3 w-3" />
                              Uitgelicht
                            </Badge>
                          )}
                          {!promotion.is_active && (
                            <Badge variant="secondary">Inactief</Badge>
                          )}
                          {isExpired && (
                            <Badge variant="destructive">Verlopen</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Icon className="h-4 w-4" />
                            {DISCOUNT_TYPES.find(dt => dt.value === promotion.discount_type)?.label}
                          </div>
                          {promotion.discount_value && (
                            <span className="font-semibold text-primary">
                              {promotion.discount_type === 'percentage' 
                                ? `${promotion.discount_value}% korting`
                                : `€${promotion.discount_value} korting`
                              }
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(promotion)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(promotion.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-foreground mb-3">
                      {promotion.description}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(promotion.valid_from), 'dd MMM yyyy', { locale: nl })}
                        {promotion.valid_until && (
                          <> - {format(new Date(promotion.valid_until), 'dd MMM yyyy', { locale: nl })}</>
                        )}
                      </div>
                      
                      {promotion.valid_hours && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {promotion.valid_hours.start} - {promotion.valid_hours.end}
                        </div>
                      )}

                      {promotion.max_redemptions && (
                        <div>
                          {promotion.current_redemptions} / {promotion.max_redemptions} gebruikt
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

