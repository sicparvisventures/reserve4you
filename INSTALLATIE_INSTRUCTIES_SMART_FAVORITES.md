# Installatie Instructies: Smart Availability Alerts

## Samenvatting

Je hebt een **unieke feature** voor Reserve4You: **Smart Availability Alerts**. Gebruikers kunnen alerts instellen voor hun favoriete restaurants en ontvangen automatisch een melding wanneer er beschikbaarheid is op hun gewenste dag en tijd.

## Wat is er gemaakt?

### Database
- ✅ `favorite_availability_alerts` tabel - Opslag van alerts met voorkeuren
- ✅ `favorite_insights` tabel - Analytics per favoriet
- ✅ 2 nieuwe notification types: `FAVORITE_AVAILABLE` en `ALERT_CREATED`
- ✅ Helper functies voor alert management
- ✅ Triggers voor automatische notificaties
- ✅ Row Level Security policies

### Backend (API)
- ✅ `/api/favorites/alerts` - GET, POST, PATCH, DELETE voor alert management
- ✅ `/api/favorites/insights` - GET voor analytics, POST voor tracking

### Frontend
- ✅ `FavoriteCard` component - Nieuwe kaart met alert configuratie UI
- ✅ `FavoritesClient` component - Client-side state management
- ✅ Upgraded `/favorites` page met tabs, stats, en feature banner
- ✅ Dialogs voor alert configuratie en statistieken
- ✅ Toast notifications voor gebruikersfeedback

