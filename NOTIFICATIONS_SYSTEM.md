# Notifications System - Reserve4You

Een compleet, professioneel notificatiesysteem voor Reserve4You.

## 📋 Overzicht

Het notificatiesysteem biedt real-time notificaties voor gebruikers over:
- Reservering updates (bevestigd, geannuleerd, herinnering)
- Betalingen (geslaagd, mislukt)
- Abonnement wijzigingen
- Systeem aankondigingen
- Berichten

## 🗄️ Database Schema

### Notifications Tabel

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type notification_type NOT NULL,
  priority notification_priority NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Optional references
  booking_id UUID,
  location_id UUID,
  tenant_id UUID,
  
  -- Action link
  action_url TEXT,
  action_label TEXT,
  
  -- Status
  read BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);
```

### Notification Types

- `BOOKING_CONFIRMED` - Reservering bevestigd
- `BOOKING_CANCELLED` - Reservering geannuleerd
- `BOOKING_REMINDER` - Herinnering voor aankomende reservering
- `BOOKING_MODIFIED` - Reservering aangepast
- `BOOKING_PENDING` - Nieuwe reservering wacht op goedkeuring
- `PAYMENT_SUCCESS` - Betaling geslaagd
- `PAYMENT_FAILED` - Betaling mislukt
- `SUBSCRIPTION_UPGRADED` - Abonnement geüpgraded
- `SUBSCRIPTION_EXPIRING` - Abonnement verloopt binnenkort
- `SYSTEM_ANNOUNCEMENT` - Systeem aankondiging
- `LOCATION_PUBLISHED` - Locatie gepubliceerd
- `REVIEW_REQUEST` - Verzoek voor review
- `MESSAGE_RECEIVED` - Nieuw bericht ontvangen
- `GENERAL` - Algemene notificatie

### Priority Levels

- `LOW` - Lage prioriteit (grijs)
- `MEDIUM` - Normale prioriteit (blauw)
- `HIGH` - Hoge prioriteit (oranje)
- `URGENT` - Urgent (rood)

## 🔐 Security

### Row Level Security (RLS)

Alle notifications policies zorgen ervoor dat:
- Gebruikers alleen hun eigen notificaties kunnen zien
- Gebruikers alleen hun eigen notificaties kunnen updaten/verwijderen
- Systeem kan notificaties aanmaken (voor backend triggers)

### API Authenticatie

Alle API routes vereisen een geldige sessie via `verifySession()`.

## 🚀 API Endpoints

### GET /api/notifications
Haal gebruiker's notificaties op

**Query Parameters:**
- `unread` (boolean) - Alleen ongelezen notificaties
- `limit` (number) - Maximum aantal notificaties (default: 50)

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "BOOKING_CONFIRMED",
      "priority": "HIGH",
      "title": "Reservering bevestigd",
      "message": "Je reservering bij Restaurant XYZ is bevestigd.",
      "read": false,
      "created_at": "2025-01-19T10:00:00Z",
      "action_url": "/profile",
      "action_label": "Bekijk Reservering"
    }
  ]
}
```

### POST /api/notifications
Maak een nieuwe notificatie aan

**Body:**
```json
{
  "type": "BOOKING_CONFIRMED",
  "priority": "HIGH",
  "title": "Reservering bevestigd",
  "message": "Je reservering is bevestigd.",
  "booking_id": "uuid",
  "action_url": "/profile",
  "action_label": "Bekijk"
}
```

### PATCH /api/notifications/[id]
Update een notificatie (markeer als gelezen)

**Body:**
```json
{
  "read": true
}
```

### DELETE /api/notifications/[id]
Verwijder een notificatie

### POST /api/notifications/mark-all-read
Markeer alle notificaties als gelezen

### GET /api/notifications/count
Haal aantal ongelezen notificaties op

**Response:**
```json
{
  "count": 5
}
```

## 💻 Frontend Componenten

### NotificationsPage
Server component die notificaties ophaalt en doorgeeft aan client.

**Locatie:** `/app/notifications/page.tsx`

### NotificationsClient
Client component met volledige UI en functionaliteit:

**Features:**
- Sidebar navigatie met filters
- Real-time status updates
- Mark as read functionaliteit
- Mark all as read
- Delete notificaties
- Empty states
- Loading states
- Success/error messages
- Responsive design

**Filters:**
- Alle notificaties
- Alleen ongelezen
- Reserveringen
- Systeem meldingen

## 🎨 Styling

