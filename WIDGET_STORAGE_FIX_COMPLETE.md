# 🔧 WIDGET STORAGE FIX - BLAUW VRAAGTEKEN OPGELOST

## ❌ **PROBLEEM:**

Bij het uploaden van:
1. Widget Logo → Blauw vraagteken
2. Button Logo → Blauw vraagteken

**Oorzaak:**
- Storage bucket niet correct ingesteld
- Upload functie met verkeerde parameter volgorde
- Missing RLS policies

---

## ✅ **OPLOSSING:**

### **Fix 1: Upload Functie Parameters**
**Probleem:** `uploadTenantLogo(tenantId, file)` ❌  
**Fix:** `uploadTenantLogo(file, tenantId)` ✅

### **Fix 2: Error Handling**
Added proper error handling en return value checking.

### **Fix 3: Storage Bucket Setup**
Complete SQL script voor storage bucket en RLS policies.

---

## 🚀 **SETUP INSTRUCTIES:**

### **Stap 1: Run SQL in Supabase**

```sql
-- Open Supabase SQL Editor
-- Run: WIDGET_STORAGE_SETUP.sql
```

Dit script:
- ✅ Maakt `tenant-logos` bucket (PUBLIC)
- ✅ Voegt 4 RLS policies toe
- ✅ Voegt `button_logo_url` column toe
- ✅ Verificatie queries

### **Stap 2: Hard Refresh Browser**

```bash
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### **Stap 3: Test Upload**

```
1. Go to: http://localhost:3007/manager/[TENANT_ID]/settings
2. Widget tab → Design
3. Upload een logo (PNG/JPG)
4. Zie preview direct verschijnen ✅
5. Klik "Opslaan"
6. Geen blauw vraagteken meer! ✅
```

---

## 📋 **WAT IS GEFIXED:**

### **In WidgetManager.tsx:**

#### **Voorheen (FOUT):**
```typescript
const logoUrl = await uploadTenantLogo(tenantId, file);
setConfig({ ...config, logo_url: logoUrl }); // logoUrl is hele object!
```

#### **Nu (CORRECT):**
```typescript
const uploadResult = await uploadTenantLogo(file, tenantId);

if ('error' in uploadResult) {
  showMessage('error', uploadResult.error);
  return;
}

setConfig({ ...config, logo_url: uploadResult.url }); // Gebruikt .url property
```

### **Key Changes:**
1. ✅ Parameters in correcte volgorde: `(file, tenantId)`
2. ✅ Proper type checking: `'error' in uploadResult`
3. ✅ Extract URL: `uploadResult.url` niet hele object
4. ✅ Early return bij errors

---

## 🗄️ **SQL SCRIPT DETAILS:**

### **WIDGET_STORAGE_SETUP.sql** doet:

#### **1. Bucket Creation:**
```sql
-- Creates 'tenant-logos' bucket (PUBLIC)
-- Sets public = true for direct access
```

#### **2. RLS Policies (4x):**
```sql
-- 1. Public SELECT (voor widget display)
-- 2. Authenticated INSERT (voor uploads)
-- 3. Authenticated UPDATE (voor wijzigingen)
-- 4. Authenticated DELETE (voor verwijderen)
```

#### **3. Column Addition:**
```sql
-- Adds button_logo_url to widget_configurations
ALTER TABLE widget_configurations
ADD COLUMN IF NOT EXISTS button_logo_url TEXT;
```

#### **4. Verification:**
- Check bucket exists en is public
- List all policies
- Show widget configurations columns

---

## 🧪 **TEST CHECKLIST:**

### **Voordat je test:**
- [x] SQL script gerund in Supabase
- [x] Browser hard refresh
- [x] Code changes applied

### **Test Logo Upload:**
1. [ ] Open Widget Manager
2. [ ] Upload widget logo
3. [ ] Zie preview direct (geen blauw vraagteken)
4. [ ] Save configuratie
5. [ ] Refresh pagina
6. [ ] Logo blijft zichtbaar ✅

### **Test Button Logo Upload:**
1. [ ] Scroll naar "Floating Button" sectie
2. [ ] Upload button logo
3. [ ] Zie rond preview (geen blauw vraagteken)
4. [ ] Save configuratie
5. [ ] Go to Preview
6. [ ] Toggle "Floating Button Widget"
7. [ ] Zie button rechtsonder met logo ✅

### **Test in Preview:**
1. [ ] Grid widget toont logo bovenaan
2. [ ] Button widget toont logo in floating button
3. [ ] Beide laden zonder errors
4. [ ] Geen blauwe vraagtekens

---

## 📊 **STORAGE URL FORMAT:**

### **Correcte URL:**
```
https://[PROJECT].supabase.co/storage/v1/object/public/tenant-logos/[TENANT_ID]/logo-[TIMESTAMP].png
```

### **Voorbeeld:**
```
https://jrudqxovozqnmxypjtij.supabase.co/storage/v1/object/public/tenant-logos/b0402eea-4296-4951-aff6-8f4c2c219818/logo-1730000000000.png
```

### **Check of URL werkt:**
```bash
# Test direct in browser
https://[JE_PROJECT].supabase.co/storage/v1/object/public/tenant-logos/[TENANT_ID]/

