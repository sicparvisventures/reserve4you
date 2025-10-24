# Fix Venue User Onboarding Skip - Complete

## 🚨 PROBLEEM

Venue users die inloggen met email/password worden naar **onboarding** gestuurd in plaats van hun toegewezen dashboard.

**Verwacht:**
```
Login → /manager/{tenantId}/location/{locationId}
```

**Actueel:**
```
Login → /manager/onboarding?step=1
```

**Oorzaak:** `/manager/page.tsx` checkt alleen `getUserTenants()`, die leeg is voor venue users, dus redirect naar onboarding.

---

## ✅ OPLOSSING

### STAP 1: SQL Script (SKIP_ONBOARDING_FOR_VENUE_USERS.sql)

Helper functions voor venue user detection:
- `is_venue_user(p_user_id UUID)` - Check if user is venue user
- `get_venue_user_tenant(p_user_id UUID)` - Get tenant for venue user

**Run in Supabase SQL Editor.**

### STAP 2: Frontend Update (app/manager/page.tsx)

Toegevoegd aan `/manager/page.tsx`:
```typescript
// Check if user is a venue user FIRST
const { data: venueUser } = await supabase.rpc('get_venue_user_by_auth_id', {
  p_auth_user_id: session.userId
});

// If venue user, determine dashboard URL
if (venueUser && venueUser.length > 0) {
  // Route based on:
  // - all_locations
  // - location_ids
  // - can_view_dashboard
  
  redirect(appropriateDashboardUrl);
}

// Otherwise, regular owner/manager flow
```

---

## 🎯 ROUTING LOGIC VOOR VENUE USERS

### Scenario 1: Single Location Access
```
User config:
  location_ids: [location-uuid]
  
Result:
  → /manager/{tenantId}/location/{location-uuid}
```

### Scenario 2: All Locations, Dashboard Access
```
User config:
  all_locations: true
  can_view_dashboard: true
  
Result:
  → /manager/{tenantId}/dashboard
```

### Scenario 3: All Locations, NO Dashboard Access
```
User config:
  all_locations: true
  can_view_dashboard: false
  
Result:
  → /manager/{tenantId}/location/{firstLocationId}
```

### Scenario 4: Multiple Locations, Dashboard Access
```
User config:
  location_ids: [loc1, loc2, loc3]
  can_view_dashboard: true
  
Result:
  → /manager/{tenantId}/dashboard
```

### Scenario 5: Multiple Locations, NO Dashboard Access
```
User config:
  location_ids: [loc1, loc2, loc3]
  can_view_dashboard: false
  
Result:
  → /manager/{tenantId}/location/{loc1}
```

---

## 📋 FILES UPDATED

1. **`SKIP_ONBOARDING_FOR_VENUE_USERS.sql`** (NEW)
   - Helper SQL functions
   - Grant permissions

2. **`app/manager/page.tsx`** (UPDATED)
   - Venue user check BEFORE tenant check
   - Direct redirect to location/dashboard
   - Skip onboarding entirely

---

## 🧪 TESTING

### Test 1: Venue User Login
1. Create venue user in `/profile` → Gebruikers
2. Config:
   - Email: test@poulepoulette.com
   - Wachtwoord: password123
   - Vestigingen: [Gent]
   - Rechten: Reserveringen beheren only
3. Login op `/staff-login`
4. ✅ Expected: Direct to `/manager/{tenantId}/location/{gentId}`
5. ❌ NO onboarding!

### Test 2: Regular Owner Login
1. Login met main account
2. ✅ Expected: Normal flow (dashboard or onboarding if no tenant)
3. ✅ NO interference with venue user logic

---

## 🔐 PERMISSIONS VERIFICATIE

Rechten die ingesteld worden in `/profile - gebruikers` worden nu correct toegepast:

### ✅ Dashboard bekijken
```typescript
can_view_dashboard: boolean
→ Controls: Back button, main dashboard access
```

### ✅ Reserveringen beheren
```typescript
can_manage_bookings: boolean
→ Controls: Reserveringen tab visibility
```

### ✅ Klanten beheren
```typescript
can_manage_customers: boolean
→ Controls: Klanten module access
```

### ✅ Tafels beheren
```typescript
can_manage_tables: boolean
→ Controls: Tafels & Diensten tabs
```

### ✅ Menu beheren
```typescript
can_manage_menu: boolean
→ Controls: Menu module access
```

### ✅ Promoties beheren
```typescript
can_manage_promotions: boolean
→ Controls: Promoties tab
```

### ✅ Analytics bekijken
```typescript
can_view_analytics: boolean
→ Controls: Analytics/stats visibility
```

### ✅ Instellingen beheren
```typescript
can_manage_settings: boolean
→ Controls: Settings access
```

### ✅ Gebruikers beheren
```typescript
can_manage_users: boolean
→ Controls: Gebruikers tab in /profile
```

### ✅ Facturatie beheren
```typescript
can_manage_billing: boolean
→ Controls: Billing/subscription access
```

---

## 🚀 DEPLOYMENT CHECKLIST

1. ✅ Run SQL: `SKIP_ONBOARDING_FOR_VENUE_USERS.sql`
2. ✅ Updated: `app/manager/page.tsx`
3. ✅ Restart dev server
4. ✅ Test venue user login
5. ✅ Verify permissions work
6. ✅ Test regular owner still works

---

## 📝 VERIFICATION QUERIES

### Check Venue User Functions
```sql
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN ('is_venue_user', 'get_venue_user_tenant')
AND routine_schema = 'public';
```

Should show:
```
✅ is_venue_user | FUNCTION
✅ get_venue_user_tenant | FUNCTION
```

### Test Venue User Detection
```sql
SELECT is_venue_user(auth.uid());
-- Returns: true (if logged in as venue user)
```

### Get Venue User Tenant
```sql
SELECT * FROM get_venue_user_tenant(auth.uid());
-- Returns: tenant_id, tenant_name, onboarding_complete (always true)
```

---

## ⚠️ IMPORTANT NOTES

### Venue Users vs Owners
**Venue Users:**
- Created in `/profile` → Gebruikers
- Have `auth_user_id` in `venue_users` table
- Skip onboarding always
- Go directly to assigned locations

**Owners/Managers:**
- Sign up normally
- Have records in `memberships` table
- Go through onboarding if no tenant
- Can see main dashboard

### Onboarding is Skipped For
- ✅ Venue users (always)
- ✅ Owners with existing tenants
- ❌ New owners without tenants (need onboarding)

---

## 🎉 EXPECTED BEHAVIOR AFTER FIX

### Before
```
Venue User Login
↓
/manager
↓
tenants.length === 0
↓
/manager/onboarding?step=1  ❌ WRONG
```

### After
```
Venue User Login
↓
/manager
↓
Check: is_venue_user? → YES
↓
Get venue user data
↓
Determine dashboard URL
↓
/manager/{tenantId}/location/{locationId}  ✅ CORRECT
```

---

## 🔍 DEBUG OUTPUT

Check server console after venue user logs in:

```
[Manager Page] Checking if user is venue user...
[Manager Page] Venue user detected: test@poulepoulette.com
[Manager Page] Redirecting to: /manager/b0402eea-4296-4951-aff6-8f4c2c219818/location/2ca30ee4-140a-4a09-96ae-1455406e0a02
```

---

**Status:** ✅ IMPLEMENTED
**SQL Required:** YES (run SKIP_ONBOARDING_FOR_VENUE_USERS.sql)
**Restart Required:** YES (after SQL + code changes)

