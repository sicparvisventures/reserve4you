# 🏆 Onze Keuze - Setup Instructies

## Overzicht

"Onze Keuze" is een dynamische Top 10 sectie op de homepage die wekelijks de meest populaire restaurants toont, gebaseerd op:
- 📊 Weekly views en clicks
- ⭐ Gemiddelde beoordelingen
- 💬 Aantal reviews
- 🆕 Nieuwheid (recency bonus)

## 📋 Setup Stappen

### 1. Fix Eventuele Errors (Als Je Die Hebt Gezien)

Als je errors hebt gezien over `booking_count` of functies die niet bestaan, run dan eerst:

```sql
-- In Supabase SQL Editor:
-- Kopieer en plak de inhoud van FIX_ONZE_KEUZE_ERROR.sql
```

### 2. Database Migration Uitvoeren

Voer de migration uit in Supabase SQL Editor:

```bash
# Open Supabase Dashboard → SQL Editor
# Kopieer en plak de inhoud van:
supabase/migrations/20250127000004_onze_keuze_metrics.sql
```

Of via command line:
```bash
cd /Users/dietmar/Desktop/ray2
supabase db push
```

### 3. Initiële Berekening Uitvoeren

Na de migration, worden de scores automatisch berekend. Controleer in Supabase SQL Editor:

```sql
-- Bekijk huidige top 10
SELECT 
    onze_keuze_rank,
    name,
    onze_keuze_score,
    city,
    average_rating,
    review_count
FROM locations
WHERE onze_keuze_rank IS NOT NULL
ORDER BY onze_keuze_rank ASC;
```

### 4. Wekelijkse Maintenance

Voer elke week (bijv. maandag ochtend) uit:

```bash
# Open het bestand:
ONZE_KEUZE_WEEKLY_MAINTENANCE.sql

# Kopieer en plak in Supabase SQL Editor
```

Dit reset de weekly counters en herberekent de top 10.

## 🎨 Component Structuur

### Frontend Components
- ✅ `/components/onzekeuze/OnzeKeuzeCarousel.tsx` - Professionele carousel component
- ✅ Gebruikt Reserve4You branding en kleuren
- ✅ Auto-scroll functionaliteit
- ✅ Responsive design
- ✅ Rank badges (#1, #2, etc.)

### Backend Functies
- ✅ `/lib/auth/tenant-dal.ts` - `getOnzeKeuzeLocations()` functie
- ✅ Query op basis van `onze_keuze_rank`
- ✅ Cached voor performance

### Homepage Integratie
- ✅ `/app/page.tsx` - Sectie toegevoegd tussen "Stijgers" en "Best Beoordeeld"
- ✅ Conditionally rendered (alleen als er top 10 locations zijn)

## 📊 Database Schema

### Nieuwe Kolommen in `locations` table:

| Kolom | Type | Beschrijving |
|-------|------|--------------|
| `total_views` | INTEGER | Totaal aantal page views |
| `total_clicks` | INTEGER | Totaal aantal clicks |
| `weekly_views` | INTEGER | Views deze week (reset wekelijks) |
| `weekly_clicks` | INTEGER | Clicks deze week (reset wekelijks) |
| `onze_keuze_score` | DECIMAL(10,2) | Berekende score |
| `onze_keuze_rank` | INTEGER | Rank 1-10 (NULL voor niet-top-10) |
| `metrics_updated_at` | TIMESTAMPTZ | Laatste update timestamp |
| `weekly_reset_at` | TIMESTAMPTZ | Laatste weekly reset timestamp |

### Database Functies:

1. **`calculate_onze_keuze_scores()`**
   - Berekent scores voor alle actieve locations
   - Wijst ranks toe aan top 10
   - Scoring algoritme:
     ```
     Score = (weekly_views × 1) + 
             (weekly_clicks × 3) + 
             (average_rating × 20) + 
             (review_count × 2) + 
             (recency_bonus: max 10 points)
     ```

2. **`reset_weekly_metrics()`**
   - Reset `weekly_views` en `weekly_clicks` naar 0
   - Voer uit elke maandag

3. **`increment_location_views(location_id)`**
   - Verhoogt view counters
   - Call wanneer location page wordt bekeken

4. **`increment_location_clicks(location_id)`**
   - Verhoogt click counters
   - Call bij clicks op cards, buttons, etc.

## 🔄 Tracking Implementeren (Optioneel)

Voor accurate metrics, implementeer tracking in je components:

### Location Card Clicks
```typescript
// In LocationCardWithFavorite.tsx
const handleClick = async () => {
  // Track click
  await fetch('/api/track/click', {
    method: 'POST',
    body: JSON.stringify({ locationId: location.id })
  });
};
```

### Location Page Views
```typescript
// In /app/p/[slug]/page.tsx
useEffect(() => {
  // Track view
  fetch('/api/track/view', {
    method: 'POST',
    body: JSON.stringify({ locationId: location.id })
  });
}, [location.id]);
```

### API Routes (Voorbeeld)
```typescript
// /app/api/track/view/route.ts
export async function POST(req: Request) {
  const { locationId } = await req.json();
  
  const supabase = await createClient();
  await supabase.rpc('increment_location_views', { 
    location_id_param: locationId 
  });
  
  return Response.json({ success: true });
}
```

## 🤖 Automatisering (Optioneel)

### Option 1: pg_cron (Supabase)
```sql
-- In Supabase SQL Editor
SELECT cron.schedule(
  'onze-keuze-weekly-reset',
  '0 6 * * 1',  -- Every Monday at 6:00 AM
  $$
    SELECT calculate_onze_keuze_scores();
    SELECT reset_weekly_metrics();
  $$
);
```

### Option 2: Vercel Cron Job
```typescript
// /app/api/cron/onze-keuze/route.ts
export async function GET(req: Request) {
  // Verify cron secret
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  
  // Calculate scores
  await supabase.rpc('calculate_onze_keuze_scores');
  
  // Reset weekly metrics
  await supabase.rpc('reset_weekly_metrics');
  
  return Response.json({ success: true });
}
```

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/onze-keuze",
    "schedule": "0 6 * * 1"
  }]
}
```

### Option 3: GitHub Actions
```yaml
# .github/workflows/onze-keuze-weekly.yml
name: Onze Keuze Weekly Reset

