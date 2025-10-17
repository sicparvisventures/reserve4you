# 🚨 FIX ENUM ERROR - STAP VOOR STAP

## ❌ ERROR:
```
ERROR: unsafe use of new value "STARTER" of enum type billing_plan
HINT: New enum values must be committed before they can be used.
```

## ✅ OPLOSSING:

PostgreSQL vereist dat nieuwe enum values worden gecommit voordat je ze kan gebruiken.
**Je moet dit in 2 stappen doen:**

---

## 📋 **STAP 1: Voeg Enum Values Toe**

Run dit in **Supabase SQL Editor**:

```sql
-- Add all new enum values
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'billing_plan') AND enumlabel = 'FREE') THEN
        ALTER TYPE billing_plan ADD VALUE 'FREE';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'billing_plan') AND enumlabel = 'STARTER') THEN
        ALTER TYPE billing_plan ADD VALUE 'STARTER';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'billing_plan') AND enumlabel = 'GROWTH') THEN
        ALTER TYPE billing_plan ADD VALUE 'GROWTH';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'billing_plan') AND enumlabel = 'BUSINESS') THEN
        ALTER TYPE billing_plan ADD VALUE 'BUSINESS';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'billing_plan') AND enumlabel = 'PREMIUM') THEN
        ALTER TYPE billing_plan ADD VALUE 'PREMIUM';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'billing_plan') AND enumlabel = 'ENTERPRISE') THEN
        ALTER TYPE billing_plan ADD VALUE 'ENTERPRISE';
    END IF;
END $$;
```

**✅ Klik RUN en wacht op "Success"**

---

## 📋 **STAP 2: Update Billing States**

**NU** run dit (nieuwe query):

```sql
-- Migrate old plans
UPDATE billing_state SET plan = 'STARTER'::billing_plan WHERE plan::text = 'START';
UPDATE billing_state SET plan = 'GROWTH'::billing_plan WHERE plan::text = 'PRO';
UPDATE billing_state SET plan = 'PREMIUM'::billing_plan WHERE plan::text = 'PLUS';

-- Set all to TRIALING
UPDATE billing_state
SET 
    status = 'TRIALING'::billing_status,
    trial_end = CASE 
        WHEN trial_end IS NULL OR trial_end < NOW() 
        THEN NOW() + INTERVAL '14 days'
        ELSE trial_end
    END,
    max_locations = CASE plan::text
        WHEN 'FREE' THEN 1
        WHEN 'STARTER' THEN 1
        WHEN 'GROWTH' THEN 3
        WHEN 'BUSINESS' THEN 5
        WHEN 'PREMIUM' THEN 999999
        WHEN 'ENTERPRISE' THEN 999999
        ELSE max_locations
    END,
    max_bookings_per_month = CASE plan::text
        WHEN 'FREE' THEN 50
        WHEN 'STARTER' THEN 200
        WHEN 'GROWTH' THEN 1000
        WHEN 'BUSINESS' THEN 3000
        WHEN 'PREMIUM' THEN 999999
        WHEN 'ENTERPRISE' THEN 999999
        ELSE max_bookings_per_month
    END;

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

-- Show results
SELECT 
    t.name AS tenant_name,
    bs.plan::text AS plan,
    bs.status::text AS status,
    bs.trial_end,
    bs.max_locations
FROM tenants t
LEFT JOIN billing_state bs ON t.id = bs.tenant_id
ORDER BY t.created_at;
```

**✅ Klik RUN en check de results**

---

## 📋 **STAP 3: Restart Dev Server**

```bash
# Stop (Ctrl+C)
npm run dev
```

---

## 📋 **STAP 4: Test Onboarding**

```
http://localhost:3007/manager/f327645c-a658-41f2-853a-215cce39196a/settings?step=2
```

**Should work now!** ✅

---

## 🎯 **ALTERNATIVE: Run Safe Script**

Of gebruik het nieuwe script dat dit automatisch doet:

```sql
-- File: FIX_BILLING_SAFE.sql
-- Deze doet alles in de juiste volgorde!
```

---

## ✅ **CHECKLIST:**

```
☐ 1. Run STAP 1 SQL (add enum values)
☐ 2. Wait for success
☐ 3. Run STAP 2 SQL (update billing)  
☐ 4. Check results table
☐ 5. Restart dev server
☐ 6. Test onboarding
☐ 7. Done! 🎉
```

---

## 🔍 **WHY 2 STEPS?**

PostgreSQL requires enum values to be **committed** before use.

**Wrong (your error):**
```sql
ALTER TYPE billing_plan ADD VALUE 'STARTER';  -- Add value
UPDATE ... SET plan = 'STARTER'...            -- ❌ Can't use yet!
```

**Right (this fix):**
```sql
-- Step 1: Add values
ALTER TYPE billing_plan ADD VALUE 'STARTER';  -- Add value
-- [Commit happens here in Supabase]

-- Step 2: Use values
UPDATE ... SET plan = 'STARTER'...            -- ✅ Now it works!
```

---

## 🎉 **READY!**

After these 2 SQL runs:
- ✅ Enum values exist
- ✅ Billing states fixed
- ✅ All tenants TRIALING
- ✅ Onboarding works

**Go fix it now!** 🚀

