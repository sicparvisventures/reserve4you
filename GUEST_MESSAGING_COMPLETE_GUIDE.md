# 📧 Guest Messaging System - Complete Guide

## ✅ VOLLEDIG SYSTEEM GEÏMPLEMENTEERD!

Een compleet manager-naar-gast messaging systeem waar managers berichten kunnen sturen aan gasten die gereserveerd hebben. Gasten ontvangen deze als notificaties in `/notifications`.

### 🔧 BELANGRIJKE FIX: 1 Bericht per Persoon

**Probleem opgelost:** Personen met meerdere reservaties ontvangen nu **1 enkel bericht** in plaats van een bericht per reservatie.

**Voorbeeld:**
- Persoon heeft 4 reservaties bij Poule & Poulette
- Ontvangt NU: **1 notificatie**
- Ontving VOORHEEN: ~~4 notificaties~~

**Hoe het werkt:**
- Systeem telt unieke personen (consumers), niet aantal reservaties
- 1 notificatie per persoon, ongeacht aantal bookings
- Alle bookings worden wel getrackt in `message_recipients`

---

## 🎯 WAT IS ER GEMAAKT

### 1. **Database Schema & Functions**
- `guest_messages` tabel - Opslag voor verzonden berichten
- `message_recipients` tabel - Tracking per gast
- `message_templates` tabel - Voorgedefinieerde sjablonen
- `send_message_to_guests()` functie - Automatisch verzenden
- `get_message_stats()` functie - Statistieken
- `get_targetable_guests_count()` functie - Doelgroep teller

### 2. **UI Components**
- `GuestMessagingPanel` - Volledig messaging dashboard
- Geïntegreerd in Location Management als nieuwe tab
- Modern design dat past bij de app stijl

### 3. **API Endpoints**
- `/api/manager/messages/send` - POST - Verstuur bericht
- `/api/manager/messages/stats` - GET - Statistieken
- `/api/manager/messages/target-count` - GET - Doelgroep aantal
- `/api/manager/messages` - GET - Verzonden berichten

### 4. **Features**
- ✅ 7 berichttypen (Aankondiging, Herinnering, Speciale Aanbieding, etc.)
- ✅ 3 targeting opties (Alle gasten, Aankomende, Specifieke datum)
- ✅ Real-time telling van doelgroep
- ✅ Stats dashboard (Totaal, Bereikt, Deze Maand, Gemiddeld)
- ✅ Recente berichten historie
- ✅ Character limits (100 onderwerp, 500 bericht)
- ✅ Integratie met notifications systeem
- ✅ RLS security policies

---

## 🚀 INSTALLATIE

### Kies je scenario:

#### ✨ Optie A: Nieuwe Installatie (Hele Systeem)

**Gebruik:** `GUEST_MESSAGING_SYSTEM_COMPLETE.sql`

```bash
# Open Supabase Dashboard → SQL Editor
# Kopieer en run: GUEST_MESSAGING_SYSTEM_COMPLETE.sql
```

#### 🔧 Optie B: Update Bestaande Installatie (Alleen Fix)

**Gebruik als je al het messaging systeem hebt maar duplicaat berichten krijgt:**

**Gebruik:** `FIX_DUPLICATE_MESSAGES_PER_PERSON.sql`

```bash
# Open Supabase Dashboard → SQL Editor
# Kopieer en run: FIX_DUPLICATE_MESSAGES_PER_PERSON.sql
```

Dit script update alleen de `send_message_to_guests()` functie zonder het hele systeem opnieuw te installeren.

**Verwachte Output (Optie A - Nieuwe Installatie):**
```
📧 GUEST MESSAGING SYSTEM SETUP
>>> Step 1: Creating message types...
>>> Step 2: Creating guest_messages table...
>>> Step 3: Creating message_recipients table...
>>> Step 4: Creating indexes...
>>> Step 5: Creating send_message_to_guests function...
>>> Step 6: Creating message stats functions...
>>> Step 7: Setting up RLS policies...
>>> Step 8: Granting permissions...
>>> Step 9: Setting up message templates...

🔍 VERIFICATION
guest_messages table: ✓
message_recipients table: ✓
send_message_to_guests function: ✓
Message templates: 5 templates

✅ GUEST MESSAGING SYSTEM COMPLETE!
```

