# 👥 GEBRUIKERSBEHEERSYSTEEM - COMPLETE GUIDE

## 🎯 **OVERZICHT:**

Een volledig gebruikersbeheersysteem voor Reserve4You met:
- 4 gebruikersrollen met specifieke rechten
- PIN-gebaseerde login (4 cijfers)
- iPhone-style numeric keypad
- Per-locatie toegangsbeheer
- Granulaire permissions per module
- Floating button voor snelle staff toegang

---

## 📊 **GEBRUIKERSROLLEN:**

### **1. Administrator**
- ✅ Volledige toegang tot alle functies
- ✅ Kan gebruikers aanmaken, bewerken en verwijderen
- ✅ Kan rechten van andere gebruikers wijzigen
- ✅ Toegang tot instellingen en facturatie
- ✅ Alle locaties beheer

**Gebruik voor:** Eigenaren, general managers

### **2. Standaard Gebruiker**
- ✅ Beperkte toegang op basis van toegekende rechten
- ✅ Toegang tot specifieke modules (reserveringen, klanten, etc.)
- ✅ Kan per locatie toegang hebben
- ❌ Geen gebruikersbeheer

**Gebruik voor:** Shift managers, receptiemedewerkers

### **3. Viewer**
- ✅ Alleen-lezen toegang
- ✅ Kan data bekijken maar niet wijzigen
- ✅ Toegang tot dashboard en analytics
- ❌ Geen bewerkrechten

**Gebruik voor:** Externe partijen, shift leaders zonder bewerkrechten

### **4. Groepsbeheerder (Multi-locatie)**
- ✅ Beheer over meerdere vestigingen
- ✅ Kan data delen tussen locaties
- ✅ Centraliseer inzichten en rapportage
- ✅ Verschillende rechten per locatie mogelijk

**Gebruik voor:** Franchise managers, district managers, group owners

---

## 🚀 **SETUP INSTRUCTIES:**

### **Stap 1: Run SQL Script**

```bash
# Open Supabase SQL Editor
# Run: USER_MANAGEMENT_SYSTEM_SETUP.sql
```

Dit script creëert:
- ✅ `venue_users` table
- ✅ `venue_user_sessions` table
- ✅ `user_role` enum type
- ✅ Helper functions voor authentication
- ✅ RLS policies

### **Stap 2: Restart Development Server**

```bash
# Stop current server (Ctrl+C)
# Restart:
npm run dev
```

### **Stap 3: Toegang tot Features**

**Gebruikersbeheer:**
```
http://localhost:3007/profile
→ Tab: "Gebruikers"
```

**Staff Login:**
```
http://localhost:3007/staff-login
OF
Click floating button (bottom-left op homepage)
```

---

## 📝 **GEBRUIKER AANMAKEN:**

### **Via Profile → Gebruikers:**

1. **Ga naar Gebruikersbeheer:**
   - Login als admin/owner
   - Go to `/profile`
   - Click tab "Gebruikers"

2. **Click "Nieuwe Gebruiker"**

3. **Vul formulier in:**
   ```
   Voornaam: John
   Achternaam: Doe
   E-mail: john@restaurant.com (optioneel)
   Telefoon: +32 123 45 67 89 (optioneel)
   PIN Code: 1234 (4 cijfers, uniek per bedrijf)
   Rol: Kies uit 4 opties
   ```

4. **Vestigingen Toegang:**
   - Toggle "Alle vestigingen" AAN voor volledige toegang
   - OF selecteer specifieke locaties

5. **Rechten & Permissies:**
   Vink aan welke modules toegankelijk zijn:
   - Dashboard bekijken
   - Reserveringen beheren
   - Klanten beheren
   - Tafels beheren
   - Menu beheren
   - Promoties beheren
   - Analytics bekijken
   - Instellingen beheren
   - Gebruikers beheren
   - Facturatie beheren

6. **Click "Aanmaken"**

7. **Geef PIN code door aan gebruiker**
   - PIN is nodig om in te loggen
   - Houd PIN privé en veilig

---

## 🔐 **STAFF LOGIN PROCES:**

### **Optie 1: Via Floating Button**

