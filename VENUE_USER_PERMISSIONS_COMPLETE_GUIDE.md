# Venue User Permissions - Complete Implementation Guide

## 🎯 OVERZICHT

Dit systeem zorgt ervoor dat **sub-accounts** (venue users) aangemaakt in `/profile - gebruikers`:
1. ✅ **Alleen** hun toegewezen locaties kunnen zien
2. ✅ **Alleen** modules kunnen gebruiken waarvoor ze rechten hebben
3. ✅ **Niets** kunnen doen buiten hun toegewezen scope
4. ✅ Volledig **database-level security** via RLS policies

---

## 📋 PERMISSION MAPPING

### 10 Rechten & Hun Effect

| # | Recht | Database Effect | UI Effect |
|---|-------|----------------|-----------|
| 1 | **Dashboard bekijken** | Kan tenant zien | Back button, main dashboard |
| 2 | **Reserveringen beheren** | Kan bookings CRUD | Reserveringen tab zichtbaar |
| 3 | **Klanten beheren** | Kan customer_profiles CRUD | Klanten module toegankelijk |
| 4 | **Tafels beheren** | Kan tables + shifts CRUD | Tafels & Diensten tabs |
| 5 | **Menu beheren** | Kan menu_items CRUD | Menu module toegankelijk |
| 6 | **Promoties beheren** | Kan promotions CRUD | Promoties tab zichtbaar |
| 7 | **Analytics bekijken** | Kan stats lezen | Analytics/graphs zichtbaar |
| 8 | **Instellingen beheren** | Kan locations + tenants UPDATE | Settings toegankelijk |
| 9 | **Gebruikers beheren** | Kan venue_users VIEW/CRUD | Gebruikers tab in /profile |
| 10 | **Facturatie beheren** | Kan billing info zien/wijzigen | Billing/subscription toegankelijk |

---

## 🔒 RLS POLICY STRUCTURE

### Locations (Vestigingen)
```sql
SELECT: 
  - Owner/Manager: All locations in tenant
  - Venue User: Only if (all_locations OR id IN location_ids)

UPDATE:
  - Owner/Manager: All locations
  - Venue User: Only if can_manage_settings AND assigned location
```

### Bookings (Reserveringen)
```sql
SELECT:
  - Owner/Manager: All bookings in tenant
  - Venue User: Only if can_manage_bookings AND assigned location

ALL (INSERT/UPDATE/DELETE):
  - Owner/Manager: Full access
  - Venue User: Only if can_manage_bookings AND assigned location
```

### Tables (Tafels)
```sql
SELECT:
  - Owner/Manager: All tables
  - Venue User: Only if can_manage_tables AND assigned location

ALL:
  - Owner/Manager: Full access
  - Venue User: Only if can_manage_tables AND assigned location
```

### Shifts (Diensten)
```sql
SELECT:
  - Owner/Manager: All shifts
  - Venue User: Only if can_manage_tables AND assigned location

ALL:
  - Owner/Manager: Full access
  - Venue User: Only if can_manage_tables AND assigned location
```

### Promotions
```sql
SELECT:
  - Owner/Manager: All promotions
  - Venue User: Only if can_manage_promotions AND assigned location

ALL:
  - Owner/Manager: Full access
  - Venue User: Only if can_manage_promotions AND assigned location
```

### Menu Items
```sql
SELECT:
  - Owner/Manager: All menu items
  - Venue User: Only if can_manage_menu AND assigned location

ALL:
  - Owner/Manager: Full access
  - Venue User: Only if can_manage_menu AND assigned location
```

### Customer Profiles (Klanten)
```sql
SELECT:
  - Owner/Manager: All customers in tenant
  - Venue User: All customers if can_manage_customers (tenant-wide)

ALL:
  - Owner/Manager: Full access
  - Venue User: All customers if can_manage_customers
```

**Note:** Customers zijn tenant-wide, niet location-specific. Een klant kan bij meerdere locaties boeken.

### Tenants (Settings)
```sql
SELECT:
  - Owner/Manager: Own tenant
  - Venue User: Own tenant (read-only unless settings permission)

UPDATE:
  - Owner/Manager: Full access
  - Venue User: Only if can_manage_settings
```

