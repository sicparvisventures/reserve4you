# 🚀 WIDGET SYSTEEM - QUICK START

## ⚡ START IN 5 MINUTEN

### Stap 1: Database Setup (2 min)

```bash
# Open Supabase SQL Editor
# https://app.supabase.com/project/YOUR_PROJECT/sql

# Run dit script:
```

Plak en run: `WIDGET_SYSTEM_SETUP.sql`

Verify:
```sql
-- Check if tables exist
SELECT COUNT(*) FROM widget_configurations;
SELECT COUNT(*) FROM widget_analytics;

-- Check if default widgets are created
SELECT 
  t.name as bedrijf,
  wc.widget_code,
  wc.is_active
FROM widget_configurations wc
JOIN tenants t ON t.id = wc.tenant_id;
```

### Stap 2: Test in Manager Portal (2 min)

1. Start je dev server:
```bash
cd /Users/dietmar/Desktop/ray2
npm run dev  # of: pnpm dev
```

2. Ga naar: http://localhost:3007/manager

3. Login met je account

4. Ga naar: **Instellingen** → **Widget** tab

5. Je ziet nu:
   - ✅ Design opties
   - ✅ Instellingen
   - ✅ Embed Code
   - ✅ Analytics

### Stap 3: Test Widget Embed (1 min)

1. Kopieer je Widget Code uit de Manager Portal (tab "Embed Code")

2. Maak test HTML bestand:

```bash
cat > /tmp/widget-test.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Widget Test</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 1400px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f5f5f5;
    }
    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 40px;
    }
  </style>
</head>
<body>
  <h1>🍽️ Reserve4You Widget Test</h1>
  
  <!-- WIDGET HIER -->
  <script src="http://localhost:3007/widget-embed.js"></script>
  <div data-r4y-widget="JOUW_WIDGET_CODE_HIER"></div>
  
</body>
</html>
EOF
```

3. **Vervang `JOUW_WIDGET_CODE_HIER`** met je widget code!

4. Open in browser:
```bash
open /tmp/widget-test.html  # Mac
# of: xdg-open /tmp/widget-test.html  # Linux
# of: start /tmp/widget-test.html  # Windows
```

---

## 🎯 VOOR POULE & POULETTE

### Widget Code Vinden:

```sql
-- Get Poule & Poulette widget code
SELECT 
  widget_code,
  widget_name,
  is_active
FROM widget_configurations wc
JOIN tenants t ON t.id = wc.tenant_id
WHERE t.name ILIKE '%poule%poulette%';
```

### Als je nog geen widget hebt:

```sql
-- Create widget for Poule & Poulette
INSERT INTO widget_configurations (
  tenant_id,
  widget_name,
  widget_code,
  primary_color,
  booking_button_color,
  show_all_locations,
  is_active
) 
SELECT 
  id,
  'Poule & Poulette Widget',
  'widget_poulepoulette_' || substring(id::text, 1, 8),
  '#FF5A5F',
  '#FF5A5F',
  true,
  true
FROM tenants 
WHERE name ILIKE '%poule%poulette%'
LIMIT 1;

-- Get the widget code
SELECT widget_code FROM widget_configurations wc
JOIN tenants t ON t.id = wc.tenant_id
WHERE t.name ILIKE '%poule%poulette%';
```

### Embed op www.poulepoulette.com:

```html
<!-- Add to your website -->
<script src="https://reserve4you.vercel.app/widget-embed.js"></script>
<div data-r4y-widget="widget_poulepoulette_XXXXXXXX"></div>
```

---

## 🔍 TROUBLESHOOTING

### Widget laadt niet?

**Check 1: Widget bestaat en is actief**
```sql
SELECT * FROM widget_configurations WHERE widget_code = 'JOUW_CODE';
```

Als `is_active = false`:
```sql
UPDATE widget_configurations SET is_active = true WHERE widget_code = 'JOUW_CODE';
```

**Check 2: Locaties zijn publiek**
```sql
SELECT id, name, is_public, is_active 
FROM locations 
WHERE tenant_id = (
  SELECT tenant_id FROM widget_configurations WHERE widget_code = 'JOUW_CODE'
);
```

Als niet publiek:
```sql
UPDATE locations 
SET is_public = true, is_active = true 
WHERE tenant_id = (
  SELECT tenant_id FROM widget_configurations WHERE widget_code = 'JOUW_CODE'
);
```

**Check 3: API werkt**
```bash
# Test API endpoint
curl http://localhost:3007/api/widget/JOUW_WIDGET_CODE
```

Moet JSON returnen met config en locations.

**Check 4: Browser Console**
```
Open browser → F12 → Console tab
Look for errors
```

