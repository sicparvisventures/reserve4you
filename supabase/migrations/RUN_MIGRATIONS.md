# 🚀 R4Y Database Migration Guide

## Quick Start - Run These in Order

Open Supabase SQL Editor en run deze migrations **IN DEZE VOLGORDE**:

### ✅ Step 1: Base Schema (MOST IMPORTANT!)
```sql
-- Kopieer en plak de VOLLEDIGE inhoud van:
-- supabase/migrations/20241017000002_r4y_multi_tenant_schema_safe.sql

-- Dit creëert:
-- ✓ 11 tables (tenants, memberships, locations, tables, shifts, policies, consumers, bookings, billing_state, pos_integrations, favorites)
-- ✓ 6 enums (membership_role, booking_status, payment_status, billing_plan, billing_status, pos_vendor)
-- ✓ 3 helper functions (is_tenant_member, get_location_tenant, is_billing_active)
-- ✓ All RLS policies
-- ✓ All indexes
```

**Expected output:**
```
🎉 R4Y Base Schema Migration Complete!
   ✅ 11 tables created
   ✅ 6 enums created
   ✅ 3 helper functions created
   ✅ RLS policies enabled
   ✅ Indexes created
```

---

### ✅ Step 2: Fix Column Names
```sql
-- Kopieer en plak de VOLLEDIGE inhoud van:
-- supabase/migrations/20241017000003_fix_column_names.sql

-- Dit doet:
-- ✓ Hernoemt bookings.start_time → start_ts
-- ✓ Hernoemt bookings.end_time → end_ts
```

**Expected output:**
```
✅ Column names fixed successfully
```

---

### ✅ Step 3: Migrate Address to JSON
```sql
-- Kopieer en plak de VOLLEDIGE inhoud van:
-- supabase/migrations/20241017000004_migrate_address_to_json.sql

-- Dit doet:
-- ✓ Creëert locations.address_json (JSONB column)
-- ✓ Migreert data van oude address columns
-- ✓ Drop oude columns (address_line1, city, postal_code)
-- ✓ Voegt opening_hours_json, slot_minutes, buffer_minutes toe
```

**Expected output:**
```
✅ Address migration complete
```

---

### ✅ Step 4: Fix RLS for Tenant Creation
```sql
-- Kopieer en plak de VOLLEDIGE inhoud van:
-- supabase/migrations/20241017000005_fix_tenant_creation_rls_v2.sql

-- Dit doet:
-- ✓ Creëert create_tenant_with_membership() function
-- ✓ Update RLS policies voor tenant creation
```

**Expected output:**
```
🎉 Tenant creation RLS fix complete!
   ✅ Function: create_tenant_with_membership
   ✅ Policy: Authenticated users can create tenants
   ✅ Policy: Users can create memberships
```

---

### ✅ Step 5: Verify Everything
```sql
-- Kopieer en plak de VOLLEDIGE inhoud van:
-- supabase/migrations/verify_schema.sql

-- Dit checkt of alles correct is
```

**Expected output:**
```
🎉 SUCCESS! All required database components are in place.
```

---

## 🔍 Troubleshooting

### Als je errors krijgt:

1. **"type already exists"**
   - Dit is OK! De migration is safe en skipt al bestaande types.

2. **"table already exists"**
   - Dit is OK! De migration is safe en skipt al bestaande tables.

3. **"column does not exist"**
   - Zorg dat je Step 1 (base schema) **als eerste** hebt gerund.
   - Run eventueel `diagnose_schema.sql` om te zien wat er mist.

4. **"function not found"**
   - Zorg dat je Step 1 (base schema) **als eerste** hebt gerund.
   - De helper functions worden daar gecreëerd.

---

## 🧹 Nuclear Option (Reset Everything)

**⚠️ WARNING: Dit VERWIJDERT ALLE DATA!**

Als je opnieuw wilt beginnen:

```sql
-- Drop all R4Y tables
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS pos_integrations CASCADE;
DROP TABLE IF EXISTS billing_state CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS consumers CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Drop all types
DROP TYPE IF EXISTS membership_role CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS billing_plan CASCADE;
DROP TYPE IF EXISTS billing_status CASCADE;
DROP TYPE IF EXISTS pos_vendor CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS is_tenant_member(UUID, UUID, membership_role);
DROP FUNCTION IF EXISTS get_location_tenant(UUID);
DROP FUNCTION IF EXISTS is_billing_active(UUID);
DROP FUNCTION IF EXISTS create_tenant_with_membership(VARCHAR, VARCHAR, UUID);

-- Now run all migrations from Step 1 again
```

---

## ✅ Quick Checklist

- [ ] Run diagnose_schema.sql (optional, to see current state)
- [ ] Run 20241017000002_r4y_multi_tenant_schema_safe.sql (BASE SCHEMA - REQUIRED!)
- [ ] Run 20241017000003_fix_column_names.sql
- [ ] Run 20241017000004_migrate_address_to_json.sql
- [ ] Run 20241017000005_fix_tenant_creation_rls_v2.sql
- [ ] Run verify_schema.sql (to confirm success)
- [ ] Test onboarding wizard at http://localhost:3007/manager/onboarding

---

## 🎯 Expected Final State

After all migrations, you should have:

| Component | Count | Status |
|-----------|-------|--------|
| Tables | 11 | ✅ |
| Enums | 6 | ✅ |
| Helper Functions | 4 | ✅ |
| RLS Policies | ~30 | ✅ |
| Indexes | ~20 | ✅ |

---

## 📞 Still Having Issues?

Run the diagnostic script:
```sql
-- supabase/migrations/diagnose_schema.sql
```

This will show you exactly what exists and what's missing!

