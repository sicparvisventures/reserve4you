# TENANT DELETE & LOCATION PUBLISHING GUIDE

## WAT IS ER GEÏMPLEMENTEERD:

### 1. TENANT VERWIJDEREN
- Bedrijven kunnen verwijderd worden vanuit `/manager`
- Alleen OWNER kan verwijderen
- Cascade delete verwijdert ALLES:
  - Alle locaties
  - Alle tafels
  - Alle shifts
  - Alle reserveringen
  - Alle policies
  - Alle favorites
  - Billing state
  - Memberships
- Confirmation dialog voorkomt ongelukken
- Clean, professional UI zonder emoji's

### 2. LOCATIES PUBLICEREN
- Locaties moeten gepubliceerd worden om zichtbaar te zijn
- Automatic checks:
  - Billing moet ACTIVE of TRIALING zijn
  - Minimaal 1 tafel geconfigureerd
  - Minimaal 1 shift geconfigureerd
  - Policies zijn optioneel maar aanbevolen
- Gepubliceerde locaties verschijnen op homepage
- Gebruikers kunnen reserveren via booking flow

---

## DATABASE SETUP:

### STAP 1: Run Cascade Delete Migration

Open **Supabase SQL Editor** en run:

```sql
-- Kopieer de inhoud van:
/Users/dietmar/Desktop/ray2/supabase/migrations/20241017000009_tenant_cascade_delete.sql
```

**Expected output:**
```
Tenant Cascade Delete Function Created

Usage:
  SELECT delete_tenant_cascade(
    'tenant-id-here'::uuid,
    'user-id-here'::uuid
  );

Security:
  - Only tenant OWNER can delete
  - Deletes ALL associated data
  - Cannot be undone
```

---

## GEBRUIK:

### IN DE APP:

#### **1. Bedrijf Verwijderen:**

1. Ga naar: `http://localhost:3007/manager`
2. Zie je lijst met bedrijven
3. Klik op "Verwijder" knop (alleen zichtbaar voor OWNER)
4. Bevestig in de dialog
5. Bedrijf en alle data wordt verwijderd

**UI Features:**
- Clean delete button met Trash icon
- Duidelijke confirmation dialog
- Loading state tijdens verwijderen
- Error handling
- Automatic page refresh

#### **2. Locatie Publiceren:**

**Via Onboarding:**
- Doorloop alle stappen 1-8
- Stap 8 ("Preview & Publiceren") checkt automatisch:
  - Billing status
  - Tables configured
  - Shifts configured
  - Policies (optioneel)
- Klik "Publiceer Restaurant"

**Via Dashboard:**
- Ga naar Settings (stap 8)
- Check status
- Publiceer als alles klaar is

**Via API:**
```bash
POST /api/manager/locations/publish
{
  "locationId": "your-location-id"
}
```

#### **3. Locatie Zichtbaar op Homepage:**

Na publiceren:
1. Ga naar: `http://localhost:3007`
2. Je locatie verschijnt in "Vanavond beschikbaar"
3. Klik op de card om details te zien
4. Gebruikers kunnen reserveren

---

## SQL HELPER SCRIPTS:

### **1. Alle Locaties Bekijken:**

```sql
-- Open Supabase SQL Editor en run:
-- File: /supabase/scripts/view_all_locations.sql

-- Dit toont:
-- - Alle locaties
-- - Hun publish status
-- - Aantal tables/shifts/policies
-- - Billing status
-- - Readiness indicator
```

**Output voorbeeld:**
```
id       | name         | is_public | billing_status | tables | shifts | status
---------|--------------|-----------|----------------|--------|--------|------------------
abc-123  | Restaurant A | true      | ACTIVE         | 5      | 3      | ✓ Published
def-456  | Restaurant B | false     | TRIALING       | 3      | 2      | ⚠ Ready to publish
ghi-789  | Restaurant C | false     | ACTIVE         | 0      | 0      | ❌ No tables
```

### **2. Locatie Publiceren (Manual):**

```sql
-- Open Supabase SQL Editor
-- File: /supabase/scripts/publish_location.sql

-- 1. Find your location ID first:
SELECT id, name, slug, is_public FROM public.locations ORDER BY created_at DESC;

-- 2. Replace in the script:
DECLARE
  target_location_id UUID := 'YOUR-LOCATION-ID-HERE'; -- PUT YOUR ID HERE

-- 3. Run the script
-- It will:
-- - Check billing status
-- - Check tables
-- - Check shifts
-- - Check policies
-- - Publish if all OK
-- - Show clear error messages if not
```

### **3. Locatie Handmatig Publiceren (Quick):**

```sql
-- Als je weet dat alles OK is, direct publiceren:
UPDATE public.locations 
SET is_public = TRUE, is_active = TRUE 
WHERE id = 'your-location-id';
```

### **4. Locatie Unpublishen:**

```sql
-- Haal een locatie offline:
UPDATE public.locations 
SET is_public = FALSE 
WHERE id = 'your-location-id';
```

### **5. Tenant Verwijderen (Manual):**

```sql
-- Als je een tenant via SQL wilt verwijderen:
SELECT delete_tenant_cascade(
  'tenant-id-here'::uuid,
  'owner-user-id-here'::uuid
);
```

---

