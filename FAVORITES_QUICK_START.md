# Favorites Systeem - Quick Start

## ✅ Wat is geïmplementeerd

Het hartje voor favorites is nu zichtbaar op **ALLE** locatiekaarten in de gehele website:

### Pagina's met favorites functionaliteit:
- ✅ **Homepage** (`/`) - Alle secties:
  - Vanavond beschikbaar
  - Stijgen (Trending)
  - Best Beoordeeld
  - Nieuw op Reserve4You
- ✅ **Discover page** (`/discover`) - Zoekresultaten
- ✅ **Favorites page** (`/favorites`) - Je favorieten lijst

## 🚀 Direct starten

### Stap 1: SQL Script uitvoeren in Supabase

1. Ga naar [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecteer je project
3. Klik op "SQL Editor" in het menu links
4. Klik op "+ New Query"
5. Kopieer de inhoud van: `supabase/migrations/20250127000001_favorites_notifications.sql`
6. Plak in de SQL editor
7. Klik op "Run" (of druk Cmd/Ctrl + Enter)
8. Je ziet: "Success. No rows returned" ✅

### Stap 2: Test de functionaliteit

1. **Refresh je browser** op `http://localhost:3007`
2. Je ziet nu **hartjes rechtsboven** in alle locatiekaarten
3. **Klik op een hartje** → wordt gevuld (rood/primary color)
4. **Klik nogmaals** → wordt weer leeg
5. Ga naar `/favorites` → zie je gefavorite restaurants

## 🎯 Hoe het werkt

### Voor Bezoekers:
1. **Hartje klikken** → Restaurant wordt favoriet
2. **Optimistische update** → Hartje vult direct (geen wachten)
3. **Database opslag** → Favoriet wordt opgeslagen
4. **Persistent** → Blijft bewaard na refresh

### Voor Restaurant Eigenaren:
1. **Automatische notificatie** wanneer iemand hun restaurant favoriet maakt
2. **Zie wie** het restaurant heeft gefavoriet
3. **Direct link** naar location dashboard
4. **Ook managers** ontvangen de notificatie

## 🎨 Styling

- **Hartje leeg**: Lichte achtergrond, outline hart
- **Hartje gevuld**: Primary color achtergrond, gevuld hart
- **Positie**: Rechtsboven in de locatiekaart
- **Hover effect**: Smooth transition
- **Responsive**: Werkt op alle schermen

## 📊 Database

### Automatisch aangemaakt:
- Favoriet record in `favorites` tabel
- Notificatie in `notifications` tabel (type: `LOCATION_FAVORITED`)
- Consumer profiel (indien nog niet bestaat)

### Metadata in notificatie:
```json
{
  "consumer_id": "uuid",
  "consumer_name": "Naam van gast",
  "consumer_email": "email@example.com",
  "favorited_at": "2025-01-27T..."
}
```

## 🔍 Troubleshooting

### Hartje niet zichtbaar?
**Oplossing**: Hard refresh (Cmd+Shift+R of Ctrl+Shift+R)

### Hartje niet klikbaar?
**Check**:
- Console voor errors (F12)
- Network tab: kijk naar `/api/favorites` calls

### Geen notificaties?
**Check in Supabase**:
```sql
-- Controleer of trigger bestaat
SELECT tgname FROM pg_trigger 
WHERE tgname = 'trigger_notify_location_favorited';

-- Controleer of enum is uitgebreid
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'notification_type'::regtype;
```

## 🧪 Test Scenario

### Complete test flow:
1. ✅ Open `http://localhost:3007` in browser
2. ✅ Zie hartjes in alle locatiekaarten
3. ✅ Login als consumer
4. ✅ Klik hartje bij restaurant → vult
5. ✅ Ga naar `/favorites` → zie restaurant
6. ✅ Open nieuw incognito venster
7. ✅ Login als eigenaar van restaurant
8. ✅ Ga naar dashboard
9. ✅ Zie notificatie: "Nieuwe favoriet"
10. ✅ Klik notificatie → ga naar location

## 📝 Technische Details

### API Endpoints:
- `GET /api/favorites` - Haal favorieten op
- `POST /api/favorites` - Toggle favoriet
  - Body: `{ locationId: string, action: 'add' | 'remove' }`

### Components:
- `LocationCardWithFavorite` - Main component met state
- `LocationCard` - Display component (dumb)

### Database Trigger:
- Fires op: `INSERT` in `favorites` tabel
- Creëert: Notificatie voor eigenaar en managers
- Type: `LOCATION_FAVORITED`
- Priority: `LOW`

## ✨ Features

✅ Hartje in alle locatiekaarten  
✅ Optimistische UI updates  
✅ Automatische notificaties  
✅ Manager notificaties  
✅ Favorites pagina  
✅ Toggle functionaliteit  
✅ Consumer metadata  
✅ Professionele styling  
✅ Responsive design  
✅ Error handling  
✅ Loading states  

## 🎉 Klaar!

Het systeem is volledig werkend. Ga naar `http://localhost:3007` en test het uit!

