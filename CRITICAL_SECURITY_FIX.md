# 🚨 KRITIEK SECURITY PROBLEEM - Incorrecte Tenant Access

## ❌ Het Probleem

User `desmetthomas09@gmail.com` kan de dashboard zien van user `dietmarkuh@gmail.com`!

Dit komt doordat er een **incorrecte membership** is aangemaakt.

---

## 🔍 Oorzaak

Het script `FIX_403_DIRECT.sql` heeft een membership aangemaakt met:
- Tenant: `b0402eea-4296-4951-aff6-8f4c2c219818` (van dietmarkuh)
- User: `313f6690-620a-4b7f-9cea-bd2e2dd3e34d` (mogelijk desmetthomas)
- Role: `OWNER`

**Als deze user ID NIET de tenant owner is, is dit een SECURITY BREACH!**

---

## 🚑 DIRECTE FIX - RUN NU!

### Stap 1: Diagnose (vind het probleem)
```sql
-- Run dit in Supabase SQL Editor:
\i DIAGNOSE_TENANT_ACCESS.sql
```

Dit toont:
- Wie is de echte owner van tenant `b0402eea`?
- Wie heeft allemaal membership voor deze tenant?
- Welke memberships zijn incorrect?

### Stap 2: Fix (verwijder incorrecte memberships)
```sql
-- Run dit in Supabase SQL Editor:
\i FIX_INCORRECT_MEMBERSHIPS.sql
```

Dit:
1. ✅ Toont welke memberships verwijderd worden
2. ✅ Verwijdert memberships waar user ≠ tenant owner
3. ✅ Zorgt dat alle tenant owners WEL een membership hebben
4. ✅ Toont verificatie

---

## 🔐 Wat Er Gebeurd Is

### Normale Situatie (CORRECT):
```
Tenant: "Mijn Restaurant" (owner: dietmarkuh@gmail.com)
├── Membership 1: dietmarkuh@gmail.com → OWNER ✅
└── [optioneel] Staff memberships van dietmarkuh's personeel
```

### Wat Er Fout Ging (INCORRECT):
```
Tenant: "Mijn Restaurant" (owner: dietmarkuh@gmail.com)
├── Membership 1: desmetthomas09@gmail.com → OWNER ❌ FOUT!
└── Membership 2: dietmarkuh@gmail.com → OWNER (mogelijk missing)
```

**Result:** Thomas kan nu Dietmar's restaurant dashboard zien! 🚨

---

## 🛡️ Preventie voor Toekomst

### Wat moet ALTIJD gelden:
```sql
-- Een membership is alleen geldig als:
membership.user_id = tenant.owner_user_id

-- OF als het expliciet toegevoegde staff is via:
-- - /manager/[tenantId]/team page (voor venue_users)
-- - Expliciete invite functionaliteit
```

### Update de Problematische Scripts:

**FIX_403_DIRECT.sql** - Deze moet NOOIT direct gerund worden tenzij:
1. Je 100% zeker weet dat de user_id de tenant owner is
2. Je hebt geverifieerd met `SELECT owner_user_id FROM tenants WHERE id = '...'`

**Better Alternative:** Gebruik altijd `FIX_ALL_MISSING_MEMBERSHIPS.sql` - die gebruikt `t.owner_user_id` automatisch!

---

## ✅ Verificatie Na Fix

Run dit om te verifiëren dat alles correct is:

```sql
-- Check 1: Elke tenant heeft exact 1 OWNER membership
SELECT 
    t.id as tenant_id,
    t.name,
    COUNT(CASE WHEN m.role = 'OWNER' THEN 1 END) as owner_count,
    CASE 
        WHEN COUNT(CASE WHEN m.role = 'OWNER' THEN 1 END) = 1 THEN '✅ CORRECT'
        WHEN COUNT(CASE WHEN m.role = 'OWNER' THEN 1 END) = 0 THEN '❌ NO OWNER'
        ELSE '❌ MULTIPLE OWNERS'
    END as status
FROM tenants t
LEFT JOIN memberships m ON m.tenant_id = t.id
GROUP BY t.id, t.name;

-- Check 2: Alle OWNER memberships matchen tenant.owner_user_id
SELECT 
    t.id as tenant_id,
    t.name,
    m.user_id as membership_user_id,
    t.owner_user_id as tenant_owner_id,
    CASE 
        WHEN m.user_id = t.owner_user_id THEN '✅ CORRECT'
        ELSE '❌ MISMATCH!'
    END as validation
FROM tenants t
JOIN memberships m ON m.tenant_id = t.id
WHERE m.role = 'OWNER';

-- Check 3: Test access voor specifieke users
SELECT 
    au.email,
    t.name as can_access_tenant,
    m.role
FROM auth.users au
JOIN memberships m ON m.user_id = au.id
JOIN tenants t ON t.id = m.tenant_id
WHERE au.email IN ('desmetthomas09@gmail.com', 'dietmarkuh@gmail.com')
ORDER BY au.email, t.name;
```

---

## 🎯 Action Items - DOEN NU!

### 1. METEEN:
- [ ] Run `DIAGNOSE_TENANT_ACCESS.sql` in Supabase
- [ ] Verifieer welke memberships fout zijn
- [ ] Run `FIX_INCORRECT_MEMBERSHIPS.sql`
- [ ] Verifieer dat fix werkt

### 2. TEST:
- [ ] Login als `desmetthomas09@gmail.com`
- [ ] Probeer naar `http://localhost:3007/manager/b0402eea-4296-4951-aff6-8f4c2c219818/dashboard`
- [ ] Zou moeten redirecten naar `/manager` (geen toegang) ✅

### 3. CLEANUP:
- [ ] Voeg waarschuwing toe aan `FIX_403_DIRECT.sql`
- [ ] Of verwijder dit script helemaal
- [ ] Update documentatie

---

## 🚨 WAAROM DIT ZO BELANGRIJK IS

Dit is een **GDPR/Privacy violation!**

❌ Users kunnen elkaars:
- Reserveringen zien
- Klant gegevens inzien
- Locatie instellingen aanpassen
- Financiële informatie zien
- Personeel beheren

**Dit moet DIRECT gefixed worden!**

---

## 📞 Support Voor Na Fix

Als er vragen zijn na het runnen van de fix scripts:
1. Check de output van `DIAGNOSE_TENANT_ACCESS.sql`
2. Verifieer dat `FIX_INCORRECT_MEMBERSHIPS.sql` geen errors geeft
3. Test inloggen met beide accounts
4. Check Supabase logs voor auth errors

---

## ✅ Expected Result Na Fix

```
User: desmetthomas09@gmail.com
├── Kan alleen zijn eigen tenants zien
└── Krijgt 403/redirect bij access tot dietmarkuh's tenants

User: dietmarkuh@gmail.com
├── Kan alleen zijn eigen tenants zien
└── Krijgt 403/redirect bij access tot desmetthomas's tenants
```

**Complete tenant isolation!** 🔐

