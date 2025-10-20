# 🎯 START HIER: Enhanced Bookings & Notifications

## ⚡ Super Snelle Start (3 minuten)

### 1️⃣ Run SQL Script

Open **Supabase SQL Editor** en run:

```
COMPLETE_NOTIFICATIONS_SETUP.sql
```

Wacht tot je dit ziet:
```
✅ COMPLETE NOTIFICATIONS SETUP - SUCCESS
✅ Automatic triggers: INSTALLED
```

### 2️⃣ Check Notifications Table

Als je **geen** notifications table hebt, run ook:

```
supabase/migrations/20250119000020_notifications_system_fixed.sql
```

### 3️⃣ Restart Server

```bash
pnpm dev
```

## ✅ Test Direct

### Test 1: Maak Reservering
```
http://localhost:3007
→ Klik "Reserveren" bij een vestiging
→ Vul in en bevestig
```

### Test 2: Check Notificatie
```
http://localhost:3007/notifications
```

**Je ziet**: "Reservering Ontvangen" 🔔

### Test 3: Check Profile
```
http://localhost:3007/profile
→ Tab "Reserveringen"
```

**Je ziet**: Gedetailleerde booking card met alle info 🎨

### Test 4: Instellingen
```
http://localhost:3007/manager/[tenantId]/settings/notifications
```

**Pas aan**: Welke notificaties je wilt ontvangen ⚙️

## 📚 Documentatie

- **Quick Start**: `QUICK_START_NOTIFICATIONS.md`
- **Complete Guide**: `ENHANCED_BOOKING_NOTIFICATIONS_SETUP.md`
- **Summary**: `NOTIFICATIONS_IMPLEMENTATION_SUMMARY.md`

## 🎁 Wat Je Krijgt

### In `/profile` → Reserveringen:
```
┌────────────────────────────────────┐
│ 🗺️  Korenmarkt11    [Bevestigd]   │
│                                    │
│ 📅 donderdag 23 oktober 2025      │
│    om 17:30                        │
│                                    │
│ 👥 4 personen                      │
│ 📞 +32 9 123 45 67                │
│ 📍 Korenmarkt 11, 9000 Gent       │
│                                    │
│ 💬 Graag bij het raam              │
└────────────────────────────────────┘
```

### In `/notifications`:
```
🔔 Reservering Bevestigd
   Je reservering bij Korenmarkt11
   op 23-10-2025 om 17:30 is
   bevestigd!
   
   [Bekijk Reservering]
```

### In Settings:
```
⚙️ Notificatie-instellingen

☑️ Nieuwe reserveringen
☑️ Bevestigde reserveringen  
☑️ Geannuleerde reserveringen
☑️ Gewijzigde reserveringen
☑️ Verzend herinneringen (24u)

[Wijzigingen Opslaan]
```

## 🐛 Problemen?

### Notificaties komen niet?
```sql
-- Check triggers:
SELECT * FROM pg_trigger 
WHERE tgname LIKE '%notification%';
```

### Bookings niet in profile?
```sql
-- Check start_ts:
SELECT start_ts FROM bookings LIMIT 1;
```

## 🎉 Klaar!

Je hebt nu:
- ✅ Professionele booking cards
- ✅ Automatische notificaties  
- ✅ Configureerbare instellingen

**Veel plezier!** 🚀

