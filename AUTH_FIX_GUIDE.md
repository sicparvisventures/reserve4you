# Auth Fix Guide - NEXT_REDIRECT Error Oplossing

Deze gids lost het "NEXT_REDIRECT" error probleem op en zorgt ervoor dat iedereen met Google kan inloggen.

## 🐛 Probleem

Het probleem was:
- Bij inloggen kreeg je een "NEXT_REDIRECT" error
- Redirect loop naar /app
- "User not found in database" errors
- Alleen jouw Google account werkte
- Nieuwe users kregen geen database entry

## ✅ Oplossing

De fix doet het volgende:
1. **Automatische user creatie** - Trigger maakt automatisch user + consumer records
2. **Geen redirect meer** - DAL maakt automatisch een profile aan
3. **RLS voor iedereen** - Users kunnen alleen hun eigen data zien
4. **Google login voor iedereen** - Niet alleen jouw account
5. **Backfill existing users** - Users die al bestaan krijgen ook records

## 🚀 Installatie

### Stap 1: Upload Database Migratie

**Via Supabase Dashboard (Aanbevolen):**

1. Ga naar https://supabase.com/dashboard
2. Selecteer je project
3. Ga naar **SQL Editor**
4. Klik op **New Query**
5. Kopieer de VOLLEDIGE inhoud van `supabase/migrations/20250119000004_fix_auth_and_auto_user_creation.sql`
6. Plak in de SQL editor
7. Klik op **Run** (of druk Cmd/Ctrl + Enter)
8. Wacht op groene vinkjes met success berichten:
   ```
   ✅ Created X user records for existing auth users
   ✅ Added email column to users table
   ✅ AUTH FIX MIGRATION COMPLETE
   ```

**Via Supabase CLI:**

```bash
cd /Users/dietmar/Desktop/ray2
npx supabase db push
```

### Stap 2: Restart Development Server

```bash
# Stop de huidige server (Ctrl+C in de terminal)
# Start opnieuw
cd /Users/dietmar/Desktop/ray2
PORT=3007 pnpm dev
```

### Stap 3: Test de Fix

1. **Logout** als je ingelogd bent
2. Ga naar http://localhost:3007
3. Klik op "Aanmelden" of "Inloggen"
4. Klik op "Sign in with Google"
5. Login met ELKE Google account (niet alleen jouw account)
6. Je zou nu succesvol ingelogd moeten zijn zonder errors

## ✅ Verificatie

Test deze scenario's:

### Test 1: Nieuwe User Signup

```bash
# 1. Ga naar http://localhost:3007/sign-up
# 2. Klik "Sign in with Google"
# 3. Login met een NIEUW Google account
# 4. Check of je automatisch doorgestuurd wordt naar /
# 5. Check of je profile zichtbaar is op /profile
```

### Test 2: Bestaande User Login

```bash
# 1. Ga naar http://localhost:3007/sign-in
# 2. Login met een bestaand account
# 3. Geen errors, direct ingelogd
```

### Test 3: RLS Verificatie

In Supabase SQL Editor:

```sql
-- Check of alle auth users een database entry hebben
SELECT 
  au.id,
  au.email,
  u.supabase_user_id IS NOT NULL as has_user_record,
  c.user_id IS NOT NULL as has_consumer_record
FROM auth.users au
LEFT JOIN public.users u ON u.supabase_user_id = au.id
LEFT JOIN public.consumers c ON c.user_id = au.id;

-- Zou allemaal true moeten zijn
```

### Test 4: Auto User Creation

```sql
-- Test de trigger
SELECT * FROM auth.users LIMIT 1;
-- De user zou automatisch een entry moeten hebben in public.users en public.consumers
```

## 🔐 Wat is er gefixed?

### 1. Automatische Triggers

```sql
-- Wanneer iemand zich aanmeldt via Google:
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Deze functie maakt automatisch:
-- ✓ Een record in public.users
-- ✓ Een record in public.consumers
-- ✓ Zonder dat de user iets hoeft te doen
```

### 2. Updated DAL Code

De `getUser()` functie in `lib/auth/dal.ts`:
- ❌ Oude gedrag: Redirect naar /sign-in bij geen user
- ✅ Nieuwe gedrag: Maakt automatisch een user profile aan

### 3. RLS Policies

```sql
-- Users kunnen alleen hun eigen data zien
CREATE POLICY "Users can view own data"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = supabase_user_id);

-- Users kunnen alleen hun eigen data updaten
CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = supabase_user_id);
```