### Styling
- ✅ Reserve4You branding (#FF5A5F primary color)
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Smooth animaties en transitions
- ✅ Professional UI met badges, gradients, en icons

## Installatie Stappen

### 1. Database Setup (VERPLICHT)

Open Supabase Dashboard en voer SQL script uit:

```bash
# Bestand: SMART_AVAILABILITY_ALERTS_SETUP.sql
```

**Stappen:**
1. Ga naar https://supabase.com/dashboard
2. Selecteer je Reserve4You project
3. Klik op **SQL Editor** (links in menu)
4. Klik op **+ New Query**
5. Open `SMART_AVAILABILITY_ALERTS_SETUP.sql`
6. Kopieer de volledige inhoud
7. Plak in de SQL editor
8. Klik op **Run** (of Cmd/Ctrl + Enter)

**Verwacht resultaat:**
```
✅ Smart Availability Alerts system successfully installed!

📊 New tables created:
  - favorite_availability_alerts
  - favorite_insights

🔔 New notification types added:
  - FAVORITE_AVAILABLE
  - ALERT_CREATED

🎯 Features:
  - Users can set alerts for specific days/times
  - Automatic cooldown to prevent spam
  - Max notification limit with auto-disable
  - View/booking analytics per favorite
```

### 2. Verifieer Installatie

Check of de tabellen zijn aangemaakt:

```sql
-- Voer uit in SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('favorite_availability_alerts', 'favorite_insights');
```

Je zou 2 rijen moeten zien.

### 3. Test de Feature

```bash
# Start development server
npm run dev
# of
yarn dev
```

1. Open `http://localhost:3007/favorites`
2. Als je favorieten hebt:
   - Klik op "Alert instellen"
   - Configureer voorkeuren
   - Klik "Alert aanmaken"
   - Check `/notifications` voor bevestiging
3. Als je geen favorieten hebt:
   - Ga naar `/discover`
   - Klik op hartje bij restaurant
   - Ga terug naar `/favorites`

## Features Overzicht

### Voor Gebruikers

#### 1. Alert Instellen
- Kies dag (maandag-zondag of "elke dag")
- Kies tijdsbereik (bijv. 18:00 - 20:00)
- Aantal personen (1-20)
- Max notificaties (1-50)
- Cooldown tussen meldingen (12u - 1 week)

#### 2. Alert Beheren
- **Toggle**: Activeren/deactiveren zonder verwijderen
- **Bewerken**: Update alle voorkeuren
- **Verwijderen**: Delete alert volledig
- **Status**: Zie hoeveel notificaties verzonden

#### 3. Statistieken
- Aantal keer geboekt bij dit restaurant
- Aantal keer pagina bekeken
- Aantal keer via alert geklikt
- Datum van laatste boeking

#### 4. Dashboard
- Totaal aantal favorieten
- Aantal actieve alerts
- Totaal aantal bookings
- Tabs: Filter op "Alle" of "Met Alerts"

### UI Elementen

#### FavoriteCard Features
- Restaurant foto of placeholder
- Rating badge (als beschikbaar)
- Alert actief badge (wanneer alert aan staat)
- Alert info samenvatting
- Stats preview (bookings + views)
- 4 knoppen:
  - Alert beheren (dialog)
  - Stats (dialog)
  - Toggle alert aan/uit
  - Verwijder favoriet
- Reserveer nu button

#### FavoritesClient Features
- Header met 3 stat cards:
  - Totaal favorieten
  - Actieve alerts
  - Totaal geboekt
- Feature banner met uitleg
- Tabs voor filtering
- Grid layout (responsive)
- Loading states
- Empty states

## API Documentatie

### GET /api/favorites/alerts
Haal alle alerts op voor ingelogde gebruiker.

**Response:**
```json
{
  "alerts": [
    {
      "id": "uuid",
      "location_id": "uuid",
      "is_active": true,
      "preferred_day_of_week": 5,
      "preferred_time_start": "18:00",
      "preferred_time_end": "20:00",
      "preferred_party_size": 2,
      "notification_count": 2,
      "max_notifications": 5,
      "cooldown_hours": 24,
      "location": {
        "id": "uuid",
        "name": "Restaurant Name",
        "slug": "restaurant-name",
        ...
      }
    }
  ]
}
```

### POST /api/favorites/alerts
Maak nieuwe alert aan.

**Body:**
```json
{
  "locationId": "uuid",
  "preferredDayOfWeek": 5,
  "preferredTimeStart": "18:00",
  "preferredTimeEnd": "20:00",
  "preferredPartySize": 2,
  "maxNotifications": 5,
  "cooldownHours": 24
}
```

**Response:**
```json
{
  "success": true,
  "message": "Alert succesvol aangemaakt",
  "alert": { ... }
}
```

### PATCH /api/favorites/alerts
Update bestaande alert.

**Body:**
```json
{
  "alertId": "uuid",
  "isActive": false,
  "preferredDayOfWeek": 6,
  ...
}
```

### DELETE /api/favorites/alerts
Verwijder alert.

**Body:**
```json
{
  "alertId": "uuid"
}
```

### GET /api/favorites/insights
Haal insights op.

**Query params:**
- `locationId` (optional) - Filter op specifieke locatie

**Response:**
```json
{
  "insights": [
    {
      "location_id": "uuid",
      "view_count": 15,
      "booking_count": 3,
      "alert_click_count": 2,
      "last_viewed_at": "2025-10-29T12:00:00Z",
      "last_booked_at": "2025-10-20T19:30:00Z",
      "location": { ... }
    }
  ]
}
```

### POST /api/favorites/insights/track
Track gebruikersactie.

**Body:**
```json
{
  "locationId": "uuid",
  "action": "view" | "book" | "alert_click"
}
```

## Database Details

### favorite_availability_alerts tabel

| Kolom | Type | Beschrijving |
|-------|------|--------------|
| id | UUID | Primary key |
| consumer_id | UUID | Foreign key naar consumers |
| location_id | UUID | Foreign key naar locations |
| favorite_id | UUID | Foreign key naar favorites |
| preferred_day_of_week | INTEGER | 0-6 (0=zondag), NULL=elke dag |
| preferred_time_start | TIME | Begintijd (bijv. '18:00') |
| preferred_time_end | TIME | Eindtijd (bijv. '20:00') |
| preferred_party_size | INTEGER | 1-20 personen |
| is_active | BOOLEAN | Alert aan/uit |
| notification_count | INTEGER | Aantal verzonden notificaties |
| max_notifications | INTEGER | Max aantal (default 5) |
| cooldown_hours | INTEGER | Uren tussen notificaties (default 24) |
| last_checked_at | TIMESTAMPTZ | Laatst gecontroleerd |
| last_notified_at | TIMESTAMPTZ | Laatst notificatie verstuurd |

### favorite_insights tabel

| Kolom | Type | Beschrijving |
|-------|------|--------------|
| id | UUID | Primary key |
| consumer_id | UUID | Foreign key naar consumers |
| location_id | UUID | Foreign key naar locations |
| view_count | INTEGER | Aantal views |
| booking_count | INTEGER | Aantal bookings |
| alert_click_count | INTEGER | Aantal clicks via alert |
| last_viewed_at | TIMESTAMPTZ | Laatst bekeken |
| last_booked_at | TIMESTAMPTZ | Laatst geboekt |

### Database Functies

#### should_send_alert(alert_id)
Controleert of een alert verstuurd mag worden:
- Is alert actief?
- Max notificaties nog niet bereikt?
- Cooldown periode verstreken?

#### record_alert_notification(alert_id)
Registreert dat een notificatie is verstuurd:
- Update last_notified_at
- Increment notification_count

#### increment_favorite_view(consumer_id, location_id)
Verhoog view count voor een favoriet.

#### increment_favorite_booking(consumer_id, location_id)
Verhoog booking count voor een favoriet.

### Triggers

#### notify_alert_created
Automatisch verstuurd wanneer een alert wordt aangemaakt:
- Type: `ALERT_CREATED`
- Prioriteit: `LOW`
- Titel: "Alert ingesteld"
- Bericht: Details over de alert voorkeuren
- Action: Link naar `/favorites`

## Security

### Row Level Security (RLS)

Alle tabellen hebben RLS enabled met policies die zorgen dat:
- Gebruikers alleen hun eigen alerts kunnen zien/bewerken/verwijderen
- Gebruikers alleen hun eigen insights kunnen zien
- Alle queries gaan via auth.uid() check

### Input Validatie

Alle API endpoints valideren input:
- Day: 0-6 of NULL
- Party size: 1-20
- Time: Valid time format
- Max notifications: 1-50
- Cooldown: 1-168 uur

## Troubleshooting

### Error: "Table doesn't exist"
**Oplossing:** Voer het SQL script opnieuw uit in Supabase Dashboard.

### Error: "Not authenticated"
**Oplossing:** Zorg dat je ingelogd bent. Check session in browser devtools.

### Error: "Consumer not found"
**Oplossing:** Er is geen consumer record. Dit wordt automatisch aangemaakt bij eerste alert.

### Alerts verschijnen niet op pagina
**Controle:**
```sql
-- Check of alerts tabel bestaat
SELECT * FROM favorite_availability_alerts LIMIT 1;

-- Check of je alerts hebt
SELECT * FROM favorite_availability_alerts 
WHERE consumer_id IN (
  SELECT id FROM consumers WHERE auth_user_id = auth.uid()
);
```

### TypeScript errors
**Oplossing:**
```bash
npm install
# of
yarn install
```

## Testing Checklist

- [ ] SQL script succesvol uitgevoerd
- [ ] Tabellen bestaan in database
- [ ] /favorites pagina laadt zonder errors
- [ ] Favorieten worden getoond
- [ ] "Alert instellen" dialog opent
- [ ] Alert kan worden aangemaakt
- [ ] Toast notification verschijnt
- [ ] Alert verschijnt in card
- [ ] Alert kan worden ge-toggled
- [ ] Alert kan worden bewerkt
- [ ] Alert kan worden verwijderd
- [ ] Stats dialog toont data
- [ ] Tabs werken (Alle / Met Alerts)
- [ ] Header stats kloppen
- [ ] Responsive design werkt
- [ ] Notificatie in /notifications

## Volgende Stappen (Optioneel)

### Fase 2: Automatische Beschikbaarheidscontrole
Implementeer een background job die:
- Elk uur actieve alerts controleert
- Beschikbaarheid checkt via API
- Notificaties verstuurt wanneer beschikbaar
- Cooldown en max notifications respecteert

### Implementatie opties:
1. **Supabase Edge Function** (cron job)
2. **Vercel Cron Job** (via vercel.json)
3. **External service** (bijv. AWS Lambda)

## Files Overzicht

### SQL
- `SMART_AVAILABILITY_ALERTS_SETUP.sql` - Database setup

### API Routes
- `app/api/favorites/alerts/route.ts` - Alert CRUD operations
- `app/api/favorites/insights/route.ts` - Analytics & tracking

### Components
- `components/favorites/FavoriteCard.tsx` - Alert UI card
- `app/favorites/FavoritesClient.tsx` - Client state management
- `app/favorites/page.tsx` - Server component

### UI Components (gebruikt)
- `components/ui/dialog.tsx` - Modal dialogs
- `components/ui/tabs.tsx` - Tab navigation
- `components/ui/select.tsx` - Dropdown selectors
- `components/ui/label.tsx` - Form labels
- `components/ui/input.tsx` - Input fields
- `components/ui/button.tsx` - Buttons
- `components/ui/badge.tsx` - Status badges

### Documentatie
- `SMART_FAVORITES_IMPLEMENTATION.md` - Volledige tech documentatie
- `QUICK_START_SMART_FAVORITES.md` - Snelstart gids
- `INSTALLATIE_INSTRUCTIES_SMART_FAVORITES.md` - Dit bestand

## Support

Voor vragen over implementatie, zie:
- **Tech details**: `SMART_FAVORITES_IMPLEMENTATION.md`
- **Quick start**: `QUICK_START_SMART_FAVORITES.md`
- **API specs**: Dit bestand, sectie "API Documentatie"

---

**Status**: Production Ready ✅  
**Versie**: 1.0  
**Datum**: 29 Oktober 2025  
**Auteur**: Reserve4You Development Team

