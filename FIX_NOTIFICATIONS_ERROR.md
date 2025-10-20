# Fix Notifications Error

## Problemen Opgelost

### 1. SQL Syntax Error ❌ → ✅
**Error**: `ERROR: 42601: syntax error at or near "RAISE"`

**Oplossing**: `RAISE NOTICE` moet binnen een `DO $$` block staan.

**Fixed File**: `COMPLETE_NOTIFICATIONS_SETUP_FIXED.sql`

### 2. Notifications Fetch Error ❌ → ✅
**Error**: `Error fetching notifications: {}`

**Probleem**: Query probeerde kolommen te joinen die mogelijk nog niet bestaan (`start_ts`, `party_size`).

**Oplossing**: Vereenvoudigde query die alleen notifications tabel selecteert.

**Fixed Files**:
- `app/notifications/page.tsx`
- `app/api/notifications/route.ts`

## 🚀 Installatie Stappen

### Stap 1: Run Fixed SQL Script

In **Supabase SQL Editor**:

```sql
-- Run dit bestand:
COMPLETE_NOTIFICATIONS_SETUP_FIXED.sql
```

✅ Dit zou nu zonder errors moeten werken!

### Stap 2: Restart Dev Server

```bash
pnpm dev
```

### Stap 3: Test Notifications

```
http://localhost:3007/notifications
```

✅ De error zou nu weg moeten zijn!

## Wat Was Het Probleem?

### SQL Error

**Voor (❌)**:
```sql
-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_start_ts ON bookings(start_ts);

RAISE NOTICE '✅ Done';  -- ❌ SYNTAX ERROR!
```

**Na (✅)**:
```sql
-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_start_ts ON bookings(start_ts);

DO $$
BEGIN
  RAISE NOTICE '✅ Done';  -- ✅ WORKS!
END $$;
```

### Notifications Query Error

**Voor (❌)**:
```typescript
.select(`
  *,
  booking:bookings(
    id,
    start_ts,  // ❌ Column might not exist yet
    party_size,  // ❌ Wrong column name (should be number_of_guests)
    location:locations(name, slug)
  ),
  location:locations(name, slug),
  tenant:tenants(name)
`)
```

**Na (✅)**:
```typescript
.select(`
  *  // ✅ Just get all notification fields
`)
```

## Waarom Vereenvoudigd?

De notification data heeft al alle info die we nodig hebben:
- `booking_id` → Link naar booking
- `location_id` → Link naar location
- `tenant_id` → Link naar tenant
- `title` → "Reservering Bevestigd"
- `message` → Volledige message met details
- `action_url` → `/profile?tab=bookings`

We hoeven niet te joinen met andere tabellen omdat:
1. De message bevat al alle relevante info
2. De action_url linkt naar de juiste pagina
3. Het voorkomt errors als kolommen nog niet bestaan
4. Het is sneller en simpeler

## Test Het

### Test 1: SQL Script
```sql
-- Run in Supabase SQL Editor:
COMPLETE_NOTIFICATIONS_SETUP_FIXED.sql

-- Je moet zien:
✅ Notifications table setup complete
✅ Booking timestamps setup complete
✅ Notification settings table created
✅ Notification event function created
✅ Automatic booking notification triggers installed
=================================================
COMPLETE NOTIFICATIONS SETUP - SUCCESS
=================================================
```

### Test 2: Notifications Page
```
1. Ga naar: http://localhost:3007/notifications
2. ✅ Geen errors meer!
3. Je ziet ofwel:
   - Lege staat: "Geen notificaties"
   - Of: Lijst met notificaties
```

### Test 3: Maak Notificatie
```
1. Maak een reservering (ingelogd)
2. Ga naar /notifications
3. ✅ Je ziet: "Reservering Ontvangen"
```

## Troubleshooting

### SQL script nog steeds errors?

**Check of notifications table bestaat**:
```sql
SELECT * FROM notifications LIMIT 1;
```

Als het niet bestaat, run eerst:
```sql
supabase/migrations/20250119000020_notifications_system_fixed.sql
```

Dan run:
```sql
COMPLETE_NOTIFICATIONS_SETUP_FIXED.sql
```

### Notifications pagina nog steeds error?

**Check RLS policies**:
```sql
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

Je moet deze policies zien:
- "Users can view own notifications"
- "Users can update own notifications"
- "Users can delete own notifications"
- "System can insert notifications"

**Check of je user_id juist is**:
```sql
SELECT auth.uid();  -- Moet je UUID teruggeven
SELECT COUNT(*) FROM notifications WHERE user_id = auth.uid();
```

### Nog steeds problemen?

**Volledige reset**:
```sql
-- 1. Drop alles
DROP TRIGGER IF EXISTS booking_created_notification ON bookings;
DROP TRIGGER IF EXISTS booking_updated_notification ON bookings;
DROP FUNCTION IF EXISTS notify_booking_event CASCADE;
DROP TABLE IF EXISTS notification_settings CASCADE;

-- 2. Run complete setup
-- (Run COMPLETE_NOTIFICATIONS_SETUP_FIXED.sql)
```

## ✅ Klaar!

Na deze fixes zou alles moeten werken:
- ✅ SQL script runt zonder errors
- ✅ Notifications pagina laadt zonder errors
- ✅ Nieuwe bookings triggeren notificaties
- ✅ Settings pagina werkt

**Next**: Maak een test reservering om te verifiëren! 🎉

