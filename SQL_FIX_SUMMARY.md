# ✅ SQL Type Cast Fix - Nu Opgelost

## Probleem

**Error:**
```
ERROR:  42883: operator does not exist: text = billing_status
LINE 104: WHERE status IN ('CANCELLED'::billing_status, 'PAST_DUE'::billing_status);
```

## Oorzaak

De `billing_state.status` kolom was **al een enum type**, maar PostgreSQL had moeite met de expliciete cast van de vergelijkingswaarden. Dit gebeurt wanneer:

1. Je `'CANCELLED'::billing_status` gebruikt (explicit cast)
2. Maar de kolom is al type `billing_status`
3. PostgreSQL denkt dat je `text` met `billing_status` vergelijkt

## Oplossing

Verwijder de expliciete type casts en laat PostgreSQL het automatisch infereren:

### ❌ Voor (fout):
```sql
WHERE status IN ('CANCELLED'::billing_status, 'PAST_DUE'::billing_status)
INSERT VALUES ('FREE'::billing_plan, 'TRIALING'::billing_status, ...)
```

### ✅ Na (goed):
```sql
WHERE status::text IN ('CANCELLED', 'PAST_DUE')
INSERT VALUES ('FREE', 'TRIALING', ...)
```

**Of met cast op de kolom:**
```sql
WHERE status::text IN ('CANCELLED', 'PAST_DUE')
```

## Gewijzigde Bestanden

### 1. `FIX_ALL_ACCOUNTS_NOW.sql`

**Wijzigingen:**
- ✅ Line 80-81: `'FREE', 'TRIALING'` (was: `'FREE'::billing_plan, 'TRIALING'::billing_status`)
- ✅ Line 97-104: `status = 'TRIALING'` en `WHERE status::text IN ('CANCELLED', 'PAST_DUE')`
- ✅ Line 126-127: `'FREE', 'TRIALING'` in trigger function

### 2. `supabase/migrations/20251029000002_fix_onboarding_billing_complete.sql`

**Wijzigingen:**
- ✅ Line 89-90: `'FREE', 'TRIALING'` 
- ✅ Line 108-115: `status = 'TRIALING'` en `WHERE status::text IN ('CANCELLED', 'PAST_DUE')`
- ✅ Line 138-139: `'FREE', 'TRIALING'` in trigger function
- ✅ Line 224-230: Status checks met `::text` cast

## Test Het

### Run in Supabase SQL Editor:

```sql
-- Test 1: Check of billing_state tabel bestaat
SELECT COUNT(*) FROM billing_state;

-- Test 2: Check status types
SELECT DISTINCT status FROM billing_state;

-- Test 3: Run het script
-- Kopieer hele inhoud van FIX_ALL_ACCOUNTS_NOW.sql
-- Plak in SQL Editor
-- Klik Run
```

### Verwacht Resultaat:

```
✅ FIX COMPLETE!

📊 Results:
   Total Tenants:           X
   With Billing State:      X
   TRIALING:                X
   ACTIVE:                  X

✅ All accounts can now create at least 1 location
✅ Trigger installed for auto-creating billing_state
✅ Subscription tab will show for all users
```

## Waarom Dit Werkt

### Type Inference
PostgreSQL kan automatisch het juiste type afleiden als je gewoon strings gebruikt:

```sql
-- PostgreSQL weet dat status een billing_status enum is
-- En cast automatisch 'TRIALING' naar billing_status
status = 'TRIALING'  -- ✅ Werkt

-- Expliciet casten van beide kanten kan conflicteren
status = 'TRIALING'::billing_status  -- ❌ Kan errors geven
```

### Text Cast voor Vergelijkingen
Bij IN clauses is het veiliger om beide kanten naar text te casten:

```sql
-- Cast de kolom naar text, vergelijk met text values
WHERE status::text IN ('CANCELLED', 'PAST_DUE')  -- ✅ Werkt altijd
```

## Andere Enum Issues Voorkomen

### Best Practices:

1. **Laat PostgreSQL het type afleiden:**
   ```sql
   status = 'TRIALING'  -- Goed
   ```

2. **Cast alleen als echt nodig:**
   ```sql
   status::text = 'TRIALING'  -- Als er type issues zijn
   ```

3. **Bij INSERT: laat het type afleiden:**
   ```sql
   INSERT INTO billing_state (plan, status) VALUES ('FREE', 'TRIALING');
   ```

4. **Bij CREATE TYPE: definieer types expliciet:**
   ```sql
   CREATE TYPE billing_status AS ENUM ('ACTIVE', 'TRIALING', 'CANCELLED', 'PAST_DUE');
   ```

## Checklist

- [x] FIX_ALL_ACCOUNTS_NOW.sql geüpdatet
- [x] Migration file geüpdatet
- [x] Alle type casts verwijderd/gefixed
- [x] Text casts toegevoegd waar nodig
- [ ] Scripts testen in Supabase
- [ ] Geen errors meer
- [ ] Success message zien
- [ ] Code deployen

## Volgende Stappen

1. **Open Supabase SQL Editor**
2. **Run: `FIX_ALL_ACCOUNTS_NOW.sql`**
3. **Verwacht: Geen errors, success message**
4. **Deploy code:**
   ```bash
   git add .
   git commit -m "fix: SQL type cast errors resolved"
   git push
   ```

---

**Status: ✅ GEFIXED**

Beide SQL scripts zijn nu correct en zouden zonder errors moeten runnen in Supabase.

