# Staff Login Quick Access Button - Complete Implementation

## ✅ FEATURE TOEGEVOEGD

Een **"Personeel Login" button** in de header van elk location dashboard die:
- Direct linkt naar de staff login URL (`/staff-login/{slug}`)
- URL kan kopiëren met één klik
- Professional popover UI toont
- Responsive werkt (desktop + mobile)

---

## 📋 WAT IS ER GEBOUWD

### 1. **StaffLoginQuickAccess Component**
**File:** `components/staff/StaffLoginQuickAccess.tsx`

**Features:**
- ✅ Popover button met Users icon
- ✅ Toont staff login URL voor huidige locatie  
- ✅ Copy-to-clipboard functionaliteit met visual feedback
- ✅ Direct "Open Login Pagina" button
- ✅ Contextuele tips voor gebruikers
- ✅ Responsive text (desktop: "Personeel Login", mobile: alleen icon)

**Props:**
```typescript
interface StaffLoginQuickAccessProps {
  locationSlug?: string;      // e.g. "poule-poulette-gent"
  locationName?: string;       // e.g. "Poule & Poulette Gent"
  isVenueUser?: boolean;       // Whether current user is venue user
}
```

### 2. **Integration in LocationManagement**
**File:** `app/manager/[tenantId]/location/[locationId]/LocationManagement.tsx`

**Changes:**
- ✅ Added `isVenueUser` prop to interface
- ✅ Imported `StaffLoginQuickAccess` component
- ✅ Added button to header (next to "Gepubliceerd" badge)
- ✅ Conditional rendering (only shows if location has slug)

### 3. **Page Updates**
**File:** `app/manager/[tenantId]/location/[locationId]/page.tsx`

**Changes:**
- ✅ Added `isVenueUser` detection via `getVenueUserByAuthId()`
- ✅ Pass `isVenueUser` prop to `LocationManagement`
- ✅ Location data already includes `slug` and `staff_login_slug`

### 4. **UI Component Added**
**File:** `components/ui/popover.tsx`

**Added via shadcn:**
```bash
npx shadcn@latest add popover
```

---

## 🎨 UI DESIGN

### Desktop Header Layout
```
┌────────────────────────────────────────────────────────────┐
│ ← Dashboard    Locatie Naam              [👥 Personeel Login] [Gepubliceerd] │
│                Adres info                                   │
└────────────────────────────────────────────────────────────┘
```

### Popover Content (on click)
```
┌─────────────────────────────────────┐
│ Personeel Inlog Link                │
│ Voor Poule & Poulette Gent          │
│                                     │
│ ┌─────────────────────────────┬───┐│
│ │ /staff-login/poule-poul...  │📋 ││
│ └─────────────────────────────┴───┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ │ Open Login Pagina            → ││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ │ 💡 Tip:                         ││
│ │ Deel deze link met je personeel││
│ │ of open op tablet/terminal voor││
│ │ snelle PIN login.               ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Mobile View
```
┌──────────────────────────┐
│ ← Dashboard   Locatie    │
│   [👥] [Gepubliceerd]    │
└──────────────────────────┘
   ↑
   Button toont alleen icon
```

---

## 🚀 FEATURES DETAIL

### 1. **Automatic Slug Detection**
```typescript
{(location.staff_login_slug || location.slug) && (
  <StaffLoginQuickAccess
    locationSlug={location.staff_login_slug || location.slug}
    locationName={location.internal_name || location.name}
    isVenueUser={isVenueUser}
  />
)}
```

Fallback order:
1. `staff_login_slug` (preferred)
2. `slug` (backup)
3. If neither exists: button doesn't render

### 2. **Copy to Clipboard**
```typescript
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(staffLoginUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};
```

Visual feedback:
- Before copy: `<Copy />` icon
- After copy (2 seconds): `<Check />` icon (green)

### 3. **Responsive Text**
```typescript
<span className="hidden sm:inline">Personeel Login</span>
```

- **Mobile (< 640px):** Only Users icon
- **Desktop (≥ 640px):** Icon + "Personeel Login" text

### 4. **Direct Link**
```typescript
<Button asChild className="flex-1" size="sm">
  <Link href={staffLoginPath}>
    Open Login Pagina
    <ExternalLink className="ml-2 h-3 w-3" />
  </Link>
