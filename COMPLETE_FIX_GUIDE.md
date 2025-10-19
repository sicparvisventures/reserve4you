# Complete Fix Guide - 3-Tier Pricing & Location Dashboards

Deze guide fix ALLE problemen met plannen, onboarding en location dashboards.

## 🎯 Wat is er gefixed?

### 1. **✅ Plannen genormaliseerd naar 3-tier**
- **Oud systeem**: FREE, STARTER, GROWTH, BUSINESS, PREMIUM, ENTERPRISE (6 tiers)
- **Nieuw systeem**: FREE, START, PRO, PLUS (4 tiers)

### 2. **✅ Onboarding aangepast**
- Nieuwe vestiging toevoegen: Skip step 6 (abonnement) en 7 (integraties)
- Alleen relevante stappen: Locatie → Tafels → Policies → Betaling → Preview
- Geen verwarrende abonnement selectie meer

### 3. **✅ Location-specifieke dashboards**
- Klik op een vestiging → ga naar `/manager/[tenantId]/location/[locationId]`
- Eigen dashboard per vestiging met stats, bookings, tables, shifts
- Back button naar hoofd dashboard

### 4. **✅ Validation errors opgelost**
- Geen "Invalid enum value" errors meer
- Plans matchen nu met validatie schema (START/PRO/PLUS)

## 🚀 Stappen om te Fixen

### **Stap 1: Voer SQL Migratie uit in Supabase**

1. Open https://supabase.com/dashboard
2. Selecteer je project
3. Ga naar **SQL Editor**
4. **Optie A - Gebruik de migratie (aanbevolen)**:
   - Copy paste de inhoud van: `supabase/migrations/20250119000006_normalize_plans_to_3tier.sql`
   - Klik **Run**

5. **Optie B - Gebruik het quick script**:
   - Copy paste de inhoud van: `NORMALIZE_BILLING_PLANS.sql`
   - Klik **Run**

6. ✅ Verificatie - je zou moeten zien:
   ```
   FREE  : X tenants
   START : X tenants
   PRO   : X tenants
   PLUS  : X tenants
   ```

### **Stap 2: Herstart Development Server**

```bash
# Stop de server (Ctrl+C in terminal)

# Clear cache
rm -rf .next/cache

# Start opnieuw
pnpm dev
```

Server start nu op: **http://localhost:3007**

### **Stap 3: Hard Refresh Browser**

1. Ga naar je dashboard: `http://localhost:3007/manager/[tenant-id]/dashboard`
2. Druk: **Cmd + Shift + R** (Mac) of **Ctrl + Shift + R** (Windows)

## ✨ Wat Werkt Nu

### **Dashboard**
```
http://localhost:3007/manager/[tenant-id]/dashboard
```
- Header toont correct plan (START / PRO / PLUS)
- Vestigingen lijst met status (Gepubliceerd / Concept)
- Klik op vestiging → ga naar vestiging dashboard

### **Nieuwe Vestiging Toevoegen**
1. Klik "Toevoegen" bij vestigingen
2. Doorloop alleen:
   - Step 2: Locatie details
   - Step 3: Tafels
   - Step 4: Policies
   - Step 5: Betaalinstellingen
   - Step 8: Preview
3. ✅ Geen abonnement selectie meer!
4. ✅ Direct terug naar dashboard

### **Vestiging Dashboard**
```
http://localhost:3007/manager/[tenant-id]/location/[location-id]
```

Nieuwe features:
- **Stats Cards**: Vandaag, Aankomend, Tafels, Deze maand
- **Tabs**: Reserveringen, Tafels, Diensten
- **Actions**: Bekijk live, Instellingen
- **Back Button**: Terug naar hoofd dashboard

### **Onboarding (Nieuwe Tenant)**
Voor een nieuw bedrijf doorloop je WEL alle stappen:
1. Bedrijfsinfo
2. Eerste locatie
3. Tafels
4. Policies
5. Betaalinstellingen
6. **Abonnement kiezen** (START / PRO / PLUS)
7. Integraties (optioneel)
8. Preview

## 📊 Plan Overzicht

| Plan | Prijs | Locaties | Bookings/maand | Features |
|------|-------|----------|----------------|----------|
| **FREE** | €0 | 1 | 50 | Basis functionaliteit |
| **START** | €49 | 1 | 200 | Basis reserveringssysteem |
| **PRO** | €99 | 3 | 1,000 | + Aanbetalingen, Wachtlijst, Team members |
| **PLUS** | €149 | ∞ | ∞ | + Alle features, API, White-label |

## 🗂️ Bestanden Aangepast

