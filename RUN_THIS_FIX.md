# Fix voor get_combinable_tables Error

## Probleem

Error bij VERIFY_MIGRATION.sql:
```
ERROR: structure of query does not match function result type
DETAIL: Returned type character varying(100) does not match expected type text
```

## Oorzaak

De `get_combinable_tables` functie verwacht TEXT maar `tables.name` is VARCHAR(100). PostgreSQL vereist expliciete type casting.

## Oplossing

Run dit in Supabase SQL Editor:

### Optie 1: Quick Fix Script

Open en run: `FIX_GET_COMBINABLE_TABLES.sql`

Dit script:
1. Dropped de oude functie
2. Maakt nieuwe functie met expliciete ::TEXT casts
3. Test de functie automatisch
4. Toont success bericht

### Optie 2: Handmatige Fix

```sql
DROP FUNCTION IF EXISTS get_combinable_tables(UUID, INT);

CREATE OR REPLACE FUNCTION get_combinable_tables(
  p_location_id UUID,
  p_party_size INT
)
RETURNS TABLE (
  table_ids UUID[],
  total_seats INT,
  table_names TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ARRAY[t.id]::UUID[] AS table_ids,
    t.seats AS total_seats,
    t.name::TEXT AS table_names  -- Toegevoegd ::TEXT
  FROM tables t
  WHERE t.location_id = p_location_id
    AND t.is_active = true
    AND t.seats >= p_party_size
  ORDER BY t.seats ASC
  LIMIT 1;
  
  IF FOUND THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    array_agg(t.id ORDER BY t.seats DESC)::UUID[] AS table_ids,
    SUM(t.seats)::INT AS total_seats,
    string_agg(t.name, ' + ' ORDER BY t.seats DESC)::TEXT AS table_names  -- Toegevoegd ::TEXT
  FROM tables t
  WHERE t.location_id = p_location_id
    AND t.is_active = true
    AND t.is_combinable = true
    AND t.group_id IS NOT NULL
  GROUP BY t.group_id
  HAVING SUM(t.seats) >= p_party_size
  ORDER BY SUM(t.seats) ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;
```

## Verificatie

Na het runnen van de fix, run opnieuw:

```sql
-- Test de functie
SELECT * FROM get_combinable_tables(
  (SELECT id FROM locations LIMIT 1),
  4
);
```

**Verwacht:** Success (of leeg resultaat als geen geschikte tafels)

Dan run opnieuw: `VERIFY_MIGRATION.sql`

**Verwacht:** Alle checks succesvol zonder errors

## Status Check

```sql
-- Check of functie bestaat en correct type heeft
SELECT 
  routine_name,
  data_type
FROM information_schema.routines
WHERE routine_name = 'get_combinable_tables'
  AND routine_schema = 'public';
```

## Klaar

Fix is toegepast. Je kunt nu:
1. VERIFY_MIGRATION.sql runnen zonder errors
2. De unified table management gebruiken
3. Combineerbare tafels functie werkt correct