Het notificaties systeem gebruikt de profile layout styling:
- Sticky header met terug knop
- Sidebar navigatie (desktop)
- Mobile navigatie (mobiel)
- Success/error message banners
- Coral accent kleuren (#FF5A5F)
- Consistent met rest van de app

### Notification Card Styling

- **Ongelezen**: Border-left accent met lichte achtergrond
- **Priority colors**: Via icon achtergrond
  - Urgent: Rood
  - High: Oranje
  - Medium: Blauw
  - Low: Grijs
- **Hover states**: Border color change
- **Icons**: Type-specifieke iconen

## 🔧 Database Functies

### create_notification()
Helper functie om notificaties te maken:

```sql
SELECT create_notification(
  p_user_id := 'user-uuid',
  p_type := 'BOOKING_CONFIRMED',
  p_title := 'Reservering bevestigd',
  p_message := 'Je reservering is bevestigd',
  p_priority := 'HIGH',
  p_booking_id := 'booking-uuid',
  p_action_url := '/profile',
  p_action_label := 'Bekijk Reservering'
);
```

### mark_notification_read()
Markeer notificatie als gelezen:

```sql
SELECT mark_notification_read('notification-uuid');
```

### mark_all_notifications_read()
Markeer alle notificaties als gelezen:

```sql
SELECT mark_all_notifications_read();
```

### get_unread_notification_count()
Haal aantal ongelezen notificaties op:

```sql
SELECT get_unread_notification_count();
```

## 📝 Gebruik Voorbeelden

### Backend - Notificatie maken bij nieuwe reservering

```typescript
// In booking creation flow
const supabase = await createServiceClient();

await supabase.rpc('create_notification', {
  p_user_id: userId,
  p_type: 'BOOKING_CONFIRMED',
  p_title: 'Reservering bevestigd',
  p_message: `Je reservering bij ${locationName} op ${date} is bevestigd.`,
  p_priority: 'HIGH',
  p_booking_id: bookingId,
  p_location_id: locationId,
  p_action_url: '/profile',
  p_action_label: 'Bekijk Reservering'
});
```

### Frontend - Markeer als gelezen

```typescript
const markAsRead = async (id: string) => {
  await fetch(`/api/notifications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ read: true }),
  });
};
```

### Frontend - Haal notificaties op

```typescript
const { data } = await fetch('/api/notifications?unread=true');
```

## 🔄 Migratie Uitvoeren

1. **Via Supabase Dashboard:**
   - Ga naar SQL Editor
   - Kopieer inhoud van `supabase/migrations/20250119000020_notifications_system.sql`
   - Voer uit

2. **Via CLI:**
   ```bash
   supabase migration up
   ```

## 🧪 Test Data

Test notificaties aanmaken:

```sql
-- Vervang 'your-user-id' met een echte user_id uit auth.users
INSERT INTO notifications (user_id, type, priority, title, message, action_url, action_label)
VALUES 
  (
    'your-user-id',
    'SYSTEM_ANNOUNCEMENT',
    'MEDIUM',
    'Welkom bij Reserve4You!',
    'Bedankt voor je registratie. Ontdek nu de beste restaurants in je omgeving.',
    '/discover',
    'Ontdek Restaurants'
  ),
  (
    'your-user-id',
    'BOOKING_CONFIRMED',
    'HIGH',
    'Reservering bevestigd',
    'Je reservering bij De Goudeneeuw op 20 januari om 19:00 is bevestigd.',
    '/profile',
    'Bekijk Reservering'
  ),
  (
    'your-user-id',
    'SUBSCRIPTION_UPGRADED',
    'MEDIUM',
    'Abonnement geüpgraded',
    'Je abonnement is succesvol geüpgraded naar het Pro plan.',
    '/profile',
    'Bekijk Details'
  );
```

## 📊 Performance

### Indexes
- User ID index voor snelle user queries
- Composite index voor ongelezen notificaties
- Type en priority indexes voor filtering

### Optimalisaties
- Limit van 50 notificaties per query
- RLS policies voor security
- Efficiënte WHERE clauses
- Archived notificaties niet standaard ophalen

## 🎯 Best Practices

1. **Altijd priority instellen** - Helpt gebruikers urgente items te identificeren
2. **Gebruik action_url** - Geef gebruikers een directe actie
3. **Korte, duidelijke titels** - Max 50-60 karakters
4. **Context in message** - Wat, wanneer, waar
5. **Relevant metadata** - Sla extra info op in metadata field
6. **Clean up old notifications** - Implementeer archivering na X dagen

## 🚧 Toekomstige Verbeteringen

- [ ] Real-time updates via Supabase Realtime
- [ ] Email notificaties (optioneel)
- [ ] Push notificaties (PWA)
- [ ] Notification preferences (per type aan/uit)
- [ ] Bulk actions (select multiple)
- [ ] Search in notifications
- [ ] Export notificaties
- [ ] Scheduled notifications (reminders)
- [ ] Notification templates
- [ ] Admin dashboard voor system announcements

## 📞 Support

Voor vragen over het notificatiesysteem, zie de API documentatie of open een issue.

