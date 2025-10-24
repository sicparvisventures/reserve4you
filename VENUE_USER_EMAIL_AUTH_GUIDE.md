# Venue User Email/Password Auth - Implementation Guide

## Overview

Complete systeem waarbij venue users Supabase auth krijgen (email/password) en permission-based toegang tot location dashboards.

---

## Wat Er Gebeurt

### Voor:
- Venue users: alleen PIN login
- Geen Supabase auth
- Geen permission checks in UI

### Na:
- Venue users: email/password Supabase auth + PIN
- `/staff-login`: email/password login → redirect naar toegewezen locatie
- Location dashboard: alleen toegestane modules zichtbaar
- "Terug naar dashboard" verborgen voor venue users zonder rechten

---

## Database Setup (COMPLETED)

### Run SQL:
```sql
-- In Supabase SQL Editor:
VENUE_USER_AUTH_SYSTEM.sql
```

Dit creëert:
- `auth_user_id` kolom in `venue_users`
- Permission check functions
- Location access functions
- RLS policies

---

## Frontend Implementation (TODO)

Dit vereist **zeer veel bestanden**. Hier is de volledige lijst:

### 1. API Routes (Nieuw)

**`app/api/venue-users/create/route.ts`**
- Creates Supabase auth user
- Creates venue_user record
- Links auth_user_id

**`app/api/venue-users/update/route.ts`**
- Updates venue_user
- Updates auth user email if changed

**`app/api/venue-users/delete/route.ts`**
- Deletes auth user
- Cascades to venue_user

### 2. Components Updates

**`components/manager/UsersManager.tsx`**
- Add email field (required)
- Add password field (required for new users)
- Call create API route
- Store auth_user_id

**`app/staff-login/page.tsx`**
- Add email/password login form
- Use Supabase signInWithPassword
- After login: get venue_user by auth.uid()
- Redirect to first accessible location

**`components/staff/StaffLoginFloatingButton.tsx`**
- Update to link to `/staff-login` (email login)
- Remove direct PIN login

### 3. Location Dashboard Updates

**`app/manager/[tenantId]/location/[locationId]/page.tsx`**
- Check if logged in user is venue_user
- Verify location access
- Pass permissions to client

**`app/manager/[tenantId]/location/[locationId]/LocationDashboard.tsx`**
- Accept `venueUserPermissions` prop
- Hide tabs based on permissions
- Hide "Dashboard" button if no access

**Example Permission Checks:**
```tsx
{venueUserPermissions?.can_manage_bookings && (
  <TabButton value="bookings">Reserveringen</TabButton>
)}

{venueUserPermissions?.can_manage_customers && (
  <TabButton value="customers">Klanten</TabButton>
)}

// etc for all modules
```

### 4. Middleware/Auth Checks

**`lib/auth/venue-user-dal.ts`** (New)
```typescript
export async function getVenueUserByAuthId(authUserId: string) {
  // Call get_venue_user_by_auth_id RPC
}

export async function checkVenueUserPermission(
  authUserId: string, 
  permission: string
) {
  // Call check_venue_user_permission RPC
}

export async function checkVenueUserLocationAccess(
  authUserId: string,
  locationId: string
) {
  // Call check_venue_user_location_access RPC
}

export async function getVenueUserAccessibleLocations(authUserId: string) {
  // Call get_venue_user_accessible_locations RPC
}
```

---

## Flow Examples

### Creating New Venue User

**In `/profile` → Gebruikers:**

1. Manager fills form:
   - Voornaam: "Manager"
   - Achternaam: "Gent"
   - **Email: "manager.gent@example.com"** (NEW!)
   - **Password: "SecurePass123!"** (NEW!)
   - PIN: "1234"
   - Rol: Standaard Gebruiker
   - Vestigingen: [Gent only]
   - Rechten: ✓ Reserveringen, ✓ Klanten

2. On submit:
   ```typescript
   // Frontend calls API
   POST /api/venue-users/create
   {
     email: "manager.gent@example.com",
     password: "SecurePass123!",
     firstName: "Manager",
     lastName: "Gent",
     pinCode: "1234",
     role: "standard",
     locationIds: ["gent-uuid"],
     permissions: {
       can_manage_bookings: true,
       can_manage_customers: true,
       // ... rest false
     }
   }
   ```

3. API creates:
   ```typescript
   // Create Supabase auth user
   const { data: authUser } = await supabase.auth.admin.createUser({
     email: "manager.gent@example.com",
     password: "SecurePass123!",
     email_confirm: true
   });

   // Create venue_user
   await supabase.from('venue_users').insert({
     auth_user_id: authUser.user.id,
     first_name: "Manager",
     last_name: "Gent",
     email: "manager.gent@example.com",
     pin_code: "1234",
     // ... rest of fields
   });
   ```

### Staff Member Login

**At `/staff-login`:**

1. User enters:
   - Email: "manager.gent@example.com"
   - Password: "SecurePass123!"

