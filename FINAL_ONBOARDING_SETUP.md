# ✅ Final Onboarding Setup - Complete Checklist

## 🎯 Status

### ✅ GEFIXED:
- ✅ **Billing State**: Alle tenants hebben billing_state (FREE/TRIALING)
- ✅ **Memberships**: Owner memberships gecreëerd
- ✅ **Locatie Aanmaken**: Stap 2 werkt (403 opgelost)
- ✅ **RLS Policies**: Tables, Shifts, Policies policies gefixed

### 📋 NOG TE DOEN:
1. **Run Final Script**: `FIX_ALL_ONBOARDING_RLS_CLEAN.sql`
2. **Test Complete Onboarding**: Stap 1 t/m 8
3. **Verify Auto-Create**: Test met nieuwe account

---

## 🚀 LAATSTE SCRIPT - Run Dit Nu

### Script: `FIX_ALL_ONBOARDING_RLS_CLEAN.sql`

**Open Supabase SQL Editor:**
```
https://supabase.com/dashboard/project/jrudqxovozqnmxypjtij/sql/new
```

**Kopieer en run:** `FIX_ALL_ONBOARDING_RLS_CLEAN.sql`

### Wat Doet Dit Script?

1. **Tables Policies** (Stap 3: Capaciteit)
   - ✅ Public kan published tables zien
   - ✅ Members kunnen tables van hun tenant zien
   - ✅ OWNER + MANAGER kunnen tables aanmaken
   - ✅ OWNER + MANAGER kunnen tables updaten
   - ✅ OWNER kan tables verwijderen

2. **Shifts Policies** (Stap 3: Diensten/Resources)
   - ✅ Zelfde structuur als tables
   - ✅ Voor multi-sector resources

3. **Policies Table** (Stap 4: Annuleringsbeleid)
   - ✅ Zelfde structuur als tables
   - ✅ Voor cancellation policies

4. **Service Role Access**
   - ✅ Service role heeft volledige toegang (voor backend operaties)

### Verwachte Output:

```
┌─────────────────────────────────────┬─────────────────┬─────────────────┬───────────────────┐
│ status                              │ tables_policies │ shifts_policies │ policies_policies │
├─────────────────────────────────────┼─────────────────┼─────────────────┼───────────────────┤
│ ✅ RLS POLICIES FIXED FOR ONBOARDING!│ 6               │ 6               │ 6                 │
└─────────────────────────────────────┴─────────────────┴─────────────────┴───────────────────┘

┌─────────────────┬───────────┬──────────────┬────────────────────────────────┐
│ info            │ tablename │ policy_count │ operations                     │
├─────────────────┼───────────┼──────────────┼────────────────────────────────┤
│ 📋 POLICY SUMMARY│ policies  │ 6            │ DELETE, INSERT, SELECT, UPDATE │
│ 📋 POLICY SUMMARY│ shifts    │ 6            │ DELETE, INSERT, SELECT, UPDATE │
│ 📋 POLICY SUMMARY│ tables    │ 6            │ DELETE, INSERT, SELECT, UPDATE │
└─────────────────┴───────────┴──────────────┴────────────────────────────────┘

┌──────────────────────────────┬────────────────────────────────┬──────────────────────┬────────┐
│ check                        │ resource                       │ accessible_locations │ roles  │
├──────────────────────────────┼────────────────────────────────┼──────────────────────┼────────┤
│ 🔍 ACCESS CHECK FOR USER 313f│ tables                         │ 5                    │ OWNER  │
│ ✅ RESULT                    │ Can create tables/shifts/...   │ 5                    │ ✅ YES │
└──────────────────────────────┴────────────────────────────────┴──────────────────────┴────────┘
```

---

## 🧪 Test Complete Onboarding

### Test Met Huidige Account (313f6690):

**Stap 1: Bedrijf** ✅ (Already done)
- Tenant: Poule & Poulette
- Status: Has membership

**Stap 2: Locatie** ✅ (Net gefixed)
- Locatie aanmaken werkt
- Geen 403 errors meer

**Stap 3: Capaciteit & Diensten** ← Test nu
1. Ga naar stap 3
2. Vul tables in (bv. "Tafel 1", 4 personen, "indoor")
3. Vul shifts/diensten in
4. Klik "Opslaan en verder"
5. ✅ Zou moeten werken na script

