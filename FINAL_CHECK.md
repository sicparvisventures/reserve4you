# Final Check: Waarom 500 Error Nog Steeds?

## Mogelijke Oorzaken

### 1. Server draait met oude cached code
**Oplossing:** Volledig stoppen en clean restart

### 2. Browser cache
**Oplossing:** Hard refresh + clear cache

### 3. Code niet correct opgeslagen
**Oplossing:** Check of files echt zijn aangepast

### 4. Database heeft nog oude data
**Oplossing:** Test met SQL direct in database

## Wat Te Doen NU

### Stap 1: Check Server Logs
Kijk in terminal waar npm run dev draait:
```
Zie je: "Error fetching alerts: column city does not exist"?
→ Dan draait server nog oude code
```

### Stap 2: Volledige Clean Restart
```bash
# Stop ALLES
pkill -f "next dev"
lsof -ti:3007 | xargs kill -9

# Wis cache
rm -rf .next
rm -rf node_modules/.cache

# Start opnieuw
npm run dev
```

### Stap 3: Check Code Files
Verifieer dat changes zijn doorgevoerd:

```bash
# Check of 'city' nog voorkomt in alerts route
grep -n "city" app/api/favorites/alerts/route.ts
# Zou NIETS moeten geven!

# Check insights route
grep -n "city" app/api/favorites/insights/route.ts
# Zou NIETS moeten geven!
```

### Stap 4: Test Direct in Terminal
```bash
# Test API call (als server draait)
curl -X GET http://localhost:3007/api/favorites/alerts \
  -H "Cookie: $(curl -s http://localhost:3007 | grep -o 'sb-[^;]*')"
```

### Stap 5: SQL Direct Test
```sql
-- Test in Supabase SQL Editor
-- Dit zou moeten werken:
DO $$
DECLARE
  v_consumer_id UUID;
  v_location_id UUID;
BEGIN
  SELECT id INTO v_consumer_id FROM consumers WHERE auth_user_id = auth.uid() LIMIT 1;
  SELECT id INTO v_location_id FROM locations LIMIT 1;
  
  IF v_consumer_id IS NOT NULL AND v_location_id IS NOT NULL THEN
    INSERT INTO favorite_availability_alerts (
      consumer_id, location_id, preferred_day_of_week,
      preferred_time_start, preferred_time_end, preferred_party_size
    ) VALUES (
      v_consumer_id, v_location_id, 5, '18:00', '20:00', 2
    );
    RAISE NOTICE 'SUCCESS!';
  ELSE
    RAISE NOTICE 'No consumer or location found';
  END IF;
END $$;
```

## Debug Info Nodig

Als het nog steeds niet werkt, geef me:

### A. Server Terminal Output
```
Kopieer de laatste 20 regels vanaf:
POST /api/favorites/alerts ...
```

### B. Browser Console Error
```
F12 → Console → Kopieer exacte error
```

### C. Network Response
```
F12 → Network → alerts → Response tab → Kopieer
```

### D. Code Verificatie
```bash
# Run dit en stuur output:
cd /Users/dietmar/Desktop/ray2
grep -A 5 "location:locations" app/api/favorites/alerts/route.ts | head -20
```

## Nuclear Option

Als NIETS werkt:

```bash
# 1. Stop alles
pkill -f "next"
lsof -ti:3007 | xargs kill -9

# 2. Wis ALLES
rm -rf .next
rm -rf node_modules/.cache
rm -rf node_modules

# 3. Reinstall
npm install

# 4. Start
npm run dev
```

Maar dit zou NIET nodig moeten zijn!

---

**Belangrijkste vraag:**
Als je naar terminal kijkt waar server draait, zie je dan NIEUWE logs vanaf de restart?
Of zijn het nog steeds de OUDE logs van eerder?

