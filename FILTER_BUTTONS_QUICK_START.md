# 🚀 Filter Buttons - Quick Start

## Setup in 3 Stappen

### Stap 1: Run SQL Script (5 min)

```bash
# 1. Open Supabase SQL Editor
https://app.supabase.com/project/YOUR_PROJECT/sql

# 2. Copy-paste FILTER_BUTTONS_SETUP.sql
# 3. Klik "Run"
```

**Script voegt toe**:
- Coordinates (latitude, longitude)
- Opening hours (JSONB)
- Group capacity (max_group_size, group_friendly)
- Deals (has_deals, deals JSONB)
- Helper functions + indexes

### Stap 2: Test de App

```bash
# Start dev server
pnpm dev

# Open browser
http://localhost:3007
```

### Stap 3: Klik op Filter Buttons

✅ **Bij mij in de buurt** → Restaurants binnen 25km  
✅ **Nu open** → Momenteel open restaurants  
✅ **Vandaag** → Beschikbaar vandaag  
✅ **Groepen** → Geschikt voor 8+ personen  
✅ **Deals** → Speciale aanbiedingen  
✅ **Zoeken** → Uitgebreide zoekpagina

---

## Test Routes

```
# Homepage met alle filter buttons
http://localhost:3007

# Discover met filters
http://localhost:3007/discover?nearby=true
http://localhost:3007/discover?open_now=true
http://localhost:3007/discover?today=true
http://localhost:3007/discover?groups=true
http://localhost:3007/discover?deals=true

# Dedicated search page
http://localhost:3007/search

# Combinaties
http://localhost:3007/discover?nearby=true&open_now=true&deals=true
```

---

## Update Sample Data (Optioneel)

```sql
-- Voeg coordinates toe voor jouw restaurant
UPDATE locations 
SET 
  latitude = 51.0543,   -- Gent
  longitude = 3.7174
WHERE name = 'Korenmarkt11';

-- Mark als group-friendly
UPDATE locations 
SET 
  group_friendly = TRUE,
  max_group_size = 15
WHERE name = 'Korenmarkt11';

-- Add deal
UPDATE locations 
SET 
  has_deals = TRUE,
  deals = '[
    {
      "title": "Happy Hour",
      "description": "50% korting op drankjes 17:00-19:00"
    }
  ]'::JSONB
WHERE name = 'Korenmarkt11';
```

---

## ✅ Klaar!

Alle filter buttons werken nu op `localhost:3007`!

Zie `FILTER_BUTTONS_COMPLETE_GUIDE.md` voor:
- Complete feature lijst
- Troubleshooting
- Toekomstige uitbreidingen
- API documentatie