### Venue Users (Gebruikers)
```sql
SELECT:
  - Owner/Manager: All venue users in tenant
  - Venue User: Other venue users if can_manage_users

INSERT/UPDATE/DELETE:
  - Owner/Manager: Full access via API (already implemented)
  - Venue User: Via API if can_manage_users
```

---

## 🧪 TESTING SCENARIOS

### Scenario 1: Single Location, Bookings Only
**User Config:**
```
Email: staff1@poulepoulette.com
PIN: 1234
Locaties: [Gent]
Rechten:
  ✅ Reserveringen beheren
  ❌ Alle andere rechten
```

**Expected Behavior:**
- ✅ Kan inloggen (PIN of email)
- ✅ Ziet alleen Gent location
- ✅ Ziet "Reserveringen" tab
- ❌ Ziet GEEN andere tabs (Tafels, Promoties, etc.)
- ✅ Kan bookings voor Gent zien
- ❌ Kan bookings voor andere locaties NIET zien (database blocked)
- ❌ Kan tables/promotions NIET zien (database blocked)
- ❌ Geen back button (kan dashboard niet zien)

**SQL Verification:**
```sql
-- Login as venue user
SELECT * FROM bookings WHERE location_id = 'gent-id';
-- ✅ Returns bookings

SELECT * FROM bookings WHERE location_id = 'mechelen-id';
-- ❌ Returns empty (RLS blocks it)

SELECT * FROM tables WHERE location_id = 'gent-id';
-- ❌ Returns empty (no can_manage_tables permission)
```

### Scenario 2: Multiple Locations, Full Access
**User Config:**
```
Email: manager@poulepoulette.com
PIN: 5678
Locaties: [Gent, Mechelen, Brussel]
Rechten:
  ✅ Dashboard bekijken
  ✅ Reserveringen beheren
  ✅ Klanten beheren
  ✅ Tafels beheren
  ✅ Promoties beheren
```

**Expected Behavior:**
- ✅ Kan inloggen
- ✅ Ziet main dashboard (can_view_dashboard)
- ✅ Ziet alle 3 locaties
- ✅ Ziet alle relevante tabs
- ✅ Kan data voor alle 3 locaties zien/bewerken
- ✅ Kan klanten voor heel de tenant zien
- ❌ Kan settings/billing NIET zien (geen permission)

**SQL Verification:**
```sql
-- Can see bookings from all assigned locations
SELECT location_id, COUNT(*) FROM bookings GROUP BY location_id;
-- ✅ Shows Gent, Mechelen, Brussel

-- Can see tables from all assigned locations
SELECT location_id, COUNT(*) FROM tables GROUP BY location_id;
-- ✅ Shows Gent, Mechelen, Brussel

-- Cannot see locations not assigned
SELECT * FROM locations WHERE id = 'antwerpen-id';
-- ❌ Returns empty (not in location_ids)
```

### Scenario 3: Viewer Role (Read-Only)
**User Config:**
```
Email: viewer@poulepoulette.com
PIN: 9999
Locaties: [Gent]
Rechten:
  ✅ Dashboard bekijken
  ✅ Analytics bekijken
  ❌ Geen management rechten
```

**Expected Behavior:**
- ✅ Kan inloggen
- ✅ Ziet Gent dashboard
- ✅ Ziet stats/analytics
- ❌ Kan NIETS bewerken (database blocks INSERT/UPDATE/DELETE)
- ❌ Ziet geen tabs voor modules zonder permission

**SQL Verification:**
```sql
-- Can read (SELECT works due to analytics permission)
SELECT * FROM bookings WHERE location_id = 'gent-id';
-- ✅ Returns data (if can_manage_bookings OR can_view_analytics)

-- Cannot write (INSERT blocked)
INSERT INTO bookings (...) VALUES (...);
-- ❌ ERROR: RLS policy violated
```

### Scenario 4: Settings Manager
**User Config:**
```
Email: settings@poulepoulette.com
PIN: 4444
Locaties: [ALL]
Rechten:
  ✅ Instellingen beheren
  ❌ Geen andere rechten
```

