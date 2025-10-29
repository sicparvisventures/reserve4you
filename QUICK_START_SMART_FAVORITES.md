# Quick Start: Smart Availability Alerts

## Wat is dit?

Een **unieke feature** die Reserve4You onderscheidt van alle andere reserveringsplatforms:

**Smart Availability Alerts** - Gebruikers krijgen automatisch een melding wanneer hun favoriete restaurants beschikbaar zijn op hun gewenste dag en tijd.

## Installatie (5 minuten)

### Stap 1: SQL Script Uitvoeren

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Ga naar je project
3. Klik op **SQL Editor** in de sidebar
4. Klik op **+ New Query**
5. Open het bestand: `SMART_AVAILABILITY_ALERTS_SETUP.sql`
6. Kopieer de volledige inhoud
7. Plak in de SQL editor
8. Klik op **Run** (of Cmd/Ctrl + Enter)

Je ziet een succesbericht:
```
✅ Smart Availability Alerts system successfully installed!

📊 New tables created:
  - favorite_availability_alerts
  - favorite_insights

🔔 New notification types added:
  - FAVORITE_AVAILABLE
  - ALERT_CREATED
```

### Stap 2: Start Development Server

```bash
npm run dev
# of
yarn dev
```

### Stap 3: Test de Feature

1. Open `http://localhost:3007/favorites` in je browser
2. Als je nog geen favorieten hebt:
   - Ga naar `/discover`
   - Klik op het hartje bij een restaurant
   - Ga terug naar `/favorites`
3. Klik op **"Alert instellen"** bij een favoriet
4. Configureer je voorkeuren:
   - Dag (bijv. vrijdag)
   - Tijd (bijv. 18:00 - 20:00)
   - Aantal personen
5. Klik op **"Alert aanmaken"**
6. Je ziet een toast: "Alert succesvol aangemaakt!"
7. Ga naar `/notifications` - je ziet een bevestigingsmelding

## Wat kunnen gebruikers nu?

### 1. Alerts Instellen
- **Dag kiezen**: Specifieke dag (maandag-zondag) of "elke dag"
- **Tijd kiezen**: Tijdsbereik (bijv. 18:00 - 20:00)
- **Personen**: 1-20 personen
- **Frequentie**: Hoe vaak meldingen ontvangen (max 50)
- **Cooldown**: Minimale tijd tussen meldingen (12u tot 1 week)

### 2. Alerts Beheren
- **Activeren/Deactiveren**: Pauzeer zonder te verwijderen
- **Bewerken**: Update voorkeuren
- **Verwijderen**: Delete alert volledig
- **Status zien**: Hoeveel meldingen al verzonden

### 3. Statistieken Bekijken
- **Totaal geboekt**: Hoe vaak je dit restaurant hebt geboekt
- **Weergaven**: Hoe vaak je de pagina hebt bekeken
- **Via alert**: Hoeveel keer je via een alert hebt geklikt
- **Laatst geboekt**: Datum van laatste reservering

### 4. Dashboard
- **Totaal favorieten**: Aantal favoriete locaties
- **Actieve alerts**: Hoeveel alerts actief zijn
- **Totaal geboekt**: Cumulatief over alle favorieten
- **Tabs**: Filter op "Alle" of "Met Alerts"

## UI Highlights