on:
  schedule:
    - cron: '0 6 * * 1'  # Every Monday at 6:00 AM UTC

jobs:
  reset:
    runs-on: ubuntu-latest
    steps:
      - name: Call API
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://yourdomain.com/api/cron/onze-keuze
```

## ✅ Verificatie

Test of alles werkt:

```sql
-- 1. Check of kolommen bestaan
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'locations' 
  AND column_name LIKE '%onze_keuze%'
  OR column_name LIKE '%weekly_%';

-- 2. Check of functies bestaan
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%onze_keuze%' 
   OR routine_name LIKE '%weekly_metrics%'
   OR routine_name LIKE '%increment_location%';

-- 3. Bekijk top 10
SELECT 
    onze_keuze_rank,
    name,
    onze_keuze_score,
    weekly_views,
    weekly_clicks,
    city
FROM locations
WHERE onze_keuze_rank IS NOT NULL
ORDER BY onze_keuze_rank ASC;

-- 4. Test increment functies
SELECT increment_location_views('some-location-uuid');
SELECT increment_location_clicks('some-location-uuid');
```

## 🎯 Resultaat

Na setup zie je op localhost:3007:
1. ✅ Spotlight Carousel (zoals voorheen)
2. ✅ Vandaag Beschikbaar sectie
3. ✅ Stijgers sectie
4. ✅ **NIEUW: Onze Keuze Carousel** 🏆
5. ✅ Best Beoordeeld sectie
6. ✅ Nieuw op Reserve4You sectie
7. ✅ Populaire keukens sectie

## 📝 Notities

- Scores worden automatisch berekend bij eerste setup
- Weekly reset moet handmatig of via automation gebeuren
- De top 10 kan wisselen elke week afhankelijk van metrics
- Nieuwe restaurants krijgen een recency bonus (max 10 punten)
- Alleen actieve en publieke locations worden meegenomen

## 🆘 Troubleshooting

**Geen locations in Onze Keuze?**
```sql
-- Herbereken scores
SELECT calculate_onze_keuze_scores();

-- Check of er locations zijn met score > 0
SELECT COUNT(*) FROM locations WHERE onze_keuze_score > 0;
```

**Carousel niet zichtbaar?**
- Check of `onzeKeuzeLocations.length > 0`
- Check browser console voor errors
- Verify migration is succesvol uitgevoerd

**Scores kloppen niet?**
- Check of `average_rating`, `review_count`, `booking_count` correct zijn
- Pas scoring algoritme aan in `calculate_onze_keuze_scores()` indien nodig

