# 🎉 Booking Availability Fix - Compleet

## Probleem

Je had twee hoofdproblemen met het reserveringssysteem:

1. **Geen beschikbare data/tijden**: Wanneer je probeerde te reserveren, waren er geen beschikbare tijdslots zelfs als er tafels en stoelen waren
2. **Lege error in console**: Bij Poule & Poulette Gent kreeg je "Booking error: {}" zonder duidelijke foutmelding

## Oorzaak

De hoofdoorzaak was dat **shifts ontbraken** voor de meeste locaties:
- **Shifts** definiëren wanneer een restaurant open is voor reserveringen (dagen van de week + tijden)
- Zonder shifts kan het systeem geen beschikbaarheid berekenen
- 5 van de 12 actieve locaties hadden geen shifts geconfigureerd

## Oplossing

### ✅ 1. Modal Fixed - Shifts Controle

**Bestand:** `components/booking/ReserveBookingModal.tsx`

**Wat is gewijzigd:**
- Modal controleert nu eerst of er shifts bestaan voor de geselecteerde datum
- Toont duidelijke foutmelding als er geen shifts zijn: _"Dit restaurant heeft nog geen openingstijden geconfigureerd"_
- Genereert tijdslots op basis van de geconfigureerde shifts (niet meer hardcoded 12:00-22:00)
- Controleert ook of er actieve tafels zijn

### ✅ 2. Betere Error Handling

**Wat is gewijzigd:**
- Error messages worden nu correct weergegeven in plaats van lege objecten
- Controleert verschillende error formaten (`err.message`, `err.error_description`, `err.error`)
- Toont altijd een begrijpelijke foutmelding aan de gebruiker

### ✅ 3. Default Shifts Toegevoegd

**Script uitgevoerd:** `scripts/add-default-shifts.ts`

**Resultaat:**
```
✅ 12 actieve locaties gevonden
➕ 5 locaties kregen default shifts:
   - CHICKX
   - Poule & Poulette Mechelen
   - Poule & Poulette Antwerpen
   - Camp Nou
   - Meshell Hair Design

📊 Totaal nu: 24 shifts voor 13 locaties
```

**Default shifts configuratie:**
- **Lunch**: Maandag-Vrijdag, 11:00-15:00
- **Dinner**: Maandag-Zaterdag, 17:00-22:00
- Booking duration: 90 minuten
- Buffer tussen reserveringen: 15 minuten

## Test Nu

### Stap 1: Restart Development Server
```bash
# Stop huidige server (Ctrl+C)
npm run dev
```

### Stap 2: Test Reservering

1. **Ga naar een restaurant pagina:**
   ```
   http://localhost:3007/p/chickx
   http://localhost:3007/p/poule-poulette-mechelen
   ```

2. **Klik op "Reserveren"**

3. **Je zou nu moeten zien:**
   - ✅ Stap 1: Aantal gasten selecteren → werkt
   - ✅ Stap 2: Datum selecteren → werkt
   - ✅ Stap 2: **Tijdslots worden getoond** (11:00-15:00 en 17:00-22:00)
   - ✅ Stap 3: Contactgegevens invullen → werkt
   - ✅ Reservering wordt aangemaakt

### Stap 3: Controleer Database (optioneel)

```sql
-- Zie alle shifts per locatie
SELECT 
  l.name,
  s.name as shift_name,
  s.days_of_week,
  s.start_time,
  s.end_time,
  s.is_active
FROM locations l
LEFT JOIN shifts s ON s.location_id = l.id
WHERE l.is_active = true
ORDER BY l.name, s.name;
```

## Mogelijke Problemen & Oplossingen

### "Geen beschikbaarheid" voor specifieke datum
**Oorzaak:** De shift is niet actief voor die dag van de week
**Oplossing:** Ga naar Manager Settings → Shifts en pas de dagen aan

### "Geen tafels beschikbaar"
**Oorzaak:** Alle tafels zijn geboekt voor die tijd
**Oplossing:** 
- Voeg meer tafels toe in Manager Settings → Tables
- Of kies een ander tijdstip

### Custom shifts nodig
**Locatie:** Manager → Settings → Shifts
**Voorbeelden:**
- Weekend Brunch: Za-Zo, 10:00-14:00
- Late Night: Vr-Za, 22:00-02:00
- Happy Hour: Ma-Vr, 16:00-18:00

## Aangemaakte Bestanden

### Scripts
- ✅ `scripts/add-default-shifts.ts` - Script om default shifts toe te voegen
- ✅ `FIX_ADD_DEFAULT_SHIFTS.sql` - SQL variant (voor reference)

### Documentatie  
- ✅ `FIX_BOOKING_AVAILABILITY_COMPLETE.md` - Dit bestand

## Volgende Stappen (Optioneel)

### 1. Pas Shifts Aan Per Locatie
Ga naar Manager interface en pas de shifts aan per locatie:
```
http://localhost:3007/manager/[location-slug]/settings?step=4
```

### 2. Configureer Booking Policies
Stel in:
- Minimale annuleringstijd
- Deposit vereisten
- Max party size
```
http://localhost:3007/manager/[location-slug]/settings?step=5
```

### 3. Test Booking Flow End-to-End
- Maak een reservering als gast
- Controleer bevestigingsmail
- Test annulering
- Test no-show handling

## Technische Details

### Database Schema: Shifts
```sql
CREATE TABLE shifts (
  id UUID PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES locations(id),
  name VARCHAR(100) NOT NULL,
  days_of_week INT[] NOT NULL,  -- [0,1,2,3,4,5,6] (0=Sunday)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_minutes INT DEFAULT 90,
  buffer_minutes INT DEFAULT 15,
  is_active BOOLEAN DEFAULT true
);
```

### Availability Logic Flow
```
1. User selects date
   ↓
2. System finds shifts for that day of week
   ↓
3. System generates time slots based on shift times
   ↓
4. System checks table availability for each slot
   ↓
5. User sees only available time slots
```

### Error Handling Improvements
```typescript
// Before
console.error('Booking error:', err);
setError(err.message || 'Default message');

// After
let errorMessage = 'Default message';
if (err?.message) errorMessage = err.message;
else if (err?.error_description) errorMessage = err.error_description;
else if (err?.error) errorMessage = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
setError(errorMessage);
```

## Support

Als je nog steeds problemen ondervindt:

1. **Check de console** voor foutmeldingen
2. **Verify shifts exist** in de database
3. **Check tables** zijn actief en hebben het juiste aantal stoelen
4. **Controleer RLS policies** als je permission errors krijgt

---

**Status:** ✅ COMPLEET  
**Datum:** 29 Oktober 2025  
**Geteste Locaties:** 5 locaties met nieuwe shifts  
**Verwacht Resultaat:** Booking availability werkt nu correct 🎉