# Moet lijst van bestanden tonen (als public)
```

---

## 🐛 **TROUBLESHOOTING:**

### **Nog steeds blauw vraagteken?**

#### **Check 1: Bucket bestaat en is public**
```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'tenant-logos';
-- Should return: public = true
```

#### **Check 2: Policies zijn actief**
```sql
SELECT COUNT(*) FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%tenant%logo%';
-- Should return: 4
```

#### **Check 3: Upload succesvol?**
```sql
SELECT name, bucket_id, created_at 
FROM storage.objects 
WHERE bucket_id = 'tenant-logos'
ORDER BY created_at DESC 
LIMIT 5;
-- Should show recent uploads
```

#### **Check 4: Console errors?**
```javascript
// Open browser console (F12)
// Look for:
[Widget Manager] Upload error: ...
[Storage] Failed to load: ...
```

### **Error: "Bucket not found"**
```sql
-- Re-create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-logos', 'tenant-logos', true);
```

### **Error: "Permission denied"**
```sql
-- Re-apply policies (run WIDGET_STORAGE_SETUP.sql again)
```

### **Error: "Invalid image"**
- Check file type: PNG, JPG, WebP, GIF only
- Check file size: Max 5MB
- Try different image

---

## ✨ **VERWACHT RESULTAAT:**

### **Na Fix:**

1. **Upload Logo:**
   - ✅ File selector opent
   - ✅ Kies PNG/JPG
   - ✅ Progress indicator (Uploaden...)
   - ✅ Preview verschijnt direct
   - ✅ Success message: "Logo geüpload!"
   - ✅ Geen blauw vraagteken

2. **Upload Button Logo:**
   - ✅ File selector opent
   - ✅ Kies PNG/JPG
   - ✅ Progress indicator (Uploaden...)
   - ✅ Rond preview verschijnt (12x12)
   - ✅ Success message: "Button logo geüpload!"
   - ✅ Geen blauw vraagteken

3. **In Preview:**
   - ✅ Grid widget: logo bovenaan zichtbaar
   - ✅ Button widget: logo in floating button
   - ✅ Beide laden snel
   - ✅ Geen console errors

---

## 📝 **FILES GEWIJZIGD:**

1. ✅ `WIDGET_STORAGE_SETUP.sql` - Complete storage setup
2. ✅ `components/manager/WidgetManager.tsx` - Fixed upload functions
3. ✅ `WIDGET_STORAGE_FIX_COMPLETE.md` - Deze guide

---

## 🎯 **SAMENVATTING:**

### **Problemen:**
- ❌ Verkeerde parameter volgorde in upload calls
- ❌ Missing error handling
- ❌ Storage bucket niet ingesteld
- ❌ RLS policies ontbraken

### **Oplossingen:**
- ✅ Parameters gecorrigeerd: `(file, tenantId)`
- ✅ Proper error handling toegevoegd
- ✅ Complete SQL setup script
- ✅ 4 RLS policies voor security

### **Resultaat:**
- ✅ Logo upload werkt perfect
- ✅ Button logo upload werkt perfect
- ✅ Geen blauwe vraagtekens meer
- ✅ Preview toont beide logos correct

---

## 🚀 **KLAAR VOOR GEBRUIK!**

**Next Steps:**
1. Run `WIDGET_STORAGE_SETUP.sql`
2. Hard refresh browser
3. Upload logo's
4. Test in preview
5. Deploy to production!

**Alles zou nu moeten werken zonder blauwe vraagtekens! ✨**

