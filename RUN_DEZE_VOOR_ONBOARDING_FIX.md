# ⚡ QUICK FIX - Onboarding 403 Error

## 🚨 Probleem
```
User: 313f6690-620a-4b7f-9cea-bd2e2dd3e34d
Fout: 403 Unauthorized bij locatie aanmaken (stap 2)
Reden: Zit in verkeerde tenant URL!
```

---

## ✅ 3-STAPPEN FIX

### STAP 1: Diagnose
**Run in Supabase SQL Editor:**
```
DIAGNOSE_ONBOARDING_403.sql
```

Kijk naar de output voor:
- "USER TENANTS" - Welke tenants heeft deze user?
- "JUISTE ONBOARDING URL" - Wat is de correcte URL?

---

### STAP 2: Fix Memberships
**Run in Supabase SQL Editor:**
```
FIX_ONBOARDING_403_COMPLETE.sql
```

Dit:
- ✅ Verwijdert incorrecte memberships
- ✅ Maakt correcte memberships aan
- ✅ Toont de JUISTE tenant ID om te gebruiken

---

### STAP 3: Gebruik Juiste URL

#### Als de fix een tenant ID toonde:
```
Gebruik deze URL (uit fix output):
http://localhost:3007/manager/onboarding?step=2&tenantId=XXXXX-XXXXX
```

#### Als er GEEN tenant is gevonden:
```
Start helemaal opnieuw:
http://localhost:3007/manager/onboarding?step=1

Dit maakt een NIEUWE tenant aan met automatische membership
```

---

## 🎯 Simpelste Oplossing

### Ga gewoon naar:
```
http://localhost:3007/manager
```

1. Je ziet je eigen tenant(s)
2. Klik op de tenant
3. Start onboarding vanuit dashboard
4. Of ga naar Settings → Locaties → Nieuwe Locatie

**Het systeem gebruikt dan automatisch de juiste tenant ID!**

---

## ⚠️ BELANGRIJK

### ❌ GEBRUIK NOOIT:
```
http://localhost:3007/manager/onboarding?step=2&tenantId=b0402eea-4296-4951-aff6-8f4c2c219818

Deze tenant behoort toe aan dietmarkuh@gmail.com!
```

### ✅ GEBRUIK WEL:
```
http://localhost:3007/manager
→ Selecteer JOUW tenant
→ Start onboarding

OF

http://localhost:3007/manager/onboarding?step=1
→ Maak nieuwe tenant aan
```

---

## 🔍 Na de Fix

Test dat het werkt:
1. Gebruik de juiste URL (uit fix output)
2. Of start vanaf `/manager`
3. Probeer locatie aan te maken
4. Zou GEEN 403 meer moeten krijgen ✅

---

## 📋 Overzicht

| Stap | Actie | Bestand |
|------|-------|---------|
| 1 | Diagnose | `DIAGNOSE_ONBOARDING_403.sql` |
| 2 | Fix | `FIX_ONBOARDING_403_COMPLETE.sql` |
| 3 | Test | Gebruik juiste URL of `/manager` |

**Totale tijd: ~2 minuten** ⏱️
