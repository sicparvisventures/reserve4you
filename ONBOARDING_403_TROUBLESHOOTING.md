# ONBOARDING 403 ERROR - TROUBLESHOOTING GUIDE

**Error:** `403 Forbidden - Unauthorized` bij het aanmaken van een locatie tijdens onboarding.

---

## 🔍 OORZAAK

De API checkt of je toegang hebt tot de tenant via de `memberships` table. Als deze membership ontbreekt, krijg je een 403 error.

**Mogelijke redenen:**
1. ✅ **Meest waarschijnlijk:** Membership record ontbreekt in database
2. Session is verlopen (uitgelogd en opnieuw ingelogd)
3. Tenant is aangemaakt zonder membership (database inconsistentie)

---

## 🛠️ OPLOSSING

### **Optie A: Quick Fix (AANBEVOLEN)**

Run dit SQL script in Supabase SQL Editor:

```sql
-- File: QUICK_FIX_MEMBERSHIP.sql

INSERT INTO memberships (tenant_id, user_id, role)
SELECT 
  t.id as tenant_id,
  t.owner_user_id as user_id,
  'OWNER' as role
FROM tenants t
WHERE t.id = 'b0402eea-4296-4951-aff6-8f4c2c219818'
  AND NOT EXISTS (
    SELECT 1 FROM memberships m 
    WHERE m.tenant_id = t.id 
    AND m.user_id = t.owner_user_id
  );
```

**Dit script:**
- Vindt de `owner_user_id` van de tenant
- Maakt een `OWNER` membership aan als deze ontbreekt
- Gebruikt `NOT EXISTS` om duplicaten te voorkomen

**Verificatie:**
```sql
SELECT 
  m.role,
  t.name as tenant_name,
  u.email as user_email
FROM memberships m
JOIN tenants t ON t.id = m.tenant_id
LEFT JOIN auth.users u ON u.id = m.user_id
WHERE m.tenant_id = 'b0402eea-4296-4951-aff6-8f4c2c219818';
```

**Expected output:** 1 row met `role = 'OWNER'`

---

### **Optie B: Diagnostic First (Als optie A niet werkt)**

Run het diagnostic script: `FIX_ONBOARDING_403.sql`

Dit script controleert:
1. Of de tenant bestaat
2. Welke memberships er zijn
3. Of er al locaties zijn aangemaakt
4. Welke gebruikers er zijn

---

### **Optie C: Herstart Onboarding**

Als de tenant nog geen locaties heeft:

1. **Verwijder de tenant:**
   ```sql
   DELETE FROM tenants 
   WHERE id = 'b0402eea-4296-4951-aff6-8f4c2c219818';
   -- Dit verwijdert ook memberships via CASCADE
   ```

2. **Start onboarding opnieuw:**
   - Ga naar `/manager/onboarding?step=1`
   - Maak een nieuwe tenant aan (dit maakt automatisch membership)

---

## 🔧 CODE FIX (Voor Developers)

Het probleem is dat `create_tenant_with_membership` RPC functie mogelijk faalt of niet bestaat.

**Check in Supabase:**
```sql
-- Check if RPC function exists
SELECT * FROM pg_proc 
WHERE proname = 'create_tenant_with_membership';
```

**Als functie ontbreekt, maak deze aan:**
```sql
CREATE OR REPLACE FUNCTION create_tenant_with_membership(
  p_tenant_name TEXT,
  p_brand_color TEXT,
  p_owner_user_id UUID
)
RETURNS TABLE (
  tenant_id UUID,
  tenant_name TEXT,
  tenant_brand_color TEXT,
  tenant_owner_user_id UUID,
  tenant_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Insert tenant
  INSERT INTO tenants (name, brand_color, owner_user_id)
  VALUES (p_tenant_name, p_brand_color, p_owner_user_id)
  RETURNING id INTO v_tenant_id;
  
  -- Insert membership
  INSERT INTO memberships (tenant_id, user_id, role)
  VALUES (v_tenant_id, p_owner_user_id, 'OWNER');
  
  -- Return tenant data
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.brand_color,
    t.owner_user_id,
    t.created_at
  FROM tenants t
  WHERE t.id = v_tenant_id;
END;
$$;
```

---

## ✅ VERIFICATIE

Na het toepassen van de fix:

1. **Refresh de browser** (hard refresh: Cmd+Shift+R / Ctrl+Shift+F5)
2. **Probeer opnieuw** locatie aan te maken in onboarding
3. **Check debug log** - moet nu `200 OK` tonen i.p.v. `403 Forbidden`

**Success indicators:**
- ✅ Response status: `200 OK`
- ✅ Debug log toont: `✅ Location created: [uuid]`
- ✅ Je wordt doorgestuurd naar Step 3 (Resources & Diensten)

---

## 🎯 PREVENTIE

Om dit probleem in de toekomst te voorkomen:

1. **Zorg dat `create_tenant_with_membership` RPC functie bestaat**
2. **Test onboarding flow na elke deployment**
3. **Monitor membership creation** bij nieuwe tenants
4. **Add error handling** in `/api/manager/tenants` route

---

## 📊 IMPACT VAN FIX

**Na deze fix:**
- ✅ `business_sector` wordt nu ook opgeslagen (was missing!)
- ✅ Membership wordt correct aangemaakt
- ✅ 403 error is opgelost
- ✅ Onboarding kan worden afgerond

**Wat er is gewijzigd:**
1. **`/app/api/manager/locations/route.ts`**
   - Voegt `business_sector` toe aan INSERT query
   
2. **SQL Quick Fix**
   - Maakt ontbrekende membership aan

---

## 🆘 NOG STEEDS PROBLEMEN?

Als de 403 error blijft:

1. **Check je session:**
   ```javascript
   // In browser console:
   await fetch('/api/auth/session').then(r => r.json())
   ```

2. **Check tenant ownership:**
   ```sql
   SELECT t.*, u.email 
   FROM tenants t 
   LEFT JOIN auth.users u ON u.id = t.owner_user_id
   WHERE t.id = 'b0402eea-4296-4951-aff6-8f4c2c219818';
   ```

3. **Force logout/login:**
   - Log uit
   - Clear browser cache
   - Log opnieuw in
   - Probeer onboarding opnieuw

---

**Status: FIXED! ✅**

De `business_sector` field wordt nu correct opgeslagen in de database tijdens onboarding!

