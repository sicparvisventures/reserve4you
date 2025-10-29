# START HIER: Dashboard SQL Queries

## Snelle Start (30 seconden)

### 1. Open Supabase SQL Editor
`https://supabase.com/dashboard/project/[YOUR-PROJECT]/sql`

### 2. Open bestand
`READY_TO_USE_QUERIES.sql`

### 3. Kopieer een query
Bijvoorbeeld: "Quick Overview - Alle Tenants"

### 4. Plak & Run
Plak in SQL editor → Click "RUN"

**Klaar!** 🎉

## Beschikbare Queries

| # | Query | Wat het toont |
|---|-------|---------------|
| 1 | Quick Overview | Totaal overzicht per tenant |
| 2 | Locations Performance | Beste/slechtste locaties |
| 3 | Popular Times | Drukste uren |
| 4 | Day of Week | Beste dagen |
| 5 | Status Distribution | Booking statussen |
| 6 | Weekly Growth | Deze week vs vorige |
| 7 | Monthly Trends | 6 maanden data |
| 8 | Top Customers | Repeat customers |
| 9 | Capacity Utilization | Bezettingsgraad |
| 10 | No-show Analysis | No-show patronen |

## Filter op Jouw Tenant (Optioneel)

Als je alleen jouw restaurants wilt zien:

### Stap 1: Vind je Tenant ID

Run `GET_MY_TENANT_ID.sql` of deze query:

```sql
SELECT id, name FROM tenants;
```

Kopieer je tenant UUID.

### Stap 2: Voeg filter toe

Voeg dit toe aan ANY query:

```sql
AND l.tenant_id = 'PLAK-HIER-JE-UUID'
```

## Voorbeeld

**Basic (alle data):**
```sql
SELECT 
  l.name, 
  COUNT(b.id) as bookings
FROM locations l
LEFT JOIN bookings b ON b.location_id = l.id
GROUP BY l.name;
```

**Filtered (alleen jouw data):**
```sql
SELECT 
  l.name, 
  COUNT(b.id) as bookings
FROM locations l
LEFT JOIN bookings b ON b.location_id = l.id
WHERE l.tenant_id = 'a1b2c3d4-...'  -- <-- Toegevoegd
GROUP BY l.name;
```

## Files Overview

✅ **READY_TO_USE_QUERIES.sql** - Begin hier!  
✅ **GET_MY_TENANT_ID.sql** - Helper voor filtering  
📖 **STEP_BY_STEP_SQL_GUIDE.md** - Uitgebreide uitleg  
❌ **DASHBOARD_INSIGHTS_QUERIES.sql** - Deprecated (schema error)  
⚠️ **DASHBOARD_INSIGHTS_QUERIES_FIXED.sql** - Werkt, maar handmatig edit nodig

## Problemen?

**Error: "column tenant_id does not exist"**
→ Gebruik `READY_TO_USE_QUERIES.sql`

**Error: "invalid input syntax for type uuid"**
→ Vervang `[YOUR_TENANT_ID]` met echte UUID (of gebruik READY_TO_USE_QUERIES.sql)

**Error: "no rows returned"**
→ Niet echt een error, betekent gewoon geen data voor die query

## Volgende Stappen

1. ✅ Run een paar queries in Supabase
2. ✅ Kies je favoriete queries voor dashboard
3. ✅ Integreer in `DashboardInsights.tsx` component
4. ✅ Test op localhost:3007/manager

---

**Ready?** Open `READY_TO_USE_QUERIES.sql` en begin!

