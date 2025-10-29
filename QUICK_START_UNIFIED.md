# Quick Start - Unified Table Management

## Stap 1: Verificatie SQL Migration

Open Supabase SQL Editor en run:

```sql
-- Quick check: Zijn de kolommen aanwezig?
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'tables' 
  AND column_name IN ('is_combinable', 'group_id');

SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'shifts' 
  AND column_name IN ('days_of_week', 'slot_minutes', 'buffer_minutes');
```

**Verwacht resultaat:**
- 2 rows voor tables (is_combinable, group_id)
- 3 rows voor shifts (days_of_week, slot_minutes, buffer_minutes)

**Als geen results:** Run de migration:
```bash
npx supabase db push
```

## Stap 2: Server Restart

```bash
# Stop server (Ctrl+C)
npm run dev
```

## Stap 3: Test Interface

1. Open: `http://localhost:3007`
2. Login als manager/owner
3. Ga naar een locatie
4. Klik op "Tafels & Plattegrond" tab

**Je ziet:**
- Sub-tab "Tafellijst" (standaard geselecteerd)
- Sub-tab "Plattegrond"

## Stap 4: Test Functies

### Tafellijst
1. Klik "Bulk Import"
2. Klik "5x 2-persoons"
3. Klik "Importeren"
4. 5 tafels verschijnen

### Plattegrond
1. Klik "Plattegrond" sub-tab
2. Drag een tafel naar nieuwe positie
3. Positie wordt automatisch opgeslagen

## Verificatie Compleet

Als beide sub-tabs werken: SUCCESS

## Tab Structuur

```
[Tafels & Plattegrond] [Diensten] [Reserveringen] [...]
       │
       ├─ [Tafellijst] [Plattegrond]
       │       │
       │       ├─ Bulk Import
       │       ├─ Export
       │       ├─ Quick Generate
       │       └─ Edit/Delete
       │
       └─ Visual Editor
           ├─ Drag & Drop
           └─ Positionering
```

## Klaar!

Systeem is operationeel met:
- Gecombineerde Tafels & Plattegrond tab
- Alle functies behouden
- Ruimtebesparend design
- Professional styling

