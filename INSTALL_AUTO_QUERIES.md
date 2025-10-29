# Installatie: Automatische Tenant Detectie

## Wat doet dit?

De SQL queries detecteren automatisch welke gebruiker ingelogd is en tonen alleen data van **hun** bedrijf/restaurants. Geen handmatige tenant_id meer nodig!

## Installatie (2 minuten)

### Stap 1: Open Supabase

1. Ga naar: `https://supabase.com/dashboard`
2. Selecteer je project
3. Click **SQL Editor** in linker menu

### Stap 2: Installeer Helper Functions

1. Open bestand: `AUTO_TENANT_DETECTION.sql`
2. Kopieer de HELE inhoud
3. Plak in Supabase SQL Editor
4. Click **RUN**

**Verwachte output:**
```
Success. No rows returned.
```

Dit is normaal! De functies zijn nu geïnstalleerd.

### Stap 3: Test de Functies

In Supabase SQL Editor, run deze test query:

```sql
-- Test: Krijg mijn tenant info
SELECT * FROM get_my_tenant_info();
```

**Verwachte output:**
```
tenant_id                              | tenant_name        | my_role | is_owner
---------------------------------------|--------------------|---------|---------
a1b2c3d4-e5f6-7890-abcd-1234567890ab  | Mijn Restaurant BV | OWNER   | true
```

Als je een error krijgt: "User not authenticated"
→ Dit is normaal als je NIET ingelogd bent via de app. De functies werken alleen voor authenticated users.

### Stap 4: Gebruik Auto Queries

Nu kun je `AUTO_DASHBOARD_QUERIES.sql` gebruiken!

Open bestand en run een query, bijvoorbeeld:

```sql
-- Query #1: Mijn Tenant Overview
SELECT 
  t.name as tenant_name,
  COUNT(DISTINCT l.id) as total_locations,
  COUNT(b.id) as total_bookings
FROM tenants t
LEFT JOIN locations l ON l.tenant_id = t.id
LEFT JOIN bookings b ON b.location_id = l.id
WHERE t.id = get_my_tenant_id()
GROUP BY t.id, t.name;
```

**Dit toont automatisch ALLEEN jouw data!**

## Hoe het werkt

### Schema Relaties

```
auth.users (Supabase authentication)
    │
    ├─→ tenants.owner_user_id (eigenaar)
    │
    └─→ memberships.user_id (team members)
            └─→ memberships.tenant_id
                    └─→ locations.tenant_id
                            └─→ bookings.location_id
```

### Functie: get_my_tenant_id()

```sql
get_my_tenant_id()
  ↓
1. Haal auth.uid() op (ingelogde gebruiker)
  ↓
2. Check: Is user OWNER van een tenant?
   → tenants WHERE owner_user_id = auth.uid()
  ↓
3. Zo niet, check: Is user MEMBER van een tenant?
   → memberships WHERE user_id = auth.uid()
  ↓
4. Return tenant_id
```

### Functie: get_my_tenant_info()

Geeft meer details:
- tenant_id
- tenant_name
- my_role (OWNER/MANAGER/STAFF)
- is_owner (boolean)

## Gebruik in de App

### Option A: Direct in API Routes

```typescript
// app/api/dashboard/stats/route.ts

export async function GET() {
  const supabase = createClient();
  
  // Query gebruikt automatisch get_my_tenant_id()
  const { data } = await supabase.rpc('get_dashboard_stats');
  
  return Response.json(data);
}
```

### Option B: Create Database Function

```sql
-- In Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_locations INT,
  total_bookings BIGINT,
  bookings_this_week BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT l.id)::INT,
    COUNT(b.id),
    COUNT(b.id) FILTER (WHERE b.created_at >= CURRENT_DATE - INTERVAL '7 days')
  FROM locations l
  LEFT JOIN bookings b ON b.location_id = l.id
  WHERE l.tenant_id = get_my_tenant_id();
END;
$$;

GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
```

Dan in je app:

```typescript
const { data } = await supabase.rpc('get_dashboard_stats');
```

### Option C: Regular Query met Filter

```typescript
const { data: user } = await supabase.auth.getUser();

const { data: tenant } = await supabase
  .from('tenants')
  .select('id')
  .or(`owner_user_id.eq.${user.id}`)
  .single();

const { data: locations } = await supabase
  .from('locations')
  .select('*')
  .eq('tenant_id', tenant.id);
```

## Voordelen

✅ **Automatisch** - Geen handmatige tenant_id nodig  
✅ **Veilig** - Gebruikers zien alleen hun eigen data  
✅ **Simpel** - Één functie call: `get_my_tenant_id()`  
✅ **Flexibel** - Werkt voor owners én team members  
✅ **Consistent** - Dezelfde logica overal  

## Queries Beschikbaar

Alle queries in `AUTO_DASHBOARD_QUERIES.sql`:

1. **Tenant Overview** - Totaal overzicht
2. **Locations Performance** - Per locatie stats
3. **Weekly Comparison** - Deze week vs vorige
4. **Popular Times** - Drukste uren
5. **Day of Week** - Beste dagen
6. **Status Distribution** - Booking statussen
7. **Monthly Trends** - 6 maanden history
8. **Top Customers** - Repeat bookings
9. **Capacity Utilization** - Bezettingsgraad
10. **No-show Analysis** - No-show patronen
11. **Revenue Potential** - Deposit tracking
12. **Quick Summary** - Dashboard summary (1 row)

## Troubleshooting

### Error: "User not authenticated"

**Oorzaak:** Je bent niet ingelogd via Supabase auth.

**Oplossing:** 
1. Log in via je app op `localhost:3007`
2. Of gebruik Supabase dashboard met RLS disabled (voor testing)

### Error: "User is not associated with any tenant"

**Oorzaak:** Gebruiker heeft geen tenant relatie.

**Oplossing:**
1. Check of user een tenant heeft:
```sql
SELECT * FROM tenants WHERE owner_user_id = auth.uid();
SELECT * FROM memberships WHERE user_id = auth.uid();
```

2. Als geen tenant: maak er een aan via de app

### Error: "function get_my_tenant_id() does not exist"

**Oorzaak:** Stap 2 (installatie) niet gedaan.

**Oplossing:** Run `AUTO_TENANT_DETECTION.sql` eerst.

## Volgende Stappen

1. ✅ Installeer functies (`AUTO_TENANT_DETECTION.sql`)
2. ✅ Test queries (`AUTO_DASHBOARD_QUERIES.sql`)
3. ✅ Integreer in je app (API routes)
4. ✅ Update `DashboardInsights.tsx` component

## Files Overzicht

| File | Wat het doet |
|------|--------------|
| `AUTO_TENANT_DETECTION.sql` | **Installeer eerst!** Maakt helper functies |
| `AUTO_DASHBOARD_QUERIES.sql` | Klaar-om-te-gebruiken queries (automatisch) |
| `INSTALL_AUTO_QUERIES.md` | Deze guide |
| ~~`READY_TO_USE_QUERIES.sql`~~ | Oude versie (toont alle tenants) |
| ~~`DASHBOARD_INSIGHTS_QUERIES_FIXED.sql`~~ | Oude versie (handmatig edit) |

---

**Klaar om te gebruiken!** 🚀

Run `AUTO_TENANT_DETECTION.sql` → Test → Gebruik `AUTO_DASHBOARD_QUERIES.sql`

