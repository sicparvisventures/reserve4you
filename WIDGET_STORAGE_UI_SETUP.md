# 🔧 WIDGET STORAGE SETUP VIA SUPABASE DASHBOARD

## ⚠️ WAAROM VIA UI?

De SQL script geeft error: `ERROR: 42501: must be owner of table objects`

Dit komt omdat storage policies **niet via SQL** gemaakt kunnen worden door normale users.  
We moeten het via de **Supabase Dashboard UI** doen.

---

## 🚀 SETUP INSTRUCTIES (5 MINUTEN)

### **STAP 1: Run SQL Script** ✅

Open Supabase SQL Editor en run:

```sql
-- Voegt button_logo_url column toe
ALTER TABLE widget_configurations
ADD COLUMN IF NOT EXISTS button_logo_url TEXT;
```

**OF** run het complete script: `WIDGET_STORAGE_SETUP_SIMPLE.sql`

---

### **STAP 2: Storage Bucket Aanmaken** 🪣

1. **Open Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/[JE_PROJECT_ID]
   ```

2. **Ga naar Storage:**
   - Klik in linker sidebar: **Storage**
   - Klik op: **"Create a new bucket"**

3. **Bucket Configuratie:**
   ```
   Name: tenant-logos
   Public: ✅ YES (BELANGRIJK!)
   Allowed MIME types: Leave empty (all allowed)
   Max file size: 5242880 (5MB)
   ```

4. **Klik "Create bucket"**

---

### **STAP 3: Storage Policies Instellen** 🔒

1. **Klik op de `tenant-logos` bucket**

2. **Ga naar "Policies" tab** (rechts bovenaan)

3. **Klik "New Policy"**

#### **Policy 1: Public SELECT** (Voor widget display)

```
Policy Name: Public can view tenant logos
Allowed operation: SELECT
Target roles: public

Policy definition:
(bucket_id = 'tenant-logos'::text)
```

**SQL voor policy:**
```sql
CREATE POLICY "Public can view tenant logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'tenant-logos');
```

---

#### **Policy 2: Authenticated INSERT** (Voor uploads)

```
Policy Name: Authenticated users can upload tenant logos
Allowed operation: INSERT
Target roles: authenticated

Policy definition:
((bucket_id = 'tenant-logos'::text) AND ((storage.foldername(name))[1] IN ( SELECT (tenants.id)::text FROM tenants WHERE ((tenants.id)::text = (storage.foldername(objects.name))[1]))))
```

**SQL voor policy:**
```sql
CREATE POLICY "Authenticated users can upload tenant logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM tenants 
    WHERE id::text = (storage.foldername(name))[1]
  )
);
```

---

#### **Policy 3: Authenticated UPDATE** (Voor wijzigingen)

```
Policy Name: Tenant members can update logos
Allowed operation: UPDATE
Target roles: authenticated

Policy definition:
((bucket_id = 'tenant-logos'::text) AND ((storage.foldername(name))[1] IN ( SELECT (t.id)::text FROM (tenants t JOIN memberships m ON ((m.tenant_id = t.id))) WHERE (m.user_id = auth.uid()))))
```

**SQL voor policy:**
```sql
CREATE POLICY "Tenant members can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT t.id::text FROM tenants t
    INNER JOIN memberships m ON m.tenant_id = t.id
    WHERE m.user_id = auth.uid()
  )
);
```

---

#### **Policy 4: Authenticated DELETE** (Voor verwijderen)

```
Policy Name: Tenant members can delete logos
Allowed operation: DELETE
Target roles: authenticated

