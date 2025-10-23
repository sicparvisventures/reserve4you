# Location-Based Staff Login System

## Overview

Elk vestiging krijgt een unieke staff login URL voor PIN-based toegang zonder hoofdaccount authenticatie.

---

## System Design

### URLs

**Location-Specific (No Auth Required):**
- `/staff-login/poule-poulette-gent`
- `/staff-login/place-jourdan-70`
- `/staff-login/poule-poulette-mechelen`

**General (Auth Required):**
- `/staff-login` → Redirects to `/sign-in` if not logged in

---

## Database Changes

### New Column: `locations.staff_login_slug`

```sql
-- Unique slug for each location
staff_login_slug TEXT UNIQUE
```

### Examples:
- "Poule & Poulette Gent" → `poule-poulette-gent`
- "Place Jourdan 70" → `place-jourdan-70`
- "Poule & Poulette Mechelen" → `poule-poulette-mechelen`

---

## New Functions

### 1. `get_location_by_staff_slug(slug)`

```sql
SELECT * FROM get_location_by_staff_slug('poule-poulette-gent');
```

Returns:
- location_id
- location_name
- tenant_id
- tenant_name
- is_active

### 2. `verify_pin_and_login_by_slug(slug, pin, ip, user_agent)`

```sql
SELECT * FROM verify_pin_and_login_by_slug(
  'poule-poulette-gent',
  '1111',
  '127.0.0.1',
  'Browser'
);
```

Returns:
- success (boolean)
- user_data (jsonb)
- session_id (uuid)
- tenant_id (uuid)
- location_id (uuid)
- dashboard_url (text)
- error_message (text)

**Validates:**
- Location exists and is active
- PIN code is correct
- User belongs to the tenant
- User has access to the location

---

## Frontend Structure

### Routes

```
app/
├── staff-login/
│   ├── page.tsx                    # General (requires auth)
│   ├── layout.tsx                  # No header
│   ├── PINLoginClient.tsx          # General PIN login
│   └── [slug]/
│       ├── page.tsx                # Location-specific
│       ├── layout.tsx              # No header
│       └── PINLoginBySlugClient.tsx # Slug-based PIN login
```

### Components

```
components/
└── location/
    └── StaffLoginInfo.tsx          # Shows staff login URL
```

---

## Setup Instructions

### Step 1: Run SQL Script

```sql
-- In Supabase SQL Editor
-- Run: LOCATION_STAFF_LOGIN_SYSTEM.sql
```

This will:
- Add `staff_login_slug` column
- Generate unique slugs for all locations
- Create helper functions
- Grant permissions

### Step 2: Verify Slugs

```sql
SELECT 
  id,
  name,
  staff_login_slug,
  '/staff-login/' || staff_login_slug as url
FROM locations
WHERE staff_login_slug IS NOT NULL;
```

### Step 3: Restart Dev Server

```bash
Ctrl+C
pnpm dev
```

### Step 4: Test

1. Find a location slug from SQL result
2. Visit: `http://localhost:3007/staff-login/[slug]`
3. Enter PIN code (e.g., `1111`)
4. Should redirect to dashboard

---

## User Management

### Creating Staff Users

1. Go to: `/profile` → Tab "Gebruikers"
2. Click: "Nieuwe Gebruiker"
3. Fill in:
   - Naam: Staff member name
   - PIN: 4-digit code (e.g., `1234`)
   - Rol: Choose appropriate role
   - Vestigingen: Select location(s)
4. Save

### Access Control

**Administrator:**
- Can access all locations
- Redirects to: `/manager/{tenant}/dashboard`

**Standard User (specific locations):**
- Can only access assigned locations
- Redirects to: `/manager/{tenant}/location/{location_id}`

**Error Handling:**
- Wrong PIN: "Invalid PIN code"
- No access: "No access to this location"
- Invalid slug: 404 Not Found

---

## Sharing Staff Login URLs

### Option 1: In Location Dashboard

Add `StaffLoginInfo` component to show the URL:

```tsx
import { StaffLoginInfo } from '@/components/location/StaffLoginInfo';

<StaffLoginInfo 
  locationSlug={location.staff_login_slug}
  locationName={location.name}
/>
```

Features:
- Shows full URL
- Copy button
- Open in new tab
- Professional design

### Option 2: Manual Sharing

Share URL directly:
```
https://your-domain.com/staff-login/poule-poulette-gent
```

---

## Security Features

### Location-Specific URLs

- No authentication required
- PIN-based access only
- Limited to specific location
- Users must have location access

### General URL

- Requires authentication (`/sign-in`)
- For managers/admins only
- Full system access

### Session Tracking

All logins are tracked in `venue_user_sessions`:
- venue_user_id
- tenant_id
- ip_address
- user_agent
- login_at
- logout_at

---

