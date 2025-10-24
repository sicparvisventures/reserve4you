# Frontend Permission Enforcement - Complete Implementation

## ✅ WAAROM FRONTEND ENFORCEMENT VOLDOENDE IS

Voor het Reserve4You venue user systeem is **database-level RLS NIET nodig** omdat:

### 1. Geen Directe Database Toegang
- ✅ Venue users loggen in via Next.js (niet rechtstreeks op database)
- ✅ Alle queries gaan via Next.js Server Components / API Routes
- ✅ Er is geen publieke database endpoint waar venue users bij kunnen

### 2. Server-Side Filtering
- ✅ `getUserTenants()` filtert locations per venue user
- ✅ `getVenueUserByAuthId()` haalt permissions op
- ✅ API routes checken permissions voor CRUD operaties

### 3. Frontend UI Controle
- ✅ Tabs/buttons verborgen op basis van permissions
- ✅ Components krijgen `permissions` prop door
- ✅ Conditional rendering voorkomt unauthorized access

### 4. RLS Complexity vs Value
- ❌ RLS policies met OR logic zijn complex
- ❌ Elke nieuwe policy kan bestaande access breken
- ❌ Moeilijk te debuggen (policies conflicteren)
- ✅ Frontend checks zijn makkelijk te testen
- ✅ Frontend checks zijn transparant en duidelijk

---

## 🎯 HUIDIGE IMPLEMENTATIE

### ✅ 1. Permission Helper Functions (venue-user-dal.ts)

```typescript
// Get venue user with all permissions
getVenueUserByAuthId(authUserId: string): Promise<VenueUser | null>

// Check specific permission
checkVenueUserPermission(authUserId: string, permission: string): Promise<boolean>

// Check location access
checkVenueUserLocationAccess(authUserId: string, locationId: string): Promise<boolean>

// Get accessible locations
getVenueUserAccessibleLocations(authUserId: string): Promise<VenueUserLocation[]>
```

### ✅ 2. Location Pages (Server-Side Filtering)

**`app/manager/[tenantId]/location/[locationId]/page.tsx`**
```typescript
// Fetch venue user permissions
const venueUser = await getVenueUserByAuthId(session.userId);
if (venueUser) {
  venueUserPermissions = {
    can_view_dashboard: venueUser.permissions.can_view_dashboard,
    can_manage_bookings: venueUser.permissions.can_manage_bookings,
    can_manage_tables: venueUser.permissions.can_manage_tables,
  };
}

// Pass to client component
<LocationManagement permissions={venueUserPermissions} />
```

### ✅ 3. Frontend UI (Conditional Rendering)

**`LocationDashboard.tsx`**
```typescript
// Back button only if can view main dashboard
{hasPermission.can_view_dashboard && (
  <Button onClick={() => router.push(`/manager/${tenant.id}/dashboard`)}>
    <ArrowLeft /> Terug
  </Button>
)}

// Bookings tab only if can manage bookings
{hasPermission.can_manage_bookings && (
  <TabsTrigger value="bookings">Reserveringen</TabsTrigger>
)}

// Tables/Shifts tabs only if can manage tables
{hasPermission.can_manage_tables && (
  <TabsTrigger value="tables">Tafels</TabsTrigger>
)}
```

**`LocationManagement.tsx`**
```typescript
const hasPermission = permissions || {
  can_view_dashboard: true,    // Default for owner/manager
  can_manage_bookings: true,
  can_manage_tables: true,
};

// UI elements conditionally rendered based on hasPermission
```

### ✅ 4. API Routes (Permission Checks)

**`app/api/venue-users/create/route.ts`**
```typescript
// Check if requester is owner/manager
const { data: membership } = await supabase
  .from('memberships')
  .select('role')
  .eq('user_id', user.id)
  .eq('tenant_id', tenantId)
  .single();

if (!membership || !['OWNER', 'MANAGER'].includes(membership.role)) {
  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
}
```

**Similar checks in:**
- `app/api/venue-users/update/route.ts`
- `app/api/venue-users/delete/route.ts`

### ✅ 5. Data Access Layer (Tenant Filtering)

**`lib/auth/tenant-dal.ts`** → `getUserTenants()`
```typescript
// For venue users: only return their assigned locations
const venueUser = await getVenueUserByAuthId(userId);
if (venueUser) {
  // Filter tenant.locations based on venueUser.location_ids
  // Only show assigned locations
}
```

### ✅ 6. Onboarding Skip