</Button>
```

Opens `/staff-login/{slug}` in same tab for seamless flow.

---

## 🧪 TESTING GUIDE

### Prerequisites
1. **Run SQL Scripts (in Supabase):**
   ```sql
   -- 1. Ensure all locations have slugs
   CHECK_LOCATION_SLUGS.sql
   
   -- 2. Clean up RLS policies
   COMPLETE_RLS_CLEANUP.sql
   ```

2. **Restart Dev Server:**
   ```bash
   npm run dev
   ```

### Test Scenario 1: Owner/Manager View
```
1. Login als owner (bijvoorbeeld owner@poulepoulette.com)
2. Ga naar Manager Portal
3. Selecteer een locatie (e.g., Gent)
4. In location dashboard header:
   ✅ Zie "Personeel Login" button (rechts van locatie naam)
5. Click op button
   ✅ Popover opent met staff login URL
6. Click copy icon
   ✅ URL gekopieerd naar clipboard
   ✅ Icon verandert naar check mark (2 sec)
7. Click "Open Login Pagina"
   ✅ Redirect naar /staff-login/poule-poulette-gent
```

### Test Scenario 2: Venue User View
```
1. Login als venue user (km11@poulepoulette.com)
2. Wordt direct geredirect naar hun location dashboard
3. In location dashboard header:
   ✅ Zie "Personeel Login" button
4. Click op button
   ✅ Popover toont EXACT die locatie's staff login URL
5. Test copy functionaliteit
   ✅ URL correct gekopieerd
6. Test open link
   ✅ Gaat naar correcte /staff-login/{slug}
```

### Test Scenario 3: Mobile View
```
1. Open browser DevTools (F12)
2. Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)
3. Set viewport to iPhone/Android
4. Navigate to location dashboard
5. Header toont:
   ✅ Only Users icon (geen tekst "Personeel Login")
   ✅ Button still clickable
   ✅ Popover nog steeds werkt
   ✅ Copy functionaliteit werkt
```

### Test Scenario 4: No Slug Edge Case
```
1. In Supabase: Update een location
   UPDATE locations SET slug = NULL, staff_login_slug = NULL WHERE id = 'xxx';

2. Refresh location dashboard
   ✅ "Personeel Login" button verschijnt NIET
   ✅ No errors in console
   ✅ Rest van UI werkt normaal