## CHECKLIST VOOR VISIBLE LOCATION:

```
☐ 1. Tenant aangemaakt
☐ 2. Billing state: ACTIVE of TRIALING
☐ 3. Location aangemaakt met:
     ☐ Naam
     ☐ Slug (uniek!)
     ☐ Adres
     ☐ Openingstijden
     ☐ Contact info
☐ 4. Minimaal 1 tafel geconfigureerd
☐ 5. Minimaal 1 shift geconfigureerd
☐ 6. Policies (optioneel maar aanbevolen)
☐ 7. Location gepubliceerd (is_public = TRUE, is_active = TRUE)
☐ 8. Check homepage: http://localhost:3007
☐ 9. Check detail page: http://localhost:3007/p/[slug]
☐ 10. Test booking flow
```

---

## TROUBLESHOOTING:

### **"Location niet zichtbaar op homepage"**

1. Check publish status:
```sql
SELECT id, name, slug, is_public, is_active 
FROM public.locations 
WHERE slug = 'your-slug';
```

2. Check billing:
```sql
SELECT bs.* 
FROM billing_state bs
JOIN tenants t ON bs.tenant_id = t.id
JOIN locations l ON l.tenant_id = t.id
WHERE l.slug = 'your-slug';
```

3. Check tables/shifts:
```sql
SELECT 
  (SELECT COUNT(*) FROM tables WHERE location_id = l.id) as tables,
  (SELECT COUNT(*) FROM shifts WHERE location_id = l.id) as shifts
FROM locations l
WHERE l.slug = 'your-slug';
```

4. Run publish check script:
```sql
-- Use /supabase/scripts/publish_location.sql
```

### **"Cannot delete tenant"**

Mogelijke oorzaken:
- Je bent niet OWNER (alleen OWNER kan verwijderen)
- Tenant ID is verkeerd
- Database error (check console)

Check je role:
```sql
SELECT role FROM memberships 
WHERE tenant_id = 'your-tenant-id' 
  AND user_id = 'your-user-id';
```

### **"Booking flow werkt niet"**

1. Check location is published
2. Check shifts zijn geconfigureerd voor vandaag
3. Check tables zijn beschikbaar
4. Check availability API: `POST /api/availability/check`

---

## TESTING FLOW:

### **Complete Test Scenario:**

```bash
# 1. Create tenant
- Go to: http://localhost:3007/manager/onboarding?step=1
- Fill in company info
- Complete all 8 steps

# 2. Verify in database
- Run: /supabase/scripts/view_all_locations.sql
- Should show your location

# 3. Publish location
- Via onboarding step 8, OR
- Via dashboard settings, OR
- Via SQL script: publish_location.sql

# 4. Check homepage
- Go to: http://localhost:3007
- Your location should appear in "Vanavond beschikbaar"

# 5. View detail page
- Click on your location card
- OR go to: http://localhost:3007/p/[your-slug]

# 6. Test booking
- Click "Reserveer"
- Select people, date, time
- Fill in guest info
- Submit booking

# 7. Check in manager dashboard
- Go to: http://localhost:3007/manager/[tenant-id]/dashboard
- Should see the booking

# 8. Test delete (optional)
- Go to: http://localhost:3007/manager
- Click "Verwijder" on your tenant
- Confirm
- Tenant and all data deleted
```

---

## BESTANDENOVERZICHT:

### **Frontend:**
- `/app/manager/page.tsx` - Server component (redirects logic)
- `/app/manager/ManagerClient.tsx` - Client component met delete UI
- `/app/page.tsx` - Homepage met published locations

### **API:**
- `/app/api/manager/tenants/[tenantId]/route.ts` - DELETE endpoint

### **Database:**
- `/supabase/migrations/20241017000009_tenant_cascade_delete.sql` - Cascade delete function

### **Helper Scripts:**
- `/supabase/scripts/view_all_locations.sql` - Overview query
- `/supabase/scripts/publish_location.sql` - Publish helper with checks

---

## SECURITY:

### **Delete Protection:**
```typescript
// Only OWNER can delete
const hasAccess = await checkTenantRole(
  session.userId, 
  tenantId, 
  ['OWNER']
);
```

### **Cascade Delete Order:**
```
1. Bookings (references locations)
2. Favorites (references locations)
3. Policies (references locations)
4. Shifts (references locations)
5. Tables (references locations)
6. POS integrations (references locations)
7. Locations (references tenant)
8. Billing state (references tenant)
9. Memberships (references tenant)
10. Tenant (root)
```

### **Publish Requirements:**
```
- Billing: ACTIVE or TRIALING
- Tables: >= 1
- Shifts: >= 1
- Policies: optional (recommended)
```

---

## READY!

Alles is nu klaar:
- Bedrijven kunnen veilig verwijderd worden
- Locaties worden automatisch zichtbaar als ze gepubliceerd zijn
- Gebruikers kunnen reserveren
- Alles in R4Y stijl, professioneel, geen emoji's

**Test het nu!**

1. Run de migration: `20241017000009_tenant_cascade_delete.sql`
2. Ga naar: `http://localhost:3007/manager`
3. Maak een bedrijf, configureer het, publiceer het
4. Check de homepage: `http://localhost:3007`
5. Test de booking flow
6. Test delete functie

**Succes!**

