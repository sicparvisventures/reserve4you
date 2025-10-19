# 📸 Image Upload Setup Guide

Complete guide om restaurant foto uploads werkend te krijgen in de onboarding flow.

## ✨ Wat is er gemaakt?

### 1. **Image Upload tijdens Onboarding**
- ✅ Upload veld in StepLocatie (stap 2)
- ✅ Image preview voordat je uploadt
- ✅ Automatische compressie (max 5MB)
- ✅ Validatie (min 400x300px)
- ✅ Upload naar Supabase Storage
- ✅ URL opslaan in database

### 2. **Images Overal Zichtbaar**
- ✅ Homepage - LocationCard toont uploaded images
- ✅ Discover page - LocationCard toont uploaded images
- ✅ Location detail page (`/p/[slug]`) - Shows image
- ✅ Fallback naar emoji 🍽️ als geen image

### 3. **Database & Storage**
- ✅ SQL migratie voor image columns
- ✅ Supabase Storage bucket configuratie
- ✅ RLS policies voor veilige uploads
- ✅ API routes voor image updates

## 🚀 Setup Stappen

### **Stap 1: Voer SQL Migratie uit**

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Selecteer je project
3. Ga naar **SQL Editor**
4. **Nieuwe query maken**
5. Copy paste de inhoud van: `supabase/migrations/20250119000007_add_location_images.sql`
6. Klik **Run**

**Wat doet deze migratie:**
- Voegt `image_url`, `image_public_id`, `images` columns toe aan `locations` table
- Maakt indexes voor betere performance
- Maakt storage bucket `location-images`
- Configureert RLS policies voor veilige uploads

### **Stap 2: Maak Storage Bucket (Manual)**

**Belangrijk:** Dit moet je handmatig doen in Supabase Dashboard!

1. Ga naar **Storage** in Supabase Dashboard
2. Klik op **New bucket**
3. Bucket configuratie:
   - **Name**: `location-images`
   - **Public bucket**: ✅ Aan (zodat images publiek toegankelijk zijn)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: 
     ```
     image/jpeg
     image/jpg
     image/png
     image/webp
     image/gif
     ```
4. Klik **Create bucket**

### **Stap 3: Verificeer RLS Policies**

Ga naar **Storage** → **Policies** en check dat deze policies bestaan:

1. ✅ **Location images are publicly accessible** (SELECT)
2. ✅ **Authenticated users can upload location images** (INSERT)
3. ✅ **Users can update their location images** (UPDATE)
4. ✅ **Users can delete their location images** (DELETE)

Als deze policies niet bestaan, voer dan stap 1 (SQL) opnieuw uit.

### **Stap 4: Herstart Server**

```bash
# Stop de server (Ctrl+C)

# Clear cache
rm -rf .next/cache

# Herstart
pnpm dev
```

## 🎯 Hoe Te Gebruiken

### **Als Manager - Nieuwe Vestiging Toevoegen**

1. Ga naar Dashboard: `http://localhost:3007/manager/[tenant-id]/dashboard`
2. Klik op **"Toevoegen"** bij Vestigingen
3. **Stap 2 - Locatie info**:
   - Vul restaurant naam in
   - Vul adres in
   - **Scroll naar beneden** naar "Restaurant foto"
   - Klik op het upload veld of sleep een foto
4. **Upload een foto:**
   - Selecteer een JPG, PNG of WebP bestand
   - Min 400x300px
   - Max 5MB
   - Image wordt automatisch gecomprimeerd
5. **Preview:** Zie direct een preview van je foto
6. **Verwijderen:** Klik op de X knop om de foto te verwijderen
7. Voltooi de rest van de onboarding
8. ✅ Foto wordt automatisch geüpload en opgeslagen!

### **Waar Verschijnt De Foto?**

De geüploade foto verschijnt automatisch op:

1. **Homepage** (`http://localhost:3007/`)
   - In de "Featured Locations" sectie
   - Vervangt de 🍽️ emoji

2. **Discover Page** (`http://localhost:3007/discover`)
   - In de location cards
   - Vervangt de 🍽️ emoji

3. **Location Detail** (`http://localhost:3007/p/[slug]`)
   - Hero image bovenaan
   - Vervangt de placeholder

## 📁 Bestanden Aangepast

### Nieuwe Bestanden:
1. ✅ `lib/utils/image-upload.ts` - Image upload utilities
2. ✅ `supabase/migrations/20250119000007_add_location_images.sql` - Database migratie
3. ✅ `IMAGE_UPLOAD_SETUP_GUIDE.md` - Deze guide

### Aangepaste Bestanden:
1. ✅ `app/manager/onboarding/steps/StepLocatie.tsx` - Image upload UI
2. ✅ `components/location/LocationCard.tsx` - Image display
3. ✅ `app/api/manager/locations/route.ts` - PATCH endpoint voor image updates