**Expected Behavior:**
- ✅ Kan inloggen
- ✅ Ziet main dashboard (all locations)
- ✅ Kan location settings wijzigen
- ✅ Kan tenant settings wijzigen
- ❌ Kan geen bookings/tables/etc zien (geen permission)

**SQL Verification:**
```sql
-- Can update locations
UPDATE locations SET name = 'New Name' WHERE id = 'gent-id';
-- ✅ SUCCESS (has can_manage_settings)

-- Cannot see bookings
SELECT * FROM bookings WHERE location_id = 'gent-id';
-- ❌ Returns empty (no can_manage_bookings)
```

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Run SQL Scripts (In Order)
```sql
1. ENFORCE_VENUE_USER_PERMISSIONS.sql
   (Covers: locations, bookings, tables, promotions, tenants)

2. ENFORCE_VENUE_USER_PERMISSIONS_PART2.sql
   (Covers: shifts, menu_items, customer_profiles, settings, billing, users)
```

### Step 2: Verify Policies
```sql
-- Check all venue user policies
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE '%venue_user%'
ORDER BY tablename, policyname;
```

Should show:
```
bookings          | venue_users_can_manage_bookings      | ALL
bookings          | venue_users_can_view_bookings        | SELECT
customer_profiles | venue_users_can_manage_customer_...  | ALL
customer_profiles | venue_users_can_view_customer_...    | SELECT
locations         | venue_users_can_update_assigned_...  | UPDATE
locations         | venue_users_can_view_assigned_...    | SELECT
menu_items        | venue_users_can_manage_menu_items    | ALL
menu_items        | venue_users_can_view_menu_items      | SELECT
promotions        | venue_users_can_manage_promotions    | ALL
promotions        | venue_users_can_view_promotions      | SELECT
shifts            | venue_users_can_manage_shifts        | ALL
shifts            | venue_users_can_view_shifts          | SELECT
tables            | venue_users_can_manage_tables        | ALL
tables            | venue_users_can_view_tables          | SELECT
tenants           | venue_users_can_update_tenant_...    | UPDATE
tenants           | venue_users_can_view_billing         | SELECT
tenants           | venue_users_can_view_tenant          | SELECT
venue_users       | venue_users_can_view_other_venue_... | SELECT
```

### Step 3: Restart Server
```bash
npm run dev
```

### Step 4: Test Complete Flow

#### A. Create Venue User
1. Login as owner: `http://localhost:3007/sign-in`
2. Go to `/profile` → Gebruikers
3. Create user:
   - Email: `test@poulepoulette.com`
   - Wachtwoord: `password123`
   - PIN: `7777`
   - Locatie: Gent only
   - Rechten: Reserveringen beheren only
4. Save

#### B. Test as Venue User
1. Logout owner
2. Login as venue user: `/staff-login` (PIN 7777)
3. Verify:
   - ✅ Lands on Gent dashboard
   - ✅ Sees only "Reserveringen" tab
   - ❌ Cannot see other tabs
   - ✅ Can view/manage bookings for Gent
   - ❌ Cannot access other locations (try URL manually)

#### C. Database Verification
```sql
-- Login to Supabase SQL Editor
-- Set session as venue user (simulate)
SET LOCAL request.jwt.claims TO '{"sub": "venue-user-auth-id"}';

-- Try to access Mechelen bookings
SELECT * FROM bookings WHERE location_id = 'mechelen-id';
-- Should return EMPTY (RLS blocks it)

-- Try to access Gent bookings
SELECT * FROM bookings WHERE location_id = 'gent-id';
-- Should return DATA (permission granted)
```

---

## 📊 PERMISSION MATRIX

| Module | Permission Required | Location-Specific | Tenant-Wide |
|--------|-------------------|-------------------|-------------|
| Dashboard | `can_view_dashboard` | No | Yes |
| Bookings | `can_manage_bookings` | Yes | No |
| Customers | `can_manage_customers` | No | Yes |
| Tables | `can_manage_tables` | Yes | No |
| Shifts | `can_manage_tables` | Yes | No |
| Menu | `can_manage_menu` | Yes | No |
| Promotions | `can_manage_promotions` | Yes | No |
| Analytics | `can_view_analytics` | Yes | No |
| Settings (Location) | `can_manage_settings` | Yes | No |
| Settings (Tenant) | `can_manage_settings` | No | Yes |
| Users | `can_manage_users` | No | Yes |
| Billing | `can_manage_billing` | No | Yes |

