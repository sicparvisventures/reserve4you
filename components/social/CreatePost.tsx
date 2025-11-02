'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, X, Loader2, MapPin, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { compressImage } from '@/lib/utils/image-upload';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CreatePostProps {
  locationId?: string | null;
  locationName?: string | null;
  locationSlug?: string | null;
  user: {
    name: string;
    profile_picture_url?: string | null;
  };
  onPostSuccess?: () => void;
  onPostError?: (error: string) => void;
  className?: string;
}

export function CreatePost({
  locationId,
  locationName,
  locationSlug,
  user,
  onPostSuccess,
  onPostError,
  className,
}: CreatePostProps) {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(locationId || null);
  const [selectedLocationName, setSelectedLocationName] = useState<string | null>(locationName || null);
  const [selectedLocationSlug, setSelectedLocationSlug] = useState<string | null>(locationSlug || null);
  const [posting, setPosting] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [searchingLocations, setSearchingLocations] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      onPostError?.('Ongeldig bestandstype. Gebruik JPG, PNG, WebP of GIF.');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      onPostError?.('Bestand te groot. Maximum grootte is 10MB.');
      return;
    }

    try {
      const compressedFile = await compressImage(file, 1920, 1440, 0.85);
      setSelectedFile(compressedFile);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error: any) {
      onPostError?.(error.message || 'Fout bij het verwerken van de foto');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLocationSearch = async (query: string) => {
    setLocationSearch(query);
    if (query.length < 2) {
      setLocationResults([]);
      return;
    }

    setSearchingLocations(true);
    try {
      const response = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setLocationResults(data.locations || []);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setSearchingLocations(false);
    }
  };

  const handleSelectLocation = (location: any) => {
    setSelectedLocationId(location.id);
    setSelectedLocationName(location.name);
    setSelectedLocationSlug(location.slug);
    setShowLocationSearch(false);
    setLocationSearch('');
    setLocationResults([]);
  };

  const handlePost = async () => {
    if (!text.trim() && !selectedFile && !selectedLocationId) {
      onPostError?.('Voeg tekst, een foto of een locatie toe om te posten');
      return;
    }

    setPosting(true);

    try {
      // If there's a file, upload it first
      let photoUrl = null;
      let photoId = null;

      if (selectedFile && selectedLocationId) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('location_id', selectedLocationId);
        if (text.trim()) {
          formData.append('caption', text.trim());
        }

        const photoResponse = await fetch('/api/social/photos/upload', {
          method: 'POST',
          body: formData,
        });

        if (photoResponse.ok) {
          const photoData = await photoResponse.json();
          photoUrl = photoData.photo.photo_url;
          photoId = photoData.photo.id;
        }
      }

      // Create post activity
      const postData: any = {
        text: text.trim() || null,
        location_id: selectedLocationId,
        photo_id: photoId,
      };

      const response = await fetch('/api/social/feed/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Post mislukt');
      }

      // Reset form
      setText('');
      handleRemoveFile();
      setSelectedLocationId(null);
      setSelectedLocationName(null);
      setSelectedLocationSlug(null);

      onPostSuccess?.();
    } catch (error: any) {
      console.error('Post error:', error);
      onPostError?.(error.message || 'Post mislukt. Probeer het opnieuw.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10 border-2 border-border">
          <AvatarImage src={user.profile_picture_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <Textarea
            placeholder="Deel je ervaring..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[100px] resize-none"
            maxLength={2000}
          />

          {preview && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted/30 border">
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
                onClick={handleRemoveFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Location Selection */}
          {selectedLocationId ? (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <MapPin className="h-4 w-4 text-primary" />
              <Link
                href={`/p/${selectedLocationSlug}`}
                className="flex-1 text-sm font-medium text-foreground hover:underline"
              >
                {selectedLocationName}
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedLocationId(null);
                  setSelectedLocationName(null);
                  setSelectedLocationSlug(null);
                }}
                className="h-7 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowLocationSearch(!showLocationSearch)}
                className="w-full justify-start"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Locatie toevoegen (optioneel)
              </Button>

              {showLocationSearch && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Zoek een locatie..."
                      value={locationSearch}
                      onChange={(e) => handleLocationSearch(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {locationResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border-t">
                      {locationResults.map((location) => (
                        <button
                          key={location.id}
                          onClick={() => handleSelectLocation(location)}
                          className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b last:border-b-0"
                        >
                          <div className="font-medium text-sm">{location.name}</div>
                          {location.address_json && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {location.address_json.street} {location.address_json.city}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {searchingLocations && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Zoeken...
                    </div>
                  )}
                  {locationSearch.length >= 2 && locationResults.length === 0 && !searchingLocations && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Geen locaties gevonden
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-9"
              >
                <Camera className="h-4 w-4 mr-2" />
                Foto
              </Button>
            </div>

            <Button
              onClick={handlePost}
              disabled={posting || (!text.trim() && !selectedFile && !selectedLocationId)}
              className="h-9 px-6"
            >
              {posting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posten...
                </>
              ) : (
                'Posten'
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

