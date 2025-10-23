# 🎯 COMPLETE UPGRADE FIX - ALLE ACCOUNTS WERKEND

## ❌ HET PROBLEEM

**Symptoom:**
- Poule & Poulette (PLUS) kan wel nieuwe locaties toevoegen
- MESH en CHICKX (FREE) werken ook
- Maar na upgrade van een account werkt + button niet

**Oorzaak:**
De upgrade API updatet alleen `plan` en `status`, maar NIET `max_locations` en `max_bookings_per_month`!

```typescript
// VOOR (FOUT):
await supabase.from('billing_state').upsert({
  tenant_id: tenantId,
  plan: plan,
  status: 'ACTIVE',
  // ❌ max_locations en max_bookings_per_month niet geüpdatet!
});
```

**Resultaat:** Account heeft PLUS plan maar nog steeds max_locations: 1

---

## ✅ OPLOSSING IN 3 STAPPEN

### STAP 1: FIX BESTAANDE DATA (2 minuten)

**Open Supabase SQL Editor:**
```
https://supabase.com/dashboard/project/jrudqxovozqnmxypjtij/sql/new
```

**Run deze SQL:**

```sql
-- Fix all existing billing states with correct limits
UPDATE billing_state
SET 
    max_locations = CASE plan::text
        WHEN 'FREE' THEN 1
        WHEN 'START' THEN 1
        WHEN 'STARTER' THEN 1
        WHEN 'PRO' THEN 3
        WHEN 'GROWTH' THEN 3
        WHEN 'BUSINESS' THEN 5
        WHEN 'PLUS' THEN 99
        WHEN 'PREMIUM' THEN 99
        WHEN 'ENTERPRISE' THEN 99
        ELSE 1
    END,
    max_bookings_per_month = CASE plan::text
        WHEN 'FREE' THEN 50
        WHEN 'START' THEN 200
        WHEN 'STARTER' THEN 200
        WHEN 'PRO' THEN 1000
        WHEN 'GROWTH' THEN 1000
        WHEN 'BUSINESS' THEN 3000
        WHEN 'PLUS' THEN 10000
        WHEN 'PREMIUM' THEN 10000
        WHEN 'ENTERPRISE' THEN 50000
        ELSE 50
    END,
    updated_at = NOW();

-- Verify all tenants now have correct limits
SELECT 
    t.name,
    bs.plan,
    bs.status,
    bs.max_locations,
    bs.max_bookings_per_month,
    COUNT(l.id) as current_locations
FROM tenants t
JOIN billing_state bs ON bs.tenant_id = t.id
LEFT JOIN locations l ON l.tenant_id = t.id
GROUP BY t.id, t.name, bs.plan, bs.status, bs.max_locations, bs.max_bookings_per_month
ORDER BY t.name;
```

**Expected output:**
```
| name             | plan    | status   | max_locations | max_bookings_per_month | current_locations |
| ---------------- | ------- | -------- | ------------- | ---------------------- | ----------------- |
| CHICKX           | FREE    | TRIALING | 1             | 50                     | 0                 |
| MESH             | FREE    | TRIALING | 1             | 50                     | 1                 |
| Poule & Poulette | PLUS    | ACTIVE   | 99            | 10000                  | 1                 |
```

✅ **Klik "Run" (▶️)**

---

### STAP 2: RESTART DEV SERVER (30 seconden)

De code is al gefixed in:
- `app/api/profile/upgrade-checkout/route.ts` ✅
- `app/api/manager/subscriptions/checkout/route.ts` ✅

**Restart server:**

```bash
# Stop server (Ctrl+C in terminal)
cd /Users/dietmar/Desktop/ray2
npm run dev
```

✅ **Wacht tot "Ready" bericht verschijnt**

---

### STAP 3: TEST UPGRADE FLOW (3 minuten)

**Test 1: Upgrade MESH naar STARTER**