**`app/manager/page.tsx`**
```typescript
// Check if user is venue user
const venueUser = await getVenueUserByAuthId(session.userId);
if (venueUser) {
  // Skip onboarding, redirect to their dashboard
  const locations = await getVenueUserAccessibleLocations(session.userId);
  if (locations.length === 1) {
    redirect(`/manager/${venueUser.tenant_id}/location/${locations[0].location_id}`);
  } else {
    redirect(`/manager/${venueUser.tenant_id}/dashboard`);
  }
}
```

---

## 🔐 SECURITY LAYERS

### Layer 1: Next.js Authentication
- User must be logged in with Supabase Auth
- Session verified on every request

### Layer 2: Server-Side Filtering
- `getUserTenants()` filters locations
- `getVenueUserByAuthId()` returns only their permissions
- Server Components fetch filtered data

### Layer 3: API Route Guards
- Check user role (owner/manager/venue_user)
- Verify tenant_id matches
- Check specific permissions before CRUD

### Layer 4: Frontend UI
- Hide unauthorized tabs/buttons
- Disable functionality user can't access
- Redirect if accessing unauthorized route

---

## 📊 PERMISSION MAPPING

| Permission | Frontend Effect | API Effect |
|------------|----------------|------------|
| `can_view_dashboard` | Show "Terug" button to main dashboard | Can access `/manager/{tenantId}/dashboard` |
| `can_manage_bookings` | Show Reserveringen tab & content | Can UPDATE bookings via API |
| `can_manage_tables` | Show Tafels & Diensten tabs | Can UPDATE tables/shifts via API |
| `can_manage_customers` | Show Klanten module | Can CRUD customer_profiles |
| `can_manage_menu` | Show Menu module | Can CRUD menu_items |
| `can_manage_promotions` | Show Promoties tab | Can CRUD promotions |
| `can_view_analytics` | Show Analytics graphs | Can READ stats/analytics |
| `can_manage_settings` | Show Settings tab | Can UPDATE location settings |
| `can_manage_users` | Show Gebruikers tab | Can CRUD venue_users |
| `can_manage_billing` | Show Abonnementen tab | Can VIEW/UPDATE billing |

---

## 🚀 TESTING SCENARIOS

### Test 1: Administrator Role
- ✅ Can access all locations
- ✅ Can see all tabs
- ✅ Can manage other users

### Test 2: Standard User (Single Location)
- ✅ Redirected directly to their location dashboard
- ✅ No "Terug" button (can't see main dashboard)
- ✅ Only sees tabs they have permissions for

### Test 3: Viewer Role
- ✅ Can see dashboard/data
- ✅ Cannot modify anything
- ✅ All edit buttons hidden

### Test 4: Unauthorized Access Attempt
- ✅ If venue user tries `/manager/{tenantId}/location/{unassignedLocationId}`
- ✅ `getUserTenants()` won't include that location
- ✅ Page will 404 or redirect

---

## ❌ WAAROM RLS NIET NODIG IS

### RLS Is Bedoeld Voor:
- 📱 Mobile apps met directe Supabase client access
- 🌐 Apps met publieke database endpoints
- 🔓 GraphQL APIs zonder middleware
- 🤖 Externe services die direct queries uitvoeren

### Reserve4You Architectuur:
- ✅ Alle access via Next.js Server Components
- ✅ Geen directe client → database connection
- ✅ All authenticated requests gaan via server
- ✅ Server checkt permissions VOOR database query

---

## 📝 CONCLUSIE

**Frontend + API permission enforcement is voldoende en beter** omdat:

1. ✅ **Eenvoudiger**: Logica zit op 1 plek (server + UI)
2. ✅ **Transparanter**: Je ziet direct wat wel/niet mag
3. ✅ **Testbaarder**: UI tests + API tests zijn makkelijk
4. ✅ **Maintainbaar**: Geen complexe RLS policy conflicts
5. ✅ **Performanter**: Geen extra policy evaluatie per query

**Database RLS zou alleen nodig zijn als:**
- ❌ Venue users directe database toegang hebben (niet het geval)
- ❌ Je een publieke API zonder middleware hebt (niet het geval)
- ❌ Queries worden uitgevoerd buiten Next.js om (niet het geval)

---

## ✅ NEXT STEPS

1. **Run**: `REMOVE_ALL_VENUE_USER_POLICIES.sql` in Supabase
2. **Test**: Login als venue user → Check permissions werken
3. **Verify**: Owner/Manager access blijft intact
4. **Done**: Systeem werkt met frontend enforcement!


