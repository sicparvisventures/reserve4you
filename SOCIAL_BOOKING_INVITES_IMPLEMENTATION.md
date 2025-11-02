# Social Booking Invites - Implementatie Documentatie

## Overzicht

Deze implementatie voegt de mogelijkheid toe om vrienden uit te nodigen voor reserveringen in de booking modal, conform de PRD voor Social Expansion.

## Wat is geïmplementeerd

### 1. Database Schema
**Bestand:** `supabase/migrations/20250128000001_social_booking_invites.sql`

- **follows tabel**: Social graph voor gebruikers die elkaar volgen
- **booking_companions tabel**: Track wie er uitgenodigd is voor welke reservering
- **Consumer extensions**: Profile picture, bio, social preferences
- **RLS policies**: Security policies voor alle nieuwe tabellen

### 2. API Endpoints

#### GET `/api/social/following`
Haalt alle gebruikers op die de huidige gebruiker volgt (vrienden).

**Response:**
```json
{
  "friends": [
    {
      "id": "uuid",
      "name": "Lisa",
      "email": "lisa@example.com",
      "profile_picture_url": "https://...",
      "bio": "...",
      "followed_since": "2025-01-20T10:00:00Z"
    }
  ],
  "count": 1
}
```

#### POST `/api/bookings/invite-friends`
Nodigt vrienden uit voor een reservering door `booking_companions` records aan te maken.

**Request Body:**
```json
{
  "bookingId": "uuid",
  "friendIds": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "2 vriend(en) uitgenodigd",
  "companions": [...]
}
```

### 3. UI Componenten

#### `InviteFriendsSelect.tsx`
Component voor het selecteren van vrienden om uit te nodigen.

**Features:**
- Laadt gevolgde gebruikers (vrienden)
- Visuele selectie met checkmarks
- Profile pictures of initials
- "Show more" voor lange lijsten
- Empty state als er geen vrienden zijn
- Error handling

#### `ReserveBookingModal.tsx` (Updated)
De booking modal is uitgebreid met:

- **Step 1**: Nieuwe sectie "Vrienden uitnodigen" onder de gasten selectie
- **Step 3**: Overzicht toont aantal uitgenodigde vrienden
- Automatisch uitnodigen van vrienden na succesvolle booking creation

## Database Migratie Uitvoeren

1. **Run de migratie in Supabase:**
```bash
# Via Supabase Dashboard:
# 1. Ga naar SQL Editor
# 2. Copy/paste de inhoud van supabase/migrations/20250128000001_social_booking_invites.sql
# 3. Run de query
```

Of via CLI:
```bash
supabase migration up
```

## Gebruik Flow

### Voor Consumenten:

1. **Vrienden volgen:**
   - Gebruikers moeten elkaar volgen via het follow systeem (nog te implementeren in UI)
   - Dit kan via API: `POST /api/social/follow`

2. **Reservering maken met vrienden:**
   - Open booking modal op location detail pagina
   - Kies aantal gasten in Step 1
   - Scroll naar beneden naar "Vrienden uitnodigen (optioneel)"
   - Selecteer vrienden om uit te nodigen
   - Ga verder met datum/tijd selectie
   - Voltooi reservering
   - Vrienden worden automatisch uitgenodigd

3. **Uitnodigingen bekijken:**
   - Uitgenodigde vrienden kunnen hun uitnodigingen zien via `booking_companions` tabel
   - Status: 'invited', 'accepted', 'declined'

## Test Scenario

### Setup (SQL):
```sql
-- Maak twee test gebruikers aan (via Supabase Auth)
-- User 1: test@example.com
-- User 2: friend@example.com

-- Krijg consumer IDs
SELECT id, name, email FROM consumers WHERE email IN ('test@example.com', 'friend@example.com');

-- Laat user 1 user 2 volgen
INSERT INTO follows (follower_id, following_id)
VALUES 
  ('consumer_id_user1', 'consumer_id_user2');

-- Test: Haal vrienden op voor user 1
SELECT * FROM get_followed_consumers('consumer_id_user1');
```

### Test Flow:
1. Log in als User 1
2. Ga naar een location detail pagina
3. Klik op "Reserveren"
4. In Step 1, zie je "Vrienden uitnodigen" sectie
5. User 2 zou zichtbaar moeten zijn
6. Selecteer User 2
7. Voltooi de reservering
8. Check `booking_companions` tabel voor de uitnodiging

## Belangrijke Opmerkingen

### Security
- Alleen gevolgde gebruikers kunnen uitgenodigd worden
- Alleen de eigenaar van een booking kan vrienden uitnodigen
- RLS policies zorgen voor data security

### Error Handling
- Als vrienden uitnodigen faalt, faalt de booking NIET
- Errors worden gelogd maar niet getoond aan gebruiker (graceful degradation)

### Performance
- Vrienden worden alleen geladen wanneer nodig (lazy loading)
- API calls worden gecached waar mogelijk

## Volgende Stappen (Toekomstige Features)

Volgens PRD zijn dit toekomstige features:
1. Follow/Unfollow UI in profielen
2. Notificaties voor uitnodigingen
3. Accept/Decline uitnodigingen UI
4. "Seen together" badges op profielen
5. Group booking planning in chat

## Troubleshooting

### Probleem: "Geen vrienden" wordt getoond
**Oplossing:** 
- Zorg dat gebruikers elkaar volgen via `follows` tabel
- Check of de gebruiker ingelogd is
- Check of `consumers` record bestaat

### Probleem: Vrienden kunnen niet uitgenodigd worden
**Oplossing:**
- Check RLS policies zijn correct toegepast
- Check of gebruiker de booking owner is
- Check of friend IDs geldig zijn en in `follows` tabel staan

### Probleem: Booking_companions worden niet aangemaakt
**Oplossing:**
- Check API response in browser console
- Check database logs voor errors
- Verify RLS policies allow INSERT

## API Endpoints Referentie

### Social Following
- `GET /api/social/following` - Get followed users (friends)
- `POST /api/social/follow` - Follow a user (nog te implementeren)
- `DELETE /api/social/follow` - Unfollow a user (nog te implementeren)

### Booking Invites
- `POST /api/bookings/invite-friends` - Invite friends to booking
- `GET /api/bookings/[id]/companions` - Get booking companions (nog te implementeren)

---

**Implementatie Status:** ✅ Complete
**Test Status:** ⏳ Pending
**Deployment:** ⏳ Pending migration execution

