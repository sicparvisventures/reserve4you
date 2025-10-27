# 🔧 Fix: Discover Page Error

## Probleem

Error: "NotFoundError: The object cannot be found here"

Dit kwam door de RPC functie `get_available_cuisine_types` die niet bestaat in Supabase.

## ✅ Oplossing (Reeds Toegepast)

De code is aangepast om direct de database te querien zonder RPC functie.

**Gewijzigd bestand:**
- `/lib/actions/discover.ts` - Gebruikt nu directe query in plaats van RPC

## 🚀 Test de Fix

### Stap 1: Restart Development Server

```bash
# Stop de huidige server (Ctrl+C)
# Start opnieuw:
cd /Users/dietmar/Desktop/ray2
pnpm dev
```

### Stap 2: Test Discover Page

```bash
# Open in browser:
http://localhost:3007/discover
```

**Verwacht resultaat:**
- ✅ Pagina laadt zonder errors
- ✅ Kaart is zichtbaar
- ✅ Filters werken
- ✅ Cuisine types worden getoond (als er data is in database)

### Stap 3: Als het Nog Steeds Niet Werkt

Run het SQL script om cuisine data toe te voegen:

```sql
-- In Supabase SQL Editor:
UPDATE_CUISINE_TYPES.sql
```

## 🔍 Wat Was Het Probleem?

### Oorspronkelijke Code (FOUT)
```typescript
// Probeerde eerst een RPC functie te gebruiken
const { data: functionData, error: functionError } = await supabase
  .rpc('get_available_cuisine_types'); // ❌ Deze functie bestaat niet!
```

### Nieuwe Code (CORRECT)
```typescript
// Query direct van de locations table
const { data, error } = await supabase
  .from('locations')
  .select('cuisine')
  .eq('is_public', true)
  .eq('is_active', true)
  .not('cuisine', 'is', null); // ✅ Dit werkt altijd
```

## 🧪 Verificatie

### Check 1: Page Laadt
```bash
http://localhost:3007/discover
# Geen error page → ✅
```

### Check 2: Cuisine Types Zichtbaar
```bash
1. Open discover page
2. Click "Filters" knop
3. Scroll naar "Type keuken"
# Zie cuisine types → ✅
# Of zie "Geen keuken types beschikbaar" → Run SQL script
```

### Check 3: Console Check
```bash
# Open browser console (F12)
# Check for errors
# Geen errors → ✅
```

## 📋 Fallback Gedrag

Als er geen cuisines in de database zijn:
- ✅ Pagina laadt normaal
- ✅ Filter panel toont "Geen keuken types beschikbaar"
- ✅ Andere filters werken nog steeds
- ✅ Kaart werkt nog steeds

Dit is correct gedrag - niet een error!

## 🔧 Als Je Nog Steeds Errors Ziet

### Error: "Cannot read property 'cuisine'"

**Oplossing:**
```sql
-- Check of de cuisine kolom bestaat:
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'locations' 
AND column_name = 'cuisine';

-- Als het niet bestaat, voeg toe:
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS cuisine VARCHAR(100);
```

### Error: "locations table does not exist"

**Oplossing:**
Dit is een groter probleem. Check je Supabase verbinding:
```bash
# Verify .env.local:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Error: "RLS Policy Error"

**Oplossing:**
De locations table moet toegankelijk zijn voor anonymous users:
```sql
-- Check policies:
SELECT * FROM pg_policies 
WHERE tablename = 'locations';

-- Moet een policy hebben voor SELECT met is_public = true
```

## ✅ Success Checklist

- [ ] Development server herstart
- [ ] http://localhost:3007/discover laadt zonder error
- [ ] Kaart is zichtbaar
- [ ] Filter panel opent
- [ ] "Type keuken" sectie is zichtbaar
- [ ] Cuisines worden getoond (of "Geen beschikbaar" message)
- [ ] Andere filters werken
- [ ] Geen console errors

## 📞 Nog Steeds Problemen?

Als de pagina nog steeds niet werkt na restart:

1. **Clear cache:**
```bash
rm -rf .next
pnpm dev
```

2. **Check terminal output:**
```bash
# Kijk naar de terminal waar pnpm dev draait
# Zie je errors? Kopieer ze en deel ze
```

3. **Check browser console:**
```bash
F12 → Console tab
# Zie je errors? Kopieer ze
```

---

**Status:** ✅ Fix Applied  
**Datum:** 27 Oktober 2025  
**Bestand Aangepast:** `/lib/actions/discover.ts`

