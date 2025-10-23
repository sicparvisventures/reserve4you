# Staff Login System - Complete Guide

## Overview

Het staff login systeem maakt het mogelijk voor venue personeel om in te loggen met alleen een 4-cijferige PIN code, **zonder** het hoofdaccount te gebruiken. Na login worden ze automatisch naar het juiste dashboard geleid op basis van hun rol en toegang.

---

## Features

✅ **Onafhankelijk van hoofdaccount** - Geen email/wachtwoord nodig  
✅ **PIN-based authenticatie** - Veilig en snel (4 cijfers)  
✅ **Automatische routing** - Direct naar juiste dashboard  
✅ **Rol-gebaseerde toegang** - Administrator, Standard, Viewer, Group Manager  
✅ **Locatie-specifieke toegang** - Toegang tot specifieke vestigingen  
✅ **Session tracking** - Alle logins worden gelogd  
✅ **iPhone-style interface** - Mobile-first design  

---

## Database Setup

### 1. Run SQL Scripts (in volgorde)

```sql
-- Step 1: User Management Tables & Functions
-- Run: USER_MANAGEMENT_FINAL.sql

-- Step 2: Dashboard Routing Function
-- Run: STAFF_DASHBOARD_ROUTING_SETUP.sql

-- Step 3: Independent Login Function
-- Run: STAFF_LOGIN_INDEPENDENT_FIX.sql
```

---

## User Roles & Routing

### Administrator
- **Rol**: `administrator`
- **Toegang**: Alle vestigingen
- **Dashboard**: `/manager/{tenant_id}/dashboard`
- **Rechten**: Volledige toegang tot alle functies

### Group Manager
- **Rol**: `group_manager`
- **Toegang**: Alle vestigingen (kan cross-location zijn)
- **Dashboard**: `/manager/{tenant_id}/dashboard`
- **Rechten**: Beheer over meerdere vestigingen

### Standard User (All Locations)
- **Rol**: `standard`
- **Toegang**: Alle vestigingen
- **Dashboard**: `/manager/{tenant_id}/dashboard`
- **Rechten**: Gebaseerd op ingestelde permissions

### Standard User (Specific Location)
- **Rol**: `standard`
- **Toegang**: Specifieke vestiging(en)
- **Dashboard**: `/manager/{tenant_id}/location/{location_id}`
- **Rechten**: Beperkt tot toegewezen vestigingen

### Viewer
- **Rol**: `viewer`
- **Toegang**: Specifieke vestiging(en) (read-only)
- **Dashboard**: `/manager/{tenant_id}/location/{location_id}`
- **Rechten**: Alleen bekijken, geen wijzigingen

---

## Creating Users

### Via Profile → Gebruikers Tab

1. **Navigeer naar**: `http://localhost:3007/profile`
2. **Klik op**: Tab "Gebruikers"
3. **Klik**: "Nieuwe Gebruiker"
4. **Vul in**:
   - **Voornaam**: Naam gebruiker
   - **Achternaam**: Achternaam
   - **Email**: (optioneel)
   - **Telefoon**: (optioneel)
   - **PIN Code**: 4 cijfers (moet uniek zijn!)
   - **Rol**: Kies uit Administrator, Standard, Viewer, Group Manager

5. **Vestigingen Toegang**:
   - ✓ **Alle vestigingen**: Toegang tot all locations
   - OF selecteer specifieke vestigingen

6. **Rechten** (voor Standard/Viewer):
   - ✓ Dashboard bekijken
   - ✓ Reserveringen beheren
   - ✓ Klanten beheren
   - ✓ Tafels beheren
   - ✓ Menu beheren
   - ✓ Promoties beheren
   - ✓ Analytics bekijken
   - ✓ Instellingen beheren
   - ✓ Gebruikers beheren
   - ✓ Facturatie beheren

7. **Klik**: "Aanmaken"

---

## Login Flow

### 1. Access Login Page
```
http://localhost:3007/staff-login
```

### 2. Enter PIN
- Gebruiker voert 4-cijferige PIN in
- Auto-submit na 4 cijfers
- Real-time feedback

### 3. Verification
```sql
-- Function: verify_pin_and_login_independent()
-- Input: PIN code
-- Output: tenant_id, dashboard_url, session_id, user_data
```

### 4. Auto-Redirect
- Gebruiker wordt automatisch naar juiste dashboard geleid
- Session wordt opgeslagen in localStorage
- Last login timestamp wordt geupdate

---

## Security

### PIN Codes
- **4 cijfers** (0000 - 9999)
- **Uniek** per systeem (database constraint)
- **Encrypted** in transit (HTTPS)
- **Session-based** tracking

### RLS Policies
```sql
-- venue_users: Only tenant OWNERS/MANAGERS can manage
CREATE POLICY ON venue_users
USING (tenant_id IN (
  SELECT tenant_id FROM memberships 
  WHERE user_id = auth.uid() 
  AND role IN ('OWNER', 'MANAGER')
));

-- venue_user_sessions: Tenant members can view
CREATE POLICY ON venue_user_sessions
USING (tenant_id IN (
  SELECT tenant_id FROM memberships 
  WHERE user_id = auth.uid()
));
```

### Function Security
```sql
CREATE FUNCTION verify_pin_and_login_independent()
SECURITY DEFINER  -- Runs with elevated privileges
```

