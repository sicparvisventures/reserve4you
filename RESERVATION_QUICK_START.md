# 🚀 Reservatiesysteem - Quick Start

## ⚡ In 3 Stappen Klaar (5 minuten)

### Stap 1: Run SQL Script in Supabase ✅

```bash
1. Open Supabase Dashboard
2. Ga naar SQL Editor
3. Open: COMPLETE_RESERVATION_SYSTEM_SETUP.sql
4. Copy/paste de volledige inhoud
5. Klik "Run"
```

**✅ Je ziet:**
```
✅ Storage bucket "location-images" created
✅ Location image columns added
✅ Smart table assignment functions created
✅ Availability checking functions created
🎉 SETUP COMPLETE!
```

---

### Stap 2: Upload Hero Image ✅

1. Ga naar: `http://localhost:3007/manager/[tenantId]/location/[locationId]`
2. Klik op tab **"Instellingen"**
3. Upload **Hero Banner Afbeelding** (aanbevolen: 1920x600px)
4. Upload **Kaart Afbeelding** (aanbevolen: 800x600px)

**✅ Resultaat:**
- Hero banner is zichtbaar op `/p/korenmarkt11`
- Kaart afbeelding op homepage cards

---

### Stap 3: Test Reserveringen ✅

1. Ga naar: `http://localhost:3007/p/korenmarkt11`
2. Klik op **"Reserveren"** knop
3. Selecteer aantal personen
4. Kies een datum
5. **Zie beschikbare tijden** → Het werkt! 🎉

---

## 🎯 Wat Heb Je Nu?

### ✅ Hero Image Upload
- Manager kan hero banner uploaden in settings
- Zichtbaar op public location page
- Professional placeholder als geen afbeelding

### ✅ Smart Table Assignment
- Automatisch beste tafel kiezen voor groepsgrootte
- Exact match first (4 personen → 4-persoonstaf el)
- Kleinste passende tafel als geen exact match
- 15-minute buffer tussen reserveringen

### ✅ Real-time Availability
- Beschikbare tijden worden real-time berekend
- Alleen tafels die passen voor groepsgrootte
- Geen dubbele boekingen mogelijk
- Tijd slots: 11:00 - 22:00 (elke 30 minuten)

### ✅ Complete Booking Flow
1. Party size → 2. Date & time → 3. Guest details → Confirmed!
- Automatische email pre-fill voor logged-in users
- Tafel wordt automatisch toegewezen
- Zichtbaar in manager dashboard

---

## 🧪 Snelle Test

### Test 1: Hero Image
```
✓ Upload image in settings
✓ Refresh public page
✓ Hero banner verschijnt
```

### Test 2: Availability
```
✓ Open BookingSheet
✓ Selecteer 4 personen
✓ Kies morgen
✓ Zie beschikbare tijden
```

### Test 3: Booking
```
✓ Reserveer een tijd slot
✓ Vul details in
✓ Bevestig
✓ Check manager dashboard → Reservering daar!
```

---

## 📊 Database Functies

Nu beschikbaar in Supabase:

```sql
-- Vind beste tafel
SELECT * FROM find_best_table_for_booking(
  'location-id'::UUID,
  4, -- party size
  '2025-10-23 18:00:00+00'::TIMESTAMPTZ,
  '2025-10-23 20:00:00+00'::TIMESTAMPTZ
);

-- Check beschikbaarheid
SELECT * FROM get_available_time_slots(
  'location-id'::UUID,
  '2025-10-23'::DATE,
  4 -- party size
);

-- Capacity analytics
SELECT * FROM get_location_capacity(
  'location-id'::UUID,
  CURRENT_DATE
);
```

---

## 🔥 Belangrijke Features

### Smart Table Logic
- ✅ 2 personen → Kleinste tafel (2 seats)
- ✅ 4 personen → 4-persoonstaf el als beschikbaar
- ✅ 8 personen → Grote tafel of combine (toekomstig)
- ✅ Auto-optimalisatie voor beste utilization

### Availability Rules
- ✅ Alleen actieve tafels (`is_active = true`)
- ✅ Controleert bestaande reserveringen
- ✅ 15-minute buffer between bookings
- ✅ 2-hour default booking duration
- ✅ Respect voor location policies

### Performance
- ✅ Indexes voor snelle queries
- ✅ Efficient conflict detection
- ✅ Cached availability checks mogelijk
- ✅ Optimized SQL functions

---

## 📁 Nieuwe Files

| File | Wat Doet Het |
|------|--------------|
| `COMPLETE_RESERVATION_SYSTEM_SETUP.sql` | Main SQL setup - RUN THIS FIRST |
| `app/api/bookings/availability/route.ts` | API voor beschikbaarheid checks |
| `components/manager/LocationImageUpload.tsx` | Image upload component |
| `RESERVATION_SYSTEM_COMPLETE_GUIDE.md` | Uitgebreide documentatie |

---

## ✅ Checklist

- [ ] SQL script gerund in Supabase
- [ ] Hero banner geüpload
- [ ] Public page toont banner
- [ ] Reserveren knop opent BookingSheet
- [ ] Beschikbare tijden worden getoond
- [ ] Reservering succesvol aangemaakt
- [ ] Tafel correct toegewezen
- [ ] Manager ziet reservering

**Als alles ✅:** JE BENT KLAAR! 🎉

---

## 🆘 Hulp Nodig?

### Image werkt niet
→ Check: Bucket `location-images` in Supabase Storage

### Geen beschikbare tijden
→ Check: Zijn er actieve tafels?
```sql
SELECT * FROM tables WHERE location_id = 'YOUR_ID' AND is_active = true;
```

### API Error
→ Check: Supabase logs in Dashboard → Logs → Postgres

### Meer info
→ Lees: `RESERVATION_SYSTEM_COMPLETE_GUIDE.md`

---

**Tijd:** 5 minuten
**Moeilijkheid:** ⭐ (Makkelijk)
**Impact:** 🚀🚀🚀 (Complete booking system!)

