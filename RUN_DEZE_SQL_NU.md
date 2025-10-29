# 🚨 KRITIEK - RUN DEZE SQL SCRIPTS NU!

## STAP 1: Diagnose
```sql
-- Kopieer en run dit in Supabase SQL Editor:
```

Open bestand: **`DIAGNOSE_TENANT_ACCESS.sql`**

Dit toont:
- ✅ Wie is de echte owner van tenant `b0402eea`?
- ✅ Wie heeft incorrecte memberships?
- ✅ Alle tenants per user

---

## STAP 2: Fix
```sql
-- Kopieer en run dit in Supabase SQL Editor:
```

Open bestand: **`FIX_INCORRECT_MEMBERSHIPS.sql`**

Dit:
1. Toont wat verwijderd wordt
2. Verwijdert incorrecte memberships
3. Voegt correcte memberships toe
4. Verifieert het resultaat

---

## STAP 3: Test

### Test 1: Login als desmetthomas09@gmail.com
```
1. Ga naar: http://localhost:3007/manager
2. Je zou NIET deze tenants moeten zien:
   ❌ Tenants van dietmarkuh@gmail.com
3. Probeer direct link:
   http://localhost:3007/manager/b0402eea-4296-4951-aff6-8f4c2c219818/dashboard
4. Zou moeten redirecten naar /manager (geen toegang)
```

### Test 2: Login als dietmarkuh@gmail.com  
```
1. Ga naar: http://localhost:3007/manager
2. Je ZOU WEL deze tenant moeten zien:
   ✅ b0402eea-4296-4951-aff6-8f4c2c219818
3. Dashboard zou normaal moeten werken
```

---

## ✅ Success Criteria

Na het runnen van de fix scripts:

```
✅ Elke user ziet alleen zijn eigen tenants
✅ Cross-tenant access geeft 403 of redirect
✅ Alle tenant owners hebben hun membership
✅ Geen memberships voor users die niet owner zijn
```

---

## 🆘 Als er errors zijn

### Error: "violates row-level security policy"
→ Gebruik service role key in Supabase SQL Editor

### Error: "column does not exist"
→ Je database schema is outdated, run migrations eerst

### Nog steeds incorrecte access?
Run dit verificatie script:
```sql
-- Check wie toegang heeft tot welke tenant
SELECT 
    au.email,
    t.name as tenant_name,
    t.owner_user_id,
    m.user_id as membership_user_id,
    m.role,
    CASE 
        WHEN m.user_id = t.owner_user_id THEN '✅ CORRECT'
        ELSE '❌ INCORRECT!'
    END as validation
FROM memberships m
JOIN tenants t ON t.id = m.tenant_id
JOIN auth.users au ON au.id = m.user_id
ORDER BY au.email, t.name;
```

Als je nog steeds incorrect ziet:
1. Run `FIX_INCORRECT_MEMBERSHIPS.sql` opnieuw
2. Check of het script zonder errors compleet
3. Clear browser cache / logout & login opnieuw

---

**RUN NU DE SCRIPTS EN TEST!** 🚨

