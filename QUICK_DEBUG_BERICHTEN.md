# 🔍 Quick Debug: Berichten Error

## Je error ziet er zo uit:
```
Error: Kon bericht niet versturen
```

## ✅ Volg deze stappen:

### 1️⃣ Open Browser Console
- Druk op **F12** (of Cmd+Option+I op Mac)
- Ga naar **Console** tab
- Kijk naar de rode errors

Je ziet waarschijnlijk één van deze:

---

### ❌ Error A: "Je account is nog niet compleet"
**Oplossing:**
```sql
-- Run dit in Supabase SQL Editor:
INSERT INTO consumers (auth_user_id, email, name)
SELECT 
    id,
    email,
    COALESCE(
        raw_user_meta_data->>'name',
        SPLIT_PART(email, '@', 1)
    )
FROM auth.users
WHERE id NOT IN (SELECT auth_user_id FROM consumers WHERE auth_user_id IS NOT NULL)
ON CONFLICT (auth_user_id) DO NOTHING;
```

---

### ❌ Error B: "Gebruiker met email ... niet gevonden"
**Betekenis:** De ontvanger heeft nog geen consumer account

**Oplossing 1 (Simpel):**
- Laat de ontvanger (admin@reserve4you.com) **inloggen** in de app
- Dan wordt automatisch een consumer aangemaakt
- Probeer daarna opnieuw

**Oplossing 2 (SQL):**
```sql
-- Run dit in Supabase SQL Editor:
-- Check welke users bestaan:
SELECT email FROM auth.users;

-- Maak consumer voor specifieke email:
INSERT INTO consumers (auth_user_id, email, name)
SELECT 
    id,
    'admin@reserve4you.com',
    'Admin'
FROM auth.users
WHERE email = 'admin@reserve4you.com'
ON CONFLICT (auth_user_id) DO NOTHING;
```

---

### ❌ Error C: "Kon gesprek niet aanmaken"
**Oplossing:**
```sql
-- Check of de functie bestaat:
SELECT * FROM pg_proc WHERE proname = 'get_or_create_conversation';

-- Als die niet bestaat, run de hele messages migratie opnieuw:
-- Kopieer en plak: supabase/migrations/20250127000005_messages_system.sql
```

---

## 🚀 Complete Fix Script

Of run gewoon dit complete fix script:

**Open:** `FIX_BERICHTEN_CONSUMER_ERROR.sql`

En run het in Supabase SQL Editor.

---

## 🔍 Nog steeds errors?

### Check deze dingen:

1. **Beide gebruikers moeten bestaan:**
```sql
-- Check of beide emails bestaan als consumer:
SELECT email, name FROM consumers 
WHERE email IN ('jouw@email.com', 'admin@reserve4you.com');

-- Zou 2 rijen moeten teruggeven!
```

2. **RLS Policies moeten correct zijn:**
```sql
-- Check policies:
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages');

-- Moet meerdere policies tonen
```

3. **Kijk in server logs:**
- Als je errors ziet in de browser console
- Check ook de **terminal** waar `npm run dev` draait
- Daar staan de server-side logs

---

## 💡 Snelle Test

Test of beide accounts klaargezet zijn:

```sql
-- Run dit en kijk of je 2 resultaten krijgt:
SELECT 
    c.email,
    c.name,
    CASE WHEN c.auth_user_id IS NOT NULL THEN '✓' ELSE '✗' END as has_auth
FROM consumers c
WHERE c.email IN (
    -- Vervang deze met je eigen emails:
    'jouw@email.com',
    'admin@reserve4you.com'
);
```

Als je **minder dan 2 rijen** ziet → Dat is het probleem!

---

## ✅ Checklist

- [ ] Browser console geopend (F12)
- [ ] Error message gelezen en genoteerd
- [ ] FIX_BERICHTEN_CONSUMER_ERROR.sql uitgevoerd
- [ ] Beide gebruikers zijn ingelogd geweest
- [ ] Beide emails staan in consumers tabel
- [ ] Opnieuw geprobeerd

---

**Wat zie je in de console? Laat het me weten!** 🚀

