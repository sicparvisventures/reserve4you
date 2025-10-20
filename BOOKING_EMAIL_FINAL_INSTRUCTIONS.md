# Booking Email - Final Instructions

## 🎉 Goed Nieuws!

Based op je database schema:
```
customer_email   | character varying | NO  (NOT NULL) ✅
customer_phone   | character varying | YES (nullable) ✅
```

**Je database is al correct geconfigureerd!**
- ✅ `customer_email` is al NOT NULL
- ✅ `customer_phone` is al optioneel

## 📋 Wat Je Moet Doen

### Stap 1: Verify Database Status

Run dit script om te checken of alles OK is:
```sql
-- In Supabase SQL Editor
-- Run: FIX_BOOKING_EMAIL_ALREADY_FIXED.sql
```

Dit toont je:
- Aantal bookings met/zonder email
- Of alle constraints correct zijn
- Of er actie nodig is

### Stap 2: (Alleen als er NULL emails zijn) Fix NULL Emails

Als het verify script zegt dat er bookings zonder email zijn, run:
```sql
-- In Supabase SQL Editor  
-- Run: FIX_NULL_EMAILS_SIMPLE.sql
```

### Stap 3: Deploy Frontend Code

De frontend code is al aangepast:
- ✅ `BookingSheet.tsx` - Email verplicht, phone optioneel
- ✅ `ReserveBookingModal.tsx` - Email verplicht, phone optioneel
- ✅ Validation schemas - Email verplicht
- ✅ Auto-fill voor ingelogde users

```bash
# Deploy de changes
git add .
git commit -m "feat: Email verplicht in booking flow + auto-fill"
git push
```

### Stap 4: Test

**Test 1: Homepage booking**
1. Ga naar `http://localhost:3007`
2. Klik "Reserveren" bij een restaurant
3. ✅ Email veld heeft sterretje (*)
4. ✅ Phone veld heeft "(optioneel)"
5. ✅ Probeer zonder email → error
6. ✅ Met email → werkt

**Test 2: Location page booking**
1. Ga naar `http://localhost:3007/p/korenmarkt11`
2. Klik "Reserveren"
3. ✅ Zelfde gedrag als homepage

**Test 3: Logged in user**
1. Login met Google
2. Probeer te reserveren
3. ✅ Email is ingevuld en readonly
4. ✅ Naam is ingevuld
5. ✅ Phone mag leeg blijven

## 🔍 Waarom Werkten De Andere Scripts Niet?

De `FIX_BOOKING_EMAIL_REQUIRED_DYNAMIC.sql` en `20250120000001_booking_email_required.sql` hadden een syntax error:

```sql
-- Probleem: '+' in format() string
REPLACE(%I, '+', '') || '@gast.reserve4you.be'
-- Error: unrecognized format() type specifier "+"
```

**Maar**: Je hebt deze scripts niet nodig! Je database is al correct!

## ✅ Checklist

- [x] Database schema heeft `customer_email` NOT NULL
- [x] Database schema heeft `customer_phone` nullable
- [ ] Run `FIX_BOOKING_EMAIL_ALREADY_FIXED.sql` om te verifiëren
- [ ] (Optioneel) Run `FIX_NULL_EMAILS_SIMPLE.sql` als er NULL emails zijn
- [ ] Deploy frontend code
- [ ] Test beide booking flows (homepage + location page)
- [ ] Test met ingelogde user

## 📊 Expected Results

Na deployment:

**Homepage (`/`):**
- ReserveBookingModal gebruikt `customer_email`, `customer_name`, `customer_phone`
- Email verplicht, phone optioneel
- Auto-fill voor logged in users

**Location Page (`/p/[slug]`):**
- BookingSheet gebruikt API die naar `guest_email` probeert te schrijven
- **MAAR**: De API route moet aangepast worden om `customer_*` te gebruiken!

## ⚠️ Laatste Stap: Check API Route

De `BookingSheet` gebruikt `/api/bookings/create` die schrijft naar:
- `guest_email`
- `guest_name`  
- `guest_phone`

Maar je database heeft:
- `customer_email`
- `customer_name`
- `customer_phone`

**Oplossing**: Check of je een migration hebt die `guest_*` columns toevoegt, OF pas de API aan om `customer_*` te gebruiken.

Laat me weten welke route je wilt nemen!

---

**Summary:**
- ✅ Database is al correct
- ✅ Frontend code is aangepast
- ⚠️ Mogelijk API mismatch tussen guest_* en customer_* columns
- 🚀 Deploy en test!

