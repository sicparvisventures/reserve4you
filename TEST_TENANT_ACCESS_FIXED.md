# ✅ TEST: Verifieer dat Tenant Access Nu Correct is

## 🎯 Wat We Gaan Testen

Na de security fix moeten we verifiëren dat:
1. ✅ Elke user alleen zijn eigen tenant(s) ziet
2. ✅ Cross-tenant access geeft 403 of redirect
3. ✅ Alle functionaliteit nog steeds werkt voor eigen tenants

---

## 🧪 TEST SCENARIO'S

### Test 1: desmetthomas09@gmail.com (User met MESH tenant)

#### Wat ZOU moeten werken:
```bash
# 1. Login als desmetthomas09@gmail.com
# 2. Ga naar manager portal
http://localhost:3007/manager

# VERWACHT: Zie alleen zijn eigen tenant (MESH)
# ✅ Moet MESH tenant zien
# ❌ Moet GEEN "Poule & Poulette" zien
```

#### Wat NIET zou moeten werken:
```bash
# 3. Probeer direct link naar Poule & Poulette dashboard
http://localhost:3007/manager/b0402eea-4296-4951-aff6-8f4c2c219818/dashboard

# VERWACHT: 
# - Redirect naar /manager
# - OF 403 Forbidden error
# - NIET de dashboard zien!
```

---

### Test 2: dietmarkuh@gmail.com (User met Poule & Poulette)

#### Wat ZOU moeten werken:
```bash
# 1. Login als dietmarkuh@gmail.com
# 2. Ga naar manager portal
http://localhost:3007/manager

# VERWACHT: Zie zijn tenant "Poule & Poulette"
# ✅ Moet "Poule & Poulette" tenant zien
```

#### Dashboard Access:
```bash
# 3. Ga naar eigen dashboard
http://localhost:3007/manager/b0402eea-4296-4951-aff6-8f4c2c219818/dashboard

# VERWACHT:
# ✅ Dashboard laadt normaal
# ✅ Ziet zijn locaties
# ✅ Ziet zijn reserveringen
# ✅ Kan instellingen wijzigen
```

---

### Test 3: fm.conceptdevelopment@gmail.com (Bistro René)

```bash
# 1. Login als fm.conceptdevelopment@gmail.com
# 2. Ga naar /manager

# VERWACHT: Zie alleen "Bistro René"
# ❌ Zie GEEN andere tenants
```

---

### Test 4: admin@reserve4you.com (CHICKX)

```bash
# 1. Login als admin@reserve4you.com
# 2. Ga naar /manager

# VERWACHT: Zie alleen "CHICKX"
# ❌ Zie GEEN andere tenants
```

---

## 🔍 SQL Verificatie Tests

Als je twijfelt, run deze queries in Supabase:

### Query 1: Check alle memberships
```sql
SELECT 
    t.name as tenant_name,
    au.email as user_email,
    m.role,
    CASE 
        WHEN m.user_id = t.owner_user_id THEN '✅ CORRECT'
        ELSE '❌ INCORRECT!'
    END as validation
FROM tenants t
JOIN memberships m ON m.tenant_id = t.id
LEFT JOIN auth.users au ON au.id = m.user_id
ORDER BY t.name;
```

**VERWACHT:** Alle rows tonen "✅ CORRECT"

### Query 2: Check specifieke user access
```sql
-- Voor desmetthomas09@gmail.com
SELECT 
    t.name as accessible_tenants,
    m.role
FROM auth.users au
JOIN memberships m ON m.user_id = au.id
JOIN tenants t ON t.id = m.tenant_id
WHERE au.email = 'desmetthomas09@gmail.com';
```

**VERWACHT:** Alleen "MESH" tenant

```sql
-- Voor dietmarkuh@gmail.com  
SELECT 
    t.name as accessible_tenants,
    m.role
FROM auth.users au
JOIN memberships m ON m.user_id = au.id
JOIN tenants t ON t.id = m.tenant_id
WHERE au.email = 'dietmarkuh@gmail.com';
```

**VERWACHT:** Alleen "Poule & Poulette" tenant

---

## ✅ Success Criteria Checklist

Na het testen, vink af:

- [ ] desmetthomas09 ziet alleen MESH tenant
- [ ] desmetthomas09 krijgt 403/redirect bij Poule & Poulette dashboard
- [ ] dietmarkuh ziet alleen Poule & Poulette tenant
- [ ] dietmarkuh kan zijn eigen dashboard normaal gebruiken
- [ ] fm.conceptdevelopment ziet alleen Bistro René
- [ ] admin@reserve4you ziet alleen CHICKX
- [ ] Geen console errors bij redirects
- [ ] SQL verificatie toont alle memberships als "CORRECT"

---

## 🐛 Als Er Nog Problemen Zijn

### Probleem: User ziet nog steeds andere tenants
**Oplossing:**
1. Logout volledig
2. Clear browser cache (Cmd+Shift+R)
3. Login opnieuw
4. Run `QUICK_FIX_TENANT_ACCESS.sql` opnieuw
5. Check browser console (F12) voor errors

### Probleem: 500 Error in plaats van redirect
**Check:**
```sql
-- Verifieer dat getTenant functie membership checkt
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname LIKE '%tenant%';
```

### Probleem: RLS errors in console
**Check:**
- RLS policies zijn correct (zie DIAGNOSE output)
- User heeft valid session
- Membership bestaat

---

## 📊 Test Resultaten Template

Gebruik dit om je tests te documenteren:

```
TEST RESULTATEN - [DATUM]
========================

User: desmetthomas09@gmail.com
- Ziet eigen tenant (MESH): [ ] JA / [ ] NEE
- Ziet andere tenants: [ ] JA / [ ] NEE (moet NEE zijn!)
- Cross-tenant access blocked: [ ] JA / [ ] NEE (moet JA zijn!)

User: dietmarkuh@gmail.com
- Ziet eigen tenant (P&P): [ ] JA / [ ] NEE
- Ziet andere tenants: [ ] JA / [ ] NEE (moet NEE zijn!)
- Dashboard werkt: [ ] JA / [ ] NEE (moet JA zijn!)

SQL Verificatie:
- Alle memberships CORRECT: [ ] JA / [ ] NEE (moet JA zijn!)
- Geen incorrecte memberships: [ ] JA / [ ] NEE (moet JA zijn!)

CONCLUSION:
[ ] ✅ Alle tests geslaagd - Security fix succesvol!
[ ] ❌ Sommige tests gefaald - Extra debugging nodig
```

---

## 🎯 Na Succesvolle Tests

Als alle tests slagen:

1. ✅ Security issue is opgelost
2. ✅ Tenant isolation werkt correct
3. ✅ GDPR compliance is hersteld
4. ✅ Users kunnen alleen hun eigen data zien

Je kunt nu veilig verder met ontwikkeling! 🚀

---

## 📝 Notities

- De fix heeft incorrecte memberships verwijderd
- Alle tenant owners hebben nu correcte memberships
- RLS policies blijven de toegang verder controleren
- `getTenant()` functie checkt membership voor extra zekerheid

**Volledig secure multi-tenant setup!** 🔒