## 🔍 Verificatie

### Check 1: Database Columns

Voer uit in Supabase SQL Editor:
```sql
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'locations' 
  AND column_name IN ('image_url', 'image_public_id', 'images')
ORDER BY column_name;
```

**Verwacht resultaat:**
```
column_name       | data_type
------------------|----------
image_public_id   | text
image_url         | text
images            | jsonb
```

### Check 2: Storage Bucket

Voer uit in Supabase SQL Editor:
```sql
SELECT 
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets
WHERE name = 'location-images';
```

**Verwacht resultaat:**
```
id               | name            | public | file_size_limit
-----------------|-----------------|--------|----------------
location-images  | location-images | true   | 5242880
```

### Check 3: Test Upload

1. Ga naar onboarding
2. Upload een test foto
3. Check in Supabase Dashboard → Storage → location-images
4. Je zou de geüploade foto moeten zien

### Check 4: Check Locations Table

```sql
SELECT 
  name,
  slug,
  image_url,
  image_public_id
FROM locations
ORDER BY created_at DESC
LIMIT 5;
```

Locations met geüploade images hebben gevulde `image_url` en `image_public_id` velden.

## 🐛 Troubleshooting

### Probleem: "Failed to upload image"

**Oorzaak**: Storage bucket niet correct geconfigureerd  
**Oplossing**:
1. Check dat bucket `location-images` bestaat
2. Check dat bucket **public** is
3. Check file size limit (5MB)
4. Check allowed MIME types

### Probleem: "Unauthorized" bij upload

**Oorzaak**: RLS policies niet correct  
**Oplossing**:
1. Voer SQL migratie opnieuw uit
2. Check policies in Storage → Policies
3. Zorg dat "INSERT" policy bestaat voor authenticated users

### Probleem: Image wordt niet getoond

**Oorzaak**: URL niet correct opgeslagen  
**Check**:
```sql
SELECT image_url FROM locations WHERE slug = 'jouw-slug';
```

Als `image_url` NULL is:
1. Check of upload succesvol was (check browser console)
2. Check of PATCH request succesvol was
3. Upload opnieuw

### Probleem: Image toont niet op homepage

**Oorzaak**: LocationCard krijgt data niet  
**Check**:
1. Refresh de homepage (hard refresh: Cmd+Shift+R)
2. Check of `image_url` in database staat
3. Check browser console voor errors
4. Check of location `is_public = true` is

### Probleem: "File too large"

**Oorzaak**: Image groter dan 5MB  
**Oplossing**:
- Image wordt automatisch gecomprimeerd
- Als nog steeds te groot: compress handmatig voor upload
- Of verhoog limit in storage bucket settings

## 📊 Image Requirements

### Upload Specificaties:
- **Formaten**: JPG, PNG, WebP, GIF
- **Min grootte**: 400x300 pixels
- **Max bestandsgrootte**: 5MB (na compressie)
- **Aanbevolen grootte**: 1200x900 pixels
- **Aspect ratio**: 4:3 of 16:9 aanbevolen

### Automatische Compressie:
- Max breedte: 1200px
- Max hoogte: 900px
- Kwaliteit: 80%
- Gebeurt automatisch client-side

## 🎨 Image Display

### LocationCard (Homepage & Discover):
- Aspect ratio: 4:3
- Height: 192px (h-48)
- Object fit: cover
- Hover: scale 1.05x
- Fallback: 🍽️ emoji

### Location Detail Page:
- Hero image: full width
- Height: auto
- Object fit: cover
- Responsive

## 💡 Tips voor Beste Resultaten

1. **Goede Foto's**:
   - Goede belichting
   - Hoge resolutie (min 1200px breed)
   - Professionele look
   - Laat het restaurant zien, niet alleen eten

2. **Upload Performance**:
   - Images worden automatisch gecomprimeerd
   - Gebruik WebP voor kleinste bestandsgrootte
   - Upload tijdens onboarding (niet later)

3. **Fallback**:
   - Altijd een emoji als fallback
   - Geen broken images
   - Graceful degradation

## 🔄 Volgende Stappen

### Optioneel - Meerdere Images:
De database heeft al een `images` JSONB column voor meerdere images.
Dit kan later gebruikt worden voor:
- Image gallery
- Multiple views
- Interior/Exterior shots

### Optioneel - Image Optimization:
Supabase Transform ondersteunt image transformations:
- Resize on-the-fly
- Format conversie
- Quality aanpassing
- Gebruik `getOptimizedImageUrl()` uit `lib/utils/image-upload.ts`

---

**Status**: ✅ Ready for Production  
**Last Updated**: 19 januari 2025  
**Version**: 1.0

