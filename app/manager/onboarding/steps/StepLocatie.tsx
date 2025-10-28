'use client';

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { locationCreateSchema } from '@/lib/validation/manager';
import { MapPin, Clock, Upload, X, Image as ImageIcon, Building2, Sparkles, Loader2 as LoaderIcon } from 'lucide-react';
import { uploadLocationImage, compressImage, validateImageDimensions } from '@/lib/utils/image-upload';
import { getSectorsByCategory } from '@/lib/terminology';
import type { BusinessSector } from '@/lib/types/terminology';
import { GooglePlacesAutocomplete } from '@/components/google/GooglePlacesAutocomplete';
import type { LocationFromGoogle } from '@/lib/google-places';

interface StepLocatieProps {
  data: any;
  updateData: (key: string, value: any) => void;
  onNext: () => void;
}

const DAYS_OF_WEEK = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

export function StepLocatie({ data, updateData, onNext }: StepLocatieProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sectorCategories = getSectorsByCategory();
  
  const [formData, setFormData] = useState({
    businessSector: data.location?.businessSector || 'RESTAURANT' as BusinessSector,
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(data.location?.imageUrl || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [importingFromGoogle, setImportingFromGoogle] = useState(false);
  const [googleImportSuccess, setGoogleImportSuccess] = useState(false);

  const addDebug = (message: string) => {
    console.log('🔍 DEBUG:', message);
    setDebugInfo(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  // Handle Google Place selection and import
  const handleGooglePlaceSelected = async (placeId: string) => {
    setImportingFromGoogle(true);
    setGoogleImportSuccess(false);
    setErrors({});
    addDebug(`🌍 Importing from Google Place ID: ${placeId}`);

    try {
      // Fetch place details from our API
      const response = await fetch(`/api/google-places/details?place_id=${encodeURIComponent(placeId)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch place details');
      }

      const data = await response.json();
      const locationData: LocationFromGoogle = data.locationData;

      addDebug(`✅ Google data fetched: ${locationData.name}`);
      addDebug(`   Address: ${locationData.address_line1}, ${locationData.city}`);
      addDebug(`   Business Sector: ${locationData.business_sector}`);

      // Auto-fill form data
      setFormData({
        ...formData,
        businessSector: (locationData.business_sector || 'OTHER') as BusinessSector,
        name: locationData.name,
        slug: locationData.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50),
        address: {
          street: locationData.address_line1.split(' ').slice(1).join(' ') || locationData.address_line1,
          number: locationData.address_line1.split(' ')[0] || '',
          city: locationData.city,
          postalCode: locationData.postal_code,
          country: locationData.country || 'BE',
        },
        phone: locationData.phone || '',
        email: formData.email, // Keep existing email
        cuisine: locationData.cuisine_type || formData.cuisine,
        priceRange: locationData.price_range === 1 ? '€' : locationData.price_range === 3 ? '€€€' : '€€',
        description: locationData.description || formData.description,
        // Keep existing timing settings
        slotMinutes: formData.slotMinutes,
        bufferMinutes: formData.bufferMinutes,
        openingHours: formData.openingHours,
      });

      setGoogleImportSuccess(true);
      addDebug('✅ Form data updated from Google');

      // Auto-scroll to form
      setTimeout(() => {
        document.getElementById('locationName')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);

    } catch (error: any) {
      console.error('Error importing from Google:', error);
      addDebug(`❌ Google import failed: ${error.message}`);
      setErrors({ google: error.message || 'Fout bij importeren van Google' });
    } finally {
      setImportingFromGoogle(false);
    }
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrors({ ...errors, image: '' });

    try {
      // Validate image dimensions
      const validation = await validateImageDimensions(file, 400, 300);
      if (!validation.valid) {
        setErrors({ ...errors, image: validation.error || 'Invalid image dimensions' });
        return;
      }

      // Compress image
      addDebug('📸 Compressing image...');
      const compressed = await compressImage(file);
      addDebug(`✅ Image compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB`);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(compressed);

      setImageFile(compressed);
    } catch (error: any) {
      setErrors({ ...errors, image: error.message || 'Failed to process image' });
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        business_sector: formData.businessSector, // Map to snake_case for API
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
      
      // Upload image if provided
      if (imageFile && location.id) {
        addDebug('📸 Uploading location image...');
        setUploadingImage(true);
        
        const uploadResult = await uploadLocationImage(imageFile, location.id);
        
        if ('error' in uploadResult) {
          addDebug(`⚠️ Image upload failed: ${uploadResult.error}`);
          // Continue anyway, image is optional
        } else {
          addDebug(`✅ Image uploaded: ${uploadResult.url}`);
          
          // Update location with image URL
          const updateResponse = await fetch('/api/manager/locations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: location.id,
              image_url: uploadResult.url,
              image_public_id: uploadResult.publicId,
            }),
          });

          if (updateResponse.ok) {
            const updatedLocation = await updateResponse.json();
            location.image_url = updatedLocation.image_url;
            addDebug('✅ Location updated with image');
          }
        }
        
        setUploadingImage(false);
      }
      
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
            <p className="text-muted-foreground">Configureer je eerste locatie</p>
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
        {/* Google Places Import - NEW! */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mr-3">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Importeer van Google</h3>
              <p className="text-sm text-muted-foreground">
                Staat je bedrijf al op Google? We vullen automatisch alle velden in
              </p>
            </div>
          </div>

          <GooglePlacesAutocomplete
            onPlaceSelected={handleGooglePlaceSelected}
            disabled={importingFromGoogle}
            placeholder="Zoek je bedrijf op Google Maps..."
          />

          {importingFromGoogle && (
            <div className="flex items-center gap-2 mt-3 text-primary">
              <LoaderIcon className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Gegevens importeren van Google...</span>
            </div>
          )}

          {googleImportSuccess && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                ✅ Succesvol geïmporteerd van Google! Controleer en pas de gegevens aan indien nodig.
              </p>
            </div>
          )}

          {errors.google && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                ❌ {errors.google}
              </p>
            </div>
          )}
        </Card>

        {/* Divider */}
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-background text-muted-foreground font-medium">
              Of vul handmatig in
            </span>
          </div>
        </div>

        {/* Business Sector Selection */}
        <div>
          <div className="flex items-center mb-3">
            <Building2 className="h-5 w-5 text-primary mr-2" />
            <Label className="text-base font-medium">Type Bedrijf *</Label>
          </div>
          <select
            value={formData.businessSector}
            onChange={(e) => setFormData({ ...formData, businessSector: e.target.value as BusinessSector })}
            className="w-full h-12 px-4 rounded-xl border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            required
          >
            {Object.entries(sectorCategories).map(([category, sectors]) => (
              <optgroup key={category} label={category}>
                {sectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector.replace(/_/g, ' ')}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="text-sm text-muted-foreground mt-2">
            Selecteer je bedrijfstype - dit bepaalt de terminologie in je dashboard
          </p>
        </div>

        {/* Location Name */}
        <div>
          <Label htmlFor="locationName" className="text-base font-medium">
            Locatie naam *
          </Label>
          <Input
            id="locationName"
            type="text"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Bijv. Studio Amsterdam Centrum, Salon de Luxe, Praktijk West"
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
              placeholder="mijn-locatie-centrum"
              className="h-12 rounded-xl flex-1"
              required
            />
          </div>
          {errors.slug && (
            <p className="text-sm text-destructive mt-1">{errors.slug}</p>
          )}
        </div>

        {/* Location Image */}
        <div>
          <Label className="text-base font-medium">
            Locatie foto
            <span className="text-muted-foreground font-normal ml-2">(optioneel)</span>
          </Label>
          <p className="text-sm text-muted-foreground mt-1 mb-3">
            Upload een foto van je locatie. Deze wordt getoond op de homepage en discover pagina.
          </p>
          
          {imagePreview ? (
            <Card className="p-4">
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Locatie preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 rounded-full"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {imageFile && `${(imageFile.size / 1024).toFixed(0)}KB`}
              </p>
            </Card>
          ) : (
            <Card className="p-8 border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">
                  Klik om een foto te uploaden
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  of sleep een bestand hierheen
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG of WebP • Max 5MB • Min 400x300px
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleImageSelect}
              />
            </Card>
          )}
          
          {errors.image && (
            <p className="text-sm text-destructive mt-2">{errors.image}</p>
          )}
          
          {uploadingImage && (
            <p className="text-sm text-primary mt-2 flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              Foto uploaden...
            </p>
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
              placeholder="info@mijnbedrijf.nl"
              className="mt-2 h-12 rounded-xl"
              required
            />
          </div>
        </div>

        {/* Cuisine & Price Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cuisine" className="text-base font-medium">
              Specialisatie / Categorie
            </Label>
            <Input
              id="cuisine"
              type="text"
              value={formData.cuisine}
              onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
              placeholder="Bijv. Italiaans, Kapsel & Kleur, Huisartsgeneeskunde"
              className="mt-2 h-12 rounded-xl"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Optioneel: Jouw specialisatie of categorie
            </p>
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
            {formData.openingHours.map((hours: any, index: number) => (
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

        {/* Booking Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="slotMinutes" className="text-base font-medium">
              Standaard duur (minuten)
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
              Standaard tijd per boeking
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
              Tijd tussen boekingen
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
            placeholder="Vertel iets over je bedrijf..."
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

