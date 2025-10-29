# ✅ Fix: Abonnement Upgrade Error

## 🐛 Het Probleem

Wanneer je in `/profile` → **Abonnementen** probeert te upgraden krijg je:

```
Fout bij upgraden: Failed to update billing state: 
new row violates row-level security policy for table "billing_state"
```

---

## 🔍 Oorzaak

**RLS Policy Probleem:**
- De `billing_state` tabel heeft RLS (Row-Level Security) enabled
- Er is een **UPDATE** policy voor owners
- Er is **GEEN INSERT** policy voor owners
- Wanneer een upgrade een nieuwe billing record probeert aan te maken (upsert), faalt de INSERT

**Flow:**
```
1. User klikt "Upgrade naar Plus" in /profile
2. API roept aan: POST /api/profile/upgrade-checkout
3. Code probeert: supabase.from('billing_state').upsert(...)
4. Upsert probeert nieuwe row te inserteren
5. ❌ INSERT policy ontbreekt → RLS blokkeert
6. Error: "new row violates row-level security policy"
```

---

## ✅ Oplossing

### Stap 1: Run SQL Fix Script

**Open Supabase SQL Editor:**

1. Ga naar: https://supabase.com/dashboard
2. Selecteer je project
3. Klik op **SQL Editor** (links in menu)
4. Klik op **New Query**
5. Kopieer de inhoud van: **`FIX_BILLING_RLS_POLICY.sql`**
6. Plak in de editor
7. Klik op **Run** (of druk Cmd/Ctrl+Enter)

**Verwacht output:**
```sql
✅ Billing State RLS Policies Fixed!

Created policies:
  1. SELECT: Users can view billing for their tenants
  2. INSERT: Owners can create billing records
  3. UPDATE: Owners can update billing records
  4. ALL: Service role has full access

✅ Profile subscription upgrades should now work!
```

---

## 🧪 Test Na Fix

### Test 1: Basic Upgrade Flow

1. Ga naar: `http://localhost:3007/profile`
2. Klik op tab: **Abonnementen**
3. Kies een restaurant/tenant
4. Klik op: **"Upgrade naar Plus"** (of Start/Pro)
5. **Verwacht:**
   - ✅ Redirect naar Stripe Checkout
   - ✅ Na betaling: success melding
   - ✅ Plan is geüpdatet in profile

### Test 2: Verify Database

In Supabase SQL Editor:
```sql
-- Check billing_state policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd, 
  roles
FROM pg_policies 
WHERE tablename = 'billing_state'
ORDER BY policyname;

-- Should show 4 policies:
-- 1. "Owners can insert billing for their tenants" - INSERT
-- 2. "Owners can update billing for their tenants" - UPDATE  
-- 3. "Users can view billing for their tenants" - SELECT
-- 4. "Service role has full access to billing_state" - ALL
```

### Test 3: Check Your Billing Records

```sql
-- View your billing records
SELECT 
  b.id,
  b.tenant_id,
  t.name as tenant_name,
  b.plan,
  b.status,
  b.created_at,
  b.updated_at
FROM billing_state b
JOIN tenants t ON t.id = b.tenant_id
WHERE b.tenant_id IN (
  SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
)
ORDER BY b.updated_at DESC;
```

---

## 🔐 RLS Policies Uitleg

### Nieuwe Policies

**1. SELECT (View):**
```sql
Users can view billing for their tenants
→ Alle members kunnen billing info zien
```

**2. INSERT (Create):**
```sql
Owners can insert billing for their tenants
→ Alleen OWNERS kunnen nieuwe billing records aanmaken
→ DEZE POLICY WAS MISSING ← Dit was het probleem!
```

**3. UPDATE (Modify):**
```sql
Owners can update billing for their tenants
→ Alleen OWNERS kunnen billing info updaten
```

**4. ALL (Service Role):**
```sql
Service role has full access
→ Voor webhooks en internal operations
```

---

## 🎯 Waarom Dit Werkt

### Voor de Fix:
```typescript
// In upgrade-checkout route.ts
await supabase.from('billing_state').upsert({
  tenant_id: tenantId,
  plan: 'PLUS',
  // ...
})

// Flow:
1. Check if record exists → NO
2. Try INSERT → ❌ No INSERT policy → RLS blocks
3. Error thrown
```

### Na de Fix:
```typescript
// Same code
await supabase.from('billing_state').upsert({
  tenant_id: tenantId,
  plan: 'PLUS',
  // ...
})

// Flow:
1. Check if record exists → NO
2. Try INSERT → ✅ INSERT policy allows (user is OWNER)
3. Success! New billing record created
```

---

## 📋 Checklist

- [ ] SQL script gerund in Supabase
- [ ] Success message gezien (groene vinkjes)
- [ ] 4 policies geïnstalleerd (check via pg_policies)
- [ ] Profile subscription tab getest
- [ ] Upgrade naar Plus werkt
- [ ] Geen RLS error meer

---

## 🚨 Als Het NOG STEEDS Niet Werkt

### Check 1: Verify User is OWNER

```sql
-- Check je membership role
SELECT 
  m.user_id,
  m.tenant_id,
  m.role,
  t.name as tenant_name
FROM memberships m
JOIN tenants t ON t.id = m.tenant_id
WHERE m.user_id = auth.uid();

-- Je role moet 'OWNER' zijn, niet 'MEMBER' of 'ADMIN'
```

### Check 2: Verify Policies Exist

```sql
-- Should return 4 rows
SELECT COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'billing_state';

-- If less than 4 → run SQL script again
```

### Check 3: Check Browser Console

Open DevTools (F12) en kijk naar:
- Network tab → API calls
- Console tab → Error messages

Kopieer exacte error en deel met mij.

---

## 📝 Samenvatting

| Component | Voor Fix | Na Fix |
|-----------|----------|--------|
| **SELECT Policy** | ✅ Exists | ✅ Exists |
| **INSERT Policy** | ❌ Missing | ✅ Created |
| **UPDATE Policy** | ✅ Exists | ✅ Exists |
| **Service Policy** | ✅ Exists | ✅ Exists |
| **Upgrade Works** | ❌ RLS Error | ✅ Success |

---

## ✅ Klaar!

Na het runnen van `FIX_BILLING_RLS_POLICY.sql` zou je:
- ✅ Kunnen upgraden naar Plus/Pro/Start
- ✅ Geen RLS errors meer krijgen
- ✅ Billing state correct kunnen aanmaken/updaten

**Test het nu in je profile → Abonnementen tab!** 🚀

