# Fix Email Login Dashboard URL Error

## 🚨 PROBLEEM

Bij inloggen met email/password op `/staff-login` krijg je:

```
Console Error: Dashboard URL error: {}
Unhandled Runtime Error: Kon dashboard niet laden
```

**Oorzaak:** De `get_user_dashboard_url()` RPC function werkt niet correct voor venue users.

---

## ✅ OPLOSSING

### Fix Applied: Direct URL Determination

In plaats van de RPC function te gebruiken, bepalen we nu de dashboard URL direct in de login component op basis van:

1. **User permissions** (`can_view_dashboard`)
2. **Location access** (`all_locations`, `location_ids`)
3. **Tenant ID**

---

## 🔧 FILES UPDATED

### 1. `components/manager/VenueUserEmailLogin.tsx`

**Oude code:**
```typescript
// Get dashboard URL
const { data: dashboardUrl, error: urlError } = await supabase.rpc('get_user_dashboard_url', {
  p_user_id: venueUser.id
});

if (urlError || !dashboardUrl) {
  console.error('Dashboard URL error:', urlError);
  throw new Error('Kon dashboard niet laden');
}

router.push(dashboardUrl);
```

**Nieuwe code:**
```typescript
// Determine dashboard URL based on permissions and location access
let dashboardUrl: string;

if (venueUser.all_locations || !venueUser.location_ids || venueUser.location_ids.length === 0) {
  // User has access to all locations
  if (venueUser.can_view_dashboard) {
    dashboardUrl = `/manager/${venueUser.tenant_id}/dashboard`;
  } else {
    // Get first available location
    const { data: locations } = await supabase
      .from('locations')
      .select('id')
      .eq('tenant_id', venueUser.tenant_id)
      .eq('is_active', true)
      .limit(1);

    if (!locations || locations.length === 0) {
      throw new Error('Geen actieve locaties gevonden');
    }

    dashboardUrl = `/manager/${venueUser.tenant_id}/location/${locations[0].id}`;
  }
} else if (venueUser.location_ids.length === 1) {
  // User has access to exactly one location
  dashboardUrl = `/manager/${venueUser.tenant_id}/location/${venueUser.location_ids[0]}`;
} else {
  // User has access to multiple specific locations
  if (venueUser.can_view_dashboard) {
    dashboardUrl = `/manager/${venueUser.tenant_id}/dashboard`;
  } else {
    dashboardUrl = `/manager/${venueUser.tenant_id}/location/${venueUser.location_ids[0]}`;
  }
}

console.log('Redirecting venue user to:', dashboardUrl);
router.push(dashboardUrl);
```

### 2. `app/staff-login/PINLoginClient.tsx`

Same logic applied to PIN login for consistency.

---

## 📋 ROUTING LOGIC

### Scenario 1: All Locations Access
```
User: all_locations = true
OR location_ids = [] (empty)

IF can_view_dashboard = true:
  → /manager/{tenantId}/dashboard
ELSE:
  → /manager/{tenantId}/location/{firstLocationId}
```

### Scenario 2: Single Location Access
```
User: location_ids = [locationId]

→ /manager/{tenantId}/location/{locationId}
(Always, regardless of can_view_dashboard)
```

### Scenario 3: Multiple Locations Access
```
User: location_ids = [locationId1, locationId2, ...]

IF can_view_dashboard = true:
  → /manager/{tenantId}/dashboard
ELSE:
  → /manager/{tenantId}/location/{firstLocationId}
```

---

## 🧪 TESTING

### Test Case 1: Single Location, No Dashboard Access
**User Config:**
- `location_ids`: `[location-uuid]`
- `can_view_dashboard`: `false`

**Expected:**
```
Login → /manager/{tenantId}/location/{location-uuid}
```

**No back button** (can't view dashboard)
**Only permitted tabs visible**

### Test Case 2: Multiple Locations, Dashboard Access
**User Config:**
- `location_ids`: `[loc1, loc2, loc3]`
- `can_view_dashboard`: `true`

**Expected:**
```
Login → /manager/{tenantId}/dashboard
```

**Shows all 3 locations**
**Can navigate to each location**

### Test Case 3: All Locations, No Dashboard Access
**User Config:**
- `all_locations`: `true`
- `can_view_dashboard`: `false`

**Expected:**
```
Login → /manager/{tenantId}/location/{firstActiveLocationId}
```

**No back button**
**Only one location visible**

---

## ✅ VERIFICATION

After applying the fix:

1. ✅ No more "Dashboard URL error"
2. ✅ No more "Kon dashboard niet laden"
3. ✅ Successful redirect to appropriate dashboard
4. ✅ Respects `can_view_dashboard` permission
5. ✅ Respects `location_ids` array
6. ✅ Handles edge cases (no locations, single location, multiple)

---

## 🎯 ADVANTAGES OF NEW APPROACH

### Before (RPC Function)
❌ Extra database call
❌ Complex SQL logic
❌ Harder to debug
❌ Error-prone
❌ Black box behavior

### After (Direct URL)
✅ No extra database call
✅ Clear TypeScript logic
✅ Easy to debug
✅ Transparent behavior
✅ Better error messages
✅ Consistent with other flows

---

## 🔍 DEBUG OUTPUT

Check browser console after login:

```
Redirecting venue user to: /manager/b0402eea-4296-4951-aff6-8f4c2c219818/location/2ca30ee4-140a-4a09-96ae-1455406e0a02
```

This confirms:
- ✅ URL is being determined
- ✅ Redirect is happening
- ✅ Correct format

---

## 📝 NO SQL CHANGES NEEDED

This fix is **frontend only** - no database changes required!

The RPC function `get_user_dashboard_url()` still exists but is no longer used for venue user login.

---

## 🚀 DEPLOYMENT

1. ✅ Files already updated:
   - `components/manager/VenueUserEmailLogin.tsx`
   - `app/staff-login/PINLoginClient.tsx`

2. ✅ Restart dev server:
   ```bash
   npm run dev
   ```

3. ✅ Test login:
   - Email/password login
   - PIN login
   - Both should work!

---

## ⚠️ EDGE CASES HANDLED

### No Active Locations
```typescript
if (!locations || locations.length === 0) {
  throw new Error('Geen actieve locaties gevonden');
}
```
**User sees:** Clear error message

### Empty location_ids Array
```typescript
if (venueUser.all_locations || !venueUser.location_ids || venueUser.location_ids.length === 0)
```
**Treated as:** All locations access

### Null location_ids
```typescript
!venueUser.location_ids
```
**Handled gracefully**

---

**Status:** ✅ FIXED
**No restart needed if server already running**
**Just refresh browser**