### 4. Backfill Bestaande Users

De migratie vult automatisch records in voor users die al bestaan in `auth.users` maar geen entry hebben in `public.users`.

## 🐛 Troubleshooting

### Error: "Failed to create user profile"

**Oorzaak:** RLS policies blokkeren insert
**Oplossing:** Run de migratie opnieuw

```sql
-- Check of de policies bestaan
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'users';
```

### Error: "User not found" blijft komen

**Oorzaak:** Migratie niet succesvol uitgevoerd
**Oplossing:**

```sql
-- Check of de trigger bestaat
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_name = 'on_auth_user_created';

-- Als niet, run migratie opnieuw
```

### Nog steeds redirect loop

**Oorzaak:** Code niet herladen
**Oplossing:**

```bash
# Hard reload in browser: Cmd+Shift+R (Mac) of Ctrl+Shift+R (Windows)
# Of restart dev server
```

### Google login werkt niet

**Oorzaak:** Supabase Auth configuratie
**Oplossing:**

1. Ga naar Supabase Dashboard
2. Authentication > Providers
3. Enable "Google"
4. Add Client ID en Client Secret
5. Add redirect URL: `http://localhost:3007/auth/callback`

### Users zien elkaars data

**Oorzaak:** RLS policies niet correct
**Oplossing:**

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'consumers', 'bookings', 'favorites');

-- Alle rowsecurity should be 't' (true)
```

## 📊 Database Changes

### Tables Updated

1. **public.users**
   - Added INSERT policy
   - Added email column
   - Email sync trigger

2. **public.consumers**  
   - Added RLS policies
   - Auto-creation on signup

### Functions Added

1. `handle_new_user()` - Creates user + consumer records
2. `sync_user_email()` - Keeps email in sync
3. `create_user_profile()` - Manual user creation (updated)

### Triggers Added

1. `on_auth_user_created` - Auto create profiles
2. `on_auth_user_email_changed` - Sync emails

## 🎯 Expected Behavior

### Voor Nieuwe Users:

1. User klikt "Sign in with Google"
2. Google OAuth flow
3. Redirect naar `/auth/callback`
4. **Trigger fires** → user + consumer records created
5. Redirect naar `/` (homepage)
6. User is ingelogd, geen errors

### Voor Bestaande Users:

1. User klikt "Sign in with Google"  
2. Google OAuth flow
3. Redirect naar `/auth/callback`
4. User record bestaat al
5. Redirect naar `/`
6. User is ingelogd

### RLS In Actie:

```sql
-- User A (id: abc-123) logt in
SELECT * FROM users; 
-- ✓ Kan alleen eigen record zien (abc-123)

SELECT * FROM consumers WHERE user_id = 'xyz-456';
-- ✗ Kan NIET consumer van andere user zien

SELECT * FROM bookings;
-- ✓ Kan alleen eigen bookings zien
```

## ✨ Features

✅ **Automatische user setup** - Geen handmatige stappen nodig
✅ **Geen redirect errors** - Smooth login flow
✅ **RLS voor privacy** - Users zien alleen hun eigen data
✅ **Google login voor iedereen** - Niet alleen jouw account
✅ **Email sync** - Email automatisch bijgewerkt
✅ **Backfill support** - Existing users krijgen ook records
✅ **Error handling** - Graceful fallback bij problemen

## 🔄 Update Checklist

- [ ] Database migratie uitgevoerd
- [ ] Development server herstart  
- [ ] Test nieuwe user signup
- [ ] Test bestaande user login
- [ ] Verify RLS werkt (users zien alleen eigen data)
- [ ] Check geen console errors
- [ ] Test Google login met verschillend account
- [ ] Verify profile page werkt
- [ ] Verify bookings alleen eigen bookings toont
- [ ] Check email sync werkt

## 📝 Notes

- De migratie is **idempotent** - veilig om meerdere keren uit te voeren
- Bestaande data wordt NIET verwijderd
- Backwards compatible met oude setup
- Service role heeft nog steeds full access (voor webhooks)
- Triggers werken automatisch, geen code changes nodig in frontend

## 🎉 Success!

Als alles werkt:
- ✅ Geen "NEXT_REDIRECT" errors meer
- ✅ Iedereen kan inloggen met Google
- ✅ Automatische profile creation
- ✅ RLS zorgt voor privacy
- ✅ Smooth authentication flow

Probleem opgelost! 🚀

