# 🚀 START HIER - Reserveringssysteem (Final)

## TL;DR (3 minuten)

```sql
-- 1. Cleanup (Supabase SQL Editor)
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.tables CASCADE;

-- 2. Setup (Kopieer ALLE 598 regels van SETUP_RESERVATIONS_COMPLETE.sql)
-- Run in Supabase SQL Editor
```

```bash
# 3. Herstart
pnpm dev
```

```
# 4. Test
http://localhost:3007
Klik "Reserveren"
✅ KLAAR!
```

---

## ✨ Wat is Nieuw?

### iPhone-Style Kalender
- ✅ Scroll verticaal door 3 maanden
- ✅ Elke maand heeft eigen sectie
- ✅ Smooth scrolling
- ✅ Duidelijke dag selectie

### Max 8 Personen
- ✅ Was 12, nu 8 (professioneler)
- ✅ Grid van 4x2

### Datum + Tijd in 1 Scherm
- ✅ Kalender bovenin (scrollable)
- ✅ Tijden onderaan (sticky)
- ✅ Betere UX

### Database
- ✅ Alles wordt correct opgeslagen
- ✅ booking_date, booking_time
- ✅ number_of_guests (1-8)
- ✅ customer info
- ✅ special_requests

---

## 🎯 Flow

```
1. Klik "Reserveren" op restaurant card
   ↓
2. STAP 1: Kies 1-8 personen
   [1] [2] [3] [4]
   [5] [6] [7] [8]
   Klik "Verder"
   ↓
3. STAP 2: Datum & Tijd
   📅 Scroll door 3 maanden kalender
   → Klik datum
   ⏰ Zie beschikbare tijden (groen/grijs)
   → Klik tijd
   Auto naar stap 3
   ↓
4. STAP 3: Gegevens
   Samenvatting (4 personen, datum, tijd)
   Naam, Email, Telefoon
   Speciale wensen
   Klik "Bevestigen"
   ↓
5. SUCCESS! 🎉
   Bevestiging scherm
   Data opgeslagen in Supabase
```

---

## ✅ Checklist

- [ ] SQL cleanup uitgevoerd
- [ ] SQL setup succesvol (geen errors!)
- [ ] Dev server herstart
- [ ] Modal opent
- [ ] Kan 1-8 personen kiezen (geen 9-12!)
- [ ] Kalender scrollt
- [ ] Kan datum selecteren
- [ ] Tijden tonen (groen = beschikbaar)
- [ ] Kan tijd selecteren
- [ ] Gegevens invullen werkt
- [ ] Bevestiging werkt
- [ ] Booking in Supabase database

---

## 🐛 Als Het Niet Werkt

### SQL Error
→ Download nieuwe `SETUP_RESERVATIONS_COMPLETE.sql`

### Rare Kalender Layout
→ Hard refresh (Cmd+Shift+R)

### Kan Meer Dan 8 Personen Kiezen
→ Check dat `ReserveBookingModal` wordt gebruikt

### Geen Tijden
→ Voeg tafels toe in location management

---

## 📚 Meer Info

- `FINAL_RESERVATIONS_FIX.md` - Complete guide
- `SETUP_RESERVATIONS_COMPLETE.sql` - Database script

---

## 🎉 Klaar!

✅ Max 8 personen  
✅ iPhone-style kalender  
✅ Scrollable maanden  
✅ Professional design  
✅ Alles wordt opgeslagen  
✅ Reserve4You branding  

**Test en deploy!** 🚀