### Geen locaties zichtbaar?

```sql
-- Force locations to be public and active
UPDATE locations 
SET is_public = true, is_active = true;

-- Verify
SELECT name, city, is_public, is_active FROM locations;
```

### Styling issues?

```sql
-- Reset to defaults
UPDATE widget_configurations 
SET 
  primary_color = '#FF5A5F',
  booking_button_color = '#FF5A5F',
  theme = 'light',
  corner_radius = 12,
  enable_animations = true,
  enable_hover_effects = true
WHERE widget_code = 'JOUW_CODE';
```

---

## 📊 TEST ANALYTICS

### Track een test event:

```bash
curl -X POST http://localhost:3007/api/widget/JOUW_CODE/track \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "view",
    "referrer_url": "http://localhost/test",
    "user_agent": "Mozilla/5.0 Test"
  }'
```

### Check analytics:

```sql
SELECT 
  event_type,
  COUNT(*) as count,
  MAX(created_at) as last_event
FROM widget_analytics wa
JOIN widget_configurations wc ON wc.id = wa.widget_id
WHERE wc.widget_code = 'JOUW_CODE'
GROUP BY event_type;
```

---

## ✅ CHECKLIST

Controleer:

- [ ] SQL script gerund in Supabase ✅
- [ ] Tables bestaan (`widget_configurations`, `widget_analytics`) ✅
- [ ] Default widgets gemaakt ✅
- [ ] Dev server draait (localhost:3007) ✅
- [ ] Manager Portal → Widget tab zichtbaar ✅
- [ ] Widget code gekopieerd ✅
- [ ] Test HTML gemaakt met widget code ✅
- [ ] Widget laadt in browser ✅
- [ ] Locaties zichtbaar ✅
- [ ] Reserveer knop werkt ✅
- [ ] Analytics tracking werkt ✅

---

## 🎨 AANPASSEN

### In Manager Portal:

1. Ga naar **Instellingen** → **Widget**
2. Klik op **Design** tab
3. Pas aan:
   - Upload logo
   - Kies kleuren
   - Selecteer layout
   - Toggle features aan/uit
4. Klik **Opslaan**
5. Refresh je test HTML → wijzigingen zijn direct zichtbaar!

### Test verschillende settings:

**Dark theme:**
```sql
UPDATE widget_configurations 
SET theme = 'dark' 
WHERE widget_code = 'JOUW_CODE';
```

**Lijst layout:**
```sql
UPDATE widget_configurations 
SET layout = 'list' 
WHERE widget_code = 'JOUW_CODE';
```

**Specifieke locaties:**
```sql
UPDATE widget_configurations 
SET 
  show_all_locations = false,
  location_ids = ARRAY['location-id-1', 'location-id-2']
WHERE widget_code = 'JOUW_CODE';
```

---

## 📞 SUPPORT

### Documentatie:
- **Klant instructies:** `WIDGET_CLIENT_INSTRUCTIONS.md`
- **Developer guide:** `WIDGET_SYSTEM_COMPLETE.md`
- **Deze guide:** `WIDGET_QUICK_START.md`

### Debug Commands:

```sql
-- Get all widget info
SELECT 
  wc.widget_code,
  wc.widget_name,
  wc.is_active,
  t.name as tenant,
  COUNT(DISTINCT l.id) as location_count,
  COUNT(DISTINCT p.id) as promotion_count
FROM widget_configurations wc
JOIN tenants t ON t.id = wc.tenant_id
LEFT JOIN locations l ON l.tenant_id = t.id AND l.is_public = true
LEFT JOIN promotions p ON p.location_id = l.id AND p.is_active = true
GROUP BY wc.id, t.name;

-- Get widget with locations
SELECT 
  wc.widget_code,
  json_agg(json_build_object(
    'name', l.name,
    'city', l.address_json->>'city',
    'is_public', l.is_public,
    'has_deals', l.has_deals
  )) as locations
FROM widget_configurations wc
JOIN locations l ON l.tenant_id = wc.tenant_id
WHERE wc.widget_code = 'JOUW_CODE'
GROUP BY wc.widget_code;
```

---

## 🚀 VOLGENDE STAPPEN

1. ✅ **Test lokaal** - Gebruik deze quick start guide
2. 📝 **Documenteer** - Noteer je widget code
3. 🎨 **Customize** - Pas aan in Manager Portal
4. 🌐 **Deploy** - Run SQL in production Supabase
5. 📤 **Share** - Stuur `WIDGET_CLIENT_INSTRUCTIONS.md` naar klanten
6. 📊 **Monitor** - Check analytics in Manager Portal

---

**✨ Je bent klaar om te beginnen!**

Start met Stap 1 hierboven ☝️

