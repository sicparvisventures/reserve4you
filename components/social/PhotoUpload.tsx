'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Camera, X, Loader2, Check } from 'lucide-react';
import Image from 'next/image';
import { compressImage } from '@/lib/utils/image-upload';
import { cn } from '@/lib/utils';

interface PhotoUploadProps {
  locationId: string;
  bookingId?: string | null;
  onUploadSuccess?: (photo: { id: string; photo_url: string; caption?: string }) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  compact?: boolean;
}

export function PhotoUpload({
  locationId,
  bookingId,
  onUploadSuccess,
  onUploadError,
  className,
  compact = false,
}: PhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      onUploadError?.('Ongeldig bestandstype. Gebruik JPG, PNG, WebP of GIF.');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      onUploadError?.('Bestand te groot. Maximum grootte is 10MB.');
      return;
    }

    try {
      // Compress image if needed
      const compressedFile = await compressImage(file, 1920, 1440, 0.85);
      setSelectedFile(compressedFile);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error: any) {
      onUploadError?.(error.message || 'Fout bij het verwerken van de foto');
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    setCaption('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploaded(false);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('location_id', locationId);
      if (bookingId) {
        formData.append('booking_id', bookingId);
      }
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }
      formData.append('is_public', 'true');

      const response = await fetch('/api/social/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload mislukt');
      }

      const data = await response.json();
      setUploaded(true);
      onUploadSuccess?.(data.photo);

      // Reset after success
      setTimeout(() => {
        handleRemove();
        setUploaded(false);
      }, 2000);
    } catch (error: any) {
      console.error('Upload error:', error);
      onUploadError?.(error.message || 'Upload mislukt. Probeer het opnieuw.');
    } finally {
      setUploading(false);
    }
  };

  if (compact) {
    return (
      <div className={cn("space-y-3", className)}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!preview ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-24 border-2 border-dashed hover:border-primary/50 transition-colors"
          >
            <div className="flex flex-col items-center gap-2">
              <Camera className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Foto toevoegen</span>
            </div>
          </Button>
        ) : (
          <Card className="p-3 space-y-3">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted/30">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Textarea
              placeholder="Voeg een bijschrift toe (optioneel)..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="min-h-[80px] text-sm"
              maxLength={500}
            />

            <Button
              type="button"
              onClick={handleUpload}
              disabled={uploading || uploaded}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploaden...
                </>
              ) : uploaded ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Geüpload!
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Foto delen
                </>
              )}
            </Button>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("p-6 space-y-4", className)}>
      <div>
        <h3 className="text-lg font-semibold mb-1">Deel je moment</h3>
        <p className="text-sm text-muted-foreground">
          Upload een foto van je ervaring en deel deze met anderen
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!preview ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 border-2 border-dashed hover:border-primary/50 transition-colors"
        >
          <div className="flex flex-col items-center gap-3">
            <Camera className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">Kies een foto</p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG of WebP (max. 10MB)
              </p>
            </div>
          </div>
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted/30 border">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-3 right-3"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <Textarea
              placeholder="Vertel iets over deze foto..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {caption.length}/500
            </p>
          </div>

          <Button
            type="button"
            onClick={handleUpload}
            disabled={uploading || uploaded}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploaden...
              </>
            ) : uploaded ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Foto gedeeld!
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Foto delen
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}

