# Step-by-Step SQL Query Guide

## Het Probleem

1. `DASHBOARD_INSIGHTS_QUERIES.sql` → Error: "column tenant_id does not exist"
2. `DASHBOARD_INSIGHTS_QUERIES_FIXED.sql` → Error: "invalid input syntax for type uuid: '[YOUR_TENANT_ID]'"

## De Oplossing

Gebruik de nieuwe **ready-to-use** queries die direct werken!

## Optie 1: Direct Gebruiken (Aanbevolen)

### Stap 1: Open Bestand

Open: `READY_TO_USE_QUERIES.sql`

### Stap 2: Kies Query

Bijvoorbeeld: "2. LOCATIONS PERFORMANCE"

### Stap 3: Kopieer & Run

Kopieer de query → Plak in Supabase SQL Editor → Run

**Klaar!** De query werkt direct zonder aanpassingen.

### Queries Beschikbaar

1. Quick Overview - Alle tenants
2. Locations Performance - Alle locaties
3. Popular Times - Drukste uren
4. Day of Week Analysis - Beste dagen
5. Status Distribution - Status overview
6. Weekly Growth - Deze week vs vorige week
7. Monthly Trends - 6 maanden overzicht
8. Top Customers - Repeat bookings
9. Capacity Utilization - Bezettingsgraad
10. No-show Analysis - No-show patronen

## Optie 2: Filter op Jouw Tenant

Als je alleen JOUW data wilt zien:

### Stap 1: Vind je Tenant ID

Open: `GET_MY_TENANT_ID.sql`

Kopieer en run in Supabase:

```sql
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  COUNT(DISTINCT l.id) as locations_count
FROM tenants t
LEFT JOIN locations l ON l.tenant_id = t.id
GROUP BY t.id, t.name
ORDER BY t.name;
```

**Output voorbeeld:**
```
tenant_id                              | tenant_name        | locations_count
---------------------------------------|--------------------|-----------------
a1b2c3d4-e5f6-7890-abcd-1234567890ab  | Mijn Restaurant    | 3
```

### Stap 2: Kopieer Tenant ID

Kopieer de UUID (bijvoorbeeld: `a1b2c3d4-e5f6-7890-abcd-1234567890ab`)

### Stap 3: Voeg Filter Toe

Pak een query uit `READY_TO_USE_QUERIES.sql` en voeg toe:

**Voor:**
```sql
SELECT ...
FROM locations l
LEFT JOIN bookings b ON b.location_id = l.id
WHERE l.is_active = true
GROUP BY ...
```

**Na:**
```sql
SELECT ...
FROM locations l
LEFT JOIN bookings b ON b.location_id = l.id
WHERE l.is_active = true
  AND l.tenant_id = 'a1b2c3d4-e5f6-7890-abcd-1234567890ab'  -- <-- Toegevoegd
GROUP BY ...
```

## Optie 3: Gebruik Fixed Queries (Manual)

Als je echt `DASHBOARD_INSIGHTS_QUERIES_FIXED.sql` wilt gebruiken:

### Stap 1: Open Bestand

Open: `DASHBOARD_INSIGHTS_QUERIES_FIXED.sql`

### Stap 2: Find & Replace

**Zoek:** `[YOUR_TENANT_ID]`
**Vervang met:** `a1b2c3d4-e5f6-7890-abcd-1234567890ab` (je tenant UUID)

**LET OP:** Verwijder de `[` en `]` brackets!

### Stap 3: Run Query

Nu werken alle queries.

## Voorbeeld: Complete Workflow

### Scenario: Ik wil location performance zien

**Stap 1:** Open `READY_TO_USE_QUERIES.sql`

**Stap 2:** Scroll naar "2. LOCATIONS PERFORMANCE"

**Stap 3:** Kopieer deze query:

```sql
SELECT 
  l.name as location_name,
  l.city,
  t.name as tenant_name,
  COUNT(b.id) as total_bookings,
  COUNT(b.id) FILTER (WHERE b.status = 'confirmed') as confirmed,
  SUM(b.number_of_guests) as total_guests
FROM locations l
LEFT JOIN bookings b ON b.location_id = l.id
LEFT JOIN tenants t ON t.id = l.tenant_id
WHERE l.is_active = true
GROUP BY l.id, l.name, l.city, t.name
ORDER BY total_bookings DESC
LIMIT 20;
```

**Stap 4:** Plak in Supabase SQL Editor

**Stap 5:** Run

**Stap 6:** Zie je results!

```
location_name    | city      | tenant_name     | total_bookings | confirmed | total_guests
-----------------|-----------|-----------------|----------------|-----------|-------------
Restaurant A     | Amsterdam | Mijn Restaurant | 234            | 198       | 876
Restaurant B     | Utrecht   | Mijn Restaurant | 156            | 132       | 624
```

## Quick Reference

### Als je deze error ziet:

**"column tenant_id does not exist"**
→ Gebruik `READY_TO_USE_QUERIES.sql` of `DASHBOARD_INSIGHTS_QUERIES_FIXED.sql`

**"invalid input syntax for type uuid: '[YOUR_TENANT_ID]'"**
→ Je moet `[YOUR_TENANT_ID]` vervangen met echte UUID, of gebruik `READY_TO_USE_QUERIES.sql`

**"no rows returned"**
→ Normaal voor sommige queries als data ontbreekt, niet een error

## Bestanden Overzicht

| Bestand | Status | Gebruik |
|---------|--------|---------|
| `READY_TO_USE_QUERIES.sql` | ✅ GEBRUIK DEZE | Werkt direct, geen changes nodig |
| `GET_MY_TENANT_ID.sql` | ✅ Helper | Vind je tenant UUID |
| `DASHBOARD_INSIGHTS_QUERIES_FIXED.sql` | ⚠️ Manual | Werkt, maar je moet [YOUR_TENANT_ID] vervangen |
| `DASHBOARD_INSIGHTS_QUERIES.sql` | ❌ Deprecated | Gebruik niet (schema error) |

## Tips

### Export Results

1. Run query
2. Click "Download CSV" in Supabase
3. Open in Excel/Google Sheets

### Save Favorite Queries

1. Create collection in Supabase SQL Editor
2. Save frequently used queries
3. One-click access

### Schedule Reports

Voor automatische reports:
- Supabase Edge Functions
- Cron jobs met pg_cron
- External automation (Zapier, n8n)

## Summary

**Simpelste manier:**
1. Open `READY_TO_USE_QUERIES.sql`
2. Kies een query
3. Kopieer & run in Supabase
4. Done!

**Voor gefilterde results:**
1. Run `GET_MY_TENANT_ID.sql` om je UUID te vinden
2. Voeg `AND l.tenant_id = 'UUID'` toe aan WHERE clause
3. Run query

Geen placeholder replacements nodig, werkt out-of-the-box!

