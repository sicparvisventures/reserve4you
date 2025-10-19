# Discover Page Migration Guide

Deze gids legt uit hoe je de discover page functionaliteit naar Supabase upload.

## 📋 Wat doet deze migratie?

Er zijn **TWEE** migratie bestanden die in volgorde uitgevoerd moeten worden:

### 1. `20250119000002_add_discover_columns.sql`
Voegt ontbrekende kolommen toe en synchroniseert cuisine/cuisine_type:
- Voegt `cuisine_type` kolom toe (als die niet bestaat)
- Voegt `address` kolom toe (gecombineerd uit address_line1/address_line2)
- Voegt `image_url` kolom toe (kopie van hero_image_url)
- Converteert latitude/longitude naar TEXT type
- Maakt een trigger om `cuisine` en `cuisine_type` gesynchroniseerd te houden

### 2. `20250119000001_discover_search_optimization.sql`
Het bestand bevat:

1. **Performance Indexes** - Voor snelle zoekfunctionaliteit
   - Indexes op `is_public`, `is_active`, `cuisine_type`, `price_range`
   - Trigram indexes voor fuzzy text search
   - Composite indexes voor veelgebruikte filter combinaties

2. **Search Functions** - SQL functies voor optimale performance
   - `search_public_locations()` - Hoofdzoekfunctie met filters
   - `get_available_cuisine_types()` - Cuisine types voor dropdown
   - `get_available_cities()` - Steden voor dropdown
   - `get_search_statistics()` - Admin statistieken

3. **Permissions** - Juiste toegangsrechten voor authenticated en anonymous users

## 🚀 Installatie

### Optie 1: Via Supabase Dashboard (Aanbevolen)

**BELANGRIJK: Voer de migraties in deze volgorde uit!**

#### Stap 1: Voeg ontbrekende kolommen toe

1. Ga naar je Supabase project dashboard: https://supabase.com/dashboard
2. Klik op je project
3. Ga naar **SQL Editor** in de linker sidebar
4. Klik op **New Query**
5. Kopieer de volledige inhoud van `supabase/migrations/20250119000002_add_discover_columns.sql`
6. Plak in de SQL editor
7. Klik op **Run** (of druk Cmd/Ctrl + Enter)
8. Wacht tot de query succesvol is uitgevoerd
9. Je zou berichten moeten zien zoals "✅ Added cuisine_type column"

#### Stap 2: Voeg search optimalisaties toe

1. Klik op **New Query** (in dezelfde SQL Editor)
2. Kopieer de volledige inhoud van `supabase/migrations/20250119000001_discover_search_optimization.sql`
3. Plak in de SQL editor
4. Klik op **Run** (of druk Cmd/Ctrl + Enter)
5. Wacht tot de query succesvol is uitgevoerd

### Optie 2: Via Supabase CLI

```bash
# Zorg dat je in de project root bent
cd /Users/dietmar/Desktop/ray2

# Login bij Supabase (als nog niet ingelogd)
npx supabase login

# Link je project (vervang PROJECT_ID met jouw project ID)
npx supabase link --project-ref PROJECT_ID

# Run BEIDE migraties in volgorde
# Eerst de kolommen toevoegen
npx supabase db remote commit
npx supabase db push

# Of handmatig met psql:
# psql -h your-project.supabase.co -U postgres -d postgres -f supabase/migrations/20250119000002_add_discover_columns.sql
# psql -h your-project.supabase.co -U postgres -d postgres -f supabase/migrations/20250119000001_discover_search_optimization.sql
```

## ✅ Verificatie

Test of de migratie succesvol is door deze queries uit te voeren in de SQL Editor:

```sql
-- Test 1: Check of indexes zijn aangemaakt
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'locations' 
  AND indexname LIKE 'idx_locations_%';

-- Test 2: Test de search functie
SELECT * FROM search_public_locations('pizza', NULL, NULL, NULL, 10);

-- Test 3: Haal beschikbare cuisine types op
SELECT * FROM get_available_cuisine_types();

-- Test 4: Haal beschikbare steden op
SELECT * FROM get_available_cities();
```

## 📊 Expected Results

Na succesvolle installatie zou je het volgende moeten zien:

1. **Indexes**: 7+ nieuwe indexes op de `locations` table
2. **Functions**: 4 nieuwe functies beschikbaar
3. **Performance**: Zoeken op `/discover` is snel (< 100ms voor de meeste queries)

## 🔧 Troubleshooting

### Error: "column cuisine_type does not exist"

Dit betekent dat je migratie #2 nog niet hebt uitgevoerd. Voer eerst `20250119000002_add_discover_columns.sql` uit.

### Error: "extension pg_trgm does not exist"

```sql
-- Voer dit uit in de SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### Error: "permission denied"

Zorg dat je als database owner ingelogd bent. In de Supabase dashboard heb je automatisch de juiste rechten.

### Error: "column does not exist" bij latitude/longitude

De migratie converteert deze automatisch naar TEXT. Als je deze error krijgt, run dan migratie #2 opnieuw.

### Indexes worden niet aangemaakt

Controleer of de `locations` table bestaat:

```sql
SELECT * FROM locations LIMIT 1;
```

Als deze fout geeft, moet je eerst de hoofdschema migratie uitvoeren.

### Cuisine sync werkt niet

Controleer of de trigger is aangemaakt:

```sql
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'locations';
```

Je zou `sync_cuisine_trigger` moeten zien.

## 🎨 Frontend Gebruik

De discover page is nu beschikbaar op:
- **URL**: http://localhost:3007/discover
- **Met filters**: http://localhost:3007/discover?cuisine=Italiaans&price=2

### Query Parameters

- `query` - Zoekterm (naam, beschrijving, stad)
- `cuisine` - Type keuken (bijv. "Italiaans", "Frans")
- `price` - Prijsklasse (1-4)
- `city` - Stad filter

## 📝 Database Schema Updates

Deze migratie verwacht dat de `locations` table de volgende kolommen heeft:
- `is_public` (boolean)
- `is_active` (boolean)
- `cuisine_type` (text)
- `price_range` (int)
- `name`, `description`, `city`, etc.

Als deze kolommen niet bestaan, voer dan eerst de basis schema migraties uit.

## 🔄 Updates

Om deze migratie te updaten in de toekomst:
1. Maak een nieuwe migratie bestand aan met een hogere timestamp
2. Gebruik `DROP INDEX IF EXISTS` en `CREATE OR REPLACE FUNCTION` voor updates
3. Test altijd eerst in development voor je naar production pusht

## 🎯 Performance Tips

1. **Vacuum regularly**: Run `VACUUM ANALYZE locations;` regelmatig voor optimale index performance
2. **Monitor slow queries**: Gebruik Supabase's query performance tools
3. **Add pagination**: Voor grote datasets, implementeer pagination in de frontend

## 📚 Resources

- [Supabase SQL Functions](https://supabase.com/docs/guides/database/functions)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [pg_trgm Extension](https://www.postgresql.org/docs/current/pgtrgm.html)