```
1. Ga naar homepage: http://localhost:3007
2. Zie floating button linksonder (lock icon)
3. Click op button
4. Komt op PIN login scherm
5. Voer 4-cijferige PIN in
6. Auto-submit bij 4e cijfer
7. Redirect naar staff dashboard
```

### **Optie 2: Direct Link**

```
1. Ga naar: http://localhost:3007/staff-login
2. Voer PIN in op numpad
3. Click "Clear" om te wissen
4. Click backspace om laatste cijfer te verwijderen
5. Login bij correcte PIN
```

### **Login Flow:**

```
Homepage
   ↓
[Floating Button Click]
   ↓
Staff Login Page
   ↓
[Enter PIN: 1234]
   ↓
Verify in Database
   ↓
Create Session
   ↓
Store in localStorage
   ↓
Redirect to Staff Dashboard
```

---

## 🎨 **UI/UX FEATURES:**

### **PIN Login Scherm:**

**Design:**
- Mobile-first responsive design
- iPhone-style numeric keypad
- Gradient background (gray-50 to gray-100)
- White card met rounded corners (3xl)
- Shadow voor depth
- Professional typography

**Components:**
- Lock icon in cirkel (primary color)
- 4 PIN input dots (filled/empty states)
- 3×4 number grid (1-9, Clear, 0, Backspace)
- Error messages met AlertCircle icon
- Loading spinner tijdens verificatie
- "Terug naar home" button

**Interaction:**
- Touch/click op nummer → voeg toe aan PIN
- Auto-submit bij 4 cijfers
- Clear button → reset PIN
- Backspace → verwijder laatste cijfer
- Haptic-achtige transitions
- Hover states op alle buttons

### **Gebruikersbeheer UI:**

**List View:**
- Card per gebruiker
- Name, role badge, status badge
- Contact info (email, phone)
- PIN (verborgen als ••••)
- Laatste login tijd
- Permission badges
- Edit/Delete buttons

**Form:**
- Two-column responsive grid
- PIN input met Key icon
- Large centered PIN display (2xl font)
- Role selector met descriptions
- Location checkboxes in scrollable grid
- Permission checkboxes in grid layout
- Save/Cancel buttons

---

## 🔧 **DATABASE SCHEMA:**

### **venue_users Table:**

