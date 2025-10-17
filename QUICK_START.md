# QUICK START GUIDE - R4Y

## SETUP IN 3 STAPPEN:

### 1. RUN DATABASE MIGRATIONS

Open **Supabase SQL Editor** en run deze migrations in volgorde:

```sql
-- 1. Tenant cascade delete functie
-- File: /supabase/migrations/20241017000009_tenant_cascade_delete.sql
```

### 2. MAAK EEN RESTAURANT

```
http://localhost:3007/manager/onboarding?step=1
```

**Vul in:**
- Stap 1: Bedrijfsnaam en branding
- Stap 2: Locatie, adres, openingstijden
- Stap 3: Tafels (bijv. 5 tafels van 2-4 personen)
- Stap 4: Policies (optioneel)
- Stap 5: Stripe Connect (skip voor nu)
- Stap 6: Kies FREE abonnement (gratis, geen betaling)
- Stap 7: Integraties (skip)
- Stap 8: Klik "Publiceer Restaurant"

### 3. CHECK HOMEPAGE

```
http://localhost:3007
```

Je restaurant verschijnt nu in "Vanavond beschikbaar"!

---

## SQL HELPERS:

### Alle Locaties Bekijken:
```sql
SELECT id, name, slug, is_public, is_active 
FROM public.locations 
ORDER BY created_at DESC;
```

### Locatie Handmatig Publiceren:
```sql
UPDATE public.locations 
SET is_public = TRUE, is_active = TRUE 
WHERE slug = 'your-restaurant-slug';
```

### Status Checken:
```sql
-- Run: /supabase/scripts/view_all_locations.sql
```

---

## TEST BOOKING FLOW:

1. Ga naar: `http://localhost:3007`
2. Klik op je restaurant card
3. Klik "Reserveer"
4. Kies personen, datum, tijd
5. Vul gast info in
6. Bevestig reservering

---

## BEDRIJF VERWIJDEREN:

1. Ga naar: `http://localhost:3007/manager`
2. Klik "Verwijder" (alleen OWNER)
3. Bevestig
4. Alles wordt verwijderd (locaties, tafels, reserveringen, etc.)

---

## TROUBLESHOOTING:

**Location niet zichtbaar?**
- Check: is_public = TRUE en is_active = TRUE
- Check: billing status is ACTIVE of TRIALING
- Check: minimaal 1 tafel en 1 shift geconfigureerd

**Kan niet verwijderen?**
- Check: je bent OWNER van het bedrijf
- Alleen OWNER kan verwijderen

**Booking werkt niet?**
- Check: shifts zijn geconfigureerd voor vandaag
- Check: tafels zijn beschikbaar
- Check: location is published

---

**Meer details? Zie `TENANT_DELETE_AND_PUBLISHING.md`**