3. Run CHECK_LOCATION_SLUGS.sql om slug te herstellen
```

---

## 💡 USE CASES

### Use Case 1: Manager Wil Personeel Laten Inloggen
**Scenario:**
- Restaurant manager heeft nieuwe werknemer
- Wil snel de login link delen

**Flow:**
1. Manager opent location dashboard
2. Click "Personeel Login" button
3. Click copy icon
4. Plak URL in WhatsApp/SMS
5. Nieuwe werknemer kan direct inloggen met PIN

**Voordeel:** Geen handmatig URL typen nodig

---

### Use Case 2: Tablet bij Ingang
**Scenario:**
- Restaurant heeft tablet bij ingang voor personeel
- Wil altijd correct login scherm tonen

**Flow:**
1. Manager opent location dashboard
2. Click "Personeel Login" button
3. Click "Open Login Pagina"
4. Laat browser tab open op tablet
5. Personeel kan direct PIN invoeren

**Voordeel:** Altijd correcte slug URL, geen handmatige navigatie

---

### Use Case 3: Venue User met Enkele Locatie
**Scenario:**
- Venue user (km11@poulepoulette.com) heeft alleen toegang tot Gent
- Wil personeel laten inloggen

**Flow:**
1. Venue user logt in → Direct naar Gent dashboard
2. Ziet "Personeel Login" button
3. Click → Ziet `/staff-login/poule-poulette-gent`
4. Kopieer/deel met personeel

**Voordeel:** User ziet automatisch de juiste URL voor hun locatie

---

### Use Case 4: Owner met Meerdere Locaties
**Scenario:**
- Owner heeft 3 locaties (Gent, Mechelen, Brussel)
- Wil verschillende staff login links delen

**Flow:**
1. Owner opent Gent dashboard
   → Button toont `/staff-login/poule-poulette-gent`
2. Owner opent Mechelen dashboard
   → Button toont `/staff-login/poule-poulette-mechelen`
3. Owner opent Brussel dashboard
   → Button toont `/staff-login/place-jourdan-70`

**Voordeel:** Elke locatie heeft unieke, identificeerbare URL

---

## 🔧 TECHNICAL DETAILS

### Props Interface
```typescript
interface StaffLoginQuickAccessProps {
  locationSlug?: string;      // Required for rendering
  locationName?: string;       // Optional, for display
  isVenueUser?: boolean;       // Optional, for future restrictions
}
```

### State Management
```typescript
const [copied, setCopied] = useState(false);
```

Only state needed is for copy feedback.

### URL Construction
```typescript
const staffLoginUrl = `${window.location.origin}/staff-login/${locationSlug}`;
const staffLoginPath = `/staff-login/${locationSlug}`;
```

- `staffLoginUrl`: Full URL for clipboard (includes domain)
- `staffLoginPath`: Relative path for Next.js `<Link>`

### Conditional Rendering
```typescript
if (!locationSlug) {
  return null;
}
```

Button doesn't render if:
- `locationSlug` is undefined
- `locationSlug` is null
- `locationSlug` is empty string

---

## 📊 INTEGRATION SUMMARY

### Files Created
- ✅ `components/staff/StaffLoginQuickAccess.tsx`
- ✅ `components/ui/popover.tsx` (via shadcn)

### Files Modified
- ✅ `app/manager/[tenantId]/location/[locationId]/page.tsx`
- ✅ `app/manager/[tenantId]/location/[locationId]/LocationManagement.tsx`
- ✅ `components/manager/UsersManager.tsx` (earlier update for slug display)

### Dependencies Added
- ✅ `@radix-ui/react-popover` (via shadcn popover component)

### Database Requirements
- ✅ `locations.slug` column (already exists)
- ✅ `locations.staff_login_slug` column (already exists)
- ✅ Slugs should be generated (via `CHECK_LOCATION_SLUGS.sql`)

---

## ✅ CHECKLIST VOOR DEPLOYMENT

### Database
- [ ] Run `CHECK_LOCATION_SLUGS.sql` to ensure all locations have slugs
- [ ] Run `COMPLETE_RLS_CLEANUP.sql` to fix RLS policies
- [ ] Verify all locations have unique slugs (no duplicates)

### Code
- [ ] `StaffLoginQuickAccess.tsx` component exists
- [ ] `popover.tsx` UI component exists
- [ ] `LocationManagement.tsx` imports and uses component
- [ ] `page.tsx` passes `isVenueUser` prop

### Testing
- [ ] Button appears in location dashboard header
- [ ] Popover opens on click
- [ ] Copy to clipboard works
- [ ] "Open Login Pagina" navigates correctly
- [ ] Mobile view shows only icon
- [ ] No errors in console
- [ ] Works for venue users
- [ ] Works for owners/managers

### Styling
- [ ] Button aligned properly in header
- [ ] Popover positioned correctly (end-aligned)
- [ ] Copy icon shows check mark after copy
- [ ] Responsive text works (hidden on mobile)
- [ ] Professional branding maintained

---

## 🎉 FEATURE COMPLETE

**Alle doelen bereikt:**

1. ✅ Venue users zien staff login link in header
2. ✅ Quick access button naast Manager Portal badge
3. ✅ Copy functionaliteit met visual feedback
4. ✅ Direct link om login pagina te openen
5. ✅ Responsive design (desktop + mobile)
6. ✅ Slugs zichtbaar in hele systeem
7. ✅ Professional, clean UI
8. ✅ No emojis in code (only in UI tips)

**Gereed voor productie!** 🚀


