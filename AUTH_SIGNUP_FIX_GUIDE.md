# Auth Signup Fix Guide

## Probleem

Wanneer een nieuwe gebruiker zich aanmeldt:
1. Ze ontvangen een bevestigingsmail van Supabase
2. Na het klikken op de link komen ze terug op `localhost:3007`
3. Er verschijnt een error (voor een kort moment)
4. Na refresh werkt het wel en zien ze `/app` met een welkomstscherm

## Oorzaak

Het probleem wordt veroorzaakt door een race condition:
- De auth callback gebeurt snel
- De database trigger/RPC moet nog het user profiel aanmaken
- De `/app` page probeert het user profiel op te halen voordat het bestaat
- De DAL (Data Access Layer) probeert het aan te maken, maar dat duurt even

## Oplossing

### 1. Database Fix Uitvoeren

Run het SQL script in de Supabase SQL Editor:

```bash
# Open Supabase Dashboard -> SQL Editor
# Upload en run: FIX_AUTH_SIGNUP_COMPLETE.sql
```

Dit script:
- ✅ Controleert en herstelt de auto-user-creation trigger
- ✅ Zorgt dat de `create_user_profile()` RPC functie bestaat
- ✅ Backfilled alle bestaande users die geen profiel hebben
- ✅ Verifieert RLS policies

### 2. Verbeterde Callback

De auth callback (`app/auth/callback/route.ts`) is verbeterd met:
- Betere logging voor debugging
- Retry logic voor user profile verificatie
- Graceful fallback als profiel nog niet bestaat
- Nederlandse foutmeldingen

### 3. Nieuwe Welcome Page

De `/app` page is vervangen door een professionele Reserve4You welkomstpagina met:
- Welkomstbericht
- Quick action cards (Ontdek Restaurants, Maak Reservering, Profiel)
- CTA sectie voor restaurant eigenaren
- Footer
- Geen emoji's, professioneel design

## Wat Gebeurt Er Nu?

### Bij Sign-up:

1. **Gebruiker vult formulier in** → `POST /auth/sign-up`
2. **Email verificatie** → Supabase stuurt bevestigingsmail
3. **Gebruiker klikt link** → Redirect naar `/auth/callback?code=...`
4. **Callback handler:**
   - Wisselt code in voor sessie
   - Wacht 500ms voor trigger
   - Verifieert dat user profiel bestaat (max 3 retries)
   - Maakt profiel aan via RPC als nodig
   - Redirect naar `/app`
5. **App page:**
   - Haalt user data op via `getUser()`
   - Als profiel niet bestaat, maakt DAL het aan
   - Toont welkomstpagina

### Bij Sign-in:

1. **Gebruiker vult formulier in** → Direct inloggen
2. **Redirect naar `/app`** → Geen callback nodig
3. **Welkomstpagina** → Direct beschikbaar

## Testing

### Test Nieuwe Sign-up

1. **Maak een test account:**
   ```
   Email: test@example.com
   Password: TestPassword123!
   ```

2. **Check email en klik verificatie link**

3. **Verwacht resultaat:**
   - Direct naar `/app` zonder error
   - Welkomstscherm met je email
   - Geen refresh nodig

### Verificatie in Database

```sql
-- Check of user profiel is aangemaakt
SELECT 
  au.email,
  u.id as user_id,
  c.id as consumer_id,
  u.created_at
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.supabase_user_id
LEFT JOIN public.consumers c ON au.id = c.auth_user_id
WHERE au.email = 'test@example.com';
```

## Logging

De callback logt nu uitgebreid:

```
[AUTH CALLBACK] Processing callback { hasCode: true, hasError: false, next: '/app' }
[AUTH CALLBACK] ✅ User authenticated: abc123... (test@example.com)
[AUTH CALLBACK] ✅ User profile verified: abc123...
[AUTH CALLBACK] ✅ Redirecting to: /app
```

Check de console voor deze logs bij problemen.

## Troubleshooting

### Error: "User profile not found"

**Oplossing:** Run `FIX_AUTH_SIGNUP_COMPLETE.sql` opnieuw

### Error blijft na refresh

**Check:**
1. Is de trigger actief? 
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. Heeft de functie permissies?
   ```sql
   SELECT has_function_privilege('create_user_profile()', 'execute');
   ```

### Users table heeft geen email kolom

**Dit is OK!** De email zit in auth.users. De sync functie is optioneel.

### RLS Policy errors

**Run:** De REPAIR sectie uit `FIX_AUTH_SIGNUP_COMPLETE.sql`

## Environment Variables

Zorg dat deze zijn ingesteld:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3007
```

## Production Deployment

Voor productie:

1. **Run alle migrations:**
   ```bash
   # In volgorde:
   supabase/migrations/20240101000000_initial_schema.sql
   supabase/migrations/20250119000004_fix_auth_and_auto_user_creation.sql
   # ... andere migrations
   ```

2. **Run FIX_AUTH_SIGNUP_COMPLETE.sql**

3. **Test sign-up flow end-to-end**

4. **Update redirect URLs in Supabase Dashboard:**
   - Authentication → URL Configuration
   - Site URL: `https://your-domain.com`
   - Redirect URLs: `https://your-domain.com/auth/callback`

## Summary

✅ Database trigger maakt automatisch user profiles aan  
✅ Callback heeft retry logic voor race conditions  
✅ DAL heeft fallback voor profile creatie  
✅ Welkomstpagina is professioneel en in thema  
✅ Nederlandse foutmeldingen  
✅ Uitgebreide logging voor debugging  

De signup flow zou nu soepel moeten verlopen zonder errors!