**Verwachte Output (Optie B - Fix Update):**
```
🔧 FIXING DUPLICATE MESSAGES ISSUE
Probleem: Persoon met 4 reservaties kreeg 4 berichten
Oplossing: Nu 1 bericht per persoon, ongeacht aantal reservaties

>>> Updating send_message_to_guests function...
>>> Updating get_targetable_guests_count function...

🔍 VERIFICATION
send_message_to_guests() updated: ✓
get_targetable_guests_count() updated: ✓

✅ FIX COMPLETE!

Wat is er gefixed:
  ✓ 1 bericht per persoon (niet per reservatie)
  ✓ Unieke consumer count
  ✓ Correcte targeting in UI

Test scenario:
  - Persoon met 4 reservaties
  - Ontvangt NU: 1 notificatie
  - Ontving VOORHEEN: 4 notificaties
```

### Stap 2: Restart Development Server

```bash
pnpm dev
```

### Stap 3: Test het Systeem

```
http://localhost:3007/manager/b0402eea-4296-4951-aff6-8f4c2c219818/location/2ca30ee4-140a-4a09-96ae-1455406e0a02
```

1. Ga naar "Berichten" tab
2. Je ziet het messaging dashboard!

---

## 🎨 USER INTERFACE

### Messaging Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  📊 STATS                                                    │
│  ┌──────────┬──────────┬──────────┬──────────┐             │
│  │ Totaal   │ Bereikt  │ Deze     │ Gemiddeld│             │
│  │ Berichten│          │ Maand    │          │             │
│  │    12    │   145    │    8     │    12    │             │
│  └──────────┴──────────┴──────────┴──────────┘             │
│                                                               │
│  📝 BERICHT VERSTUREN                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Type Bericht: [Icons voor 7 types]                  │   │
│  │                                                       │   │
│  │ Doelgroep:                                           │   │
│  │  ○ Alle gasten met reserveringen                    │   │
│  │  ● Aankomende reserveringen [125 gasten]           │   │
│  │  ○ Specifieke datum [Datumpicker]                  │   │
│  │                                                       │   │
│  │ Onderwerp: [________________] 45/100                │   │
│  │ Bericht:   [________________] 187/500               │   │
│  │            [                ]                        │   │
│  │                                                       │   │
│  │  [Verstuur naar 125 gasten]                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  📜 RECENTE BERICHTEN                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔔 Welkom bij ons restaurant (24 ontvangers)       │   │
│  │    Bedankt voor je reservering...                   │   │
│  │    2 jan, 14:30                                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 7 Berichttypen

| Icon | Type | Kleur | Gebruik |
|------|------|-------|---------|
| 💬 | Aankondiging | Blauw | Algemene updates |
| ⏰ | Herinnering | Paars | Reservering reminder |
| ✨ | Speciale Aanbieding | Groen | Promoties |
| ⚠️ | Update | Oranje | Belangrijke info |
| 👋 | Welkom | Roze | Nieuwe gasten |
| ✅ | Bedankt | Teal | Na bezoek |
| ✉️ | Aangepast | Grijs | Custom |

### 3 Targeting Opties

1. **Alle gasten** - Iedereen met een actieve reservering
2. **Aankomende** - Alleen toekomstige reserveringen (vanaf vandaag)
3. **Specifieke datum** - Gasten met reservering op één specifieke dag

---

## 📊 DATABASE SCHEMA

### guest_messages Table

```sql
CREATE TABLE guest_messages (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  location_id UUID,
  sender_user_id UUID NOT NULL,
  message_type guest_message_type NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  target_all_guests BOOLEAN DEFAULT false,
  target_upcoming_bookings BOOLEAN DEFAULT false,
  target_specific_date DATE,
  sent_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);
```

