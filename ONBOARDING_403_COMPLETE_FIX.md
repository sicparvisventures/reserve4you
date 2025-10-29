# 🚨 ONBOARDING 403 FIX - Complete Guide

## Het Probleem

User krijgt 403 Unauthorized bij stap 2 (locatie aanmaken):
```
User: 313f6690-620a-4b7f-9cea-bd2e2dd3e34d
Tenant: b0402eea-4296-4951-aff6-8f4c2c219818 (van dietmarkuh!)
Error: Unauthorized
```

**Oorzaak:** User zit in de verkeerde tenant URL!

---

## 🔍 STAP 1: Diagnose (Vind de Juiste Tenant)

Run in **Supabase SQL Editor**:
```
DIAGNOSE_ONBOARDING_403.sql
```

Dit toont:
- Wie is deze user?
- Welke tenants heeft deze user?
- Is er een membership probleem?
- Wat is de juiste tenant ID?

---

## 🔧 STAP 2: Fix (Herstel Memberships)

Run in **Supabase SQL Editor**:
```
FIX_ONBOARDING_403_COMPLETE.sql
```

Dit:
1. ✅ Verwijdert incorrecte memberships
2. ✅ Voegt correcte memberships toe
3. ✅ Toont de JUISTE tenant ID
4. ✅ Geeft de correcte onboarding URL

---

## 🎯 STAP 3: Gebruik de Juiste URL

Na het runnen van de fix, krijg je output zoals:

```
JUISTE ONBOARDING URL:
http://localhost:3007/manager/onboarding?step=2&tenantId=XXXXX-YYYY

FOUT (gebruik dit NIET):
http://localhost:3007/manager/onboarding?step=2&tenantId=b0402eea...
```

### Gebruik de JUISTE tenant ID!

---

## 🔄 Alternatief: Start Onboarding Opnieuw

Als je niet zeker weet welke tenant ID je moet gebruiken:

### Optie 1: Ga naar Manager
```
http://localhost:3007/manager
```
- Dit toont al je tenants
- Klik op de tenant die je wilt gebruiken
- Ga dan naar onboarding vanuit daar

### Optie 2: Start Vanaf Stap 1
```
http://localhost:3007/manager/onboarding?step=1
```
- Vul bedrijfsnaam in
- Systeem maakt NIEUWE tenant aan
- Krijg automatisch de juiste tenant ID
- Membership wordt automatisch aangemaakt via `create_tenant_with_membership`

---

## 🛡️ Waarom Dit Gebeurt

De onboarding wizard gebruikt de `tenantId` parameter uit de URL:

```typescript
// OnboardingWizard.tsx regel 44
const tenantIdParam = searchParams.get('tenantId');

// Als er een tenantId is, gebruikt de wizard DIE tenant
if (tenantIdParam) {
  setData(prev => ({ ...prev, tenantId: tenantIdParam }));
}
```

**Probleem:** Als je een URL deelt of een oude URL uit je history gebruikt met een verkeerde tenant ID, probeer je in andermans tenant te werken!

---

## ✅ Preventie

### Voor Developers:
1. ❌ Deel NOOIT onboarding URLs met tenant IDs
2. ✅ Gebruik altijd: `/manager` → Selecteer tenant → Start onboarding
3. ✅ Of start zonder tenantId: `/manager/onboarding?step=1`

### Voor Users:
1. ❌ Gebruik geen oude/gedeelde URLs
2. ✅ Start altijd vanaf `/manager`
3. ✅ Laat het systeem de juiste tenant ID kiezen

---

## 🧪 Verificatie Na Fix

### Test 1: Check Membership
```sql
SELECT 
    t.name as tenant_name,
    m.role,
    CASE 
        WHEN m.user_id = t.owner_user_id THEN '✅ CORRECT'
        ELSE '❌ WRONG'
    END as validation
FROM memberships m
JOIN tenants t ON t.id = m.tenant_id
WHERE m.user_id = '313f6690-620a-4b7f-9cea-bd2e2dd3e34d';
```

**Verwacht:** Alleen memberships voor eigen tenants, alle "✅ CORRECT"

### Test 2: Probeer Onboarding Opnieuw
1. Clear browser cache (Cmd+Shift+R)
2. Ga naar `/manager`
3. Selecteer JOUW tenant
4. Start onboarding vanuit dashboard
5. Of gebruik de tenant ID uit de fix output

---

## 🎯 Samenvatting

| Probleem | Oplossing |
|----------|-----------|
| 403 bij locatie aanmaken | Run `DIAGNOSE_ONBOARDING_403.sql` |
| Verkeerde tenant ID in URL | Run `FIX_ONBOARDING_403_COMPLETE.sql` |
| Geen membership | Fix script maakt membership aan |
| Onzeker welke tenant | Ga naar `/manager` en selecteer |
| Wil opnieuw beginnen | Start bij `/manager/onboarding?step=1` |

---

## 📝 SQL Scripts Overzicht

### 1. DIAGNOSE_ONBOARDING_403.sql
- Vindt de juiste tenant voor de user
- Checkt membership status
- Toont het probleem

### 2. FIX_ONBOARDING_403_COMPLETE.sql
- Verwijdert incorrecte memberships
- Maakt correcte memberships aan
- Geeft de juiste URL

### 3. FIX_ALL_MISSING_MEMBERSHIPS.sql
- Universele fix voor alle users
- Gebruikt `tenant.owner_user_id`
- Veilig om altijd te runnen

---

## 🚀 Quick Fix Checklist

- [ ] Run `DIAGNOSE_ONBOARDING_403.sql`
- [ ] Check output: welke tenant is van deze user?
- [ ] Run `FIX_ONBOARDING_403_COMPLETE.sql`
- [ ] Kopieer de JUISTE tenant ID uit output
- [ ] Gebruik die URL voor onboarding
- [ ] Test dat locatie aanmaken werkt
- [ ] Vervolg met rest van onboarding

**Na deze fix zou onboarding normaal moeten werken!** 🎉

