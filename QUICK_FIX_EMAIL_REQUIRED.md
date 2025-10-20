# Quick Fix: Email Required Error

## 🐛 Probleem

Je krijgt deze error:
```
ERROR: 42703: column "guest_email" does not exist
```

Dit betekent dat jouw bookings tabel `customer_email` gebruikt in plaats van `guest_email`.

## ✅ Oplossing

### Stap 1: Check welke kolommen je hebt

Run dit in Supabase SQL Editor:

```sql
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings' 
  AND column_name LIKE '%email%' 
  OR column_name LIKE '%phone%'
  OR column_name LIKE '%name%';
```

### Stap 2: Run de DYNAMISCHE fix script

**Gebruik**: `FIX_BOOKING_EMAIL_REQUIRED_DYNAMIC.sql`

Dit script:
- ✅ Detecteert automatisch of je `guest_*` of `customer_*` kolommen hebt
- ✅ Gebruikt de juiste kolom namen
- ✅ Fix alle NULL emails
- ✅ Maakt email verplicht
- ✅ Maakt phone optioneel

**Instructies**:
1. Open Supabase Dashboard
2. Ga naar SQL Editor
3. Open `FIX_BOOKING_EMAIL_REQUIRED_DYNAMIC.sql`
4. Klik "Run"
5. ✅ Klaar!

### Stap 3: Verify

Je zou dit moeten zien:
```
=================================================
FIX BOOKING EMAIL REQUIRED - DYNAMIC
=================================================
Detected: customer_* columns (of guest_* columns)
Total bookings: X
Bookings with NULL/empty email: Y
=================================================
✅ Fixed Y bookings with NULL/empty email
✅ customer_email is now NOT NULL (of guest_email)
✅ customer_phone is now nullable (of guest_phone)
✅ Added email format validation
✅ Created index on customer_email
=================================================
COMPLETE!
=================================================
```

## 📝 Waarom gebeurt dit?

Je database heeft één van deze twee schema's:

**Schema A**: (nieuwer)
- `guest_email`
- `guest_name`
- `guest_phone`

**Schema B**: (ouder)
- `customer_email`
- `customer_name`
- `customer_phone`

Het dynamische script werkt met BEIDE!

## 🔧 Als je nog steeds errors krijgt

Run eerst deze diagnostic query:

```sql
-- Show ALL columns in bookings table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;
```

Stuur de output naar mij en ik help je verder!

## 🚀 Na de fix

De code verwacht beide kolom namen te ondersteunen:
- `ReserveBookingModal` gebruikt `customer_email`, `customer_name`, `customer_phone`
- `BookingSheet` gebruikt beide afhankelijk van de API

Beide zouden moeten werken na de fix!

