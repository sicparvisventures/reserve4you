'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  MapPin, 
  Users, 
  CreditCard, 
  Settings as SettingsIcon,
  Save,
  Upload,
  X,
  Image as ImageIcon,
  Globe,
  Mail,
  Phone,
  Clock,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  Camera,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { uploadLocationImage, compressImage, validateImageDimensions } from '@/lib/utils/image-upload';

const DAYS_OF_WEEK = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

interface SettingsClientProps {
  tenantId: string;
  tenant: any;
  locations: any[];
  billing: any;
  memberships: any[];
}

const NAVIGATION = [
  { id: 'general', label: 'Bedrijfsinformatie', icon: Building2, description: 'Naam en branding' },
  { id: 'locations', label: 'Locaties', icon: MapPin, description: 'Restaurant instellingen' },
  { id: 'team', label: 'Team', icon: Users, description: 'Teamleden beheren' },
  { id: 'billing', label: 'Abonnement', icon: CreditCard, description: 'Plan en facturatie' },
  { id: 'advanced', label: 'Geavanceerd', icon: SettingsIcon, description: 'Systeem instellingen' },
];

export function SettingsClient({ tenantId, tenant, locations, billing, memberships }: SettingsClientProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('general');
  const [selectedLocationId, setSelectedLocationId] = useState<string>(locations[0]?.id || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedLocation = locations.find(l => l.id === selectedLocationId);

  // Tenant state
  const [tenantData, setTenantData] = useState({
    name: tenant.name || '',
    brand_color: tenant.brand_color || '#FF5A5F',
    logo_url: tenant.logo_url || '',
  });

  // Location state
  const getInitialLocationData = () => {
    if (!selectedLocation) return null;
    return {
      name: selectedLocation.name || '',
      slug: selectedLocation.slug || '',
      description: selectedLocation.description || '',
      cuisine: selectedLocation.cuisine || '',
      price_range: selectedLocation.price_range || 2,
      address_json: selectedLocation.address_json || {
        street: '',
        number: '',
        city: '',
        postalCode: '',
        country: 'NL',
      },
      phone: selectedLocation.phone || '',
      email: selectedLocation.email || '',
      website: selectedLocation.website || '',
      opening_hours_json: selectedLocation.opening_hours_json || DAYS_OF_WEEK.map((_, index) => ({
        dayOfWeek: index,
        openTime: index === 0 ? '00:00' : '11:00',
        closeTime: index === 0 ? '00:00' : '22:00',
        isClosed: index === 0,
      })),
      slot_minutes: selectedLocation.slot_minutes || 90,
      buffer_minutes: selectedLocation.buffer_minutes || 15,
      is_public: selectedLocation.is_public || false,
      is_active: selectedLocation.is_active || true,
      image_url: selectedLocation.image_url || null,
      image_public_id: selectedLocation.image_public_id || null,
    };
  };

  const [locationData, setLocationData] = useState<any>(getInitialLocationData());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(selectedLocation?.image_url || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update location data when selected location changes
  useEffect(() => {
    const newData = getInitialLocationData();
    setLocationData(newData);
    setImagePreview(selectedLocation?.image_url || null);
    setImageFile(null);
  }, [selectedLocationId]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const validation = await validateImageDimensions(file, 400, 300);
      if (!validation.valid) {
        showMessage('error', validation.error || 'Ongeldige afbeelding afmetingen');
        return;
      }

      const compressed = await compressImage(file);
      setImageFile(compressed);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(compressed);
    } catch (error) {
      console.error('Error processing image:', error);
      showMessage('error', 'Fout bij verwerken afbeelding');
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const saveTenant = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/manager/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenantData),
      });

      if (!response.ok) throw new Error('Failed to save tenant');

      showMessage('success', 'Bedrijfsinformatie opgeslagen!');
      router.refresh();
    } catch (error) {
      console.error('Error saving tenant:', error);
      showMessage('error', 'Fout bij opslaan bedrijfsinformatie');
    } finally {
      setSaving(false);
    }
  };

  const saveLocation = async () => {
    if (!selectedLocation || !locationData) return;

    setSaving(true);
    try {
      let imageUrl = locationData.image_url;
      let imagePublicId = locationData.image_public_id;

      if (imageFile) {
        setUploadingImage(true);
        const uploadResult = await uploadLocationImage(imageFile, selectedLocation.id);
        
        if ('error' in uploadResult) {
          showMessage('error', uploadResult.error);
          setUploadingImage(false);
          setSaving(false);
          return;
        }

        imageUrl = uploadResult.url;
        imagePublicId = uploadResult.publicId;
        setUploadingImage(false);
      }

      const response = await fetch(`/api/manager/locations/${selectedLocation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...locationData,
          image_url: imageUrl,
          image_public_id: imagePublicId,
        }),
      });

      if (!response.ok) throw new Error('Failed to save location');

      showMessage('success', 'Locatie instellingen opgeslagen!');
      setImageFile(null);
      router.refresh();
    } catch (error) {
      console.error('Error saving location:', error);
      showMessage('error', 'Fout bij opslaan locatie');
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const priceRangeOptions = [
    { value: 1, label: '€', description: 'Budget vriendelijk' },
    { value: 2, label: '€€', description: 'Middel segment' },
    { value: 3, label: '€€€', description: 'Hogere prijsklasse' },
    { value: 4, label: '€€€€', description: 'Premium fine dining' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/manager/${tenantId}/dashboard`)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <div className="h-8 w-px bg-border" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Instellingen</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">Beheer je bedrijf en locaties</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className="sticky top-[73px] z-10">
          <div className={`px-4 sm:px-6 lg:px-8 py-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border-b border-green-200' 
              : 'bg-red-50 border-b border-red-200'
          }`}>
            <div className="max-w-[1800px] mx-auto flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-32 space-y-1">
              {NAVIGATION.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isActive ? 'text-primary-foreground' : ''}`} />
                    <div className="text-left flex-1">
                      <div className={`font-medium text-sm ${isActive ? 'text-primary-foreground' : ''}`}>
                        {item.label}
                      </div>
                      <div className={`text-xs mt-0.5 ${
                        isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Mobile Navigation */}
          <div className="lg:hidden w-full mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {NAVIGATION.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <main className="flex-1 min-w-0">
            {/* General Section */}
            {activeSection === 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Bedrijfsinformatie</h2>
                  <p className="text-sm text-muted-foreground">Algemene instellingen voor je organisatie</p>
                </div>

                <Card className="p-6">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="tenant-name">Bedrijfsnaam</Label>
                      <Input
                        id="tenant-name"
                        value={tenantData.name}
                        onChange={(e) => setTenantData({ ...tenantData, name: e.target.value })}
                        placeholder="Mijn Restaurant Groep"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="brand-color">Merkkleur</Label>
                      <div className="flex gap-3 mt-1.5">
                        <div className="relative">
                          <Input
                            id="brand-color"
                            type="color"
                            value={tenantData.brand_color}
                            onChange={(e) => setTenantData({ ...tenantData, brand_color: e.target.value })}
                            className="w-16 h-11 cursor-pointer"
                          />
                        </div>
                        <Input
                          value={tenantData.brand_color}
                          onChange={(e) => setTenantData({ ...tenantData, brand_color: e.target.value })}
                          placeholder="#FF5A5F"
                          className="flex-1"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Deze kleur wordt gebruikt in je reserveringspagina's en branding
                      </p>
                    </div>

                    <div className="pt-4 border-t flex justify-end">
                      <Button onClick={saveTenant} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Opslaan...' : 'Wijzigingen Opslaan'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Locations Section */}
            {activeSection === 'locations' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Locatie Instellingen</h2>
                  <p className="text-sm text-muted-foreground">Beheer je restaurant locaties en hun instellingen</p>
                </div>

                {/* Location Selector */}
                {locations.length > 1 && (
                  <Card className="p-4">
                    <Label className="mb-3 block">Selecteer Locatie</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {locations.map((loc) => (
                        <Button
                          key={loc.id}
                          variant={selectedLocationId === loc.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedLocationId(loc.id)}
                          className="justify-start"
                        >
                          <MapPin className="h-3 w-3 mr-2" />
                          {loc.name}
                        </Button>
                      ))}
                    </div>
                  </Card>
                )}

                {locationData && (
                  <>
                    {/* Image Upload */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Restaurant Foto
                      </h3>
                      
                      <div className="space-y-4">
                        {imagePreview ? (
                          <div className="relative inline-block">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full max-w-2xl h-80 object-cover rounded-lg border-2 border-border"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="absolute top-3 right-3 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors shadow-lg"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-border rounded-lg p-16 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                          >
                            <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                            <p className="text-base font-medium mb-2">Klik om foto te uploaden</p>
                            <p className="text-sm text-muted-foreground">
                              JPG, PNG of WebP • Min 400x300px • Max 5MB
                            </p>
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </div>
                    </Card>

                    {/* Basic Info */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Basis Informatie</h3>
                      <div className="grid gap-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="loc-name">Restaurant Naam</Label>
                            <Input
                              id="loc-name"
                              value={locationData.name}
                              onChange={(e) => setLocationData({ ...locationData, name: e.target.value })}
                              placeholder="De Goudeneeuw"
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label htmlFor="loc-slug">URL Slug</Label>
                            <Input
                              id="loc-slug"
                              value={locationData.slug}
                              onChange={(e) => setLocationData({ ...locationData, slug: e.target.value })}
                              placeholder="de-goudeneeuw"
                              className="mt-1.5"
                            />
                            <p className="text-xs text-muted-foreground mt-1.5">
                              r4y.be/p/{locationData.slug || 'slug'}
                            </p>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="loc-description">Beschrijving</Label>
                          <Textarea
                            id="loc-description"
                            value={locationData.description}
                            onChange={(e) => setLocationData({ ...locationData, description: e.target.value })}
                            placeholder="Vertel over je restaurant..."
                            rows={3}
                            className="mt-1.5"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="loc-cuisine">Keuken Type</Label>
                            <Input
                              id="loc-cuisine"
                              value={locationData.cuisine}
                              onChange={(e) => setLocationData({ ...locationData, cuisine: e.target.value })}
                              placeholder="Belgisch, Modern"
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label>Prijsklasse</Label>
                            <div className="grid grid-cols-4 gap-2 mt-1.5">
                              {priceRangeOptions.map((option) => (
                                <Button
                                  key={option.value}
                                  type="button"
                                  variant={locationData.price_range === option.value ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setLocationData({ ...locationData, price_range: option.value })}
                                  title={option.description}
                                  className="font-semibold"
                                >
                                  {option.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Contact & Address */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Contact & Adres</h3>
                      <div className="grid gap-5">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="loc-phone">Telefoon</Label>
                            <Input
                              id="loc-phone"
                              value={locationData.phone}
                              onChange={(e) => setLocationData({ ...locationData, phone: e.target.value })}
                              placeholder="+32 9 123 45 67"
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label htmlFor="loc-email">Email</Label>
                            <Input
                              id="loc-email"
                              type="email"
                              value={locationData.email}
                              onChange={(e) => setLocationData({ ...locationData, email: e.target.value })}
                              placeholder="info@restaurant.be"
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label htmlFor="loc-website">Website</Label>
                            <Input
                              id="loc-website"
                              value={locationData.website}
                              onChange={(e) => setLocationData({ ...locationData, website: e.target.value })}
                              placeholder="https://restaurant.be"
                              className="mt-1.5"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                          <div className="col-span-2">
                            <Label htmlFor="loc-street">Straat</Label>
                            <Input
                              id="loc-street"
                              value={locationData.address_json.street}
                              onChange={(e) => setLocationData({
                                ...locationData,
                                address_json: { ...locationData.address_json, street: e.target.value }
                              })}
                              placeholder="Korenmarkt"
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label htmlFor="loc-number">Nummer</Label>
                            <Input
                              id="loc-number"
                              value={locationData.address_json.number}
                              onChange={(e) => setLocationData({
                                ...locationData,
                                address_json: { ...locationData.address_json, number: e.target.value }
                              })}
                              placeholder="11"
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label htmlFor="loc-postal">Postcode</Label>
                            <Input
                              id="loc-postal"
                              value={locationData.address_json.postalCode}
                              onChange={(e) => setLocationData({
                                ...locationData,
                                address_json: { ...locationData.address_json, postalCode: e.target.value }
                              })}
                              placeholder="9000"
                              className="mt-1.5"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="loc-city">Stad</Label>
                          <Input
                            id="loc-city"
                            value={locationData.address_json.city}
                            onChange={(e) => setLocationData({
                              ...locationData,
                              address_json: { ...locationData.address_json, city: e.target.value }
                            })}
                            placeholder="Gent"
                            className="mt-1.5"
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Reservation Settings */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Reservering Instellingen</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="slot-minutes">Reservering Duur (minuten)</Label>
                          <Input
                            id="slot-minutes"
                            type="number"
                            value={locationData.slot_minutes}
                            onChange={(e) => setLocationData({ ...locationData, slot_minutes: parseInt(e.target.value) })}
                            min="30"
                            max="240"
                            step="15"
                            className="mt-1.5"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Standaard duur per reservering
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="buffer-minutes">Buffer Tijd (minuten)</Label>
                          <Input
                            id="buffer-minutes"
                            type="number"
                            value={locationData.buffer_minutes}
                            onChange={(e) => setLocationData({ ...locationData, buffer_minutes: parseInt(e.target.value) })}
                            min="0"
                            max="60"
                            step="5"
                            className="mt-1.5"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Tijd tussen reserveringen
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Status */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Status</h3>
                      <div className="space-y-4">
                        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <input
                            type="checkbox"
                            checked={locationData.is_public}
                            onChange={(e) => setLocationData({ ...locationData, is_public: e.target.checked })}
                            className="w-5 h-5 mt-0.5"
                          />
                          <div className="flex-1">
                            <p className="font-medium">Publiek Zichtbaar</p>
                            <p className="text-sm text-muted-foreground">
                              Locatie is zichtbaar op r4y.be en accepteert reserveringen
                            </p>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <input
                            type="checkbox"
                            checked={locationData.is_active}
                            onChange={(e) => setLocationData({ ...locationData, is_active: e.target.checked })}
                            className="w-5 h-5 mt-0.5"
                          />
                          <div className="flex-1">
                            <p className="font-medium">Actief</p>
                            <p className="text-sm text-muted-foreground">
                              Locatie is operationeel en neemt reserveringen aan
                            </p>
                          </div>
                        </label>
                      </div>
                    </Card>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/manager/${tenantId}/location/${selectedLocationId}`)}
                      >
                        Ga naar Dashboard
                      </Button>
                      <Button onClick={saveLocation} disabled={saving || uploadingImage} size="lg">
                        <Save className="h-4 w-4 mr-2" />
                        {uploadingImage ? 'Uploaden...' : saving ? 'Opslaan...' : 'Wijzigingen Opslaan'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Team Section */}
            {activeSection === 'team' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Team Beheer</h2>
                  <p className="text-sm text-muted-foreground">Beheer teamleden en hun toegangsrechten</p>
                </div>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Team Leden ({memberships.length})</h3>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Uitnodigen
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {memberships.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{member.user_id}</p>
                            <Badge variant="outline" className="mt-1">
                              {member.role}
                            </Badge>
                          </div>
                        </div>
                        {member.role !== 'OWNER' && (
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Billing Section */}
            {activeSection === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Abonnement</h2>
                  <p className="text-sm text-muted-foreground">Beheer je abonnement en facturatie</p>
                </div>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Huidig Abonnement</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                      <div>
                        <p className="text-2xl font-bold">{billing.plan}</p>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">{billing.status}</p>
                      </div>
                      <Badge 
                        variant={billing.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className="text-sm px-3 py-1"
                      >
                        {billing.status}
                      </Badge>
                    </div>

                    <Button
                      variant="default"
                      onClick={() => router.push('/profile')}
                      className="w-full"
                      size="lg"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Upgrade Abonnement
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Advanced Section */}
            {activeSection === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Geavanceerde Instellingen</h2>
                  <p className="text-sm text-muted-foreground">Systeem instellingen en gevaarlijke acties</p>
                </div>

                <Card className="p-6 border-destructive/50">
                  <h3 className="text-lg font-semibold mb-2 text-destructive flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Gevaarlijke Zone
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Deze acties zijn onomkeerbaar. Wees voorzichtig!
                  </p>
                  <Button variant="destructive" disabled>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Verwijder Bedrijf
                  </Button>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