Policy definition:
((bucket_id = 'tenant-logos'::text) AND ((storage.foldername(name))[1] IN ( SELECT (t.id)::text FROM (tenants t JOIN memberships m ON ((m.tenant_id = t.id))) WHERE (m.user_id = auth.uid()))))
```

**SQL voor policy:**
```sql
CREATE POLICY "Tenant members can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT t.id::text FROM tenants t
    INNER JOIN memberships m ON m.tenant_id = t.id
    WHERE m.user_id = auth.uid()
  )
);
```

---

### **STAP 4: Verificatie** ✅

1. **Check bucket bestaat:**
   - Ga naar Storage
   - Zie je `tenant-logos` bucket? ✅
   - Is "Public" = YES? ✅

2. **Check policies:**
   - Klik op `tenant-logos` bucket
   - Ga naar "Policies" tab
   - Zie je 4 policies? ✅
     - Public can view tenant logos (SELECT)
     - Authenticated users can upload tenant logos (INSERT)
     - Tenant members can update logos (UPDATE)
     - Tenant members can delete logos (DELETE)

3. **Test upload:**
   - Go to Widget Manager
   - Upload logo
   - Geen blauw vraagteken? ✅

---

## 🎯 SNELLE SETUP (MAKKELIJKSTE MANIER)

Als je **niet** alle policies handmatig wilt toevoegen:

### **Optie A: Via Supabase SQL Editor (Als Admin)**

Als je **admin/owner** bent van het project, run dit in SQL Editor:

```sql
-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Public can view tenant logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload tenant logos" ON storage.objects;
DROP POLICY IF EXISTS "Tenant members can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Tenant members can delete logos" ON storage.objects;

-- Create all 4 policies
CREATE POLICY "Public can view tenant logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'tenant-logos');

CREATE POLICY "Authenticated users can upload tenant logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM tenants 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Tenant members can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT t.id::text FROM tenants t
    INNER JOIN memberships m ON m.tenant_id = t.id
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "Tenant members can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT t.id::text FROM tenants t
    INNER JOIN memberships m ON m.tenant_id = t.id
    WHERE m.user_id = auth.uid()
  )
);
```

**Als dit ook "must be owner" error geeft:**  
→ Je **MOET** het via de Dashboard UI doen (Stap 2-3)

---

### **Optie B: Simpele Public Bucket (QUICK & DIRTY)**

Als je **alleen maar wilt dat uploads werken** zonder security:

1. **Create bucket `tenant-logos`** (Public = YES)

2. **Add deze 2 policies via Dashboard:**

**Policy 1: Public All Access**
```sql
CREATE POLICY "Public access to tenant logos"
ON storage.objects
USING (bucket_id = 'tenant-logos');
```

**Policy 2: Authenticated Can Upload**
```sql
CREATE POLICY "Authenticated can upload tenant logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tenant-logos');
```

⚠️ **Minder veilig maar werkt direct!**

---

## 🧪 TEST CHECKLIST

Na setup:

- [ ] Bucket `tenant-logos` bestaat
- [ ] Bucket is PUBLIC
- [ ] Minimaal 2 policies actief
- [ ] Upload logo in Widget Manager → Werkt! ✅
- [ ] Upload button logo → Werkt! ✅
- [ ] Preview toont beide logo's → Werkt! ✅
- [ ] Geen blauwe vraagtekens → Werkt! ✅

---

## 🐛 TROUBLESHOOTING

### **Error: "Bucket not found"**
→ Bucket nog niet aangemaakt in Dashboard

### **Error: "Permission denied"**
→ Policies niet correct ingesteld

### **Error: "new row violates row-level security"**
→ INSERT policy ontbreekt

### **Logo upload werkt maar toont blauw vraagteken**
→ Bucket is niet PUBLIC of SELECT policy ontbreekt

### **Hoe check ik of bucket public is?**
```sql
SELECT id, public FROM storage.buckets WHERE id = 'tenant-logos';
-- Should return: public = true
```

### **Hoe check ik of policies bestaan?**
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%tenant%logo%';
-- Should return: 4 rows
```

---

## ✅ KLAAR!

Als je alle stappen hebt gevolgd:

1. ✅ `tenant-logos` bucket bestaat (Public)
2. ✅ 4 policies actief (of minimaal 2)
3. ✅ `button_logo_url` column in database
4. ✅ Code changes applied (WidgetManager.tsx)

**Test nu je widget uploads! Geen blauwe vraagtekens meer! 🎉**

---

## 📚 EXTRA INFO

### **Waarom moet bucket PUBLIC zijn?**
- Widget wordt getoond op externe websites
- Die websites hebben geen Supabase auth
- Public bucket = direct image access via URL

### **URL Format:**
```
https://[PROJECT].supabase.co/storage/v1/object/public/tenant-logos/[TENANT_ID]/logo-[TIMESTAMP].png
```

### **Voorbeeld:**
```
https://jrudqxovozqnmxypjtij.supabase.co/storage/v1/object/public/tenant-logos/b0402eea-4296-4951-aff6-8f4c2c219818/logo-1730000000000.png
```

---

**Volg de stappen en je logo's werken perfect! 🚀**