```sql
CREATE TABLE venue_users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID (link to auth.users),
  
  -- Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- Auth
  pin_code TEXT NOT NULL UNIQUE, -- 4 digits
  role user_role NOT NULL,
  
  -- Access
  location_ids UUID[],
  all_locations BOOLEAN DEFAULT false,
  
  -- Permissions (10 different flags)
  can_view_dashboard BOOLEAN,
  can_manage_bookings BOOLEAN,
  can_manage_customers BOOLEAN,
  can_manage_tables BOOLEAN,
  can_manage_menu BOOLEAN,
  can_manage_promotions BOOLEAN,
  can_view_analytics BOOLEAN,
  can_manage_settings BOOLEAN,
  can_manage_users BOOLEAN,
  can_manage_billing BOOLEAN,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  
  -- Metadata
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **venue_user_sessions Table:**

```sql
CREATE TABLE venue_user_sessions (
  id UUID PRIMARY KEY,
  venue_user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  login_at TIMESTAMP DEFAULT NOW(),
  logout_at TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔍 **HELPER FUNCTIONS:**

### **1. verify_pin_and_login()**

Verificeert PIN en creëert sessie:

```sql
SELECT * FROM verify_pin_and_login(
  p_tenant_id := 'uuid-here',
  p_pin_code := '1234',
  p_ip_address := '127.0.0.1',
  p_user_agent := 'Mozilla/5.0...'
);

-- Returns:
-- success: boolean
-- user_data: jsonb (user info + permissions)
-- session_id: uuid
```

### **2. get_user_permissions()**

Haalt gebruikersrechten op:

```sql
SELECT * FROM get_user_permissions(
  p_tenant_id := 'uuid-here',
  p_pin_code := '1234'
);

-- Returns:
-- user_id: uuid
-- full_name: text
-- role: user_role
-- permissions: jsonb
```

---

## 🧪 **TESTING GUIDE:**

### **Test 1: Gebruiker Aanmaken**

```
1. Go to: http://localhost:3007/profile
2. Tab: Gebruikers
3. Click: "Nieuwe Gebruiker"
4. Fill:
   - Voornaam: Test
   - Achternaam: User
   - PIN: 1111
   - Rol: Standard
   - Rechten: Dashboard + Reserveringen
5. Click: "Aanmaken"
6. ✅ Gebruiker verschijnt in lijst
```

### **Test 2: PIN Login**

```
1. Go to: http://localhost:3007
2. Click: Floating button (linksonder)
3. Kom op: Staff Login pagina
4. Enter PIN: 1111
5. ✅ Auto-submit na 4e cijfer
6. ✅ Redirect naar dashboard
7. ✅ Session opgeslagen in localStorage
```

### **Test 3: Foute PIN**

```
1. Staff Login pagina
2. Enter PIN: 9999 (onbestaande)
3. ✅ Error: "Ongeldige PIN code"
4. ✅ PIN reset naar leeg
5. ✅ Kan opnieuw proberen
```

### **Test 4: Gebruiker Bewerken**

```
1. Gebruikerslijst
2. Click: Edit button op gebruiker
3. Wijzig: Rol → Administrator
4. Voeg toe: Instellingen beheren
5. Click: "Bijwerken"
6. ✅ Wijzigingen opgeslagen
7. ✅ Updated_at timestamp gewijzigd
```

### **Test 5: Gebruiker Verwijderen**

```
1. Gebruikerslijst
2. Click: Delete button (rood)
3. Confirm: "Weet je het zeker?"
4. Click: OK
5. ✅ Gebruiker verwijderd
6. ✅ Sessions ook verwijderd (CASCADE)
```

---

## 🔐 **SECURITY FEATURES:**

### **Row Level Security (RLS):**

```sql
-- Only tenant admins can manage users
CREATE POLICY "Tenant admins can manage venue users"
ON venue_users FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT m.tenant_id FROM memberships m
    WHERE m.user_id = auth.uid()
    AND m.role IN ('owner', 'manager')
  )
);
```

### **PIN Constraints:**

- Exactly 4 digits required
- UNIQUE per tenant (no duplicates)
- Stored as TEXT (not hashed for easy reset)
- Pattern validation: `^\d{4}$`

### **Session Management:**

- Session ID stored in localStorage
- IP address + user agent tracked
- Last login timestamp updated
- Logout functionality available

---

## 📱 **MOBILE-FIRST DESIGN:**

### **Responsive Breakpoints:**

```css
/* Mobile (default) */
- Single column forms
- Full-width buttons
- Touch-optimized button size (min 44px)

/* Tablet (md:) */
- Two-column grid for forms
- Side-by-side permission checkboxes

/* Desktop (lg:) */
- Max-width containers
- Optimal spacing
- Hover states enhanced
```

### **Touch Optimizations:**

- Large tap targets (48px×48px minimum)
- No hover-only functionality
- Swipe-friendly list items
- Pinch-zoom disabled on numpad
- Haptic-like visual feedback

---

## 🎨 **STYLING CONSISTENCY:**

### **Color Palette:**

```css
Primary: #263e0f (green)
Background: white, gray-50, gray-100
Text: gray-900, gray-600
Error: red-600
Success: green-600
Border: gray-200, gray-300
```

### **Typography:**

```css
Headings: font-bold, text-xl to text-2xl
Body: font-normal, text-sm to text-base
Labels: font-medium, text-sm
Buttons: font-semibold, text-sm
```

### **Shadows:**

```css
Card: shadow-lg
Floating button: shadow-xl on hover
Modal: shadow-2xl
Subtle: shadow-sm
```

---

## 🚨 **TROUBLESHOOTING:**

### **Problem: PIN niet geaccepteerd**

**Diagnose:**
```sql
-- Check if PIN exists
SELECT * FROM venue_users 
WHERE pin_code = '1234' 
AND tenant_id = 'your-tenant-id';

-- Check if user is active
SELECT is_active FROM venue_users WHERE pin_code = '1234';
```

**Fix:**
- Verify PIN is exactly 4 digits
- Check user is_active = true
- Check tenant_id is correct
- Try different PIN

### **Problem: Floating button niet zichtbaar**

**Diagnose:**
- Check browser console for errors
- Verify StaffLoginFloatingButton is imported
- Check z-index conflicts

**Fix:**
```typescript
// Increase z-index if needed
className="... z-[9999]"
```

### **Problem: Permission changes niet zichtbaar**

**Diagnose:**
```sql
-- Check user permissions in DB
SELECT 
  first_name, 
  last_name,
  can_manage_bookings,
  can_view_dashboard,
  updated_at
FROM venue_users
WHERE id = 'user-id';
```

**Fix:**
- Hard refresh browser (Ctrl+Shift+R)
- Clear localStorage
- Re-login

### **Problem: Duplicate PIN error**

**Error:** `23505: unique constraint violation`

**Fix:**
```sql
-- Find duplicate
SELECT pin_code, COUNT(*) 
FROM venue_users 
WHERE tenant_id = 'tenant-id'
GROUP BY pin_code 
HAVING COUNT(*) > 1;

-- Change PIN
UPDATE venue_users 
SET pin_code = '5678' 
WHERE id = 'user-id';
```

---

## 📊 **ANALYTICS & MONITORING:**

### **Track User Activity:**

```sql
-- Login history
SELECT 
  vu.first_name || ' ' || vu.last_name as user_name,
  vus.login_at,
  vus.ip_address,
  EXTRACT(EPOCH FROM (vus.logout_at - vus.login_at))/60 as session_duration_minutes
FROM venue_user_sessions vus
JOIN venue_users vu ON vu.id = vus.venue_user_id
WHERE vu.tenant_id = 'tenant-id'
ORDER BY vus.login_at DESC
LIMIT 100;

-- Most active users
SELECT 
  vu.first_name || ' ' || vu.last_name as user_name,
  COUNT(*) as login_count,
  MAX(vus.login_at) as last_login
FROM venue_users vu
LEFT JOIN venue_user_sessions vus ON vus.venue_user_id = vu.id
WHERE vu.tenant_id = 'tenant-id'
GROUP BY vu.id, vu.first_name, vu.last_name
ORDER BY login_count DESC;
```

---

## 🎯 **BEST PRACTICES:**

### **DO:**
- ✅ Gebruik unieke PIN codes per gebruiker
- ✅ Wijzig PIN regelmatig voor hoge rechten accounts
- ✅ Geef minimale rechten (principle of least privilege)
- ✅ Review gebruikerstoegang maandelijks
- ✅ Deactiveer users in plaats van verwijderen (audit trail)
- ✅ Track login activiteit
- ✅ Train personeel over PIN beveiliging

### **DON'T:**
- ❌ Deel PIN codes
- ❌ Gebruik sequentiële PINs (1234, 2345, etc.)
- ❌ Gebruik geboortedatums als PIN
- ❌ Laat PINs onbeheerd zichtbaar
- ❌ Geef iedereen administrator rechten
- ❌ Vergeet inactieve users te deactiveren

---

## 📝 **FILES OVERZICHT:**

```
SQL Scripts:
✅ USER_MANAGEMENT_SYSTEM_SETUP.sql - Database schema & functions

Frontend Components:
✅ components/manager/UsersManager.tsx - User management UI
✅ app/profile/ProfileClient.tsx - Added "Gebruikers" tab
✅ app/staff-login/page.tsx - Staff login server component
✅ app/staff-login/PINLoginClient.tsx - PIN login client
✅ components/staff/StaffLoginFloatingButton.tsx - Floating button
✅ app/page.tsx - Homepage with floating button

Documentation:
✅ USER_MANAGEMENT_COMPLETE_GUIDE.md - This file
```

---

## 🎉 **KLAAR VOOR GEBRUIK!**

Het complete gebruikersbeheersysteem is geïmplementeerd en klaar voor gebruik!

**Start testing:**
1. Run SQL script in Supabase
2. Restart dev server
3. Go to /profile → Gebruikers
4. Maak eerste gebruiker aan
5. Test PIN login via floating button
6. Verify permissions werken

**Succes met je nieuwe gebruikersbeheersysteem! 🚀**