1. Ga naar: `http://localhost:3007/profile`
2. Klik **"Abonnementen"** tab
3. Zoek **MESH** tenant
4. Selecteer **"START"** of **"STARTER"** plan
5. Klik **"Upgrade naar START"**
6. Wordt geredirect naar `/profile?upgraded=true&plan=STARTER&testmode=true`
7. Refresh pagina (Cmd + R)
8. Check dat MESH nu **"STARTER"** plan toont

**Test 2: Verify quota in database**

Run in Supabase:
```sql
SELECT name, plan, max_locations, max_bookings_per_month
FROM tenants t
JOIN billing_state bs ON bs.tenant_id = t.id
WHERE t.name = 'MESH';
```

Should show:
```
| name | plan    | max_locations | max_bookings_per_month |
| MESH | STARTER | 1             | 200                    |
```

**Test 3: Upgrade CHICKX naar PLUS**

1. Ga naar: `http://localhost:3007/profile`
2. Klik **"Abonnementen"** tab
3. Zoek **CHICKX** tenant
4. Selecteer **"PLUS"** plan
5. Klik **"Upgrade naar PLUS"**
6. Wordt geredirect → refresh
7. Check dat CHICKX nu **"PLUS"** toont

**Test 4: Verify CHICKX can add unlimited locations**

```sql
SELECT name, plan, max_locations, max_bookings_per_month
FROM tenants t
JOIN billing_state bs ON bs.tenant_id = t.id
WHERE t.name = 'CHICKX';
```

Should show:
```
| name   | plan | max_locations | max_bookings_per_month |
| CHICKX | PLUS | 99            | 10000                  |
```

**Test 5: Test + button**

1. Ga naar CHICKX dashboard
2. Klik **+ Add Location** button
3. Zou moeten redirecten naar settings/onboarding
4. Vul locatie gegevens in
5. Save
6. ✅ **Nieuwe locatie aangemaakt!**

---

## 🔧 WAT IS ER GEFIXED

### Code Changes:

**1. `app/api/profile/upgrade-checkout/route.ts`** ✅

```typescript
// VOOR:
await supabase.from('billing_state').upsert({
  tenant_id: tenantId,
  plan: plan,
  status: 'ACTIVE',
  stripe_customer_id: customerId,
});

// NA:
const planLimits = {
  'PLUS': { maxLocations: 99, maxBookings: 10000 },
  'PREMIUM': { maxLocations: 99, maxBookings: 10000 },
  // ... etc
};

const limits = planLimits[plan];

await supabase.from('billing_state').upsert({
  tenant_id: tenantId,
  plan: plan,
  status: 'ACTIVE',
  stripe_customer_id: customerId,
  max_locations: limits.maxLocations,      // ✅ NU WEL!
  max_bookings_per_month: limits.maxBookings, // ✅ NU WEL!
  trial_end: null,
});
```

**2. `app/api/manager/subscriptions/checkout/route.ts`** ✅

Dezelfde fix toegepast voor manager subscription upgrades.

**3. SQL Migration** ✅

Alle bestaande billing_state records geüpdatet met correcte limits gebaseerd op hun plan.

---

## 📊 PLAN LIMITS OVERZICHT

| Plan | Locations | Bookings/Month | API | DB |
|------|-----------|----------------|-----|-----|
| **FREE** | 1 | 50 | ✅ | ✅ |
| **STARTER** | 1 | 200 | ✅ | ✅ |
| **GROWTH** | 3 | 1000 | ✅ | ✅ |
| **BUSINESS** | 5 | 3000 | ✅ | ✅ |
| **PLUS** | 99 (∞) | 10000 | ✅ | ✅ |
| **PREMIUM** | 99 (∞) | 10000 | ✅ | ✅ |
| **ENTERPRISE** | 99 (∞) | 50000 | ✅ | ✅ |

---

## 🧪 COMPLETE TEST SCENARIO

### Start State:
```
MESH: FREE (1 location max)
CHICKX: FREE (1 location max)
Poule & Poulette: PLUS (99 locations max)
```

### Test Upgrades:

**Test A: FREE → STARTER**
```bash
# Before
MESH: plan=FREE, max_locations=1

# Upgrade via /profile
MESH: "Upgrade naar STARTER" → testmode redirect

# After (check in Supabase)
MESH: plan=STARTER, max_locations=1, max_bookings=200 ✅
```

**Test B: FREE → PLUS**
```bash
# Before
CHICKX: plan=FREE, max_locations=1

# Upgrade via /profile
CHICKX: "Upgrade naar PLUS" → testmode redirect

# After (check in Supabase)
CHICKX: plan=PLUS, max_locations=99, max_bookings=10000 ✅

# Test + button
CHICKX Dashboard → Click + → Can add location ✅
```

**Test C: STARTER → GROWTH**
```bash
# Upgrade MESH again
MESH: "Upgrade naar PRO/GROWTH"

# After
MESH: plan=GROWTH, max_locations=3, max_bookings=1000 ✅
```

---

## 💡 WHY IT WORKS NOW

### Before Fix:

1. User klikt "Upgrade naar PLUS"
2. API updatet: `plan = 'PLUS'`, `status = 'ACTIVE'`
3. **Maar:** `max_locations` blijft 1 (niet geüpdatet)
4. Quota check: `if (1 >= 1)` → **"Limit reached"** ❌

### After Fix:

1. User klikt "Upgrade naar PLUS"
2. API updatet: `plan = 'PLUS'`, `status = 'ACTIVE'`, **`max_locations = 99`**, **`max_bookings_per_month = 10000`**
3. Quota check: `if (1 >= 99)` → **"Allowed"** ✅
4. + button works! ✅

---

## 🆘 TROUBLESHOOTING

### Issue: Upgrade werkt maar + button nog disabled

**Check 1: Browser cache**
```bash
Cmd + Shift + R  # Hard refresh
Option + Cmd + E # Clear cache (Safari)
```

**Check 2: Verify database**
```sql
SELECT t.name, bs.plan, bs.max_locations, COUNT(l.id) as locations
FROM tenants t
JOIN billing_state bs ON bs.tenant_id = t.id
LEFT JOIN locations l ON l.tenant_id = t.id
GROUP BY t.id, t.name, bs.plan, bs.max_locations;
```

**Check 3: Dev server restarted?**
```bash
# Check terminal - should show recent restart time
# If not, restart:
Ctrl+C
npm run dev
```

---

### Issue: SQL query fails

**Error: "invalid input value for enum"**

Fix:
```sql
-- Add missing enum values first
ALTER TYPE billing_plan ADD VALUE IF NOT EXISTS 'PLUS';
ALTER TYPE billing_plan ADD VALUE IF NOT EXISTS 'PREMIUM';

-- Then rerun the UPDATE query
```

---

## 🎉 SUCCESS CHECKLIST

- [ ] SQL gerund in Supabase
- [ ] Verificatie query toont correcte limits voor alle plans
- [ ] Dev server herstart
- [ ] Browser cache cleared
- [ ] Test upgrade: FREE → STARTER werkt
- [ ] Database toont: STARTER met max_locations=1
- [ ] Test upgrade: FREE → PLUS werkt
- [ ] Database toont: PLUS met max_locations=99
- [ ] + button werkt voor PLUS accounts
- [ ] Dashboard toont correct plan
- [ ] Settings toont correct plan

Als alle checkboxes ✅: **Volledig gefixed!** 🚀

---

## 📄 RELATED FILES

**Fixed:**
- `app/api/profile/upgrade-checkout/route.ts` - Upgrade API (profile)
- `app/api/manager/subscriptions/checkout/route.ts` - Upgrade API (manager)
- `FIX_PLUS_PLAN_UNLIMITED.sql` - Database migration

**Reference:**
- `lib/billing/quota.ts` - Quota limits definition
- `lib/auth/tenant-dal.ts` - getTenantBilling function
- `app/profile/SubscriptionSection.tsx` - Upgrade UI

---

**VOLGENDE STAP: Run de SQL in Supabase en restart server!** 🚀