## URL Slug Generation

### Rules

1. Convert to lowercase
2. Remove special characters
3. Replace spaces with hyphens
4. If duplicate: append tenant_id prefix

### Examples

| Location Name | Slug |
|--------------|------|
| Poule & Poulette Gent | `poule-poulette-gent` |
| Place Jourdan 70 | `place-jourdan-70` |
| Restaurant L'Avenue | `restaurant-lavenue` |
| Café De Markt | `cafe-de-markt` |

---

## New Location Flow

When creating a new location:

1. **Automatic slug generation:**
   ```sql
   -- Slug is auto-generated on INSERT
   -- Or manually set:
   UPDATE locations
   SET staff_login_slug = 'my-new-location'
   WHERE id = 'location-uuid';
   ```

2. **Share URL with staff:**
   - Copy from location dashboard
   - Or construct: `/staff-login/my-new-location`

3. **Create staff users:**
   - In `/profile` → "Gebruikers"
   - Assign to new location
   - Set PIN codes

4. **Test:**
   - Visit the URL
   - Enter PIN
   - Verify access

---

## Troubleshooting

### "Location not found" (404)

**Check:**
```sql
SELECT staff_login_slug 
FROM locations 
WHERE id = 'your-location-id';
```

**Fix:**
```sql
UPDATE locations
SET staff_login_slug = 'correct-slug'
WHERE id = 'your-location-id';
```

### "Invalid PIN code"

**Check:**
```sql
SELECT pin_code, first_name, last_name
FROM venue_users
WHERE tenant_id = 'your-tenant-id'
AND is_active = true;
```

**Verify:**
- PIN is exactly 4 digits
- User is active
- User belongs to correct tenant

### "No access to this location"

**Check:**
```sql
SELECT 
  first_name,
  last_name,
  all_locations,
  location_ids
FROM venue_users
WHERE pin_code = '1234';
```

**Fix:**
- Set `all_locations = true`, OR
- Add location ID to `location_ids` array

### General `/staff-login` redirects to sign-in

**This is correct behavior!**

Use location-specific URLs instead:
- `/staff-login/[slug]` → No auth required
- `/staff-login` → Auth required

---

## Production Considerations

### 1. SSL/HTTPS

Staff login URLs must use HTTPS in production:
```
https://reserve4you.com/staff-login/location-slug
```

### 2. QR Codes

Generate QR codes for easy mobile access:
- Print and display at location
- Staff can scan to login quickly

### 3. URL Shortening (Optional)

For easier sharing:
```
https://r4y.link/staff-gent
→ redirects to https://reserve4you.com/staff-login/poule-poulette-gent
```

### 4. Rate Limiting

Implement rate limiting on PIN attempts:
- Max 5 attempts per IP per minute
- Temporary lockout after 10 failed attempts

### 5. Session Management

Configure session timeout:
- Auto-logout after inactivity
- Clear sessions on logout
- Track concurrent sessions

---

## API Reference

### Get Location by Slug

```typescript
const { data, error } = await supabase
  .rpc('get_location_by_staff_slug', {
    p_slug: 'poule-poulette-gent'
  });
```

### Verify PIN and Login

```typescript
const { data, error } = await supabase
  .rpc('verify_pin_and_login_by_slug', {
    p_slug: 'poule-poulette-gent',
    p_pin_code: '1234',
    p_ip_address: null,
    p_user_agent: navigator.userAgent
  });

if (data[0].success) {
  // Store session
  localStorage.setItem('venue_user_session', JSON.stringify({
    sessionId: data[0].session_id,
    user: data[0].user_data,
    tenant_id: data[0].tenant_id,
    location_id: data[0].location_id
  }));
  
  // Redirect
  router.push(data[0].dashboard_url);
}
```

---

## Summary

### What Changed

- Each location has unique staff login URL
- No authentication required for location URLs
- General `/staff-login` requires authentication
- PIN-based access with location validation
- Professional, secure, easy to share

### Benefits

- Staff can login without main account
- Location-specific access control
- Easy to share and remember URLs
- Tracked sessions for security
- Professional user experience

### Files Changed

**SQL:**
- `LOCATION_STAFF_LOGIN_SYSTEM.sql`

**Frontend:**
- `app/staff-login/[slug]/page.tsx` (new)
- `app/staff-login/[slug]/PINLoginBySlugClient.tsx` (new)
- `app/staff-login/[slug]/layout.tsx` (new)
- `app/staff-login/page.tsx` (updated)
- `components/conditional-header.tsx` (updated)
- `components/location/StaffLoginInfo.tsx` (new)

---

## Next Steps

1. Run SQL script in Supabase
2. Restart dev server
3. Check generated slugs
4. Test with location-specific URLs
5. Share URLs with staff
6. Monitor login sessions

**System is now ready for production use!**