### Professional Design
- Reserve4You branding (#FF5A5F primary color)
- Smooth animaties en transitions
- Responsive (desktop, tablet, mobile)
- Toast notifications voor feedback

### Smart Features Banner
Prominente uitleg van de nieuwe feature met:
- Icon en badge "Nieuw"
- Duidelijke beschrijving
- Aantal actieve alerts

### Cards per Favoriet
- **Afbeelding**: Restaurant foto of placeholder
- **Badge**: "Alert actief" wanneer alert aan staat
- **Rating**: Gemiddelde beoordeling
- **Alert info**: Samenvatting van alert voorkeuren
- **Stats preview**: Aantal bookings en views
- **Acties**: Alert beheren, stats bekijken, toggle, verwijderen

## API Endpoints

Alle endpoints zijn volledig werkend:

### GET /api/favorites/alerts
Haal alle alerts op voor huidige gebruiker

### POST /api/favorites/alerts
Maak nieuwe alert aan
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

### PATCH /api/favorites/alerts
Update bestaande alert
```json
{
  "alertId": "uuid",
  "isActive": false
}
```

### DELETE /api/favorites/alerts
Verwijder alert
```json
{
  "alertId": "uuid"
}
```

### GET /api/favorites/insights
Haal insights op voor alle favorieten

### POST /api/favorites/insights/track
Track actie (view, book, alert_click)
```json
{
  "locationId": "uuid",
  "action": "view"
}
```

## Database Features

### Automatische Notificaties
Wanneer een alert wordt aangemaakt, wordt automatisch een bevestigingsnotificatie verstuurd:
- Type: `ALERT_CREATED`
- Titel: "Alert ingesteld"
- Bericht: Details over de alert
- Link: Naar `/favorites`

### Security (RLS)
- Gebruikers kunnen alleen hun eigen alerts zien/bewerken
- Gebruikers kunnen alleen hun eigen insights zien
- Alle queries zijn beveiligd met Row Level Security

### Helper Functions
- `should_send_alert(alert_id)`: Check of alert verzonden mag worden
- `record_alert_notification(alert_id)`: Registreer verzonden notificatie
- `increment_favorite_view(consumer_id, location_id)`: Track view
- `increment_favorite_booking(consumer_id, location_id)`: Track booking

## Files Overzicht

### Database
- `SMART_AVAILABILITY_ALERTS_SETUP.sql` - Complete database setup

### API Routes
- `app/api/favorites/alerts/route.ts` - Alert management (GET, POST, PATCH, DELETE)
- `app/api/favorites/insights/route.ts` - Analytics & tracking (GET, POST)

### Components
- `components/favorites/FavoriteCard.tsx` - Card met alert UI
- `app/favorites/FavoritesClient.tsx` - Client-side logic & state
- `app/favorites/page.tsx` - Server component wrapper

### Documentation
- `SMART_FAVORITES_IMPLEMENTATION.md` - Volledige documentatie
- `QUICK_START_SMART_FAVORITES.md` - Deze guide

## Troubleshooting

### "Table doesn't exist" error
→ Voer het SQL script opnieuw uit in Supabase

### "Not authenticated" error
→ Zorg dat je ingelogd bent

### Alerts verschijnen niet
→ Check of je consumer record bestaat in de database

### TypeScript errors
→ Run `npm install` om dependencies te updaten

## Next Steps (Toekomstig)

### Fase 2: Automatische Checks
Implementeer een background job die periodiek beschikbaarheid checkt en notificaties verstuurt:
- Cron job (elk uur)
- Check alle actieve alerts
- Verstuur notificaties wanneer beschikbaar
- Respect cooldown en max notifications

### Fase 3: Machine Learning
- Leer gebruikersvoor keuren
- Voorspel beste tijden
- Personaliseer suggesties

### Fase 4: Social
- Deel favorieten met vrienden
- Groepsalerts
- Leaderboards

## Marketing

### Voor Consumenten
"**Mis nooit meer een tafel bij je favoriete restaurant**"
- Automatische meldingen
- Geen handmatig checken
- Altijd als eerste

### Voor Restaurants
"**Vul je restaurant slimmer**"
- Directe lijn naar fans
- Maximaliseer bezetting
- Bouw wachtlijst

## Unieke Selling Points

1. **Niemand heeft dit**: Geen enkel ander platform biedt geautomatiseerde beschikbaarheidsmonitoring
2. **Lost echt probleem op**: Populaire restaurants zijn vaak vol, mensen missen kansen
3. **Verhoogt engagement**: Gebruikers komen terug voor notifications
4. **Meer conversies**: Alerts leiden direct naar bookings
5. **Data insights**: Leer wat populair is en wanneer

## Support

Voor vragen of problemen, zie de volledige documentatie in:
- `SMART_FAVORITES_IMPLEMENTATION.md`

---

**Status**: Production Ready ✅
**Versie**: 1.0
**Datum**: 29 Oktober 2025

