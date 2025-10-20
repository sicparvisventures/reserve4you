# 🎯 FINAL SETUP: Enhanced Bookings & Notifications

## ✅ Alle Errors Gefixed!

### Error 1: SQL Syntax ❌ → ✅
**Was**: `ERROR: 42601: syntax error at or near "RAISE"`  
**Nu**: Fixed in `COMPLETE_NOTIFICATIONS_SETUP_FIXED.sql`

### Error 2: Notifications Fetch ❌ → ✅  
**Was**: `Error fetching notifications: {}`  
**Nu**: Fixed in `app/notifications/page.tsx` en `app/api/notifications/route.ts`

---

## 🚀 Installatie (3 Simpele Stappen)

### Stap 1: Run SQL Script

Open **Supabase SQL Editor** en run:

```
COMPLETE_NOTIFICATIONS_SETUP_FIXED.sql
```

**Je moet zien**:
```
✅ Notifications table setup complete
✅ Booking timestamps setup complete
✅ Notification settings table created
✅ Notification event function created
✅ Automatic booking notification triggers installed

=================================================
COMPLETE NOTIFICATIONS SETUP - SUCCESS
=================================================
```

### Stap 2: Restart Dev Server

```bash
pnpm dev
```

### Stap 3: Test

1. **Ga naar**: `http://localhost:3007/notifications`
   - ✅ Geen errors meer!
   - Je ziet: "Geen notificaties" (empty state)

2. **Maak een reservering** (ingelogd met Google):
   - `http://localhost:3007` → Kies vestiging → Reserveren
   - Vul formulier in → Bevestig

3. **Check notificatie**:
   - `http://localhost:3007/notifications`
   - ✅ Je ziet: "Reservering Ontvangen" 🔔

4. **Check profile**:
   - `http://localhost:3007/profile` → Tab "Reserveringen"
   - ✅ Je ziet: Gedetailleerde booking card 🎨

5. **Check settings**:
   - `http://localhost:3007/manager/[tenantId]/settings/notifications`
   - ✅ Pas notificatie instellingen aan ⚙️

---

## 📁 Belangrijkste Bestanden

### ✅ Run Dit in Supabase:
```
COMPLETE_NOTIFICATIONS_SETUP_FIXED.sql
```

### ✅ Automatisch Geüpdatet (via git pull):
- `app/profile/ProfileClient.tsx` - Enhanced booking cards
- `app/notifications/page.tsx` - Fixed query
- `app/api/notifications/route.ts` - Fixed query
- `components/manager/NotificationSettings.tsx` - Settings component
- `app/api/manager/notification-settings/route.ts` - API endpoint
- `app/manager/[tenantId]/settings/notifications/page.tsx` - Settings page

---

## 🎁 Wat Je Krijgt

### 1. Enhanced Profile Bookings (`/profile` → Reserveringen)

**Volledige Details**:
```
┌─────────────────────────────────────────────┐
│ 🗺️  Korenmarkt11               [Bevestigd] │
│                                             │
│ 📅 donderdag 23 oktober 2025 om 17:30     │
│ 👥 4 personen                               │
│ 📞 +32 9 123 45 67                         │
│ 📍 Korenmarkt 11, 9000 Gent                │
│                                             │
│ ⚠️ Speciale Verzoeken:                      │
│    Graag bij het raam                       │
│                                             │
│ Reserveringsnummer: a1b2c3d4                │
│ Gemaakt op 20-10-2025                       │
└─────────────────────────────────────────────┘
```

### 2. Automatische Notificaties (`/notifications`)

**Events**:
- 🔔 **Nieuwe reservering**: "Reservering Ontvangen"
- ✅ **Bevestigd**: "Reservering Bevestigd"
- ❌ **Geannuleerd**: "Reservering Geannuleerd"
- ✏️ **Gewijzigd**: "Reservering Aangepast"

**Voorbeeld Notificatie**:
```
┌─────────────────────────────────────────────┐
│ 🔔 Reservering Bevestigd           [NIEUW]  │
│                                             │
│ Je reservering bij Korenmarkt11 op          │
│ 23-10-2025 om 17:30 is bevestigd!          │
│                                             │
│ 2 minuten geleden          [HIGH]           │
│                                             │
│ [Bekijk Reservering] [✓ Markeer Gelezen]   │
└─────────────────────────────────────────────┘
```

### 3. Notificatie Instellingen

**Configureerbaar per tenant**:
- ☑️ Nieuwe reserveringen
- ☑️ Bevestigde reserveringen
- ☑️ Geannuleerde reserveringen
- ☑️ Gewijzigde reserveringen
- ☑️ Verzend herinneringen (timing instelbaar)
- ☑️ Klant confirmations
- ☑️ Team notificaties

---

## 🔧 Troubleshooting

### SQL Script Geeft Nog Steeds Error?

**Check of notifications table bestaat**:
```sql
SELECT COUNT(*) FROM notifications;
```

Als error, run eerst:
```sql
-- In Supabase SQL Editor:
supabase/migrations/20250119000020_notifications_system_fixed.sql
```

