'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationImageUploadProps {
  locationId: string;
  locationName: string;
  currentImageUrl?: string | null;
  currentBannerUrl?: string | null;
  onImageUpdate?: () => void;
}

export function LocationImageUpload({
  locationId,
  locationName,
  currentImageUrl,
  currentBannerUrl,
  onImageUpdate
}: LocationImageUploadProps) {
  const [uploadingCard, setUploadingCard] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [cardPreview, setCardPreview] = useState(currentImageUrl);
  const [bannerPreview, setBannerPreview] = useState(currentBannerUrl);

  const uploadImage = async (file: File, type: 'card' | 'banner') => {
    const setUploading = type === 'card' ? setUploadingCard : setUploadingBanner;
    const setPreview = type === 'card' ? setCardPreview : setBannerPreview;
    
    try {
      setUploading(true);

      // Validate file
      if (file.size > 10 * 1024 * 1024) {
        alert('Bestand is te groot. Maximaal 10MB toegestaan.');
        return;
      }

      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        alert('Ongeldig bestandstype. Gebruik JPG, PNG of WebP.');
        return;
      }

      const supabase = createClient();

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${locationId}/${type}_${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('location-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('location-images')
        .getPublicUrl(fileName);

      // Update database
      const columnName = type === 'card' ? 'image_url' : 'banner_image_url';
      const { error: updateError } = await supabase
        .from('locations')
        .update({ [columnName]: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', locationId);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      // Update preview
      setPreview(publicUrl);
      
      // Trigger callback
      if (onImageUpdate) {
        onImageUpdate();
      }

      alert(`${type === 'card' ? 'Kaart' : 'Hero'} afbeelding succesvol geüpload!`);

    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Er is een fout opgetreden bij het uploaden van de afbeelding');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'card' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file, type);
    }
    // Reset input
    e.target.value = '';
  };

  const removeImage = async (type: 'card' | 'banner') => {
    if (!confirm(`Weet je zeker dat je de ${type === 'card' ? 'kaart' : 'hero'} afbeelding wilt verwijderen?`)) {
      return;
    }

    try {
      const supabase = createClient();
      const columnName = type === 'card' ? 'image_url' : 'banner_image_url';
      
      const { error } = await supabase
        .from('locations')
        .update({ [columnName]: null, updated_at: new Date().toISOString() })
        .eq('id', locationId);

      if (error) throw error;

      if (type === 'card') {
        setCardPreview(null);
      } else {
        setBannerPreview(null);
      }

      if (onImageUpdate) {
        onImageUpdate();
      }

      alert('Afbeelding verwijderd');
    } catch (error) {
      console.error('Error removing image:', error);
      alert('Fout bij verwijderen van afbeelding');
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner Image */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Hero Banner Afbeelding</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Grote banner afbeelding bovenaan de locatie pagina (aanbevolen: 1920x600px)
            </p>
          </div>

          {bannerPreview ? (
            <div className="relative rounded-lg overflow-hidden border border-border group">
              <img
                src={bannerPreview}
                alt="Hero banner"
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => removeImage('banner')}
                >
                  <X className="h-4 w-4 mr-2" />
                  Verwijderen
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  asChild
                >
                  <label className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Vervangen
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => handleFileSelect(e, 'banner')}
                      disabled={uploadingBanner}
                    />
                  </label>
                </Button>
              </div>
            </div>
          ) : (
            <label className={cn(
              "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer",
              "hover:bg-muted/50 transition-colors",
              uploadingBanner && "opacity-50 cursor-not-allowed"
            )}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {uploadingBanner ? (
                  <>
                    <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-3" />
                    <p className="text-sm text-muted-foreground">Uploaden...</p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Klik om te uploaden</span> of sleep hier
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, WebP (max. 10MB)
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => handleFileSelect(e, 'banner')}
                disabled={uploadingBanner}
              />
            </label>
          )}
        </div>
      </Card>

      {/* Card Image */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Kaart Afbeelding</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Afbeelding voor locatiekaarten op de homepage en ontdek pagina (aanbevolen: 800x600px)
            </p>
          </div>

          {cardPreview ? (
            <div className="relative rounded-lg overflow-hidden border border-border group aspect-[4/3] max-w-sm">
              <img
                src={cardPreview}
                alt="Kaart afbeelding"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => removeImage('card')}
                >
                  <X className="h-4 w-4 mr-2" />
                  Verwijderen
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  asChild
                >
                  <label className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Vervangen
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => handleFileSelect(e, 'card')}
                      disabled={uploadingCard}
                    />
                  </label>
                </Button>
              </div>
            </div>
          ) : (
            <label className={cn(
              "flex flex-col items-center justify-center w-full max-w-sm aspect-[4/3] border-2 border-dashed rounded-lg cursor-pointer",
              "hover:bg-muted/50 transition-colors",
              uploadingCard && "opacity-50 cursor-not-allowed"
            )}>
              <div className="flex flex-col items-center justify-center p-6">
                {uploadingCard ? (
                  <>
                    <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-3" />
                    <p className="text-sm text-muted-foreground">Uploaden...</p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="mb-2 text-sm text-muted-foreground text-center">
                      <span className="font-semibold">Klik om te uploaden</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, WebP (max. 10MB)
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => handleFileSelect(e, 'card')}
                disabled={uploadingCard}
              />
            </label>
          )}
        </div>
      </Card>
    </div>
  );
}