---

## 🔍 TROUBLESHOOTING

### Issue: Venue User Sees All Locations
**Check:**
```sql
SELECT id, first_name, all_locations, location_ids
FROM venue_users
WHERE email = 'test@poulepoulette.com';
```

If `all_locations = true` → Change to `false`  
If `location_ids = []` → Add proper location IDs

### Issue: Venue User Can't See Bookings
**Check:**
```sql
SELECT can_manage_bookings FROM venue_users
WHERE email = 'test@poulepoulette.com';
```

If `false` → Enable permission in `/profile - gebruikers`

### Issue: RLS Policy Not Working
**Verify:**
```sql
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'bookings'
AND policyname LIKE '%venue_user%';
```

Should show 2 policies (SELECT + ALL)

### Issue: User Can Access Wrong Location
**Check RLS:**
```sql
-- Test as that user
SELECT * FROM locations;
```

Should only return assigned locations.

---

## ⚠️ IMPORTANT NOTES

### Security Considerations
1. **RLS is ENFORCED** - Even if frontend allows it, database blocks it
2. **Permissions are CHECKED** - Every query validates permissions
3. **Location Access is STRICT** - Cannot bypass via API
4. **Cascade Protection** - Deleting location doesn't orphan data

### Performance Notes
1. RLS policies add query overhead (minimal)
2. Consider indexes on `venue_users.auth_user_id`
3. Consider indexes on permission columns
4. Monitor slow queries in production

### Future Enhancements
- [ ] Permission presets ("Manager", "Viewer", etc.)
- [ ] Time-based access (schedule permissions)
- [ ] IP-based restrictions
- [ ] Activity logging per venue user
- [ ] Permission inheritance (role-based)

---

## 📞 SUPPORT QUERIES

### Check User Permissions
```sql
SELECT 
  first_name,
  last_name,
  email,
  role,
  all_locations,
  array_length(location_ids, 1) as num_locations,
  can_view_dashboard,
  can_manage_bookings,
  can_manage_customers,
  can_manage_tables,
  can_manage_menu,
  can_manage_promotions,
  can_view_analytics,
  can_manage_settings,
  can_manage_users,
  can_manage_billing
FROM venue_users
WHERE tenant_id = 'your-tenant-id'
AND is_active = true;
```

### Check Access to Location
```sql
SELECT 
  vu.first_name,
  vu.email,
  l.name as location_name,
  CASE 
    WHEN vu.all_locations THEN 'ALL LOCATIONS'
    WHEN l.id = ANY(vu.location_ids) THEN 'HAS ACCESS'
    ELSE 'NO ACCESS'
  END as access_status
FROM venue_users vu
CROSS JOIN locations l
WHERE vu.tenant_id = l.tenant_id
AND vu.email = 'test@example.com';
```

### Audit Permissions
```sql
SELECT 
  email,
  ARRAY_AGG(
    CASE 
      WHEN can_view_dashboard THEN 'dashboard'
      WHEN can_manage_bookings THEN 'bookings'
      WHEN can_manage_customers THEN 'customers'
      WHEN can_manage_tables THEN 'tables'
      WHEN can_manage_menu THEN 'menu'
      WHEN can_manage_promotions THEN 'promotions'
      WHEN can_view_analytics THEN 'analytics'
      WHEN can_manage_settings THEN 'settings'
      WHEN can_manage_users THEN 'users'
      WHEN can_manage_billing THEN 'billing'
    END
  ) FILTER (WHERE 
    can_view_dashboard OR
    can_manage_bookings OR
    can_manage_customers OR
    can_manage_tables OR
    can_manage_menu OR
    can_manage_promotions OR
    can_view_analytics OR
    can_manage_settings OR
    can_manage_users OR
    can_manage_billing
  ) as granted_permissions
FROM venue_users
WHERE tenant_id = 'your-tenant-id'
GROUP BY email;
```

---

**Status:** ✅ PRODUCTION READY  
**Security Level:** Database-Enforced (RLS)  
**Last Updated:** $(date)  
**Version:** Complete v1.0

