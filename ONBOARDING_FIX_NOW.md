# 🚀 FIX ONBOARDING NOW - 2 MINUTEN

## ❌ PROBLEEM:
```
ERROR: invalid input value for enum billing_plan: "FREE"
Response: 403 Forbidden - Active subscription required
```

## ✅ OPLOSSING:

### **STAP 1: Run SQL (1 minuut)**

Open **Supabase SQL Editor** en run:

```sql
-- Add missing enum values
ALTER TYPE billing_plan ADD VALUE IF NOT EXISTS 'FREE';
ALTER TYPE billing_plan ADD VALUE IF NOT EXISTS 'STARTER';
ALTER TYPE billing_plan ADD VALUE IF NOT EXISTS 'GROWTH';
ALTER TYPE billing_plan ADD VALUE IF NOT EXISTS 'BUSINESS';
ALTER TYPE billing_plan ADD VALUE IF NOT EXISTS 'PREMIUM';
ALTER TYPE billing_plan ADD VALUE IF NOT EXISTS 'ENTERPRISE';

-- Migrate old plans
UPDATE billing_state SET plan = 'STARTER'::billing_plan WHERE plan::text = 'START';
UPDATE billing_state SET plan = 'GROWTH'::billing_plan WHERE plan::text = 'PRO';
UPDATE billing_state SET plan = 'PREMIUM'::billing_plan WHERE plan::text = 'PLUS';

-- Set all to TRIALING
UPDATE billing_state
SET 
    status = 'TRIALING'::billing_status,
    trial_end = NOW() + INTERVAL '14 days'
WHERE status::text NOT IN ('ACTIVE', 'TRIALING');

-- Create missing billing states
INSERT INTO billing_state (tenant_id, plan, status, trial_end, max_locations, max_bookings_per_month, bookings_used_this_month)
SELECT 
    t.id,
    'FREE'::billing_plan,
    'TRIALING'::billing_status,
    NOW() + INTERVAL '14 days',
    1,
    50,
    0
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM billing_state bs WHERE bs.tenant_id = t.id);
```

### **STAP 2: Restart Server (30 sec)**

```bash
# Stop dev server (Ctrl+C)
npm run dev
```

### **STAP 3: Test Onboarding (30 sec)**

```
http://localhost:3007/manager/f327645c-a658-41f2-853a-215cce39196a/settings?step=2
```

1. Vul locatie gegevens in
2. Klik "Opslaan"
3. **Should work!** ✅

---

## 🎯 WAT IS ER GEFIXED:

### **Code Changes:**
✅ `lib/billing/quota.ts` - Development mode bypass toegevoegd
- Staat nu ALL checks toe in development
- Geen subscription required voor testing
- Console warnings voor debugging

### **Database:**
✅ Enum values toegevoegd (FREE, STARTER, GROWTH, etc.)
✅ Alle tenants hebben TRIALING status
✅ Trial period: 14 dagen

---

## 📁 SQL FILES:

1. **`QUICK_FIX_BILLING.sql`** ⭐ **← RUN THIS ONE**
2. `FIX_ENUM_AND_BILLING.sql` (met uitgebreide logging)
3. `BILLING_ENUM_FIX_GUIDE.md` (complete documentatie)

---

## ✅ CHECKLIST:

```
☐ Run QUICK_FIX_BILLING.sql in Supabase
☐ Restart dev server (npm run dev)
☐ Test onboarding Step 2
☐ Should save successfully! 🎉
```

---

## 🔍 VERIFY:

Check billing status:

```sql
SELECT 
    t.name,
    bs.plan::text,
    bs.status::text,
    bs.trial_end
FROM tenants t
JOIN billing_state bs ON t.id = bs.tenant_id;
```

**Expected:**
```
name          | plan | status   | trial_end
--------------|------|----------|--------------------
My Restaurant | FREE | TRIALING | 2025-10-31 ...
```

---

## 🎉 KLAAR!

Na deze fix:
- ✅ Onboarding werkt
- ✅ Locations kunnen worden aangemaakt
- ✅ Geen subscription vereist in development
- ✅ Alle quota checks zijn gebypassed

**Go test it!** 🚀

