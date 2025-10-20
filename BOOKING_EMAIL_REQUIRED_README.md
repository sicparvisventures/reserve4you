# Booking Email Required - Complete Implementation

## 🎯 Wat is er gewijzigd?

### Probleem
- Email was optioneel in booking forms
- Telefoonnummer was verplicht
- Database gaf null constraint errors wanneer email niet werd ingevuld
- Geen auto-fill voor ingelogde gebruikers

### Oplossing
✅ **Email is nu verplicht** (met sterretje *)  
✅ **Telefoonnummer is nu optioneel** (met label "(optioneel)")  
✅ **Auto-fill voor ingelogde gebruikers** met Google OAuth data  
✅ **Database constraint** - guest_email is NOT NULL  
✅ **Validation schemas** aangepast in frontend en backend  

## 📁 Gewijzigde Bestanden

### 1. Validation Schemas
**Bestand**: `lib/validation/booking.ts`

**Wijzigingen**:
- `bookingCreateSchema`: email is nu verplicht, phone optioneel
- `guestFormSchema`: email is nu verplicht, phone optioneel

```typescript
// Voor
guest_phone: verplicht
guest_email: optioneel

// Na
guest_email: verplicht ✅
guest_phone: optioneel ✅
```

### 2. BookingSheet Component
**Bestand**: `components/booking/BookingSheet.tsx`

**Wijzigingen**:
- ✅ Email veld komt nu VOOR phone veld
- ✅ Email label: "E-mailadres *"
- ✅ Phone label: "Telefoonnummer (optioneel)"
- ✅ Auto-load user data bij open modal
- ✅ Auto-fill name, email, phone voor ingelogde users
- ✅ Email veld is readonly als user ingelogd is
- ✅ Correcte volgorde in API call

**Auto-fill logica**:
```typescript
// Bij modal open:
1. Check of user ingelogd is (supabase.auth.getUser())
2. Zoek consumer record op auth_user_id
3. Fill form met consumer data (of auth.user data als fallback)
4. Email is readonly voor ingelogde users
```

### 3. ReserveBookingModal Component
**Bestand**: `components/booking/ReserveBookingModal.tsx`

**Wijzigingen**:
- ✅ Email veld komt nu VOOR phone veld
- ✅ Email label: "E-mailadres *"  
- ✅ Phone label: "Telefoonnummer (optioneel)"
- ✅ Auto-load user data bij stap 3
- ✅ Email validation in handleReserve functie
- ✅ Email veld is readonly + required voor ingelogde users

**Validatie**:
```typescript
// Nieuwe validatie
if (!name || !email) {
  setError('Vul naam en e-mailadres in');
}

// Email format check
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  setError('Vul een geldig e-mailadres in');
}
```

### 4. Database Migraties

#### Bestand: `FIX_BOOKING_EMAIL_REQUIRED.sql`
Standalone script voor directe uitvoering in Supabase Dashboard.

**Wat het doet**:
1. ✅ Update NULL guest_email values met fallback emails
2. ✅ Voegt NOT NULL constraint toe aan guest_email
3. ✅ Update customer_email als die kolom bestaat
4. ✅ Voegt email validation constraint toe
5. ✅ Maakt index op guest_email
6. ✅ Rapport met statistieken

#### Bestand: `supabase/migrations/20250120000001_booking_email_required.sql`
Proper Supabase migratie voor version control.

**Wat het doet**:
1. ✅ Fix bestaande NULL emails
2. ✅ guest_email NOT NULL constraint
3. ✅ guest_phone DROP NOT NULL (optioneel maken)
4. ✅ Email format validation
5. ✅ Index aanmaken

## 🚀 Deployment Instructies

### Stap 1: Run Database Migratie

**Optie A: Via Supabase Dashboard** (aangeraden voor productie)
```sql
-- Open Supabase Dashboard → SQL Editor
-- Plak inhoud van FIX_BOOKING_EMAIL_REQUIRED.sql
-- Klik "Run"
```

**Optie B: Via Supabase CLI**
```bash
# De migratie staat al in de migrations folder
supabase db push

# Of manual:
supabase db reset --local
```

### Stap 2: Verify Database Changes

Run deze query om te checken:
```sql
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'bookings' 
  AND column_name IN ('guest_email', 'guest_phone', 'customer_email', 'customer_phone')
ORDER BY column_name;
```

**Verwacht resultaat**:
- `guest_email`: `is_nullable = 'NO'` ✅
- `guest_phone`: `is_nullable = 'YES'` ✅

### Stap 3: Deploy Code Changes

```bash
# Commit alle wijzigingen
git add .
git commit -m "feat: Email verplicht, phone optioneel + auto-fill voor ingelogde users"
git push

# Deploy naar Vercel/productie
```

### Stap 4: Test de Flow

**Test 1: Niet-ingelogde gebruiker**
1. Ga naar `http://localhost:3007`
2. Klik op "Reserveren" bij een restaurant
3. Selecteer datum, tijd, aantal personen
4. ✅ Check: Email veld heeft sterretje (*)
5. ✅ Check: Phone veld heeft "(optioneel)"
6. ✅ Probeer zonder email → error message
7. ✅ Vul email in → booking werkt

**Test 2: Ingelogde gebruiker (Google OAuth)**
1. Login met Google account
2. Ga naar een restaurant pagina (`/p/korenmarkt11`)
3. Klik "Reserveren"
4. Selecteer datum, tijd, aantal personen
5. ✅ Check: Name is automatisch ingevuld
6. ✅ Check: Email is automatisch ingevuld EN readonly
7. ✅ Check: Phone is leeg (optioneel)
8. ✅ Klik "Bevestigen" → booking werkt direct

