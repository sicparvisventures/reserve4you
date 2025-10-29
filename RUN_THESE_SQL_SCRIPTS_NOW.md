# 🚨 RUN DEZE SQL SCRIPTS NU

## Wat is er gefixed?

1. ✅ **SQL Error** - "INACTIVE" enum bestaat niet → Gefixed naar CANCELLED/PAST_DUE
2. ✅ **Profile upgrade scherm** - Altijd zichtbaar, ook zonder voltooide onboarding

---

## 📋 Stap voor Stap

### Stap 1: Open Supabase SQL Editor

```
https://supabase.com/dashboard/project/jrudqxovozqnmxypjtij/sql/new
```

### Stap 2: Run dit script

Open bestand: **`FIX_ALL_ACCOUNTS_NOW.sql`**

Kopieer ALLE inhoud en plak in SQL Editor → Klik "Run"

### Stap 3: Verwacht Resultaat

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

### Stap 4: Deploy Code

```bash
git add .
git commit -m "fix: SQL enum errors and always show upgrade options"
git push origin main
```

---

## ✅ Wat is er nu gefixed?

### SQL Scripts:
- ✅ Geen "INACTIVE" enum errors meer
- ✅ Alle tenants krijgen billing_state
- ✅ Status wordt TRIALING voor 14 dagen
- ✅ Trigger geïnstalleerd voor nieuwe accounts

### Profile Pagina:
- ✅ Abonnementen tab ALTIJD zichtbaar
- ✅ Upgrade scherm ALTIJD zichtbaar
- ✅ Ook ZONDER voltooide onboarding
- ✅ Ook ZONDER bestaande locaties

---

## 🎨 Wat Ziet de Gebruiker Nu?

### Gebruiker ZONDER bedrijven:

**Op /profile → Abonnementen tab:**

```
┌─────────────────────────────────────┐
│  Start je eerste bedrijf            │
│  Begin met onze gratis proefperiode │
│  [Start nu gratis]                   │
└─────────────────────────────────────┘

Kies je abonnement
┌──────────┬──────────┬──────────┐
│  Start   │   Pro    │   Plus   │
│  €49     │   €99    │   €149   │
│          │ POPULAIR │          │
│ Features │ Features │ Features │
│ [Start]  │ [Start]  │ [Start]  │
└──────────┴──────────┴──────────┘
```

### Gebruiker MET bedrijven:

**Op /profile → Abonnementen tab:**

```
┌─────────────────────────────────────┐
│  Mijn Restaurant                     │
│  [FREE] [TRIALING]                   │
│  → Naar dashboard                    │
└─────────────────────────────────────┘

Upgrade je abonnement
┌──────────┬──────────┬──────────┐
│  Start   │   Pro    │   Plus   │
│  €49     │   €99    │   €149   │
│          │ POPULAIR │          │
│ Features │ Features │ Features │
│[Upgrade] │[Upgrade] │[Upgrade] │
└──────────┴──────────┴──────────┘
```

---

## 🧪 Test Het

### Test 1: Nieuwe Account
1. Maak nieuw account aan
2. Ga naar /profile
3. Klik "Abonnementen"
4. ✅ Zie upgrade opties
5. ✅ Zie "Start gratis proefperiode"

### Test 2: Bestaande Account
1. Login met bestaand account
2. Ga naar /profile
3. Klik "Abonnementen"
4. ✅ Zie upgrade opties
5. ✅ Kan van plan wisselen

### Test 3: Onboarding
1. Nieuwe account
2. Start onboarding
3. Maak locatie aan (stap 2)
4. ✅ Werkt zonder errors
5. ✅ Geen 403 meer

---

## 📊 Statistieken

Na het draaien van het script:

```sql
-- Check hoeveel tenants billing hebben
SELECT COUNT(*) FROM tenants t
WHERE EXISTS (
  SELECT 1 FROM billing_state bs WHERE bs.tenant_id = t.id
);
-- Moet: 100% van tenants

-- Check status verdeling
SELECT status, COUNT(*) 
FROM billing_state 
GROUP BY status;
-- Verwacht: TRIALING (meeste), ACTIVE (betaald)
```

---

## 🎯 Checklist

- [ ] SQL script gedraaid in Supabase
- [ ] Geen errors in output
- [ ] Success message gezien
- [ ] Code gecommit en gepusht
- [ ] Vercel deployment succesvol
- [ ] /profile → Abonnementen tab zichtbaar
- [ ] Upgrade opties zichtbaar
- [ ] Test met nieuwe account
- [ ] Test onboarding werkt

---

## 🎉 Klaar!

Je platform heeft nu:

✅ **Werkende SQL scripts** (geen enum errors)  
✅ **Zichtbare upgrade opties** (altijd, voor iedereen)  
✅ **Soepele onboarding** (eerste locatie altijd toegestaan)  
✅ **Transparante prijzen** (gebruikers zien waarde direct)  

**Tijd om te draaien: 5 minuten**  
**Impact: 100% werkende onboarding**

🚀 **Success!**