### message_recipients Table

```sql
CREATE TABLE message_recipients (
  id UUID PRIMARY KEY,
  message_id UUID NOT NULL,
  booking_id UUID NOT NULL,
  consumer_id UUID NOT NULL,
  notification_id UUID,
  status guest_message_status DEFAULT 'SENT',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  UNIQUE(message_id, booking_id)
);
```

### Message Enums

```sql
CREATE TYPE guest_message_type AS ENUM (
  'ANNOUNCEMENT', 'REMINDER', 'SPECIAL_OFFER',
  'UPDATE', 'WELCOME', 'THANK_YOU', 'CUSTOM'
);

CREATE TYPE guest_message_status AS ENUM (
  'SENT', 'DELIVERED', 'READ'
);
```

---

## 🔧 FUNCTIONS

### send_message_to_guests()

```sql
SELECT send_message_to_guests(
  p_message_id := 'uuid-here',
  p_tenant_id := 'tenant-uuid',
  p_location_id := 'location-uuid',
  p_subject := 'Welkom!',
  p_message := 'Bedankt voor je reservering',
  p_message_type := 'WELCOME',
  p_target_all_guests := false,
  p_target_upcoming_bookings := true,
  p_target_specific_date := NULL
);

-- Returns: { sent_count: 25, recipient_ids: [...] }
```

**Wat het doet:**
1. Zoekt alle matching bookings (confirmed/pending)
2. Filtert op targeting (all/upcoming/specific date)
3. Maakt notification per gast
4. Tracked recipient in message_recipients
5. Update sent_count op message

### get_message_stats()

```sql
SELECT * FROM get_message_stats('location-uuid');

-- Returns:
-- total_messages | total_recipients | messages_this_month | average_recipients
-- 45             | 567              | 12                  | 12.6
```

### get_targetable_guests_count()

```sql
SELECT get_targetable_guests_count(
  'location-uuid',
  true,  -- upcoming only
  NULL   -- no specific date
);

-- Returns: 125
```

---

## 🔐 SECURITY (RLS)

### Policies

**Managers kunnen:**
- ✅ Berichten BEKIJKEN voor hun tenant/location
- ✅ Berichten VERSTUREN voor hun tenant/location
- ✅ Recipients BEKIJKEN voor hun berichten

**Gasten kunnen:**
- ✅ Hun eigen ONTVANGEN berichten bekijken
- ❌ GEEN berichten versturen
- ❌ GEEN andere gasten zien

```sql
-- Example policy
CREATE POLICY "Managers can view messages"
  ON guest_messages FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT m.tenant_id
      FROM memberships m
      WHERE m.user_id = auth.uid()
        AND m.role IN ('OWNER', 'MANAGER')
    )
  );
```

---

## 🧪 TESTEN

### Test 1: Verstuur Welkomstbericht

```
1. Ga naar Location Management
2. Klik op "Berichten" tab
3. Selecteer type: "Welkom"
4. Selecteer: "Aankomende reserveringen"
5. Onderwerp: "Welkom bij {restaurant_name}"
6. Bericht: "We kijken ernaar uit je te verwelkomen!"
7. Check doelgroep aantal (bijv. 15 gasten)
8. Klik "Verstuur naar 15 gasten"
9. ✅ Succes! Check notifications van gasten
```

### Test 2: Check Guest Notifications

```
1. Login als gast met een booking
2. Ga naar /notifications
3. ✅ Je ziet het bericht van de manager!
4. Klik op "Bekijk reservering"
5. ✅ Gaat naar je booking
```

### Test 3: Stats Verificatie

```sql
-- Check message stats
SELECT * FROM get_message_stats('2ca30ee4-140a-4a09-96ae-1455406e0a02');

-- Check sent messages
SELECT * FROM guest_messages
WHERE location_id = '2ca30ee4-140a-4a09-96ae-1455406e0a02'
ORDER BY created_at DESC
LIMIT 10;

-- Check recipients
SELECT mr.*, c.email, b.booking_date
FROM message_recipients mr
JOIN consumers c ON c.id = mr.consumer_id
JOIN bookings b ON b.id = mr.booking_id
WHERE mr.message_id = 'specific-message-uuid';
```

