# Favorites Systeem - Complete Implementatie

## Overzicht

Het favorites systeem is volledig geïmplementeerd met automatische notificaties voor locatie-eigenaren wanneer iemand hun restaurant toevoegt aan favorieten.

## Features

### Voor Consumenten
- **Favoriet Toevoegen**: Klik op het hartje rechtsboven in de locatiekaart
- **Favoriet Verwijderen**: Klik nogmaals op het hartje om te verwijderen
- **Favorieten Bekijken**: Bekijk al je favoriete restaurants op `/favorites`
- **Optimistische Updates**: UI update direct, zelfs voordat server antwoord geeft
- **Persistentie**: Favorieten blijven bewaard per gebruiker

### Voor Locatie-eigenaren
- **Automatische Notificaties**: Ontvang een notificatie wanneer iemand je restaurant favoriet maakt
- **Consumer Informatie**: Zie wie je restaurant heeft gefavoriet
- **Dashboard Link**: Direct link naar je locatie dashboard
- **Manager Notificaties**: Ook locatie managers ontvangen notificaties

## Implementatie Details

### 1. Database (Supabase)

**SQL Script**: `supabase/migrations/20250127000001_favorites_notifications.sql`

Dit script bevat:
- Nieuwe notification type: `LOCATION_FAVORITED`
- Automatische trigger functie `notify_location_favorited()`
- Trigger op `favorites` tabel die notificaties creëert
- Notificaties voor eigenaar én managers
- Metadata met consumer informatie

**Uitvoeren in Supabase Dashboard**:
```sql
-- Kopieer en plak de volledige inhoud van:
supabase/migrations/20250127000001_favorites_notifications.sql
```

Of via Supabase CLI:
```bash
supabase db push
```

### 2. API Route

**Bestand**: `app/api/favorites/route.ts`

**Endpoints**:
- `GET /api/favorites` - Haal alle favorieten op voor ingelogde gebruiker
- `POST /api/favorites` - Voeg toe of verwijder favoriet
  - Body: `{ locationId: string, action: 'add' | 'remove' }`

**Features**:
- Authenticatie check
- Automatisch consumer profiel aanmaken indien nodig
- Error handling met duidelijke berichten
- Duplicate prevention

### 3. Client Components

**LocationCardWithFavorite** (`components/location/LocationCardWithFavorite.tsx`)
- Wrapper component voor LocationCard
- Optimistische UI updates
- Automatische redirect naar login als niet ingelogd
- Loading state tijdens API call
- Error handling met rollback

### 4. Server Actions

**Bestand**: `lib/actions/favorites.ts`

**Functies**:
- `getFavoriteLocationIds()` - Haal alle favoriet location IDs op
- `isLocationFavorited(locationId)` - Check of specifieke locatie favoriet is

### 5. Pages Geüpdatet

#### Discover Page (`app/discover/page.tsx`)
- Gebruikt `LocationCardWithFavorite` component
- Laadt favoriet IDs bij pagina load
- Toont hartje gevuld voor gefavorite locaties
- Real-time toggle functionaliteit

#### Favorites Page (`app/favorites/page.tsx`)
- Toont alle gefavorite restaurants
- Mogelijkheid om favorieten te verwijderen
- Empty state met link naar discover page
- Telt aantal favorieten

## Gebruikersflow

### Favoriet Toevoegen
1. Gebruiker gaat naar `/discover`
2. Klikt op hartje bij restaurant
3. **Direct**: Hartje wordt gevuld (optimistische update)
4. **Achtergrond**: API call naar `/api/favorites`
5. **Succes**: 
   - Favoriet wordt opgeslagen in database
   - Trigger creëert notificatie voor eigenaar
   - Eigenaar ziet notificatie in dashboard
6. **Fout**: Hartje wordt weer leeg gemaakt

### Favoriet Verwijderen
1. Gebruiker klikt op gevuld hartje
2. **Direct**: Hartje wordt leeg
3. **Achtergrond**: API call verwijdert favoriet
4. **Op /favorites**: Restaurant verdwijnt uit lijst

