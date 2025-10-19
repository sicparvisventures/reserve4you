# Notifications System - Setup Instructies

## 🚀 Snelstart Gids

### Stap 1: Database Migratie Uitvoeren

#### Optie A: Via Supabase Dashboard (Aanbevolen)
1. Ga naar je Supabase project dashboard
2. Klik op "SQL Editor" in de sidebar
3. Open het bestand: `supabase/migrations/20250119000020_notifications_system.sql`
4. Kopieer de volledige inhoud
5. Plak in de SQL Editor
6. Klik "Run" of druk Ctrl+Enter
7. Wacht tot "Success" verschijnt

#### Optie B: Via Supabase CLI
```bash
cd /Users/dietmar/Desktop/ray2
supabase migration up
```

### Stap 2: Verificatie

Controleer of de tabel is aangemaakt:

```sql
-- In Supabase SQL Editor
SELECT * FROM notifications LIMIT 1;
```

Je zou een lege tabel moeten zien of een bericht dat de query succesvol was.

### Stap 3: Test Data Aanmaken

1. Haal je user_id op:
```sql
SELECT id, email FROM auth.users;
```

2. Kopieer je user_id

3. Open `CREATE_TEST_NOTIFICATIONS.sql`

4. Vervang **ALLE** drie instanties van `'YOUR_USER_ID_HERE'` met je echte user_id:
   - Regel 12: `v_user_id UUID := 'jouw-user-id-hier';`
   - Regel 163: `WHERE user_id = 'jouw-user-id-hier'`
   - Regel 173: `WHERE user_id = 'jouw-user-id-hier'`

5. Voer het script uit in Supabase SQL Editor

6. Je zou een success bericht moeten zien: "Test notifications created successfully"

### Stap 4: Bekijk Notificaties

1. Start de development server (als die nog niet draait):
```bash
cd /Users/dietmar/Desktop/ray2
pnpm dev
```

2. Open in je browser: `http://localhost:3007/notifications`

3. Je zou nu je test notificaties moeten zien!

## 📋 Wat is er Aangemaakt?

### Database
- ✅ `notifications` tabel met alle velden
- ✅ `notification_type` enum (14 types)
- ✅ `notification_priority` enum (4 levels)
- ✅ RLS policies voor security
- ✅ Indexes voor performance
- ✅ Helper functies (`create_notification`, `mark_notification_read`, etc.)
- ✅ Triggers voor auto-update timestamps

### API Routes
- ✅ `GET /api/notifications` - Haal notificaties op
- ✅ `POST /api/notifications` - Maak notificatie aan
- ✅ `PATCH /api/notifications/[id]` - Update notificatie
- ✅ `DELETE /api/notifications/[id]` - Verwijder notificatie
- ✅ `POST /api/notifications/mark-all-read` - Markeer alle als gelezen
- ✅ `GET /api/notifications/count` - Haal ongelezen aantal op

### Frontend
- ✅ `/app/notifications/page.tsx` - Server component
- ✅ `/app/notifications/NotificationsClient.tsx` - Client component met UI
- ✅ Sidebar navigatie met filters
- ✅ Mobile responsive design
- ✅ Real-time updates
- ✅ Empty states
- ✅ Loading states
- ✅ Success/error messages

### Documentatie
- ✅ `NOTIFICATIONS_SYSTEM.md` - Volledige documentatie
- ✅ `CREATE_TEST_NOTIFICATIONS.sql` - Test data script
- ✅ `NOTIFICATIONS_SETUP_INSTRUCTIONS.md` - Deze gids

## 🎨 Features

### Filters
- **Alle** - Alle notificaties
- **Ongelezen** - Alleen ongelezen notificaties (met badge)
- **Reserveringen** - Alleen booking-gerelateerde notificaties
- **Systeem** - Alleen systeem aankondigingen

### Actions
- ✅ Mark as read (individueel)
- ✅ Mark all as read (alle tegelijk)
- ✅ Delete notification (verwijderen)
- ✅ Click action (ga naar gerelateerde pagina)