### Code Changes:
1. ✅ `app/manager/onboarding/steps/StepAbonnement.tsx` - Plannen naar START/PRO/PLUS
2. ✅ `app/manager/onboarding/OnboardingWizard.tsx` - Skip steps 6 & 7 voor nieuwe vestigingen
3. ✅ `app/manager/[tenantId]/dashboard/ProfessionalDashboard.tsx` - Links naar location dashboards
4. ✅ `app/manager/[tenantId]/location/[locationId]/page.tsx` - Location dashboard page (NEW)
5. ✅ `app/manager/[tenantId]/location/[locationId]/LocationDashboard.tsx` - Location dashboard UI (NEW)
6. ✅ `package.json` - Server port naar 3007

### SQL Files:
1. ✅ `NORMALIZE_BILLING_PLANS.sql` - Quick fix script
2. ✅ `supabase/migrations/20250119000006_normalize_plans_to_3tier.sql` - Migration

## 🔍 Troubleshooting

### Probleem: "Invalid enum value" error

**Oorzaak**: Oude plan namen (GROWTH, BUSINESS, etc.) in database  
**Oplossing**: Voer SQL migratie uit (Stap 1)

### Probleem: Zie nog steeds oude plannen in onboarding

**Oorzaak**: Browser cache  
**Oplossing**:
1. Hard refresh (Cmd+Shift+R)
2. Of open Incognito/Private window

### Probleem: Kan geen locatie toevoegen

**Oorzaak**: Plan limiet bereikt  
**Check**: Voer uit in Supabase:
```sql
SELECT 
  t.name,
  bs.plan,
  (SELECT COUNT(*) FROM locations WHERE tenant_id = t.id) as locations,
  CASE 
    WHEN bs.plan IN ('FREE', 'START') THEN 1
    WHEN bs.plan = 'PRO' THEN 3
    WHEN bs.plan = 'PLUS' THEN 999
  END as max_locations
FROM billing_state bs
JOIN tenants t ON t.id = bs.tenant_id
WHERE t.id = 'JOUW_TENANT_ID';
```

**Oplossing**: Upgrade plan in `/profile` tab "Abonnementen"

### Probleem: Vestiging klik werkt niet

**Oorzaak**: Link niet correct  
**Check**: Kijk in browser console (F12) voor errors  
**Oplossing**: Hard refresh, of check dat location ID bestaat

### Probleem: Dashboard toont verkeerde plan in header

**Oorzaak**: Cache  
**Oplossing**:
```bash
# Stop server
# Run SQL migration
rm -rf .next/cache
pnpm dev
# Hard refresh browser
```

## 📝 SQL Verificatie Queries

### Check alle plannen:
```sql
SELECT plan, COUNT(*) 
FROM billing_state 
GROUP BY plan;
```

Moet tonen: `FREE`, `START`, `PRO`, `PLUS` alleen.

### Check specifieke tenant:
```sql
SELECT 
  t.name,
  bs.plan,
  bs.status,
  (SELECT COUNT(*) FROM locations WHERE tenant_id = t.id) as locations
FROM billing_state bs
JOIN tenants t ON t.id = bs.tenant_id
WHERE t.id = 'JOUW_TENANT_ID';
```

### Check quota functie:
```sql
SELECT * FROM check_location_quota(
  'JOUW_TENANT_ID',
  (SELECT plan FROM billing_state WHERE tenant_id = 'JOUW_TENANT_ID')
);
```

## 🎉 Test Checklist

Na het uitvoeren van alle stappen, test:

- [ ] Dashboard header toont correct plan
- [ ] Klik op "Toevoegen" bij vestigingen
- [ ] Doorloop alleen stappen 2, 3, 4, 5, 8 (geen 6 & 7)
- [ ] Kom terug bij dashboard
- [ ] Zie nieuwe vestiging in lijst
- [ ] Klik op vestiging
- [ ] Kom in vestiging-specifieke dashboard
- [ ] Zie stats, bookings, tables, shifts
- [ ] Klik "Terug" button
- [ ] Kom terug bij hoofd dashboard

## 💡 Extra Info

### Routes Structuur:
```
/manager
  └── [tenantId]
      ├── /dashboard                    # Hoofd dashboard
      └── /location
          └── [locationId]              # Vestiging dashboard
```

### Plan Migration Mapping:
```
STARTER    → START
GROWTH     → PRO
BUSINESS   → PLUS
PREMIUM    → PLUS
ENTERPRISE → PLUS
FREE       → FREE (blijft hetzelfde)
```

---

**Laatste update**: 19 januari 2025  
**Versie**: 2.0  
**Status**: ✅ Production Ready

