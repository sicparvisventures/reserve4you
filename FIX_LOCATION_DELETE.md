# 🔧 FIX: Location Delete Functionaliteit

**Probleem:** "The string did not match the expected pattern" bij verwijderen van locaties  
**Oorzaak:** Nieuwe multi-sector tabellen (resources, service_offerings) hebben foreign keys naar locations, maar oude delete functie kent deze niet  
**Oplossing:** Update cascade delete functie + voeg DELETE endpoint toe  
**Datum:** 29 oktober 2025  
**Status:** ✅ KLAAR VOOR DEPLOYMENT

---

## 🎯 WAT IS GEFIXED

### **1. Database: Updated Cascade Delete Function**
✅ Nieuwe migratie toegevoegd: `20251029000001_update_location_cascade_delete.sql`

**Verwijdert nu ook:**
- ✅ `resources` (generic resource table - nieuwe tafels, kamers, personeel)
- ✅ `service_offerings` (services/menu items)
- ✅ `recurring_booking_patterns` (terugkerende afspraken)
- ✅ `intake_form_submissions` (intake formulieren)
- ✅ `reviews` & `review_replies` (beoordelingen)
- ✅ `messages` & `conversations` (berichten)
- ✅ `notification_preferences` (notificatie instellingen)
- ✅ `waitlist` (wachtlijst)
- ✅ `email_logs` & `api_usage_logs` (logs)

**Plus alle originele tabellen:**
- ✅ `bookings` (reserveringen)
- ✅ `tables` (oude tafel systeem)
- ✅ `shifts` (diensten)
- ✅ `policies` (beleid)
- ✅ `favorites` (favorieten)
- ✅ `pos_integrations` (POS koppelingen)

### **2. API: DELETE Endpoint Toegevoegd**
✅ File aangepast: `app/api/manager/locations/[locationId]/route.ts`

**Features:**
- ✅ Roept `delete_location_cascade` functie aan
- ✅ Verificatie: alleen OWNER en MANAGER kunnen verwijderen
- ✅ Betere error messages
- ✅ Audit logging (console logs)

---

## 🚀 SETUP INSTRUCTIES

### **Stap 1: Run Database Migration**

**⏱️ Tijd: 2 minuten**

1. **Open Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/[jouw-project]/sql
   ```

2. **Kopieer en plak deze migratie:**
   ```
   /Users/dietmar/Desktop/ray2/supabase/migrations/20251029000001_update_location_cascade_delete.sql
   ```

3. **Klik "Run"**

4. **Verwacht output:**
   ```sql
   ✅ Location Cascade Delete Function Updated (Multi-Sector)
   
   NEW: Now safely deletes these additional tables:
     ✅ resources (generic resource table)
     ✅ service_offerings (services/menu items)
     ✅ recurring_booking_patterns (recurring appointments)
     ... (meer)
   ```

5. **Verificatie:**
   ```sql
   -- Check of de functie bestaat
   SELECT routine_name, routine_type 
   FROM information_schema.routines 
   WHERE routine_name = 'delete_location_cascade';
   
   -- Expected: 1 row met routine_type = 'FUNCTION'
   ```

---

### **Stap 2: Deploy Code Changes**

**⏱️ Tijd: 5 minuten**

1. **Commit en push naar GitHub:**
   ```bash
   cd /Users/dietmar/Desktop/ray2
   git add .
   git commit -m "Fix: Update location delete to support multi-sector tables"
   git push
   ```

2. **Vercel auto-deploy:**
   - Vercel zal automatisch deployen
   - Check: https://vercel.com/dashboard
   - Wacht tot status "Ready" is

3. **Verificatie:**
   ```bash
   # Check of DELETE endpoint werkt
   curl -X DELETE https://je-app.vercel.app/api/manager/locations/[location-id] \
     -H "Cookie: [je-session-cookie]"
   
   # Expected: {"success": true, "message": "Location ... deleted successfully"}
   ```

---

## 🧪 TESTEN

### **Test 1: Lokaal Testen (Development)**

**⏱️ 2 minuten**

1. **Zorg dat dev server draait:**
   ```bash
   # Als server al draait op poort 3007:
   lsof -ti:3007 | xargs kill -9
   
   # Start fresh:
   cd /Users/dietmar/Desktop/ray2
   pnpm run dev
   ```

2. **Ga naar Manager Dashboard:**
   ```
   http://localhost:3007/manager/[tenant-id]/dashboard
   ```

3. **Verwijder een test locatie:**
   - Klik op het trash icon bij een locatie
   - Bevestig in de dialog
   - ✅ Moet succesvol verwijderen
   - ✅ Dashboard moet refreshen
   - ❌ Geen "pattern" error meer!

---

### **Test 2: Database Verificatie**

**⏱️ 1 minuut**

Na het verwijderen, check in Supabase SQL Editor:

```sql
-- Check of locatie echt verwijderd is
SELECT * FROM locations WHERE id = '[verwijderde-location-id]';
-- Expected: 0 rows

