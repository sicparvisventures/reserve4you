# Debug: Alert Aanmaken Werkt Niet

## Wat Te Doen

### Stap 1: Check Browser Console

1. Open je browser
2. Druk F12 (of Cmd+Option+I op Mac)
3. Ga naar **Console** tab
4. Ga naar: http://localhost:3007/favorites
5. Klik "Alert instellen"
6. Configureer opties
7. Klik "Alert aanmaken"
8. **KOPIEER DE EXACTE ERROR uit de console**

### Stap 2: Check Network Tab

1. In DevTools: ga naar **Network** tab
2. Filter op "alerts"
3. Klik "Alert aanmaken"
4. Klik op de "alerts" request (rood = error)
5. Ga naar **Response** tab
6. **KOPIEER DE RESPONSE**

### Stap 3: Test API Direct

Open nieuwe browser tab en plak dit in console (F12 → Console):

```javascript
// Test 1: Check of API bereikbaar is
fetch('/api/favorites/alerts')
  .then(r => r.json())
  .then(data => console.log('GET result:', data))
  .catch(err => console.error('GET error:', err));

// Test 2: Probeer alert aan te maken
fetch('/api/favorites/alerts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    locationId: 'PASTE_HIER_EEN_LOCATION_ID',
    preferredDayOfWeek: 5,
    preferredTimeStart: '18:00',
    preferredTimeEnd: '20:00',
    preferredPartySize: 2,
    maxNotifications: 5,
    cooldownHours: 24
  })
})
  .then(r => r.json())
  .then(data => console.log('POST result:', data))
  .catch(err => console.error('POST error:', err));
```

### Stap 4: Check Database

Ga naar Supabase SQL Editor en run:

```sql
-- Check of tabel bestaat en structuur klopt
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'favorite_availability_alerts'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'favorite_availability_alerts';

-- Check of je een consumer bent
SELECT id, auth_user_id, email
FROM consumers
WHERE auth_user_id = auth.uid();

-- Check favorieten
SELECT f.*, l.name as location_name
FROM favorites f
JOIN locations l ON f.location_id = l.id
JOIN consumers c ON f.consumer_id = c.id
WHERE c.auth_user_id = auth.uid();
```

## Mogelijke Problemen & Oplossingen

### Probleem 1: "Consumer not found"
**Oorzaak:** Je hebt geen consumer record
**Oplossing:**
```sql
-- Maak consumer aan
INSERT INTO consumers (auth_user_id, email, full_name)
VALUES (auth.uid(), 'jouw@email.com', 'Jouw Naam');
```

### Probleem 2: "Location not found"
**Oorzaak:** location_id klopt niet
**Oplossing:**
```sql
-- Vind je location IDs
SELECT id, name, slug FROM locations LIMIT 10;
```

### Probleem 3: "RLS policy violation"
**Oorzaak:** Row Level Security blokkeert insert
**Oplossing:**
```sql
-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'favorite_availability_alerts';

-- Als ze er niet zijn, run FIX_ALERTS_COMPLETE.sql opnieuw
```

### Probleem 4: "Column favorite_id does not exist"
**Oorzaak:** Oude tabel structuur
**Oplossing:**
```sql
-- Drop en recreate tabel
DROP TABLE IF EXISTS favorite_availability_alerts CASCADE;

-- Run daarna FIX_ALERTS_COMPLETE.sql opnieuw
```

### Probleem 5: "Validation error" / "Check constraint"
**Oorzaak:** Ongeldige waarden
**Oplossing:**
- preferredDayOfWeek: moet 0-6 zijn (of NULL)
- preferredPartySize: moet 1-20 zijn
- preferredTimeStart/End: moet valid time zijn
- cooldownHours: moet 1-168 zijn

### Probleem 6: Server Cache
**Oorzaak:** Oude code in cache
**Oplossing:**
```bash
# Stop server
lsof -ti:3007 | xargs kill -9

# Clear cache
rm -rf .next

# Start opnieuw
npm run dev
```

## Quick Test Script

Run dit in Supabase SQL Editor om alles te testen:

```sql
-- Full diagnostic check
DO $$
DECLARE
  v_consumer_id UUID;
  v_location_id UUID;
  v_alert_id UUID;
BEGIN
  -- Check 1: Consumer exists?
  SELECT id INTO v_consumer_id FROM consumers 
  WHERE auth_user_id = auth.uid() LIMIT 1;
  
  IF v_consumer_id IS NULL THEN
    RAISE NOTICE '❌ Geen consumer record gevonden!';
    RAISE NOTICE 'Run: INSERT INTO consumers (auth_user_id, email, full_name) VALUES (auth.uid(), ''email@example.com'', ''Name'');';
    RETURN;
  ELSE
    RAISE NOTICE '✅ Consumer gevonden: %', v_consumer_id;
  END IF;
  
  -- Check 2: Locations exist?
  SELECT id INTO v_location_id FROM locations LIMIT 1;
  
  IF v_location_id IS NULL THEN
    RAISE NOTICE '❌ Geen locaties gevonden!';
    RETURN;
  ELSE
    RAISE NOTICE '✅ Locaties gevonden';
  END IF;
  
  -- Check 3: Table exists?
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'favorite_availability_alerts'
  ) THEN
    RAISE NOTICE '❌ Tabel favorite_availability_alerts bestaat niet!';
    RAISE NOTICE 'Run FIX_ALERTS_COMPLETE.sql';
    RETURN;
  ELSE
    RAISE NOTICE '✅ Tabel bestaat';
  END IF;
  
  -- Check 4: Can insert?
  BEGIN
    INSERT INTO favorite_availability_alerts (
      consumer_id,
      location_id,
      preferred_day_of_week,
      preferred_time_start,
      preferred_time_end,
      preferred_party_size,
      max_notifications,
      cooldown_hours,
      is_active
    ) VALUES (
      v_consumer_id,
      v_location_id,
      5, -- Friday
      '18:00',
      '20:00',
      2,
      5,
      24,
      true
    ) RETURNING id INTO v_alert_id;
    
    RAISE NOTICE '✅ Alert aangemaakt: %', v_alert_id;
    
    -- Cleanup test alert
    DELETE FROM favorite_availability_alerts WHERE id = v_alert_id;
    RAISE NOTICE '✅ Test alert verwijderd';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Fout bij insert: %', SQLERRM;
  END;
  
END $$;
```

## Als Niets Werkt

### Nuclear Option: Volledige Reset

```sql
-- 1. Drop alles
DROP TABLE IF EXISTS favorite_availability_alerts CASCADE;
DROP FUNCTION IF EXISTS should_send_alert CASCADE;
DROP FUNCTION IF EXISTS record_alert_notification CASCADE;
DROP FUNCTION IF EXISTS notify_alert_created CASCADE;
DROP FUNCTION IF EXISTS update_favorite_alerts_updated_at CASCADE;

-- 2. Run FIX_ALERTS_COMPLETE.sql opnieuw

-- 3. Restart server:
-- lsof -ti:3007 | xargs kill -9
-- rm -rf .next
-- npm run dev

-- 4. Hard refresh browser (Cmd+Shift+R)
```

## Wat Ik Nodig Heb Om Te Helpen

Als het nog steeds niet werkt, geef me:

1. **Browser Console Output** (hele error)
2. **Network Response** (van /api/favorites/alerts POST)
3. **SQL Diagnostic Output** (van quick test script hierboven)
4. **Supabase Logs** (ga naar Logs → API in Supabase dashboard)

---

**Status**: Debugging Guide Ready
**Datum**: 29 Oktober 2025

