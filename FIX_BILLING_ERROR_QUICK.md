# 🔧 FIX BILLING STATE ERROR - 2 MINUTEN

## ❌ PROBLEEM

```
Error fetching billing state: {}
```

**Oorzaak:** De tenant heeft geen `billing_state` record in de database.

---

## ✅ OPLOSSING IN 2 STAPPEN

### STAP 1: RUN SQL IN SUPABASE (1 minuut)

**1. Open Supabase SQL Editor:**
```
https://supabase.com/dashboard/project/jrudqxovozqnmxypjtij/sql/new
```

**2. Plak en run deze SQL:**

```sql
-- Create billing_state for all tenants that don't have one
INSERT INTO billing_state (
    tenant_id, 
    plan, 
    status, 
    trial_end, 
    max_locations, 
    max_bookings_per_month, 
    bookings_used_this_month
)
SELECT 
    t.id,
    'FREE'::billing_plan,
    'TRIALING'::billing_status,
    NOW() + INTERVAL '14 days',
    1,
    50,
    0
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 
    FROM billing_state bs 
    WHERE bs.tenant_id = t.id
);
```

**3. Klik "Run" (▶️ knop)**

✅ **Dit creëert billing_state records voor alle tenants die deze missen**

---

### STAP 2: REFRESH DE PAGINA (10 sec)

**1. Ga terug naar:**
```
http://localhost:3007/manager/6110187b-80f7-466c-98cc-15895dcb286b/settings
```

**2. Refresh de pagina (Cmd + R)**

**3. Klik op "Abonnement" tab**

**4. ✅ Zou nu moeten werken!**

---

## 🧪 TEST

Je zou nu moeten zien:
```
Huidig Abonnement
━━━━━━━━━━━━━━━━
Plan: FREE
Status: TRIALING
Trial eindigt over 14 dagen
```

---

## 📋 WAT IS ER GEBEURD

### Waarom deze fout:

1. **Tenant werd gecreëerd** zonder billing_state
2. **Settings pagina** probeert billing info te laden
3. **billing_state ontbreekt** → error

### Wat de SQL doet:

1. **Zoekt alle tenants** zonder billing_state
2. **Creëert FREE trial** voor 14 dagen
3. **Sets limits:** 1 locatie, 50 bookings/maand

### Code fix:

De code is ook gefixed om te checken of billing null is:
- ✅ **Als billing bestaat:** Toont plan en status
- ✅ **Als billing null is:** Toont friendly error message

---

## 🔍 VERIFIEER IN DATABASE

Als je wilt checken of het werkt:

**Run in Supabase SQL Editor:**
```sql
SELECT 
    t.id,
    t.name,
    bs.plan,
    bs.status,
    bs.trial_end
FROM tenants t
LEFT JOIN billing_state bs ON bs.tenant_id = t.id
WHERE t.id = '6110187b-80f7-466c-98cc-15895dcb286b';
```

Zou moeten tonen:
```
id: 6110187b-80f7-466c-98cc-15895dcb286b
plan: FREE
status: TRIALING
trial_end: [datum over 14 dagen]
```

---

## 🆘 ALS HET NOG NIET WERKT

### Optie A: Run SQL voor specifieke tenant

```sql
INSERT INTO billing_state (
    tenant_id, 
    plan, 
    status, 
    trial_end, 
    max_locations, 
    max_bookings_per_month, 
    bookings_used_this_month
)
VALUES (
    '6110187b-80f7-466c-98cc-15895dcb286b',
    'FREE'::billing_plan,
    'TRIALING'::billing_status,
    NOW() + INTERVAL '14 days',
    1,
    50,
    0
)
ON CONFLICT (tenant_id) DO NOTHING;
```

### Optie B: Check enum types

Als je error krijgt over "invalid enum value":

```sql
-- Add missing enum values
ALTER TYPE billing_plan ADD VALUE IF NOT EXISTS 'FREE';
ALTER TYPE billing_status ADD VALUE IF NOT EXISTS 'TRIALING';
```

### Optie C: Restart dev server

```bash
# Stop server (Ctrl + C)
cd /Users/dietmar/Desktop/ray2
npm run dev
```

---

## 💡 WAAROM DIT GEBEURT

**Database schema evolutie:**

1. **Vroeger:** Tenants werden aangemaakt tijdens onboarding (inclusief billing)
2. **Nu:** Tenants kunnen bestaan zonder billing_state
3. **Oplossing:** Automatisch billing_state creëren of dit checken

**Preventie voor de toekomst:**

Het is nu gefixed in de code:
- ✅ Settings pagina checkt of billing null is
- ✅ Toont friendly message als billing ontbreekt
- ✅ Geen crash meer!

---

## 🎯 CHECKLIST

Vink af wat je hebt gedaan:

- [ ] Supabase SQL Editor geopend
- [ ] SQL query geplakt en gerund
- [ ] "Success" bericht gezien in Supabase
- [ ] Settings pagina gerefreshed
- [ ] Abonnement tab werkt nu
- [ ] Ziet "FREE" plan met "TRIALING" status

Als alle checkboxes ✅ zijn: **Klaar!** 🎉

---

## 📄 MEER INFO

Voor complete SQL queries en checks, zie:
- **FIX_MISSING_BILLING_STATE.sql** - Volledige SQL scripts
- **Code fix:** `app/manager/[tenantId]/settings/SettingsClient.tsx` - Nu null-safe

---

**VOLGENDE STAP:** Run de SQL query in Supabase! 🚀

