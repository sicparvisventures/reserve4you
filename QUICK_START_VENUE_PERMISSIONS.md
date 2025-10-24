# Quick Start: Venue User Permissions

## ⚡ SNEL IMPLEMENTEREN (5 Minuten)

### 1️⃣ Run SQL Scripts in Supabase

**Script 1:** `ENFORCE_VENUE_USER_PERMISSIONS.sql`
```
Locations, Bookings, Tables, Promotions, Tenants
```

**Script 2:** `ENFORCE_VENUE_USER_PERMISSIONS_PART2.sql`
```
Shifts, Menu Items, Customers, Settings, Billing, Users
```

### 2️⃣ Restart Server
```bash
npm run dev
```

### 3️⃣ Test (2 Minuten)

**A. Create Test User**
```
1. Login als owner
2. /profile → Gebruikers
3. Nieuwe Gebruiker:
   Email: test@poulepoulette.com
   Password: password123
   PIN: 7777
   Locatie: [Gent] (één selecteren)
   Rechten: [Reserveringen beheren] (één aanvinken)
4. Opslaan
```

**B. Login as Venue User**
```
1. Logout owner
2. /staff-login → PIN 7777
3. Verify:
   ✅ Ziet alleen Gent
   ✅ Ziet alleen "Reserveringen" tab
   ❌ Ziet GEEN andere tabs
```

**C. Database Test**
```sql
-- In Supabase SQL Editor
-- Check policies exist
SELECT COUNT(*) FROM pg_policies 
WHERE policyname LIKE '%venue_user%';

-- Should show 18+ policies
```

---

## 🎯 PERMISSION CHEAT SHEET

| Aangevinkt in UI | Effect |
|-----------------|--------|
| Dashboard bekijken | Ziet main dashboard + back button |
| Reserveringen beheren | Ziet + bewerkt bookings voor toegewezen locaties |
| Klanten beheren | Ziet + bewerkt alle klanten (tenant-wide) |
| Tafels beheren | Ziet + bewerkt tables + shifts voor toegewezen locaties |
| Menu beheren | Ziet + bewerkt menu items voor toegewezen locaties |
| Promoties beheren | Ziet + bewerkt promoties voor toegewezen locaties |
| Analytics bekijken | Ziet stats voor toegewezen locaties |
| Instellingen beheren | Kan location + tenant settings wijzigen |
| Gebruikers beheren | Ziet andere venue users, kan beheren via API |
| Facturatie beheren | Ziet billing info (zeer restrictief) |

---

## 🔒 SECURITY LEVELS

### Level 1: Frontend Only (UI hiding)
❌ **NOT SECURE** - User kan API calls doen

### Level 2: API Route Checks
⚠️ **MEDIUM** - User kan direct DB queries doen

### Level 3: Database RLS Policies ✅
✅ **SECURE** - Database blokkeert ongeautoriseerde toegang

**We gebruiken Level 3!**

---

## 🧪 SNELLE TESTS

### Test 1: Location Access
```sql
-- Login as venue user (Gent only)
-- Try to access Mechelen bookings
SELECT * FROM bookings WHERE location_id = 'mechelen-id';
-- Expected: EMPTY (RLS blocks it)
```

### Test 2: Permission Check
```sql
-- Login as venue user (bookings only)
-- Try to access tables
SELECT * FROM tables WHERE location_id = 'gent-id';
-- Expected: EMPTY (no can_manage_tables)
```

### Test 3: Frontend UI
```
1. Login as venue user (Gent, bookings only)
2. Check tabs shown
   Expected: ONLY "Reserveringen" visible
3. Try to manually navigate to /manager/{id}/location/{gent}/promoties
   Expected: No data shown (even if UI loads)
```

---

## 📋 VERIFICATION CHECKLIST

After running SQL scripts:

- [ ] Run `SELECT COUNT(*) FROM pg_policies WHERE policyname LIKE '%venue_user%';`
      → Should show 18+ policies

- [ ] Create test venue user with limited access
- [ ] Login with that user
- [ ] Verify can ONLY see assigned locations
- [ ] Verify can ONLY use granted permissions
- [ ] Try to access non-assigned location (should fail)
- [ ] Try to use non-granted permission (should fail)

---

## ⚠️ COMMON ISSUES

### Issue: User Sees All Locations
**Fix:** Check `all_locations = false` and `location_ids` array is correct

### Issue: User Can Access Everything
**Fix:** Verify SQL scripts ran successfully, check policies exist

### Issue: User Can't Login
**Fix:** Check `is_active = true` in venue_users table

### Issue: Permission Not Working
**Fix:** Restart server after SQL changes

---

## 📞 NEED HELP?

**Check Logs:**
```sql
-- View user permissions
SELECT * FROM venue_users WHERE email = 'test@poulepoulette.com';

-- View policies
SELECT tablename, policyname FROM pg_policies 
WHERE policyname LIKE '%venue_user%'
ORDER BY tablename;
```

**Full Documentation:** `VENUE_USER_PERMISSIONS_COMPLETE_GUIDE.md`

---

**Status:** ✅ Ready to Deploy  
**Time to Implement:** 5 minutes  
**Security Level:** Database-Enforced (Highest)

