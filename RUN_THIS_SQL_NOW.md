# ⚠️ BELANGRIJK: SQL Scripts Uitvoeren

## De Error die je zag:
```
Error adding favorite
```

Dit komt omdat de `favorites` tabel **geen RLS policies** heeft. Je moet nu 2 SQL scripts uitvoeren.

## 🚀 Stap-voor-stap

### Stap 1: Open Supabase Dashboard
1. Ga naar https://supabase.com/dashboard
2. Selecteer je project
3. Klik op **"SQL Editor"** in het linker menu

### Stap 2: Voer BEIDE scripts uit (in deze volgorde!)

#### Script 1: Notifications Trigger
1. Klik op **"+ New Query"**
2. Kopieer de VOLLEDIGE inhoud van:
   ```
   supabase/migrations/20250127000001_favorites_notifications.sql
   ```
3. Plak in de SQL editor
4. Klik **"Run"** (of druk Cmd+Enter / Ctrl+Enter)
5. Je ziet: ✅ "Success. No rows returned"

#### Script 2: RLS Policies (DIT LOST DE ERROR OP!)
1. Klik op **"+ New Query"** (nieuwe query)
2. Kopieer de VOLLEDIGE inhoud van:
   ```
   supabase/migrations/20250127000002_favorites_rls_policies.sql
   ```
3. Plak in de SQL editor
4. Klik **"Run"** (of druk Cmd+Enter / Ctrl+Enter)
5. Je ziet: ✅ "Success. No rows returned"

### Stap 3: Test het systeem
1. **Refresh** je browser (Cmd+Shift+R of Ctrl+Shift+R)
2. Ga naar `http://localhost:3007`
3. **Login** als consumer
4. Klik op een **hartje** bij een restaurant
5. Het hartje moet nu **vullen** zonder error!
6. Ga naar `/favorites` → zie je restaurant

## 📋 Wat doet elk script?

### Script 1 (favorites_notifications.sql):
- ✅ Voegt `LOCATION_FAVORITED` toe aan notification types
- ✅ Creëert trigger functie voor automatische notificaties
- ✅ Trigger stuurt notificatie naar eigenaar en managers

### Script 2 (favorites_rls_policies.sql): **DIT LOST DE ERROR OP**
- ✅ Voegt RLS policies toe aan `favorites` tabel
- ✅ Gebruikers kunnen hun eigen favorieten toevoegen
- ✅ Gebruikers kunnen hun eigen favorieten verwijderen
- ✅ Gebruikers kunnen hun eigen favorieten bekijken

## 🔍 Check of het werkt

Na het uitvoeren van beide scripts, test dit:

```sql
-- Run deze query in Supabase SQL Editor om policies te checken
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'favorites';
```

Je moet zien:
- ✅ "Users can view own favorites"
- ✅ "Users can create own favorites"
- ✅ "Users can delete own favorites"
- ✅ "Service role full access to favorites"

## ⚡ Quick Copy-Paste Instructies

```bash
# Stap 1: Copy script 1
cat supabase/migrations/20250127000001_favorites_notifications.sql

# Stap 2: Copy script 2
cat supabase/migrations/20250127000002_favorites_rls_policies.sql
```

## 🐛 Troubleshooting

### Als je nog steeds errors ziet:

1. **Check of je ingelogd bent**
   - Console: Ga naar Application → Cookies → Check supabase auth token

2. **Check RLS policies zijn aangemaakt**
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'favorites';
   ```

3. **Check consumer record bestaat**
   ```sql
   SELECT * FROM consumers WHERE auth_user_id = auth.uid();
   ```

4. **Hard refresh browser**
   - Cmd+Shift+R (Mac) of Ctrl+Shift+R (Windows)

5. **Check console voor nieuwe errors**
   - F12 → Console tab
   - Kijk naar nieuwe error berichten

## ✅ Success Checklist

Na het uitvoeren:
- [ ] Script 1 uitgevoerd zonder errors
- [ ] Script 2 uitgevoerd zonder errors
- [ ] Browser ge-refreshed
- [ ] Ingelogd als consumer
- [ ] Hartje klikken werkt zonder error
- [ ] Hartje vult met primary color
- [ ] `/favorites` toont gefavorite restaurants
- [ ] Eigenaar ontvangt notificatie

## 📞 Nog steeds errors?

Als het nog steeds niet werkt:
1. Check de browser Console (F12)
2. Check Supabase logs: Dashboard → Logs → API
3. Verifieer dat beide SQL scripts succesvol zijn uitgevoerd
4. Check dat je als authenticated user bent ingelogd

## 🎉 Klaar!

Na het uitvoeren van BEIDE scripts moet alles werken. Het hartje systeem werkt dan op alle paginas:
- Homepage (/)
- Discover (/discover)
- Favorites (/favorites)

