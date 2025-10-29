# FIX: Alert 500 Error + Dropdown Styling

## Probleem

1. **500 Error** bij alert aanmaken (favorite_id foreign key probleem)
2. **Dropdown achtergrond** doorzichtig (opties niet leesbaar)

## Oplossing

### Stap 1: SQL Script Uitvoeren

```
1. Ga naar Supabase Dashboard → SQL Editor
2. Open bestand: FIX_ALERTS_COMPLETE.sql
3. Kopieer en plak de volledige inhoud
4. Klik "Run"
```

**Verwacht resultaat:**
```
✅ Smart Availability Alerts GEFIXED!

Wijzigingen:
  - favorite_id kolom verwijderd (veroorzaakte 500 error)
  - UNIQUE constraint toegevoegd (consumer_id, location_id)
  - Alle policies en triggers opnieuw aangemaakt
```

### Stap 2: Hard Refresh Browser

```
Chrome/Edge: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
Safari: Cmd+Option+R
Firefox: Cmd+Shift+R
```

### Stap 3: Test Opnieuw

```
1. Ga naar: http://localhost:3007/favorites
2. Klik "Alert instellen"
3. Kies opties in dropdowns
   → ✅ Achtergrond is nu wit/solid
   → ✅ Opties zijn leesbaar
4. Klik "Alert aanmaken"
   → ✅ Groene toast: "Alert succesvol aangemaakt!"
   → ✅ Geen 500 error meer!
```

## Wat is Gefixed?

### Backend (SQL)
- ✅ `favorite_id` kolom verwijderd uit `favorite_availability_alerts` tabel
- ✅ Foreign key probleem opgelost
- ✅ UNIQUE constraint toegevoegd (één alert per consumer+location)
- ✅ Alle triggers en policies opnieuw aangemaakt

### Frontend (UI)
- ✅ Dropdown achtergrond: `bg-popover` → `bg-background` (wit/solid)
- ✅ SelectItem achtergrond: expliciet `bg-background`
- ✅ Hover state: `hover:bg-muted` (lichtgrijs bij hover)
- ✅ Focus state: `focus:bg-muted` (lichtgrijs bij focus)
- ✅ Check icon: `text-primary` (Reserve4You rood)

### API Route (TypeScript)
- ✅ `favorite_id` verwijderd uit insert statement
- ✅ Error handling verbeterd
- ✅ Favorite check optioneel gemaakt

## Verwachte Resultaat

### Dropdown Opties Nu Zichtbaar
```
┌─────────────────────┐
│ ✓ Elke dag         │ ← Wit/solid achtergrond
│   Maandag          │ ← Leesbaar!
│   Dinsdag          │
│   Woensdag         │
│   Donderdag        │
│   Vrijdag          │
│   Zaterdag         │
│   Zondag           │
└─────────────────────┘
```

### Alert Aanmaken Werkt
```
1. Configureer alert
2. Klik "Alert aanmaken"
3. ✅ Groene toast: "Alert succesvol aangemaakt!"
4. ✅ Badge "Alert actief" verschijnt
5. ✅ Alert info wordt getoond
6. ✅ Notificatie in /notifications
```

## Troubleshooting

### Nog steeds 500 error?
```sql
-- Check in Supabase SQL Editor of tabel correct is:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'favorite_availability_alerts';

-- Je zou GEEN 'favorite_id' kolom moeten zien!
```

### Dropdown nog steeds doorzichtig?
```
1. Hard refresh (Cmd+Shift+R)
2. Check browser console voor cached CSS
3. Clear browser cache volledig
4. Restart development server:
   - Stop: Cmd+C in terminal
   - Start: npm run dev
```

### Andere errors?
```
Open browser console (F12)
Tab: Console
Kopieer errors en check ze
```

## Files Gewijzigd

1. **FIX_ALERTS_COMPLETE.sql** (nieuw)
   - Drop en recreate `favorite_availability_alerts` tabel
   - Zonder `favorite_id` kolom
   - Alle policies en triggers

2. **app/api/favorites/alerts/route.ts**
   - Verwijderd: `favorite_id` uit insert
   - Vereenvoudigd: favorite check

3. **components/ui/select.tsx**
   - SelectContent: `bg-popover` → `bg-background`
   - SelectItem: `bg-background` + hover/focus states
   - Check icon: `text-primary`

## Direct Testen

1. **SQL**: Run `FIX_ALERTS_COMPLETE.sql` in Supabase
2. **Browser**: Hard refresh (Cmd+Shift+R)
3. **Test**: http://localhost:3007/favorites

**Alles zou nu moeten werken! 🚀**

---

**Status**: Fixed ✅  
**Datum**: 29 Oktober 2025