### Notificatie Ontvangen (Eigenaar)
1. Consumer voegt restaurant toe aan favorieten
2. Database trigger wordt uitgevoerd
3. Notificatie wordt gecreëerd met:
   - Titel: "Nieuwe favoriet"
   - Bericht: "[Naam] heeft [Restaurant] toegevoegd aan favorieten"
   - Link naar location dashboard
   - Metadata met consumer info
4. Notificatie verschijnt in dashboard notifications
5. Badge telt omhoog

## Styling & Branding

- **Kleuren**: Gebruikt primary color van Reserve4You branding
- **Iconen**: Lucide React Heart icon
- **Animaties**: Smooth transitions bij hover en toggle
- **Responsive**: Werkt op alle schermformaten
- **Professioneel**: Geen emoji's, clean design

## Database Schema

### favorites tabel
```sql
- id: UUID (primary key)
- consumer_id: UUID (referentie naar consumers)
- location_id: UUID (referentie naar locations)
- created_at: TIMESTAMPTZ
- UNIQUE(consumer_id, location_id)
```

### notifications tabel (uitgebreid)
```sql
Nieuwe type: LOCATION_FAVORITED
Priority: LOW
Metadata bevat:
  - consumer_id
  - consumer_name
  - consumer_email
  - favorited_at
```

## Testing Checklist

### Basis Functionaliteit
- [ ] Inloggen als consumer
- [ ] Ga naar `/discover`
- [ ] Klik op hartje bij restaurant → wordt gevuld
- [ ] Refresh pagina → hartje blijft gevuld
- [ ] Klik nogmaals → hartje wordt leeg
- [ ] Ga naar `/favorites` → zie gefavorite restaurants

### Notificaties
- [ ] Login als locatie eigenaar
- [ ] In tweede browser/incognito: login als consumer
- [ ] Consumer favoriet restaurant van eigenaar
- [ ] Eigenaar ziet notificatie in dashboard
- [ ] Klik op notificatie → ga naar location dashboard

### Edge Cases
- [ ] Niet ingelogd → klik hartje → redirect naar login
- [ ] Zelfde restaurant 2x favorieten → duplicate error
- [ ] Verwijder favoriet van `/favorites` → verdwijnt direct
- [ ] Manager account → ontvangt ook notificaties

## Troubleshooting

### Hartje werkt niet
- Check console voor errors
- Verify user is authenticated
- Check API response in Network tab

### Geen notificaties
- Run SQL migration in Supabase dashboard
- Check `notification_type` enum heeft `LOCATION_FAVORITED`
- Verify trigger exists: `trigger_notify_location_favorited`

### Favorieten niet opgeslagen
- Check RLS policies op `favorites` tabel
- Verify consumer record exists
- Check Supabase logs voor errors

## SQL Queries voor Debugging

```sql
-- Check favorieten voor een consumer
SELECT f.*, l.name 
FROM favorites f
JOIN locations l ON l.id = f.location_id
JOIN consumers c ON c.id = f.consumer_id
WHERE c.auth_user_id = 'YOUR_AUTH_USER_ID';

-- Check recent favorite notificaties
SELECT *
FROM notifications
WHERE type = 'LOCATION_FAVORITED'
ORDER BY created_at DESC
LIMIT 10;

-- Check trigger bestaat
SELECT tgname, tgrelid::regclass, proname
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE tgname = 'trigger_notify_location_favorited';
```

## Next Steps (Optioneel)

1. **Email Notificaties**: Stuur ook email wanneer restaurant favoriet wordt gemaakt
2. **Analytics**: Track hoeveel keer restaurant favoriet gemaakt is
3. **Popular Locations**: Toon "Meest gefavorite restaurants"
4. **Favorite Collections**: Maak collecties van favorieten (bijv. "Voor romantisch diner")
5. **Share Favorites**: Deel favorieten met vrienden

## Support

Voor vragen of problemen:
- Check Supabase logs
- Check browser console
- Check Network tab voor API calls
- Verify SQL migration is uitgevoerd