**Stap 4: Policies**
1. Vul annuleringsbeleid in
2. Klik "Opslaan en verder"
3. ✅ Zou moeten werken

**Stap 5-8: Rest van onboarding**
- Betaalinstellingen (optioneel)
- Abonnement (optioneel, al PLUS/ACTIVE)
- Integraties (optioneel)
- Preview & Publiceren

---

## 🎯 Voor Nieuwe Bedrijven (Auto-Create)

### Triggers Geïnstalleerd:

1. **`trigger_auto_create_owner_membership`** ✅
   - Bij nieuwe tenant → creëert OWNER membership
   - Script: `FIX_ALL_MISSING_MEMBERSHIPS.sql` (al gedraaid)

2. **`trigger_auto_create_billing_state`** ✅
   - Bij nieuwe tenant → creëert billing_state (FREE/TRIALING)
   - Script: `FIX_ALL_ACCOUNTS_NOW.sql` (al gedraaid)

### RLS Policies:

Alle policies gebruiken nu:
```sql
EXISTS (
    SELECT 1 FROM locations l
    INNER JOIN memberships m ON m.tenant_id = l.tenant_id
    WHERE l.id = [table].location_id
    AND m.user_id = auth.uid()
    AND m.role IN ('OWNER', 'MANAGER')
)
```

Dit betekent:
- ✅ Werkt automatisch voor ELKE nieuwe tenant
- ✅ Zolang ze membership hebben (trigger zorgt hiervoor)
- ✅ Zolang ze OWNER of MANAGER zijn (trigger geeft OWNER)

---

## ✅ Verification Checklist

Na `FIX_ALL_ONBOARDING_RLS_CLEAN.sql`:

### Database Check:
```sql
-- Check 1: Tables policies count
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'tables';
-- Verwacht: 6

-- Check 2: Shifts policies count
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'shifts';
-- Verwacht: 6

-- Check 3: Policies policies count
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'policies';
-- Verwacht: 6
```

### Onboarding Test:
- [ ] Stap 1: Bedrijf aanmaken
- [ ] Stap 2: Locatie aanmaken
- [ ] Stap 3: Tables aanmaken ← Test na script
- [ ] Stap 3: Shifts aanmaken ← Test na script
- [ ] Stap 4: Policies instellen ← Test na script
- [ ] Stap 5-8: Rest van flow

### Nieuwe Account Test:
- [ ] Nieuwe account aanmaken
- [ ] Check: Membership auto-created
- [ ] Check: Billing state auto-created
- [ ] Test: Complete onboarding doorlopen
- [ ] Verify: Geen RLS errors

---

## 📊 Huidige Status Samenvatting

### User 313f6690-620a-4b7f-9cea-bd2e2dd3e34d:

**Memberships:** ✅
```
- Poule & Poulette (b0402eea-...): OWNER
- 5 locaties toegankelijk
- Kan tables/shifts/policies aanmaken
```

**Billing:** ✅
```
- Plan: PLUS
- Status: ACTIVE
- Max locations: 99
- Max bookings: 10000
```

**RLS Policies:** ✅ (na script)
```
- Tables: 6 policies
- Shifts: 6 policies
- Policies: 6 policies
```

**Triggers:** ✅
```
- Auto-create membership: Installed
- Auto-create billing: Installed
```

---

## 🎊 Final Steps

### 1. Run Script
```
FIX_ALL_ONBOARDING_RLS_CLEAN.sql in Supabase
```

### 2. Test Onboarding
```
Ga door stappen 3-8
```

### 3. Verify
```
Alles werkt? ✅
Geen errors? ✅
```

### 4. Nieuwe Account Test
```
Maak test account
Complete onboarding
Verify auto-create werkt
```

---

## 🚀 Deploy Code (Als Alles Werkt)

Als alle SQL scripts succesvol zijn:

```bash
cd /Users/dietmar/Desktop/ray2
git add .
git commit -m "fix: Complete onboarding setup - memberships, billing, RLS policies"
git push origin main
```

---

**Run `FIX_ALL_ONBOARDING_RLS_CLEAN.sql` nu en test stap 3!** 🎯