### Design
- ✅ Ongelezen notificaties hebben coral border-left accent
- ✅ Priority colors op icon backgrounds
- ✅ Type-specific icons (Calendar, Mail, Bell, etc.)
- ✅ Hover states met border color changes
- ✅ Responsive sidebar/mobile tabs
- ✅ Empty states per filter
- ✅ Time ago display (Nederlands)

## 🧪 Testing Checklist

### Database Tests
- [ ] Migratie succesvol uitgevoerd
- [ ] Tabel `notifications` bestaat
- [ ] Enums zijn aangemaakt
- [ ] RLS policies zijn actief
- [ ] Test notificaties zijn aangemaakt

### API Tests
```bash
# Test 1: Get notifications
curl http://localhost:3007/api/notifications

# Test 2: Get unread only
curl http://localhost:3007/api/notifications?unread=true

# Test 3: Get unread count
curl http://localhost:3007/api/notifications/count

# Test 4: Mark as read (replace ID)
curl -X PATCH http://localhost:3007/api/notifications/YOUR_NOTIFICATION_ID \
  -H "Content-Type: application/json" \
  -d '{"read": true}'

# Test 5: Mark all as read
curl -X POST http://localhost:3007/api/notifications/mark-all-read

# Test 6: Delete notification (replace ID)
curl -X DELETE http://localhost:3007/api/notifications/YOUR_NOTIFICATION_ID
```

### Frontend Tests
- [ ] Pagina `/notifications` laadt zonder errors
- [ ] Test notificaties zijn zichtbaar
- [ ] Filters werken (All, Unread, Bookings, System)
- [ ] Mark as read werkt
- [ ] Mark all as read werkt
- [ ] Delete werkt
- [ ] Action buttons linken correct
- [ ] Empty states tonen correct
- [ ] Mobile responsive werkt
- [ ] Success/error messages tonen

## 🔧 Troubleshooting

### "Table already exists" error
De migratie probeert een bestaande tabel te maken. Run eerst:
```sql
DROP TABLE IF EXISTS notifications CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS notification_priority CASCADE;
```
Dan run de migratie opnieuw.

### "No notifications found"
Heb je test data aangemaakt? Controleer:
```sql
SELECT COUNT(*) FROM notifications WHERE user_id = 'jouw-user-id';
```

Als 0, run het `CREATE_TEST_NOTIFICATIONS.sql` script opnieuw.

### "Permission denied" errors
RLS policies werken. Zorg dat je ingelogd bent en dat je user_id correct is.

### API 500 errors
Check de console logs voor details. Meestal een Supabase connection issue.

## 📊 Database Queries

### Alle notificaties voor gebruiker
```sql
SELECT * FROM notifications 
WHERE user_id = 'jouw-user-id' 
ORDER BY created_at DESC;
```

### Ongelezen notificaties tellen
```sql
SELECT COUNT(*) FROM notifications 
WHERE user_id = 'jouw-user-id' 
AND read = FALSE 
AND archived = FALSE;
```

### Notificaties per type
```sql
SELECT type, COUNT(*) 
FROM notifications 
WHERE user_id = 'jouw-user-id'
GROUP BY type;
```

### Recente urgente notificaties
```sql
SELECT * FROM notifications 
WHERE user_id = 'jouw-user-id' 
AND priority = 'URGENT'
AND read = FALSE
ORDER BY created_at DESC;
```

## 🎯 Volgende Stappen

1. **Integreer notificaties in booking flow**
   - Maak notificatie bij booking confirmation
   - Maak notificatie bij booking cancellation
   - Schedule reminders voor upcoming bookings

2. **Update header om notification count te tonen**
   - Voeg badge toe aan Bell icon in header
   - Real-time updates via polling of Supabase Realtime

3. **Email notificaties** (optioneel)
   - Stuur email bij belangrijke notificaties
   - User preferences voor email notifications

4. **Push notificaties** (optioneel)
   - PWA push notifications
   - Browser notifications API

## ✅ Gereed!

Je notificatiesysteem is nu volledig opgezet en klaar voor gebruik!

Bezoek: `http://localhost:3007/notifications`