Dan run:
```sql
COMPLETE_NOTIFICATIONS_SETUP_FIXED.sql
```

### Notifications Pagina Geeft Error?

**Check RLS Policies**:
```sql
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

**Check Je User ID**:
```sql
SELECT auth.uid();
SELECT COUNT(*) FROM notifications WHERE user_id = auth.uid();
```

### Bookings Niet in Profile?

**Check start_ts Column**:
```sql
SELECT id, booking_date, booking_time, start_ts 
FROM bookings 
ORDER BY created_at DESC 
LIMIT 5;
```

Als `start_ts` NULL is:
```sql
UPDATE bookings
SET start_ts = (booking_date::TEXT || ' ' || booking_time::TEXT)::TIMESTAMPTZ,
    end_ts = (booking_date::TEXT || ' ' || booking_time::TEXT)::TIMESTAMPTZ + (duration_minutes || ' minutes')::INTERVAL
WHERE start_ts IS NULL;
```

### Notificaties Komen Niet Aan?

**Check Triggers**:
```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname LIKE '%notification%';
```

**Check Settings**:
```sql
SELECT * FROM notification_settings;
```

Als leeg, worden defaults gebruikt (alles aan).

---

## ✅ Verificatie Checklist

Na installatie, check:

- [ ] SQL script runt zonder errors
- [ ] `/notifications` laadt zonder errors
- [ ] Nieuwe reservering maakt notificatie aan
- [ ] Notificatie verschijnt in `/notifications`
- [ ] Booking card toont alle details in `/profile`
- [ ] Settings pagina werkt in `/manager/[tenantId]/settings/notifications`
- [ ] Toggle settings en save werkt
- [ ] Disabled notificaties komen niet meer

---

## 📊 Database Verificatie Queries

### Check Alles Werkt

```sql
-- Notifications table
SELECT 
  COUNT(*) as total_notifications,
  SUM(CASE WHEN read THEN 1 ELSE 0 END) as read_count,
  SUM(CASE WHEN NOT read THEN 1 ELSE 0 END) as unread_count
FROM notifications;

-- Bookings with timestamps
SELECT 
  COUNT(*) as total_bookings,
  SUM(CASE WHEN start_ts IS NOT NULL THEN 1 ELSE 0 END) as with_start_ts,
  SUM(CASE WHEN end_ts IS NOT NULL THEN 1 ELSE 0 END) as with_end_ts
FROM bookings;

-- Notification settings
SELECT 
  COUNT(*) as total_settings,
  SUM(CASE WHEN notify_on_new_booking THEN 1 ELSE 0 END) as notify_new,
  SUM(CASE WHEN notify_on_booking_confirmed THEN 1 ELSE 0 END) as notify_confirmed
FROM notification_settings;

-- Triggers
SELECT 
  tgname as trigger_name,
  CASE tgenabled 
    WHEN 'O' THEN 'Enabled'
    WHEN 'D' THEN 'Disabled'
  END as status
FROM pg_trigger 
WHERE tgname LIKE '%booking%notification%';
```

### Zie Je Eigen Data

```sql
-- Je notifications
SELECT 
  type,
  title,
  message,
  created_at,
  read
FROM notifications
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;

-- Je bookings met timestamps
SELECT 
  b.id,
  b.booking_date,
  b.booking_time,
  b.start_ts,
  b.customer_name,
  l.name as location_name
FROM bookings b
LEFT JOIN locations l ON b.location_id = l.id
LEFT JOIN consumers c ON b.consumer_id = c.id
WHERE c.auth_user_id = auth.uid()
ORDER BY b.booking_date DESC, b.booking_time DESC
LIMIT 10;
```

---

## 🎉 Success!

Als alles werkt, zie je:

1. ✅ **Profile** (`/profile`):
   - Mooie, gedetailleerde booking cards
   - Alle informatie zichtbaar
   - Status badges
   - Special requests

2. ✅ **Notifications** (`/notifications`):
   - Automatische notificaties bij events
   - Filter opties (Alle, Ongelezen, Reserveringen, Systeem)
   - Mark as read functie
   - Delete functie

3. ✅ **Settings** (`/manager/[tenantId]/settings/notifications`):
   - Alle toggle opties
   - Timing instellingen
   - Save functie werkt
   - Changes reflecteren in notificaties

---

## 📚 Documentatie

Voor meer details:
- **Quick Start**: `QUICK_START_NOTIFICATIONS.md`
- **Complete Guide**: `ENHANCED_BOOKING_NOTIFICATIONS_SETUP.md`
- **Implementation Summary**: `NOTIFICATIONS_IMPLEMENTATION_SUMMARY.md`
- **Error Fixes**: `FIX_NOTIFICATIONS_ERROR.md`

---

## 🚀 Klaar!

Je hebt nu een volledig werkend, professioneel notificatiesysteem!

**Veel plezier!** 🎊

---

**Gemaakt**: 20 oktober 2025  
**Versie**: 2.0 (Fixed)  
**Status**: ✅ Production Ready