-- Check of gerelateerde data ook weg is
SELECT COUNT(*) as remaining_bookings 
FROM bookings 
WHERE location_id = '[verwijderde-location-id]';
-- Expected: 0

SELECT COUNT(*) as remaining_resources 
FROM resources 
WHERE location_id = '[verwijderde-location-id]';
-- Expected: 0

SELECT COUNT(*) as remaining_services 
FROM service_offerings 
WHERE location_id = '[verwijderde-location-id]';
-- Expected: 0
```

✅ Alles moet 0 zijn!

---

### **Test 3: Productie Test (Vercel)**

**⏱️ 2 minuten**

1. **Maak een test locatie:**
   - Ga naar: https://je-app.vercel.app/manager/onboarding
   - Maak een nieuwe test locatie aan
   - Publiceer

2. **Verwijder de test locatie:**
   - Ga naar dashboard
   - Klik trash icon
   - Bevestig
   - ✅ Moet succesvol verwijderen

3. **Check browser console:**
   - Open DevTools (F12)
   - Check Console tab
   - ✅ Geen errors
   - ✅ Success message zichtbaar

---

## 🔒 SECURITY & PERMISSIONS

### **Wie kan locaties verwijderen?**

✅ **OWNER** - Kan alles verwijderen  
✅ **MANAGER** - Kan locaties verwijderen  
❌ **STAFF** - Kan NIET verwijderen  
❌ **Consumers** - Geen toegang

### **Beveiliging:**
- ✅ SECURITY DEFINER functie (veilig geïsoleerd)
- ✅ Role check in functie (dubbele verificatie)
- ✅ Role check in API endpoint (triple verification)
- ✅ RLS policies blijven actief
- ✅ Audit logging (wie, wat, wanneer)

---

## ⚠️ WAARSCHUWINGEN

### **Data Loss:**
```
🚨 PERMANENT VERWIJDEREN
Verwijderen van een locatie verwijdert ALLES:
- Alle reserveringen (bookings)
- Alle tafels/resources
- Alle services
- Alle reviews
- Alle berichten
- Alle shifts
- Alle policies
- ALLES!

Dit kan NIET ongedaan gemaakt worden!
```

### **Confirmation Dialog:**
De confirmation dialog in de UI waarschuwt gebruikers:
```
Weet je zeker dat je vestiging "[naam]" wilt verwijderen?

Dit verwijdert permanent:
- Alle tafels en shifts
- Alle reserveringen
- Alle policies en instellingen

