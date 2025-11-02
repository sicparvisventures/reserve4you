# Messages Fix - Stap voor Stap

## Probleem
- Migration `20250128000007_fix_messages_table.sql` succesvol uitgevoerd
- Maar berichten kunnen nog steeds niet worden verzonden
- Error: "Could not send message"

## Oplossing

### Stap 1: Run de RLS Fix Migration

Voer deze migration uit in Supabase SQL Editor:

**Bestand:** `supabase/migrations/20250128000008_fix_messages_rls.sql`

Deze migration:
- Verwijdert alle conflicterende RLS policies
- Creeert nieuwe, correcte policies
- Zorgt ervoor dat users berichten kunnen verzenden in conversations waar ze participant zijn

### Stap 2: Check Browser Console

Na het runnen van de RLS fix, probeer opnieuw een bericht te versturen en kijk in de browser console naar de gedetailleerde error message. De API route is aangepast om meer details te loggen:
- Error code
- Error details
- Error hint
- Message data die geprobeerd werd in te voegen

### Stap 3: Verify RLS Policies

Check of de policies correct zijn aangemaakt:

```sql
-- Check alle policies op messages tabel
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY policyname;
```

Je zou deze policies moeten zien:
1. `Users can view messages in conversations` (SELECT)
2. `Users can send messages in conversations` (INSERT)
3. `Users can update their own messages` (UPDATE)

### Stap 4: Test Manual Insert

Test of je handmatig een message kunt inserten (vervang de IDs met echte IDs):

```sql
-- Vervang deze met echte IDs
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = 'your-auth-user-id';

-- Test of je een message kunt inserten
INSERT INTO messages (
  conversation_id,
  sender_id,
  message_content,
  message_text,
  message_type
)
SELECT 
  'conversation-uuid',
  (SELECT id FROM consumers WHERE auth_user_id = auth.uid()),
  'Test message',
  'Test message',
  'text'
WHERE EXISTS (
  SELECT 1 FROM conversation_participants cp
  INNER JOIN consumers c ON c.id = cp.consumer_id
  WHERE cp.conversation_id = 'conversation-uuid'
  AND c.auth_user_id = auth.uid()
);
```

## Mogelijke Oorzaken

### 1. RLS Policy Conflict
- **Symptoom:** Error code `42501` (insufficient privilege)
- **Oplossing:** Run `20250128000008_fix_messages_rls.sql`

### 2. Participant Niet Gevonden
- **Symptoom:** Policy faalt omdat user niet als participant wordt gevonden
- **Oplossing:** Check of `conversation_participants` correct is ingevuld:
```sql
SELECT cp.*, c.email 
FROM conversation_participants cp
JOIN consumers c ON c.id = cp.consumer_id
WHERE conversation_id = 'your-conversation-id';
```

### 3. Kolom Structuur Probleem
- **Symptoom:** Error over ontbrekende kolom (`message_content` of `message_text`)
- **Oplossing:** Check of beide kolommen bestaan:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
AND column_name IN ('message_content', 'message_text');
```

### 4. Check Constraint Failing
- **Symptoom:** Error over constraint violation
- **Oplossing:** Check of message voldoet aan de constraint:
```sql
-- Check constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'messages'::regclass;
```

## Debug Steps

1. **Check logs in Supabase Dashboard:**
   - Ga naar Logs → Postgres Logs
   - Filter op "messages" of "RLS"
   - Kijk naar de exacte error

2. **Test met Supabase client direct:**
   ```typescript
   // In browser console op /notifications pagina
   const supabase = window.supabase; // of import createClient
   const { data, error } = await supabase
     .from('messages')
     .insert({
       conversation_id: 'xxx',
       sender_id: 'yyy',
       message_content: 'test',
       message_text: 'test',
       message_type: 'text'
     });
   console.log('Error:', error);
   ```

3. **Check RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'messages';
   -- rowsecurity should be true
   ```

## Expected Result

Na het runnen van beide migrations zou je moeten kunnen:
1. ✅ Berichten versturen naar andere users
2. ✅ Bestaande berichten zien
3. ✅ Nieuwe conversations aanmaken
4. ✅ Berichten ontvangen in je feed

## Als Het Nog Steeds Niet Werkt

Stuur de volgende informatie:
1. De exacte error message uit de browser console
2. De error code en details uit de API response
3. De output van de SQL queries hierboven
4. Screenshot van de Supabase logs