**Test 3: Bestaande bookings**
1. Check `/manager/{tenantId}/dashboard`
2. ✅ Alle oude bookings hebben nu een email
3. ✅ Placeholder emails eindigen op `@gast.reserve4you.be`

## 🎨 UI/UX Changes

### Voor
```
┌─────────────────────────────────┐
│ Naam *                          │
│ ┌─────────────────────────────┐ │
│ │ [input]                     │ │
│ └─────────────────────────────┘ │
│                                 │
│ Telefoonnummer *                │  ← Verplicht
│ ┌─────────────────────────────┐ │
│ │ [input]                     │ │
│ └─────────────────────────────┘ │
│                                 │
│ E-mailadres (optioneel)         │  ← Optioneel
│ ┌─────────────────────────────┐ │
│ │ [input]                     │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Na
```
┌─────────────────────────────────┐
│ Naam *                          │
│ ┌─────────────────────────────┐ │
│ │ [input]                     │ │
│ └─────────────────────────────┘ │
│                                 │
│ E-mailadres *                   │  ← Verplicht ✅
│ ┌─────────────────────────────┐ │
│ │ [Auto-filled if logged in] │ │  ← Auto-fill ✅
│ └─────────────────────────────┘ │
│                                 │
│ Telefoonnummer (optioneel)      │  ← Optioneel ✅
│ ┌─────────────────────────────┐ │
│ │ [input]                     │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

## 🔍 Auto-Fill Logic Details

### Voor Ingelogde Gebruikers

**Stap 1**: Check Authentication
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

**Stap 2**: Zoek Consumer Record
```typescript
const { data: consumer } = await supabase
  .from('consumers')
  .select('*')
  .eq('auth_user_id', user.id)
  .single();
```

**Stap 3**: Fill Form
```typescript
if (consumer) {
  // Use consumer data
  setValue('name', consumer.name);
  setValue('email', consumer.email);  // Readonly!
  setValue('phone', consumer.phone);
} else {
  // Use auth.user data
  setValue('name', user.user_metadata?.full_name);
  setValue('email', user.email);      // Readonly!
  setValue('phone', user.phone);
}
```

### Data Prioriteit
1. **consumer.name** → fallback user.user_metadata.full_name → fallback email username
2. **consumer.email** → fallback user.email (Google OAuth email)
3. **consumer.phone** → fallback user.phone → fallback empty (optioneel)

## 📊 Database Schema Changes

### bookings tabel

**Voor**:
```sql
guest_email VARCHAR(255) NULL,          -- Optioneel
guest_phone VARCHAR(20) NOT NULL,       -- Verplicht
```

**Na**:
```sql
guest_email VARCHAR(255) NOT NULL,      -- Verplicht ✅
guest_phone VARCHAR(20) NULL,           -- Optioneel ✅

CONSTRAINT bookings_guest_email_valid 
  CHECK (guest_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

### Fallback Email Format

Voor oude bookings zonder email:
```
Based on phone:  32612345678@gast.reserve4you.be
Based on name:   john.doe@gast.reserve4you.be
Based on ID:     gast.a1b2c3d4@gast.reserve4you.be
```

## 🐛 Troubleshooting

### Error: "null value in column guest_email violates not-null constraint"

**Oorzaak**: Database migratie nog niet uitgevoerd

**Oplossing**:
```sql
-- Run in Supabase SQL Editor
\i FIX_BOOKING_EMAIL_REQUIRED.sql
```

### Error: Email veld niet readonly voor ingelogde user

**Check 1**: Is user daadwerkelijk ingelogd?
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user); // Should not be null
```

**Check 2**: Wordt loadUserData aangeroepen?
```typescript
// Check browser console voor logs
// Zou je "Error loading user data" moeten zien als het faalt
```

### Auto-fill werkt niet

**Check 1**: Consumer record bestaat?
```sql
SELECT * FROM consumers WHERE auth_user_id = '[user-id]';
```

**Check 2**: Auth user heeft email?
```sql
SELECT id, email FROM auth.users WHERE id = '[user-id]';
```

**Fix**: Run het consumer fix script uit eerdere sessie:
```sql
-- FIX_CONSUMER_BOOKINGS.sql
-- Dit linkt auth users aan consumers
```

## ✅ Checklist voor Deployment

- [ ] Database migratie uitgevoerd
- [ ] Verification query gecontroleerd (guest_email is NOT NULL)
- [ ] Code deployed naar productie
- [ ] Test: Booking zonder email → error message
- [ ] Test: Booking met email → werkt
- [ ] Test: Ingelogde user → auto-fill werkt
- [ ] Test: Email readonly voor ingelogde user
- [ ] Test: Phone is optioneel
- [ ] Oude bookings hebben fallback emails
- [ ] Booking detail modal toont emails correct

## 🎉 Resultaat

**Voor ingelogde gebruikers**:
- ✅ Velden zijn automatisch ingevuld
- ✅ Email is readonly (kan niet aangepast worden)
- ✅ Alleen aantal personen, datum en tijd selecteren
- ✅ Direct bevestigen en klaar!

**Voor niet-ingelogde gebruikers**:
- ✅ Email is verplicht met duidelijk sterretje
- ✅ Phone is optioneel
- ✅ Duidelijke validatie error messages

**Voor restaurant managers**:
- ✅ Alle bookings hebben nu verplicht een email
- ✅ Betere communicatie met gasten mogelijk
- ✅ Email notificaties werken altijd

---

**Created**: 2025-01-20  
**Author**: AI Assistant  
**Status**: ✅ Complete - Ready for deployment

