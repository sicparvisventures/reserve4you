# 🚀 QUICK FIX: Image Upload Storage RLS

## Probleem
`StorageApiError: new row violates row-level security policy`

## Snelle Oplossing (5 minuten) ⚡

### 1️⃣ Open Supabase Dashboard
```
https://supabase.com/dashboard
```
→ Selecteer je project

### 2️⃣ Ga naar Storage
- Klik **Storage** in linker menu
- Klik op bucket **location-images**
- Als deze niet bestaat: maak aan met **New Bucket**
  - Naam: `location-images`  
  - Public: ✅ **AAN**
  - File size: `5242880` bytes (5MB)
  - MIME types: `image/jpeg,image/jpg,image/png,image/webp,image/gif`

### 3️⃣ Klik op "Policies" Tab
Bovenaan de bucket pagina zie je tabs. Klik **Policies**.

### 4️⃣ Klik "New Policy"

### 5️⃣ Voeg deze 4 policies toe:

#### 📤 Policy 1: Upload
```
Template: Custom
Name: Allow authenticated uploads
Operation: INSERT
Target roles: authenticated
Policy definition: bucket_id = 'location-images'
```

#### 👁️ Policy 2: View
```
Template: Custom
Name: Allow public downloads
Operation: SELECT
Target roles: public
Policy definition: bucket_id = 'location-images'
```

#### ✏️ Policy 3: Update
```
Template: Custom
Name: Allow authenticated updates
Operation: UPDATE
Target roles: authenticated
USING: bucket_id = 'location-images'
WITH CHECK: bucket_id = 'location-images'
```

#### 🗑️ Policy 4: Delete
```
Template: Custom
Name: Allow authenticated deletes
Operation: DELETE
Target roles: authenticated
Policy definition: bucket_id = 'location-images'
```

### 6️⃣ Test
1. Ga naar `localhost:3007`
2. Login
3. Manager Portal → Instellingen
4. Upload afbeelding
5. ✅ Werkt!

---

## 🎯 Of gebruik deze Template

Als je een template wilt gebruiken in plaats van Custom:
1. Klik **New Policy**
2. Kies template: **"Enable insert for authenticated users only"**
3. Voor **Policy name**: `authenticated-uploads`
4. Herhaal voor SELECT (public), UPDATE en DELETE

---

## ⚠️ Belangrijk
- Zorg dat bucket **PUBLIC** is (anders geen images zichtbaar)
- De `authenticated` role = ingelogde users
- De `public` role = iedereen (ook niet-ingelogd)

---

## 🔍 Verificatie
Na het aanmaken, controleer in **SQL Editor**:

```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage';
```

Moet 4 policies tonen ✅

