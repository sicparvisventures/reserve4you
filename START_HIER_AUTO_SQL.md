# ⚡ START HIER: Automatische SQL Queries

## 🎯 Wat je krijgt

SQL queries die **automatisch** jouw bedrijf detecteren en alleen jouw restaurants/bookings tonen. Geen handmatige filters meer!

## 📋 Snelle Installatie (2 minuten)

### 1️⃣ Open Supabase

Ga naar: `https://supabase.com/dashboard` → Je project → **SQL Editor**

### 2️⃣ Run Installatie Script

1. Open: `AUTO_TENANT_DETECTION.sql`
2. Kopieer alles (Cmd+A → Cmd+C)
3. Plak in Supabase SQL Editor
4. Click **RUN**

**Verwacht:** `Success. No rows returned.` ✅

### 3️⃣ Test Het

Run deze test query:

```sql
SELECT * FROM get_my_tenant_info();
```

**Verwacht:**
```
tenant_id   | tenant_name        | my_role | is_owner
------------|--------------------|---------|---------
abc123...   | Mijn Restaurant BV | OWNER   | true
```

### 4️⃣ Gebruik de Queries

Open: `AUTO_DASHBOARD_QUERIES.sql`

Kies een query, bijvoorbeeld **#12 (Quick Dashboard Summary)**:

```sql
SELECT 
  t.name as tenant_name,
  (SELECT COUNT(*) FROM locations 
   WHERE tenant_id = t.id AND is_active = true) as active_locations,
  (SELECT COUNT(*) FROM bookings b 
   JOIN locations l ON l.id = b.location_id 
   WHERE l.tenant_id = t.id 
     AND b.created_at >= CURRENT_DATE - INTERVAL '7 days') as bookings_this_week
FROM tenants t
WHERE t.id = get_my_tenant_id();
```

**Kopieer → Plak → RUN** → Zie JOUW data! 🎉

## 📊 Beschikbare Queries

| # | Query | Output |
|---|-------|--------|
| 1 | Tenant Overview | Totaal stats van jouw bedrijf |
| 2 | Locations Performance | Per restaurant prestaties |
| 3 | Weekly Comparison | Deze vs vorige week |
| 4 | Popular Times | Drukste reserverings-uren |
| 5 | Day of Week | Beste dagen |
| 6 | Status Distribution | Booking statussen |
| 7 | Monthly Trends | 6 maanden grafiek data |
| 8 | Top Customers | Stamgasten |
| 9 | Capacity Utilization | Bezettingsgraad |
| 10 | No-show Analysis | No-show patronen |
| 11 | Revenue Potential | Inkomsten via deposits |
| 12 | Quick Summary | 1-row dashboard summary |

## 🔧 Gebruik in Code

### API Route Voorbeeld

```typescript
// app/api/dashboard/quick-stats/route.ts

import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  
  // Query gebruikt automatisch ingelogde user's tenant
  const { data, error } = await supabase
    .rpc('get_my_tenant_id')
    .single();
    
  if (error) return Response.json({ error }, { status: 401 });
  
  const { data: stats } = await supabase
    .from('locations')
    .select('id, name, (bookings(count))')
    .eq('tenant_id', data);
    
  return Response.json(stats);
}
```

### React Component Voorbeeld

```typescript
// components/manager/DashboardStats.tsx

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function DashboardStats() {
  const [stats, setStats] = useState(null);
  const supabase = createClient();
  
  useEffect(() => {
    async function loadStats() {
      // Automatisch gefilterd op jouw tenant
      const { data } = await supabase
        .from('locations')
        .select(`
          id, 
          name,
          bookings!inner(count)
        `);
      
      setStats(data);
    }
    
    loadStats();
  }, []);
  
  return <div>{/* Render stats */}</div>;
}
```

## 🛡️ Hoe het werkt

```
1. User logt in → Supabase auth.uid()
   ↓
2. get_my_tenant_id() functie
   ↓
3. Check: tenants.owner_user_id = auth.uid()
   OF: memberships.user_id = auth.uid()
   ↓
4. Return tenant_id
   ↓
5. Query filtert automatisch op deze tenant_id
   ↓
6. User ziet alleen EIGEN data
```

## ❌ Troubleshooting

### "User not authenticated"
→ Log in via je app eerst op `localhost:3007`

### "function does not exist"
→ Run `AUTO_TENANT_DETECTION.sql` eerst (Stap 2)

### "User is not associated with any tenant"
→ Check: `SELECT * FROM tenants WHERE owner_user_id = auth.uid();`  
→ Maak tenant aan via de app als deze niet bestaat

## 📁 Files

| File | Gebruik |
|------|---------|
| ✅ `AUTO_TENANT_DETECTION.sql` | **START HIER** - Installeer eerst |
| ✅ `AUTO_DASHBOARD_QUERIES.sql` | 12 klaar-om-te-gebruiken queries |
| 📖 `INSTALL_AUTO_QUERIES.md` | Uitgebreide installatie guide |
| 📖 `START_HIER_AUTO_SQL.md` | Deze quick start |

## ⏭️ Volgende Stappen

1. ✅ Installeer functies
2. ✅ Test een paar queries
3. ✅ Kies je favoriete queries voor dashboard
4. ✅ Integreer in `DashboardInsights.tsx`

---

**Klaar!** Je hebt nu automatische, veilige, self-service SQL queries! 🚀

