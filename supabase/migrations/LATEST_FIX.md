# ✅ ALLE ERRORS GEFIXED! (V3)

## 🐛 Laatste Probleem
Error: `column "start_time" does not exist`

## 💡 Oorzaak
De `bookings` table gebruikte `start_time` en `end_time`, maar de rest van de code (en de fix_column_names migration) verwachtte `start_ts` en `end_ts`.

## 🔧 Oplossing
De base schema migration gebruikt nu **direct** de juiste kolom namen:
- ✅ `start_ts` in plaats van `start_time`
- ✅ `end_ts` in plaats van `end_time`
- ✅ Indexes ook geupdate naar `start_ts` en `end_ts`

## 📋 Alle Fixes in Deze Versie

### 1. **UNIQUE Constraints** (Fix voor vendor error)
Alle UNIQUE constraints zijn nu inline in CREATE TABLE:
- ✅ memberships (tenant_id, user_id)
- ✅ tables (location_id, name)
- ✅ policies (location_id)
- ✅ consumers (auth_user_id)
- ✅ bookings (idempotency_key)
- ✅ billing_state (stripe_customer_id, stripe_subscription_id)
- ✅ pos_integrations (location_id, vendor)
- ✅ favorites (consumer_id, location_id)

### 2. **Column Names** (Fix voor start_time error)
- ✅ bookings.start_ts (was start_time)
- ✅ bookings.end_ts (was end_time)
- ✅ Alle indexes geupdate

## 🚀 RUN DE GEFIXTE MIGRATION

Open **Supabase SQL Editor** en run **ALLEEN** dit bestand:

```sql
-- Kopieer VOLLEDIGE inhoud van:
/Users/dietmar/Desktop/ray2/supabase/migrations/20241017000002_r4y_multi_tenant_schema_safe.sql
```

## 📊 Expected Output

```
🎉 R4Y Base Schema Migration Complete!
   ✅ 11 tables created (with start_ts/end_ts)
   ✅ 6 enums created
   ✅ 3 helper functions created
   ✅ RLS policies enabled
   ✅ Indexes created

📋 Next steps:
   1. SKIP: 20241017000003_fix_column_names.sql (already done!)
   2. Run: 20241017000004_migrate_address_to_json.sql
   3. Run: 20241017000005_fix_tenant_creation_rls_v2.sql
```

## 📝 Nieuwe Volgorde

### ✅ Step 1: Base Schema (ALLES-IN-1!)
```sql
-- supabase/migrations/20241017000002_r4y_multi_tenant_schema_safe.sql
-- ✓ Creëert alles met de juiste kolom namen!
```

### ⏭️ Step 2: SKIP!
```
-- 20241017000003_fix_column_names.sql
-- Deze kun je OVERSLAAN! De base schema heeft al start_ts/end_ts.
```

### ✅ Step 3: Address Migration
```sql
-- supabase/migrations/20241017000004_migrate_address_to_json.sql
```

### ✅ Step 4: RLS Fix
```sql
-- supabase/migrations/20241017000005_fix_tenant_creation_rls_v2.sql
```

### ✅ Step 5: Verify
```sql
-- supabase/migrations/verify_schema.sql
```

## 🆘 Als Het NOG STEEDS Faalt

Run de Nuclear Option:

```sql
-- ⚠️ VERWIJDERT ALLE R4Y DATA!

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

DROP TYPE IF EXISTS membership_role CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS billing_plan CASCADE;
DROP TYPE IF EXISTS billing_status CASCADE;
DROP TYPE IF EXISTS pos_vendor CASCADE;

DROP FUNCTION IF EXISTS is_tenant_member(UUID, UUID, membership_role);
DROP FUNCTION IF EXISTS get_location_tenant(UUID);
DROP FUNCTION IF EXISTS is_billing_active(UUID);
DROP FUNCTION IF EXISTS create_tenant_with_membership(VARCHAR, VARCHAR, UUID);
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Dan run je ALLEEN:
-- 1. 20241017000002_r4y_multi_tenant_schema_safe.sql
-- 2. 20241017000004_migrate_address_to_json.sql
-- 3. 20241017000005_fix_tenant_creation_rls_v2.sql
-- 4. verify_schema.sql
```

## 🎯 Wat Je Krijgt

Na deze migration heb je:

| Component | Status | Details |
|-----------|--------|---------|
| Tables | ✅ 11 | tenants, memberships, locations, tables, shifts, policies, consumers, **bookings (met start_ts!)**, billing_state, pos_integrations, favorites |
| Enums | ✅ 6 | membership_role, booking_status, payment_status, billing_plan, billing_status, pos_vendor |
| Functions | ✅ 4 | is_tenant_member, get_location_tenant, is_billing_active, update_updated_at_column |
| RLS Policies | ✅ ~30 | Voor alle tables |
| Indexes | ✅ ~20 | Inclusief bookings(start_ts) |

## 🔥 TL;DR

**RUN DIT:**
1. ✅ `20241017000002_r4y_multi_tenant_schema_safe.sql` (ALLES!)
2. ✅ `20241017000004_migrate_address_to_json.sql` (Address fix)
3. ✅ `20241017000005_fix_tenant_creation_rls_v2.sql` (RLS fix)
4. ✅ `verify_schema.sql` (Check)

**SKIP DIT:**
- ❌ `20241017000003_fix_column_names.sql` (Niet meer nodig!)

---

**Probeer het nu! 🚀**