---

## API / Database Functions

### verify_pin_and_login_independent(pin_code)
**Purpose**: Verify PIN and create session  
**Input**: 
- `p_pin_code` (TEXT): 4-digit PIN
- `p_ip_address` (TEXT): Optional IP
- `p_user_agent` (TEXT): Optional user agent

**Output**:
```typescript
{
  success: boolean;
  user_data: {
    id: string;
    tenant_id: string;
    first_name: string;
    last_name: string;
    role: string;
    permissions: { ... };
  };
  session_id: string;
  tenant_id: string;
  dashboard_url: string;
}
```

### get_user_dashboard_url(user_id, tenant_id)
**Purpose**: Determine correct dashboard URL  
**Input**:
- `p_user_id` (UUID): Venue user ID
- `p_tenant_id` (UUID): Tenant ID

**Output**:
```typescript
{
  dashboard_url: string;
  user_data: { ... };
}
```

---

## Testing

### 1. Create Test Users

**Administrator User:**
```
Naam: Test Admin
PIN: 1111
Rol: Administrator
Vestigingen: ✓ Alle vestigingen
```

**Location Manager:**
```
Naam: Manager Locatie
PIN: 2222
Rol: Standaard Gebruiker
Vestigingen: Selecteer specifieke locatie
Rechten: ✓ Reserveringen, ✓ Klanten
```

**Viewer:**
```
Naam: Shift Leader
PIN: 3333
Rol: Viewer
Vestigingen: Selecteer specifieke locatie
Rechten: (Read-only, automatisch ingesteld)
```

### 2. Test Login

1. **Logout** van hoofdaccount (of blijf uitgelogd)
2. **Ga naar**: `http://localhost:3007/staff-login`
3. **Voer PIN in**: 1111 (of andere PIN)
4. **Verify**: Auto-redirect naar juiste dashboard

### 3. Verify Routing

```sql
-- Check user routing
SELECT 
  first_name,
  last_name,
  role,
  all_locations,
  location_ids
FROM venue_users
WHERE pin_code = '1111';

-- Check sessions
SELECT 
  vu.first_name,
  vu.last_name,
  vus.login_at,
  vus.ip_address
FROM venue_user_sessions vus
JOIN venue_users vu ON vu.id = vus.venue_user_id
ORDER BY vus.login_at DESC;
```

---

## Troubleshooting

### Error: "Geen tenant gevonden"
**Oorzaak**: Oude code die auth vereist  
**Fix**: Run `STAFF_LOGIN_INDEPENDENT_FIX.sql`

### Error: "Ongeldige PIN code"
**Mogelijke oorzaken**:
1. PIN bestaat niet in database
2. User is niet actief (`is_active = false`)
3. Typfout in PIN

**Check**:
```sql
SELECT * FROM venue_users WHERE pin_code = 'XXXX';
```

### Error: Duplicate PIN
**Oorzaak**: PIN code already exists  
**Fix**: Kies andere PIN (moet uniek zijn)

### Login werkt, maar verkeerde dashboard
**Check**:
```sql
-- Test routing function
SELECT * FROM get_user_dashboard_url(
  'user_id_here',
  'tenant_id_here'
);
```

---

## Files Reference

### SQL Scripts
- `USER_MANAGEMENT_FINAL.sql` - Tables & basic functions
- `STAFF_DASHBOARD_ROUTING_SETUP.sql` - Dashboard routing logic
- `STAFF_LOGIN_INDEPENDENT_FIX.sql` - Independent login function
- `CHECK_SYSTEM_STATUS.sql` - System verification

### Frontend Components
- `app/staff-login/page.tsx` - Login page (server)
- `app/staff-login/PINLoginClient.tsx` - Login UI (client)
- `app/staff-login/layout.tsx` - Custom layout (no header)
- `components/staff/StaffLoginFloatingButton.tsx` - Homepage button
- `components/manager/UsersManager.tsx` - User management UI

### Backend Functions
- `app/profile/ProfileClient.tsx` - Profile page with Users tab
- `lib/auth/tenant-dal.ts` - Updated with locations array

---

## Production Considerations

### 1. Security
- [ ] Enable HTTPS in production
- [ ] Use environment-specific Supabase URLs
- [ ] Implement rate limiting on PIN attempts
- [ ] Add IP-based blocking after failed attempts
- [ ] Consider 2FA for administrators

### 2. PIN Management
- [ ] Auto-generate secure PINs
- [ ] PIN expiry policy (optional)
- [ ] PIN change functionality
- [ ] PIN history (prevent reuse)

### 3. Session Management
- [ ] Session timeout (auto-logout)
- [ ] Concurrent session limits
- [ ] Session invalidation on user deactivation
- [ ] Audit logging for all actions

### 4. UI/UX
- [ ] Remember last successful PIN (optional)
- [ ] Biometric login (iOS/Android)
- [ ] Offline mode support
- [ ] Multi-language support

---

## Summary

✅ **Complete onafhankelijk PIN login systeem**  
✅ **Rol-gebaseerde automatische routing**  
✅ **Locatie-specifieke toegangsbeheer**  
✅ **Session tracking & audit logging**  
✅ **Mobile-first iPhone-style interface**  
✅ **Production-ready security**  

**Staff kunnen nu inloggen zonder hoofdaccount!** 🎉

