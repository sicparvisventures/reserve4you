# SQL Queries Quick Guide

## Probleem Opgelost

De originele queries hadden een fout: `bookings` tabel heeft geen directe `tenant_id` kolom.

**Schema relatie:**
```
bookings → location_id (FK)
locations → tenant_id (FK)
```

## Gebruik de Gefixt Versie

**Bestand:** `DASHBOARD_INSIGHTS_QUERIES_FIXED.sql`

Alle queries zijn nu correct en gebruiken:
```sql
FROM bookings b
JOIN locations l ON l.id = b.location_id
WHERE l.tenant_id = '[YOUR_TENANT_ID]'
```

## Quick Start

### Stap 1: Vind je Tenant ID

Run in Supabase SQL Editor:

```sql
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  COUNT(l.id) as location_count
FROM tenants t
LEFT JOIN locations l ON l.tenant_id = t.id
GROUP BY t.id, t.name
ORDER BY t.name;
```

**Output voorbeeld:**
```
tenant_id                             | tenant_name        | location_count
--------------------------------------|--------------------|--------------
a1b2c3d4-e5f6-7890-abcd-ef1234567890 | Mijn Restaurant BV | 3
```

### Stap 2: Kopieer je Tenant ID

Bijvoorbeeld: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### Stap 3: Vervang in Queries

Open `DASHBOARD_INSIGHTS_QUERIES_FIXED.sql` en zoek/vervang:

**Zoek:** `[YOUR_TENANT_ID]`
**Vervang met:** `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### Stap 4: Run Query

Kopieer en plak de query in Supabase SQL Editor en run.

## Test Query

Quick test om te verifiëren dat alles werkt:

```sql
SELECT 
  'Quick Stats' as report,
  COUNT(DISTINCT l.id) as total_locations,
  COUNT(b.id) as total_bookings,
  COUNT(b.id) FILTER (WHERE b.created_at >= CURRENT_DATE - INTERVAL '7 days') as bookings_last_7_days,
  COUNT(b.id) FILTER (WHERE b.status = 'confirmed') as confirmed_bookings
FROM locations l
LEFT JOIN bookings b ON b.location_id = l.id
WHERE l.tenant_id = 'YOUR_TENANT_ID_HERE';
```

**Verwacht resultaat:**
```
report       | total_locations | total_bookings | bookings_last_7_days | confirmed_bookings
-------------|-----------------|----------------|----------------------|-------------------
Quick Stats  | 3               | 456            | 23                   | 312
```

## Available Queries (All Fixed)

1. **Weekly Growth Analysis** - Vergelijk deze week vs vorige week
2. **Location Performance Ranking** - Top performing locations
3. **Popular Time Slots** - Drukste tijden
4. **Day of Week Analysis** - Beste dagen
5. **Booking Status Distribution** - Status overview
6. **Monthly Trends** - 6 maanden trends
7. **Peak Times Heatmap** - Dag x tijd matrix
8. **Customer Loyalty** - One-time vs repeat klanten
9. **Capacity Utilization** - Bezettingsgraad
10. **No-show Analysis** - No-show patronen
11. **Booking Lead Time** - Hoeveel dagen vooruit boeken
12. **Revenue Potential** - Geschatte omzet

## Voorbeeld: Location Performance Query

```sql
SELECT 
  l.id,
  l.name,
  l.city,
  COUNT(b.id) as total_bookings,
  COUNT(b.id) FILTER (WHERE b.status = 'confirmed') as confirmed_bookings,
  ROUND(
    (COUNT(b.id) FILTER (WHERE b.status = 'confirmed')::FLOAT / 
     NULLIF(COUNT(b.id), 0) * 100),
    1
  ) as confirmation_rate,
  SUM(b.number_of_guests) as total_guests
FROM locations l
LEFT JOIN bookings b ON b.location_id = l.id
WHERE l.tenant_id = 'YOUR_TENANT_ID_HERE'
  AND l.is_active = true
GROUP BY l.id, l.name, l.city
ORDER BY total_bookings DESC;
```

**Output voorbeeld:**
```
name                | city      | total_bookings | confirmed_bookings | confirmation_rate | total_guests
--------------------|-----------|----------------|--------------------|--------------------|-------------
Restaurant A        | Amsterdam | 234            | 198                | 84.6               | 876
Restaurant B        | Utrecht   | 156            | 132                | 84.6               | 624
Restaurant C        | Rotterdam | 98             | 87                 | 88.8               | 392
```

## Tips

### Export Results

1. Run query in Supabase SQL Editor
2. Copy results
3. Paste in Excel/Google Sheets
4. Format as table

### Scheduled Reports

Voor automatische reports, overweeg:
- Supabase Edge Functions
- Cron jobs
- Email automation

### Visualization

Gebruik query results voor:
- Charts (Recharts, Chart.js)
- Dashboards (Metabase, Grafana)
- Reports (PDF generation)

## Troubleshooting

### Error: "column tenant_id does not exist"

**Probleem:** Je gebruikt de oude queries
**Oplossing:** Gebruik `DASHBOARD_INSIGHTS_QUERIES_FIXED.sql`

### No Results

**Check:**
1. Tenant ID correct?
2. Locaties actief? (`is_active = true`)
3. Bookings bestaan?
4. Date range redelijk?

### Slow Queries

**Oplossingen:**
1. Add indexes op frequently queried columns
2. Reduce date range
3. Limit results met `LIMIT`
4. Use specific location_id filters

## Schema Reference

```sql
-- Main tables structure
tenants
  ├─ id (UUID, PK)
  ├─ name
  └─ ...

locations
  ├─ id (UUID, PK)
  ├─ tenant_id (UUID, FK → tenants.id)
  ├─ name
  ├─ is_active
  └─ ...

bookings
  ├─ id (UUID, PK)
  ├─ location_id (UUID, FK → locations.id)
  ├─ booking_date
  ├─ booking_time
  ├─ number_of_guests
  ├─ status
  ├─ customer_email
  ├─ created_at
  └─ ...

tables
  ├─ id (UUID, PK)
  ├─ location_id (UUID, FK → locations.id)
  ├─ seats
  ├─ is_active
  └─ ...
```

## Summary

- **Use:** `DASHBOARD_INSIGHTS_QUERIES_FIXED.sql`
- **Replace:** `[YOUR_TENANT_ID]` met je actual UUID
- **Test:** Run quick test query eerst
- **Export:** Results naar Excel/Sheets voor analyse

Alle queries werken nu correct met het schema!