---

## 💡 GEBRUIK SCENARIO'S

### Scenario 1: Welkomstbericht

**Wanneer:** Nieuwe reservering bevestigd
**Type:** WELCOME
**Target:** Specifieke datum (morgen)
**Voorbeeld:**
```
Onderwerp: Welkom bij Poule & Poulette!
Bericht: Bedankt voor je reservering morgen om 19:00. We kijken ernaar uit je te verwelkomen!
```

### Scenario 2: Herinnering

**Wanneer:** Dag voor reservering
**Type:** REMINDER
**Target:** Specifieke datum (morgen)
**Voorbeeld:**
```
Onderwerp: Herinnering: Je reservering morgen
Bericht: Dit is een vriendelijke herinnering voor je reservering morgen. Tot dan!
```

### Scenario 3: Speciale Aanbieding

**Wanneer:** Weekend promotie
**Type:** SPECIAL_OFFER
**Target:** Aankomende reserveringen
**Voorbeeld:**
```
Onderwerp: 20% korting op desserts!
Bericht: Dit weekend krijg je 20% korting op alle desserts. Geniet van je bezoek!
```

### Scenario 4: Restaurant Update

**Wanneer:** Menu wijziging / openingstijden
**Type:** UPDATE
**Target:** Alle gasten
**Voorbeeld:**
```
Onderwerp: Nieuwe openingstijden
Bericht: Vanaf volgende week zijn we ook op maandag open! We hopen je snel te zien.
```

### Scenario 5: Bedankbericht

**Wanneer:** Na bezoek
**Type:** THANK_YOU
**Target:** Specifieke datum (vandaag)
**Voorbeeld:**
```
Onderwerp: Bedankt voor je bezoek!
Bericht: Bedankt dat je bij ons hebt gegeten. We hopen je snel weer te zien!
```

---

## 📱 MOBILE RESPONSIVE

Het messaging panel is volledig responsive:

**Desktop (>768px):**
- 4 kolommen stats
- 4 kolommen berichttypen grid
- Volledige breedte forms

**Tablet (>640px):**
- 2 kolommen stats
- 2 kolommen berichttypen
- Volledige forms

**Mobile (<640px):**
- 1 kolom stats (stacked)
- 2 kolommen berichttypen
- Aangepaste button sizes

---

## 🎨 STYLING DETAILS

### Colors & Theming

**Stats Cards:**
```typescript
{
  background: 'card',
  border: 'border',
  hover: 'hover:border-primary',
}
```

**Message Type Buttons:**
```typescript
{
  active: 'border-primary bg-primary/5 text-primary',
  inactive: 'border-border hover:border-primary/50',
}
```

**Target Options:**
```typescript
{
  selected: 'border-primary bg-primary/5',
  unselected: 'border-border hover:border-primary/50',
}
```

**Success/Error Messages:**
```typescript
{
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
}
```

---

## 🔄 WORKFLOW

```
Manager composes message
        ↓
Selects target audience
        ↓
System counts targetable guests
        ↓
Manager clicks "Send"
        ↓
API creates guest_message record
        ↓
Calls send_message_to_guests()
        ↓
For each matching booking:
  - Creates notification for guest
  - Tracks in message_recipients
        ↓
Guest sees notification in /notifications
        ↓
Guest clicks notification
        ↓
Opens booking details
```

---

## ✅ VERIFICATION CHECKLIST

Gebruik deze checklist om te verifiëren dat alles werkt:

- [ ] SQL script succesvol uitgevoerd
- [ ] guest_messages tabel bestaat
- [ ] message_recipients tabel bestaat
- [ ] message_templates tabel bestaat (5 templates)
- [ ] send_message_to_guests() functie bestaat
- [ ] get_message_stats() functie bestaat
- [ ] get_targetable_guests_count() functie bestaat
- [ ] RLS policies aangemaakt (4 policies)
- [ ] "Berichten" tab zichtbaar in Location Management
- [ ] Stats dashboard toont cijfers
- [ ] Berichttypen selecteerbaar
- [ ] Targeting opties werken
- [ ] Doelgroep aantal wordt getoond
- [ ] Bericht kan verzonden worden
- [ ] Success message verschijnt
- [ ] Stats worden ge-update
- [ ] Recente berichten verschijnen
- [ ] Gasten ontvangen notifications
- [ ] Notifications linken naar bookings

---

## 🐛 TROUBLESHOOTING

### Probleem: "Failed to send message"

**Oplossing:**
```sql
-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'send_message_to_guests';

-- Check permissions
GRANT EXECUTE ON FUNCTION send_message_to_guests TO authenticated;
```

### Probleem: "No targetable guests"

**Check:**
```sql
-- Are there bookings?
SELECT COUNT(*) FROM bookings
WHERE location_id = 'your-location-uuid'
  AND status IN ('confirmed', 'pending')
  AND booking_date >= CURRENT_DATE;
```

### Probleem: Stats tonen 0

**Check:**
```sql
-- Manual stats query
SELECT 
  COUNT(DISTINCT id) as total_messages,
  SUM(sent_count) as total_recipients
FROM guest_messages
WHERE location_id = 'your-location-uuid';
```

### Probleem: Gasten ontvangen geen notifications

**Check:**
1. Heeft de gast een consumer record met auth_user_id?
2. Is de booking status 'confirmed' of 'pending'?
3. Check notifications table:

```sql
SELECT * FROM notifications
WHERE user_id = 'guest-user-uuid'
ORDER BY created_at DESC;
```

---

## 📞 SUPPORT QUERIES

### All Messages for Location

```sql
SELECT * FROM guest_messages
WHERE location_id = 'location-uuid'
ORDER BY created_at DESC;
```

### Message Recipients

```sql
SELECT 
  mr.*,
  c.email,
  b.booking_date,
  b.booking_time,
  n.read as notification_read
FROM message_recipients mr
JOIN consumers c ON c.id = mr.consumer_id
JOIN bookings b ON b.id = mr.booking_id
LEFT JOIN notifications n ON n.id = mr.notification_id
WHERE mr.message_id = 'message-uuid';
```

### Unread Messages Count

```sql
SELECT COUNT(*) 
FROM message_recipients mr
JOIN notifications n ON n.id = mr.notification_id
WHERE mr.consumer_id = 'consumer-uuid'
  AND n.read = false;
```

---

## 🎉 COMPLETE!

Je hebt nu een volledig werkend guest messaging systeem!

**Wat managers kunnen:**
- ✅ Berichten sturen naar alle gasten
- ✅ Targeten op aankomende reserveringen
- ✅ Targeten op specifieke datums
- ✅ 7 verschillende berichttypen gebruiken
- ✅ Real-time zien hoeveel gasten bereikt worden
- ✅ Stats en historie bekijken

**Wat gasten ontvangen:**
- ✅ Notifications in /notifications
- ✅ Duidelijke berichten van het restaurant
- ✅ Link naar hun reservering
- ✅ Professional communicatie

**Files Created:**
1. `GUEST_MESSAGING_SYSTEM_COMPLETE.sql` - Database setup
2. `components/manager/GuestMessagingPanel.tsx` - UI component
3. `app/api/manager/messages/send/route.ts` - Send endpoint
4. `app/api/manager/messages/stats/route.ts` - Stats endpoint
5. `app/api/manager/messages/target-count/route.ts` - Count endpoint
6. `app/api/manager/messages/route.ts` - List endpoint
7. `GUEST_MESSAGING_COMPLETE_GUIDE.md` - This guide

---

**Created:** ${new Date().toLocaleDateString('nl-NL')}
**Version:** 1.0.0
**Status:** ✅ Production Ready