2. System:
   ```typescript
   const { data } = await supabase.auth.signInWithPassword({
     email,
     password
   });

   // Get venue_user by auth ID
   const venueUser = await getVenueUserByAuthId(data.user.id);

   // Get accessible locations
   const locations = await getVenueUserAccessibleLocations(data.user.id);

   // Redirect to first location
   router.push(`/manager/${venueUser.tenant_id}/location/${locations[0].id}`);
   ```

3. At location dashboard:
   - Check permissions
   - Hide modules user can't access
   - Hide "Terug naar dashboard" if not allowed

---

## Permission-Based UI

### Location Dashboard Tabs

```tsx
// Only show tabs for allowed modules
<Tabs value={activeTab}>
  {permissions.can_view_dashboard && (
    <TabButton value="overview">Overzicht</TabButton>
  )}
  
  {permissions.can_manage_bookings && (
    <TabButton value="reservations">Reserveringen</TabButton>
  )}
  
  {permissions.can_manage_customers && (
    <TabButton value="customers">Klanten</TabButton>
  )}
  
  {permissions.can_manage_tables && (
    <TabButton value="tables">Tafels</TabButton>
  )}
  
  {permissions.can_manage_menu && (
    <TabButton value="menu">Menu</TabButton>
  )}
  
  {permissions.can_manage_promotions && (
    <TabButton value="promotions">Promoties</TabButton>
  )}
  
  {permissions.can_view_analytics && (
    <TabButton value="analytics">Analytics</TabButton>
  )}
  
  {permissions.can_manage_settings && (
    <TabButton value="settings">Instellingen</TabButton>
  )}
</Tabs>
```

### Dashboard Button

```tsx
// Hide if venue user without tenant-level access
{!isVenueUserWithoutTenantAccess && (
  <Button asChild>
    <Link href={`/manager/${tenantId}/dashboard`}>
      Terug naar Dashboard
    </Link>
  </Button>
)}
```

---

## Security Considerations

### RLS Policies

Venue users can only:
- Read own `venue_users` record
- Read assigned locations
- Read bookings for assigned locations
- Manage resources in assigned locations (based on permissions)

### Middleware Checks

Every location page must:
1. Check if user is venue_user
2. Verify location access
3. Verify permissions for requested action

### API Route Protection

All venue-user management routes:
- Require authentication
- Check if requester is OWNER/MANAGER
- Validate tenant ownership

---

## Testing Steps

### 1. Run SQL
```sql
VENUE_USER_AUTH_SYSTEM.sql
```

### 2. Implement API Routes
- Create venue user with auth
- Update venue user
- Delete venue user

### 3. Update UsersManager
- Add email/password fields
- Call create API
- Test user creation

### 4. Update Staff Login
- Add email/password form
- Implement Supabase signIn
- Test login flow

### 5. Update Location Dashboard
- Add permission checks
- Hide unauthorized tabs
- Test with different roles

### 6. Full Flow Test

**Test User:**
- Email: test@example.com
- Password: TestPass123!
- PIN: 9999
- Role: Standard
- Locations: [Gent only]
- Permissions: Reserveringen + Klanten only

**Expected:**
1. Create user in `/profile` → Success
2. Login at `/staff-login` → Redirects to Gent
3. At Gent dashboard → Only sees Reserveringen + Klanten tabs
4. "Terug naar Dashboard" → Hidden
5. Try to access `/manager/{tenant}/dashboard` → Access denied

---

## Files to Create/Update

### SQL (Done)
- ✅ VENUE_USER_AUTH_SYSTEM.sql

### API Routes (TODO)
- [ ] app/api/venue-users/create/route.ts
- [ ] app/api/venue-users/update/route.ts
- [ ] app/api/venue-users/delete/route.ts

### Lib (TODO)
- [ ] lib/auth/venue-user-dal.ts

### Components (TODO)
- [ ] components/manager/UsersManager.tsx (update)
- [ ] components/manager/VenueUserEmailLogin.tsx (new)

### Pages (TODO)
- [ ] app/staff-login/page.tsx (major update)
- [ ] app/manager/[tenantId]/location/[locationId]/page.tsx (update)
- [ ] app/manager/[tenantId]/location/[locationId]/LocationDashboard.tsx (update)

---

## Estimated Implementation Time

- API Routes: 2-3 hours
- UsersManager Update: 1-2 hours
- Staff Login Update: 2-3 hours
- Location Dashboard Update: 3-4 hours
- Testing & Debugging: 2-3 hours

**Total: 10-15 hours of development**

---

## Priority Order

1. ✅ SQL setup (DONE)
2. API routes for user management
3. UsersManager email/password fields
4. Staff login email/password form
5. Location dashboard permission checks
6. Full integration testing

---

## Notes

- This is a MAJOR feature addition
- Requires careful testing
- Security is critical (permissions)
- UX must be smooth (no confusion about access)
- Error messages must be clear

---

## Alternative: Simpler Approach

If full implementation is too complex, consider:

**Phase 1: Just Email/Password**
- Add email/password to venue_users
- Create auth users
- Login at /staff-login
- No permission UI yet (all or nothing)

**Phase 2: Permission UI**
- Add permission checks
- Hide unauthorized components
- Full access control

This allows incremental rollout.

---

**Ready to implement? Start with running the SQL script first!**

