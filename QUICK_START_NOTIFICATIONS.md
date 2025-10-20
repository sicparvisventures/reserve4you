# 🚀 Quick Start: Enhanced Bookings & Notifications

## Wat Krijg Je?

1. **Mooie booking cards** in `/profile` → Reserveringen
   - Volledige details (datum, tijd, aantal personen, telefoonnummer)
   - Speciale verzoeken zichtbaar
   - Location adres
   - Status badges

2. **Automatische notificaties** in `/notifications`
   - Bij nieuwe reservering → "Reservering Ontvangen"
   - Bij bevestiging → "Reservering Bevestigd" 
   - Bij annulering → "Reservering Geannuleerd"
   - Bij wijziging → "Reservering Aangepast"

3. **Notificatie instellingen** in `/manager/[tenantId]/settings/notifications`
   - Per tenant aanpasbaar
   - Toggle per event type
   - Herinnering timing instelbaar

## 📦 Installatie (3 Stappen)

### Stap 1: Run SQL Script

In **Supabase SQL Editor**:

```sql
-- Run dit bestand:
COMPLETE_NOTIFICATIONS_SETUP.sql
```

Dit installeert alles in één keer:
- ✅ Booking timestamps (start_ts, end_ts)
- ✅ Notification settings table
- ✅ Automatic triggers
- ✅ Helper functions
- ✅ RLS policies

### Stap 2: Verifieer Notifications Table

Als je nog geen notifications table hebt, run ook:

```sql
-- In Supabase SQL Editor:
supabase/migrations/20250119000020_notifications_system_fixed.sql
```

### Stap 3: Restart Dev Server

```bash
pnpm dev
```

## ✅ Test Het

### 1. Maak een Reservering

```
http://localhost:3007
→ Kies een vestiging
→ Klik "Reserveren"
→ Vul formulier in (met Google ingelogd)
→ Bevestig
```

### 2. Check Notificatie

```
http://localhost:3007/notifications
```

Je ziet: **"Reservering Ontvangen"** met details

### 3. Check Profile

```
http://localhost:3007/profile
→ Tab "Reserveringen"
```

Je ziet een **gedetailleerde card** met:
- 🗺️ Korenmarkt11
- 🏷️ Status badge (Bevestigd)
- 📅 Donderdag 23 oktober 2025 om 17:30
- 👥 4 personen
- 📞 Telefoonnummer
- 📍 Volledig adres
- 💬 Speciale verzoeken (als ingevuld)

### 4. Bevestig Reservering

```
http://localhost:3007/manager/[tenantId]/dashboard
→ Klik op reservering
→ Klik "Confirm"
```

### 5. Check Notificatie Again

```
http://localhost:3007/notifications
```

Nieuwe notificatie: **"Reservering Bevestigd"**

### 6. Configureer Instellingen

```
http://localhost:3007/manager/[tenantId]/settings/notifications
```

Pas aan:
- ✅/❌ Notificeer bij nieuwe reservering
- ✅/❌ Notificeer bij bevestiging
- ✅/❌ Stuur herinneringen
- 🕐 Uren van tevoren

## 🎨 Preview

### Profile Booking Card

```
┌─────────────────────────────────────────────┐
│ 🗺️  Korenmarkt11          [✅ Bevestigd]   │
│                                             │
│ ╔══ DATUM & TIJD ══╗  ╔══ AANTAL ══╗       │
│ ║ donderdag         ║  ║ 4 personen ║       │
│ ║ 23 oktober 2025   ║  ╚════════════╝       │
│ ║ om 17:30          ║                       │
│ ╚═══════════════════╝                       │
│                                             │
│ 👤 Op naam van: John Doe                    │
│ 📞 Telefoon: +32 9 123 45 67               │
│                                             │
│ 📍 Korenmarkt 11                            │
│    9000 Gent                                │
│                                             │
│ ⚠️ Speciale Verzoeken:                      │
│    Graag bij het raam                       │
│                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Reserveringsnummer: a1b2c3d4                │
│ Gemaakt op 20-10-2025                       │
└─────────────────────────────────────────────┘
```

### Notification

```
┌─────────────────────────────────────────────┐
│ 🔔 Reservering Bevestigd           [NIEUW]  │
│                                             │
│ Je reservering bij Korenmarkt11 op          │
│ 23-10-2025 om 17:30 is bevestigd!          │
│ We kijken ernaar uit om je te verwelkomen. │
│                                             │
│ 2 minuten geleden                           │
│                                             │
│ [Bekijk Reservering] [✓ Gelezen]           │
└─────────────────────────────────────────────┘
```

### Settings Page

```
┌─────────────────────────────────────────────┐
│ 🔔 Reservering Notificaties                 │
│                                             │
│ ☑️ Nieuwe reserveringen                     │
│    Word op de hoogte gebracht bij...        │
│                                             │
│ ☑️ Bevestigde reserveringen                 │
│    Melding wanneer een reservering...       │
│                                             │
│ ☑️ Geannuleerde reserveringen               │
│    Melding wanneer een reservering...       │
│                                             │
│ ☑️ Gewijzigde reserveringen                 │
│    Melding wanneer reserveringsdetails...   │
└─────────────────────────────────────────────┘
```

## 📁 Bestanden

### Created:
- ✅ `COMPLETE_NOTIFICATIONS_SETUP.sql` - Run dit in Supabase
- ✅ `components/manager/NotificationSettings.tsx` - Settings component
- ✅ `app/api/manager/notification-settings/route.ts` - API endpoint
- ✅ `app/manager/[tenantId]/settings/notifications/page.tsx` - Settings page
- ✅ `ENHANCED_BOOKING_NOTIFICATIONS_SETUP.md` - Volledige docs

### Modified:
- ✅ `app/profile/ProfileClient.tsx` - Enhanced booking cards

## 🐛 Troubleshooting

### Notificaties verschijnen niet?

```sql
-- Check of triggers zijn geïnstalleerd:
SELECT * FROM pg_trigger WHERE tgname LIKE '%booking%notification%';
```

### Bookings niet in profile?

```sql
-- Check start_ts column:
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'start_ts';
```

### Settings niet opslaan?

Check of je tenant owner bent:
```sql
SELECT * FROM memberships 
WHERE user_id = auth.uid() AND role = 'OWNER';
```

## 📚 Meer Info

Zie `ENHANCED_BOOKING_NOTIFICATIONS_SETUP.md` voor:
- Detailed architecture
- Customization options
- Advanced features
- Database queries
- Full API documentation

## ✨ Klaar!

Je hebt nu:
- 🎨 Mooie booking cards in profile
- 🔔 Automatische notificaties
- ⚙️ Configureerbare instellingen
- 📱 Volledige notificatie management

Geniet van je upgrade! 🎉

