# Setup Enhanced Manager - Quick Start

## Stap 1: Database Migration Uitvoeren

Je moet de database migration handmatig uitvoeren. Kies één van deze opties:

### Optie A: Supabase CLI (Aanbevolen)

```bash
cd /Users/dietmar/Desktop/ray2
npx supabase db push
```

### Optie B: Supabase Dashboard

1. Open https://supabase.com/dashboard
2. Selecteer je project
3. Ga naar SQL Editor
4. Open het bestand: `supabase/migrations/20250129000001_enhanced_tables_shifts_management.sql`
5. Kopieer de inhoud
6. Plak in SQL Editor
7. Klik "Run"

### Optie C: Direct SQL (als je database URL hebt)

```bash
# Als je psql geïnstalleerd hebt
psql $DATABASE_URL < supabase/migrations/20250129000001_enhanced_tables_shifts_management.sql
```

## Stap 2: Development Server Herstarten

```bash
# Stop huidige server (Ctrl+C in terminal)
npm run dev
```

## Stap 3: Test de Nieuwe Features

1. Open browser: `http://localhost:3007`
2. Log in als manager/owner
3. Ga naar Dashboard
4. Klik op een locatie
5. Je ziet nu nieuwe tabs:
   - **Tafels** - Voor tafel management
   - **Diensten** - Voor shift/openingstijden management

## Verificatie

### Check 1: Tabs Zichtbaar?
- Ga naar: `http://localhost:3007/manager/[tenantId]/location/[locationId]`
- Kijk of je "Tafels" en "Diensten" tabs ziet tussen "Plattegrond" en "Reserveringen"

### Check 2: Shifts Tab Werkt?
1. Klik op "Diensten" tab
2. Klik "Dienst Toevoegen"
3. Vul in:
   - Naam: "Lunch"
   - Dagen: Ma-Vr (gebruik quick action button)
   - Starttijd: 11:00
   - Eindtijd: 15:00
4. Klik "Opslaan"
5. Shift verschijnt in lijst

### Check 3: Tafels Tab Werkt?
1. Klik op "Tafels" tab
2. Klik "Bulk Import"
3. Klik "5x 2-persoons" (quick generate)
4. Klik "Importeren"
5. 5 tafels verschijnen in lijst

## Troubleshooting

### Tabs niet zichtbaar?
- Server restart vergeten? Stop (Ctrl+C) en start opnieuw: `npm run dev`
- Browser cache? Hard refresh: Cmd+Shift+R (Mac) of Ctrl+Shift+R (Windows)

### Error bij opslaan shift/tafel?
- Migration niet uitgevoerd? Ga terug naar Stap 1
- Check browser console (F12) voor details

### "days_of_week" error?
- Oude schema: Migration moet uitgevoerd worden
- Voer Stap 1 uit

## Klaar!

Als alles werkt:
- Je hebt 2 nieuwe professionele management tabs
- Je kunt shifts (openingstijden) beheren
- Je kunt tafels bulk importeren
- Alles is geïntegreerd met het reserveringssysteem

Zie `ENHANCED_MANAGER_IMPLEMENTATION.md` voor volledige documentatie.

