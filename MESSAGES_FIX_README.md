# Messages System Fix - Herstel Berichten Functionaliteit

## Probleem
Na de social expansion migrations zijn de berichten niet meer werkend:
- Berichten kunnen niet worden verzonden (Error: Could not send message)
- Bestaande berichten zijn niet meer zichtbaar
- Oorzaak: Kolomnamen conflict tussen oude en nieuwe database structuur

## Oplossing
Een fix migration die beide structuren ondersteunt:
- `message_content` (oud) + `message_text` (nieuw) - beide worden gesynchroniseerd
- `location_id` kolom hersteld
- Automatische synchronisatie tussen oude en nieuwe velden

## Stappen om te Herstellen

### 1. Run de Fix Migration

Voer de volgende SQL uit in Supabase SQL Editor:

```sql
-- Bestand: supabase/migrations/20250128000007_fix_messages_table.sql
```

Of voer direct uit in Supabase:
1. Ga naar Supabase Dashboard → SQL Editor
2. Copy-paste de inhoud van `20250128000007_fix_messages_table.sql`
3. Klik "Run"

### 2. Verifieer de Fix

Na het runnen van de migration, controleer of:
- De `messages` tabel beide kolommen heeft: `message_content` EN `message_text`
- De `location_id` kolom bestaat
- De trigger `sync_message_content_trigger` actief is

Check query:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;
```

Je zou moeten zien:
- `message_content` (TEXT)
- `message_text` (TEXT)
- `location_id` (UUID)
- `location_data` (JSONB)
- `deleted_at` (TIMESTAMPTZ)

### 3. Test Berichten

1. Ga naar `/notifications` in de app
2. Probeer een bericht te sturen naar een andere gebruiker
3. Controleer of bestaande berichten weer zichtbaar zijn

## Technische Details

### Wat de Migration Doet

1. **Voegt ontbrekende kolommen toe:**
   - `message_content` (als die ontbreekt)
   - `location_id` (als die ontbreekt)
   - `location_data` (als die ontbreekt)
   - `deleted_at` (als die ontbreekt)
   - `is_edited` (als die ontbreekt)

2. **Migreert bestaande data:**
   - Kopieert `message_text` → `message_content` (voor oude berichten)

3. **Creeert synchronisatie trigger:**
   - Wanneer `message_content` wordt geupdate → update ook `message_text`
   - Wanneer `message_text` wordt geupdate → update ook `message_content`

4. **Hertelt indexes:**
   - Index op `location_id`
   - Index op `deleted_at`

### API Wijzigingen

De API route (`app/api/messages/route.ts`) is aangepast om:
- Beide kolommen te ondersteunen bij INSERT
- Beide kolommen te lezen bij SELECT
- `deleted_at` filter toe te passen (alleen niet-verwijderde berichten)

### Frontend Wijzigingen

- `MessageBubble.tsx`: Ondersteunt beide `message_content` en `message_text`
- `MessagesView.tsx`: Interface aangepast voor beide structuren

## Troubleshooting

### Als berichten nog steeds niet werken:

1. **Check RLS policies:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'messages';
```

Zorg dat deze policies bestaan:
- "Users can view messages in conversations"
- "Users can send messages"

2. **Check of trigger werkt:**
```sql
SELECT * FROM pg_trigger WHERE tgname = 'sync_message_content_trigger';
```

3. **Test manual insert:**
```sql
-- Vervang de IDs met echte IDs uit jouw database
INSERT INTO messages (conversation_id, sender_id, message_content, message_text, message_type)
VALUES (
  'conversation-uuid',
  'consumer-uuid',
  'Test message',
  'Test message',
  'text'
);

-- Check of beide kolommen zijn gevuld
SELECT id, message_content, message_text FROM messages WHERE id = 'inserted-uuid';
```

4. **Check logs:**
- Browser console voor frontend errors
- Supabase logs voor database errors
- Next.js server logs voor API errors

## Rollback (Als Nodig)

Als er problemen zijn, kun je de migration terugdraaien:

```sql
-- Verwijder trigger
DROP TRIGGER IF EXISTS sync_message_content_trigger ON messages;
DROP FUNCTION IF EXISTS sync_message_content();

-- Maak message_content weer nullable (als nodig)
ALTER TABLE messages ALTER COLUMN message_content DROP NOT NULL;
```

Maar dit wordt niet aangeraden - de fix is backward compatible.