Deze actie kan niet ongedaan gemaakt worden.
```

---

## 🐛 TROUBLESHOOTING

### **Probleem: "Function does not exist"**

**Oorzaak:** Migratie niet gerund

**Oplossing:**
1. Open Supabase SQL Editor
2. Run migratie: `20251029000001_update_location_cascade_delete.sql`
3. Refresh de page

---

### **Probleem: "Permission denied"**

**Oorzaak:** User is geen OWNER of MANAGER

**Oplossing:**
1. Check role:
   ```sql
   SELECT role FROM memberships 
   WHERE user_id = '[user-id]' AND tenant_id = '[tenant-id]';
   ```
2. Role moet zijn: `OWNER` of `MANAGER`
3. Update indien nodig:
   ```sql
   UPDATE memberships 
   SET role = 'MANAGER' 
   WHERE user_id = '[user-id]' AND tenant_id = '[tenant-id]';
   ```

---

### **Probleem: "Failed to delete location" met details**

**Debug steps:**

1. **Check Supabase logs:**
   - Supabase Dashboard → Logs → API
   - Filter op "delete_location_cascade"
   - Zie welke stap faalt

2. **Check foreign keys:**
   ```sql
   -- Welke tabellen refereren naar locations?
   SELECT 
     tc.table_name, 
     kcu.column_name,
     ccu.table_name AS foreign_table_name,
     ccu.column_name AS foreign_column_name 
   FROM information_schema.table_constraints AS tc 
   JOIN information_schema.key_column_usage AS kcu
     ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.constraint_column_usage AS ccu
     ON ccu.constraint_name = tc.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY' 
     AND ccu.table_name='locations';
   ```

3. **Handmatig verwijderen (last resort):**
   ```sql
   -- ⚠️ VOORZICHTIG: Alleen als cascade delete faalt
   SELECT delete_location_cascade(
     '[location-id]'::uuid,
     '[your-user-id]'::uuid
   );
   ```

---

### **Probleem: Nog steeds "pattern" error**

**Mogelijke oorzaken:**

1. **Migratie niet gerund**
   - Oplossing: Run migratie in Supabase SQL Editor

2. **Nieuwe tabel met FK die we gemist hebben**
   - Check welke tabel:
     ```sql
     -- Run deze query om te zien waar het fout gaat
     -- (in Supabase logs na failed delete)
     ```
   - Voeg toe aan migratie
   - Contact developer

3. **Cache issue**
   - Refresh browser (Ctrl+F5)
   - Clear cookies
   - Logout + login

---

## 📊 DATABASE SCHEMA UPDATES

### **Tabellen die NU ondersteund worden:**

| Tabel                          | Beschrijving                    | Action        |
|--------------------------------|---------------------------------|---------------|
| `resources`                    | Generic resources (nieuw)       | ✅ CASCADE    |
| `service_offerings`            | Services/menu (nieuw)           | ✅ CASCADE    |
| `recurring_booking_patterns`   | Recurring bookings (nieuw)      | ✅ CASCADE    |
| `intake_form_submissions`      | Forms (nieuw)                   | ✅ CASCADE    |
| `reviews`                      | Beoordelingen                   | ✅ CASCADE    |
| `review_replies`               | Review antwoorden               | ✅ CASCADE    |
| `messages`                     | Berichten                       | ✅ CASCADE    |
| `conversations`                | Gesprekken                      | ✅ CASCADE    |
| `notification_preferences`     | Notificatie settings            | ✅ CASCADE    |
| `waitlist`                     | Wachtlijst                      | ✅ CASCADE    |
| `email_logs`                   | Email logs                      | ✅ CASCADE    |
| `api_usage_logs`               | API usage logs                  | ✅ CASCADE    |
| `bookings`                     | Reserveringen                   | ✅ CASCADE    |
| `tables`                       | Tafels (oud systeem)            | ✅ CASCADE    |
| `shifts`                       | Diensten                        | ✅ CASCADE    |
| `policies`                     | Beleid                          | ✅ CASCADE    |
| `favorites`                    | Favorieten                      | ✅ CASCADE    |
| `pos_integrations`             | POS koppelingen                 | ✅ CASCADE    |

### **Safe Delete Strategy:**

De functie gebruikt **TRY/CATCH** blokken om gracefully om te gaan met:
- ✅ Tabellen die nog niet bestaan (nieuwe features)
- ✅ Tabellen die verwijderd zijn (deprecated features)
- ✅ Verschillende database versies
- ✅ Partial migrations

---

## ✅ CHECKLIST

Gebruik deze checklist bij deployment:

### **Database:**
- [ ] Migratie gerund in Supabase SQL Editor
- [ ] Success message gezien
- [ ] Functie bestaat (verificatie query gerund)

### **Code:**
- [ ] Changes committed naar Git
- [ ] Gepushed naar GitHub
- [ ] Vercel deployment succesvol (status: Ready)

### **Testing:**
- [ ] Lokaal getest (test locatie verwijderd)
- [ ] Database verificatie gedaan (0 remaining rows)
- [ ] Productie getest (test locatie op Vercel)
- [ ] Geen console errors

### **Documentation:**
- [ ] Team geïnformeerd over changes
- [ ] FIX_LOCATION_DELETE.md gelezen
- [ ] Troubleshooting sectie bekeken

---

## 🎉 SUCCESS!

Na deze fix:
- ✅ Locaties kunnen veilig verwijderd worden
- ✅ Alle gerelateerde data wordt automatisch opgeruimd
- ✅ Geen foreign key violations meer
- ✅ Geen "pattern" errors meer
- ✅ Database blijft clean
- ✅ Klaar voor multi-sector expansion

---

## 📝 CHANGELOG

**Versie 2.0 (29 okt 2025):**
- ✅ UPDATE: Cascade delete functie updated voor multi-sector support
- ✅ NEW: DELETE endpoint toegevoegd aan API
- ✅ FIX: "The string did not match the expected pattern" error opgelost
- ✅ NEW: Support voor 18 tabellen (was 6)
- ✅ IMPROVED: Betere error handling met try/catch
- ✅ IMPROVED: Detailed audit logging
- ✅ DOCS: Complete troubleshooting guide

**Versie 1.0 (17 okt 2024):**
- Initial cascade delete function
- Support voor 6 basis tabellen

---

## 💬 SUPPORT

Bij problemen:

1. **Check deze docs eerst** (meeste problemen staan hierboven)
2. **Check Supabase logs** (Dashboard → Logs → API)
3. **Check browser console** (F12 → Console tab)
4. **Run verificatie queries** (zie Troubleshooting)

---

## 🔗 GERELATEERDE DOCS

- `LOCATION_MANAGEMENT.md` - Location management guide
- `TENANT_DELETE_AND_PUBLISHING.md` - Tenant delete guide
- `PROFESSIONAL_DASHBOARD.md` - Dashboard docs
- `MULTI_SECTOR_IMPLEMENTATION_COMPLETE.md` - Multi-sector expansion

---

**Klaar!** Je kunt nu veilig locaties verwijderen! 🚀

