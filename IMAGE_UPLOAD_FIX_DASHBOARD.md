# 🔧 Fix Image Upload - Via Supabase Dashboard

## Het Probleem
Je krijgt een `StorageApiError: new row violates row-level security policy` error omdat de `location-images` bucket geen RLS policies heeft.

## ✅ Oplossing via Supabase Dashboard (Meest Betrouwbaar)

### Stap 1: Ga naar je Supabase Project
1. Open https://supabase.com/dashboard
2. Selecteer je project
3. Ga naar **Storage** in de linker sidebar

### Stap 2: Configureer de Bucket
1. Klik op de bucket **location-images**
   - Als deze niet bestaat, maak hem aan:
     - Klik op **New bucket**
     - Naam: `location-images`
     - Public bucket: ✅ **AAN**
     - File size limit: `5242880` (5MB)
     - Allowed MIME types: `image/jpeg,image/jpg,image/png,image/webp,image/gif`

### Stap 3: Voeg RLS Policies Toe
1. Klik op de **location-images** bucket
2. Ga naar het tabblad **Policies** (bovenaan)
3. Klik op **New Policy**

#### Policy 1: Upload (INSERT)
- **Policy name**: `Allow authenticated uploads`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  bucket_id = 'location-images'
  ```

#### Policy 2: View (SELECT)  
- **Policy name**: `Allow public downloads`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **Policy definition**:
  ```sql
  bucket_id = 'location-images'
  ```

#### Policy 3: Update (UPDATE)
- **Policy name**: `Allow authenticated updates`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **USING expression**:
  ```sql
  bucket_id = 'location-images'
  ```
- **WITH CHECK expression**:
  ```sql
  bucket_id = 'location-images'
  ```

#### Policy 4: Delete (DELETE)
- **Policy name**: `Allow authenticated deletes`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  bucket_id = 'location-images'
  ```

### Stap 4: Test het
1. Ga naar je app op `localhost:3007`
2. Log in
3. Ga naar **Manager Portal** → **Instellingen**
4. Upload een afbeelding
5. ✅ Het zou nu moeten werken!

---

## 🎯 Snelle Check
Na het toevoegen van de policies, controleer in de **SQL Editor**:

```sql
SELECT 
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;
```

Je zou 4 policies moeten zien voor de location-images bucket.

---

## 🔥 Alternative: Via SQL Editor (als je admin access hebt)

Als je SQL wilt gebruiken, ga dan naar **SQL Editor** en voer dit uit:

```sql
-- Alleen als je SUPERUSER bent of supabase_admin
SET ROLE postgres;

-- Drop oude policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Maak nieuwe policies
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'location-images');

CREATE POLICY "Allow public downloads"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'location-images');

CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'location-images')
WITH CHECK (bucket_id = 'location-images');

CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'location-images');
```

---

## 📝 Waarom Dashboard?
De Supabase Dashboard heeft automatisch de juiste permissions om Storage policies te maken. Via SQL heb je vaak `must be owner of table objects` errors.

---

## ❓ Hulp Nodig?
Als het nog steeds niet werkt:
1. Check of de bucket `location-images` bestaat
2. Check of de bucket **public** is ingesteld
3. Check of je bent ingelogd als authenticated user
4. Check browser console voor andere errors

