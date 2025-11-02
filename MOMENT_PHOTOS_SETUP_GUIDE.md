# Moment Photos Storage Setup Guide

## Stap 1: Maak Storage Bucket aan via Dashboard

Storage buckets kunnen niet via SQL worden aangemaakt in Supabase. Volg deze stappen:

1. **Ga naar Supabase Dashboard**
   - Open je project: https://supabase.com/dashboard
   - Selecteer je project

2. **Ga naar Storage**
   - Klik op "Storage" in het linker menu

3. **Maak nieuwe bucket aan**
   - Klik op "New bucket" of "Create a new bucket"
   
4. **Configureer bucket:**
   - **Name:** `moment-photos`
   - **Public bucket:** ✅ **Ja (AAN)** - Dit is belangrijk zodat foto's publiek zichtbaar zijn
   - **File size limit:** `10485760` bytes (10MB)
   - **Allowed MIME types:** 
     ```
     image/jpeg
     image/jpg
     image/png
     image/webp
     image/gif
     ```
   - Of laat "Allowed MIME types" leeg om alle image types toe te staan

5. **Klik "Create bucket"**

## Stap 2: Voer SQL Script uit voor RLS Policies

Nadat de bucket is aangemaakt:

1. **Ga naar SQL Editor** in Supabase Dashboard
2. **Voer het SQL script uit:**
   ```
   supabase/migrations/20250128000016_create_moment_photos_bucket.sql
   ```
   
   Dit script maakt de RLS policies aan voor veilige foto uploads.

## Verificatie

Na beide stappen:

1. **Check bucket bestaat:**
   - Ga naar Storage > moment-photos
   - Je zou de bucket moeten zien

2. **Check RLS policies:**
   - Ga naar Storage > moment-photos > Policies
   - Je zou 4 policies moeten zien:
     - Public can view moment photos (SELECT)
     - Authenticated users can upload moment photos (INSERT)
     - Users can update own moment photos (UPDATE)
     - Users can delete own moment photos (DELETE)

## Test

Test de foto upload functionaliteit:

1. Maak een reservering → Upload foto na bevestiging
2. Ga naar een location detail page → Upload foto in Reviews tab
3. Ga naar je profiel → Upload foto bij voltooide boekingen

## Troubleshooting

### Error: "Bucket not found"
- **Oplossing:** Controleer of de bucket `moment-photos` bestaat in Storage

### Error: "Permission denied" bij upload
- **Oplossing:** Controleer of de RLS policies correct zijn aangemaakt via SQL script

### Error: "File too large"
- **Oplossing:** Controleer of file_size_limit is ingesteld op 10485760 (10MB)

### Error: "Invalid file type"
- **Oplossing:** Controleer of de MIME types correct zijn ingesteld in de bucket configuratie

