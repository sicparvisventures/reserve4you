# MANAGER PORTAL - EASY ACCESS & CONDITIONAL HEADER

## WAT IS ER AANGEPAST:

### 1. CONSUMER HEADER ALLEEN VOOR CONSUMERS
✅ Consumer header (R4Y header) toont NIET meer op `/manager` routes
✅ Manager portal heeft nu geen consumer navigation
✅ Clean manager experience zonder consumer UI

### 2. MANAGER PORTAL BUTTON IN HEADER
✅ Desktop: "Manager Portal" button rechts in header
✅ Mobile: "Manager Portal" button in hamburger menu
✅ Zichtbaar voor beide authenticated & unauthenticated users
✅ Prominent styling met gradient of primary border

### 3. HOMEPAGE CTA VERBETERD
✅ Grotere, prominente sectie voor restaurant owners
✅ Twee duidelijke buttons: "Start Gratis" en "Manager Portal"
✅ Icon, beschrijving, en trust indicators
✅ Geen emoji's, clean design

### 4. CUISINE CARDS ZONDER EMOJI
✅ Verwijderd: 🍽️ emoji uit "Populaire keukens"
✅ Nu: Clean text-only design
✅ Hover states en borders

---

## WAAR IS MANAGER PORTAL NU TOEGANKELIJK:

### **1. Consumer Header (Alle Consumer Pages)**

**Desktop (Rechts in header):**
```
[Search] [Heart] [Bell] [Profiel] | [Manager Portal]
                                    ↑
                          Gradient button
```

**Mobile (In hamburger menu):**
```
- Home
- Ontdek
- Favorieten
─────────────
- Favorieten
- Profiel
─────────────
[Manager Portal]  ← Gradient button
```

### **2. Homepage (Bottom CTA Section)**

```
┌──────────────────────────────────────────┐
│         [Restaurant Icon]                │
│                                          │
│    Heb je een restaurant?                │
│                                          │
│    Sluit je aan bij R4Y...              │
│                                          │
│  [Start Gratis]  [Manager Portal]       │
│                                          │
│  Gratis voor altijd • Geen setup kosten │
└──────────────────────────────────────────┘
```

### **3. Manager Routes (NO Consumer Header)**

Manager portal routes tonen GEEN consumer header:
- `/manager` - Hub (tenant selection)
- `/manager/onboarding` - Onboarding wizard
- `/manager/[tenantId]/dashboard` - Dashboard
- `/manager/[tenantId]/settings` - Settings

✅ Clean manager experience
✅ Geen consumer navigation
✅ Focus op manager tasks

---

## CODE CHANGES:

### **1. Conditional Header Logic**

**File:** `/components/conditional-header.tsx`

```typescript
// Don't show consumer header on:
// - Login/signup pages
// - Manager portal routes (all routes starting with /manager)
const hideHeader = 
  pathname === '/sign-in' || 
  pathname === '/sign-up' ||
  pathname.startsWith('/manager');  // ← NEW

if (hideHeader) {
  return null;
}
```

### **2. Header Component - Desktop**

**File:** `/components/header.tsx`

```typescript
{userData ? (
  <>
    {/* Existing buttons... */}
    <div className="h-6 w-px bg-border mx-1" />  {/* Divider */}
    <Button variant="outline" size="sm" asChild className="gradient-bg text-white border-0">
      <Link href="/manager">Manager Portal</Link>
    </Button>
  </>
) : (
  <>
    {/* Existing buttons... */}
    <div className="h-6 w-px bg-border mx-1" />  {/* Divider */}
    <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary/10">
      <Link href="/manager">Manager Portal</Link>
    </Button>
  </>
)}
```

### **3. Header Component - Mobile**

```typescript
{userData ? (
  <>
    {/* Existing menu items... */}
    <div className="h-px bg-border my-2" />
    <Link href="/manager" onClick={() => setMobileMenuOpen(false)}>
      <Button className="w-full gradient-bg text-white">Manager Portal</Button>
    </Link>
  </>
) : (
  <>
    {/* Existing menu items... */}
    <div className="h-px bg-border my-2" />
    <Link href="/manager" onClick={() => setMobileMenuOpen(false)}>
      <Button variant="outline" className="w-full border-primary text-primary">
        Manager Portal
      </Button>
    </Link>
  </>
)}
```

### **4. Homepage CTA**

**File:** `/app/page.tsx`

```typescript
<section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-2xl border-2 border-primary/20 p-8 md:p-12 text-center shadow-lg">
  <div className="max-w-3xl mx-auto">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-6 shadow-md">
      {/* Restaurant icon SVG */}
    </div>
    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
      Heb je een restaurant?
    </h2>
    <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
      Sluit je aan bij R4Y en begin vandaag nog met het ontvangen van reserveringen. 
      Gratis starten, geen creditcard nodig.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <Link href="/manager">
        <Button size="lg" className="gradient-bg text-white rounded-xl shadow-lg">
          Start Gratis
        </Button>
      </Link>
      <Link href="/manager">
        <Button size="lg" variant="outline" className="rounded-xl border-2 border-primary text-primary">
          Manager Portal
        </Button>
      </Link>
    </div>
    <p className="text-xs text-muted-foreground mt-6">
      Gratis voor altijd • Geen setup kosten • Direct beginnen
    </p>
  </div>
</section>
```

---

## STYLING DETAILS:

### **Authenticated Users:**
- Button: `gradient-bg text-white border-0`
- Style: Prominent gradient (same as primary CTA)
- Position: After divider `|`

### **Unauthenticated Users:**
- Button: `border-primary text-primary hover:bg-primary/10`
- Style: Outlined with primary color
- Position: After divider `|`

### **Mobile (Both States):**
- Full width button
- At bottom of menu
- After divider line
- Authenticated: Gradient background
- Unauthenticated: Primary outline

---

## USER FLOWS:

### **Consumer → Manager Portal**

**Desktop:**
1. User on homepage
2. See "Manager Portal" button in header (top right)
3. Click → Redirect to `/manager`
4. Consumer header disappears
5. Manager portal UI shows

**Mobile:**
1. User on homepage
2. Tap hamburger menu
3. Scroll to bottom
4. See "Manager Portal" button
5. Tap → Redirect to `/manager`
6. Consumer header disappears
7. Manager portal UI shows

### **Homepage CTA:**
1. User scrolls to bottom of homepage
2. See prominent restaurant owner section
3. Two options:
   - "Start Gratis" → Onboarding
   - "Manager Portal" → Login/Hub

---

## ROUTES OVERVIEW:

### **Consumer Routes (WITH Header):**
- `/` - Homepage
- `/discover` - Search/Browse
- `/favorites` - User favorites
- `/profile` - User profile
- `/p/[slug]` - Restaurant detail
- `/search` - Search page
- `/notifications` - Notifications

### **Manager Routes (NO Header):**
- `/manager` - Hub/tenant selection
- `/manager/onboarding` - Onboarding wizard
- `/manager/[tenantId]/dashboard` - Dashboard
- `/manager/[tenantId]/settings` - Settings

### **Auth Routes (NO Header):**
- `/sign-in` - Login
- `/sign-up` - Register

---

## BENEFITS:

### **For Consumers:**
✅ Clear separation: consumer vs manager mode
✅ Easy access to manager portal if they own a restaurant
✅ Clean consumer experience

### **For Restaurant Owners:**
✅ Prominent "Manager Portal" button everywhere
✅ Multiple entry points (header + homepage CTA)
✅ Clean manager portal without consumer UI
✅ No confusion between consumer and manager mode

### **For UX:**
✅ No emoji's, professional look
✅ Consistent R4Y branding
✅ Mobile-first design
✅ Clear visual hierarchy

---

## TESTING CHECKLIST:

### **Desktop:**
```
☐ 1. Open homepage as logged-out user
☐ 2. See "Manager Portal" button in header (primary outline)
☐ 3. See prominent CTA at bottom with 2 buttons
☐ 4. Click "Manager Portal" in header
☐ 5. Verify consumer header disappears
☐ 6. Login to manager portal
☐ 7. Go back to homepage (browser back)
☐ 8. Verify consumer header is back
☐ 9. Click "Manager Portal" as logged-in user
☐ 10. Verify gradient button styling
```

### **Mobile:**
```
☐ 1. Open homepage on mobile
☐ 2. Tap hamburger menu
☐ 3. Scroll to bottom
☐ 4. See "Manager Portal" button
☐ 5. Tap → Goes to /manager
☐ 6. Verify consumer header is gone
☐ 7. Navigate manager portal
☐ 8. No consumer navigation visible
```

### **Manager Portal:**
```
☐ 1. Direct to /manager
☐ 2. No consumer header visible
☐ 3. Go to /manager/onboarding
☐ 4. No consumer header
☐ 5. Go to /manager/[id]/dashboard
☐ 6. No consumer header
☐ 7. Manager UI is clean and focused
```

---

## FILES CHANGED:

1. ✅ `/components/conditional-header.tsx` - Hide header for /manager routes
2. ✅ `/components/header.tsx` - Add Manager Portal button (desktop + mobile)
3. ✅ `/app/page.tsx` - Enhanced CTA section, removed emoji's
4. ✅ `/app/manager/[tenantId]/dashboard/DashboardClient.tsx` - Remove emoji from success banner

---

## READY TO TEST!

Alle changes zijn live. Test de flows:

1. **Homepage → Manager Portal (Header button)**
2. **Homepage → Manager Portal (CTA section)**
3. **Mobile menu → Manager Portal**
4. **Verify consumer header NIET zichtbaar in /manager**
5. **Verify clean manager experience**

**Perfect! Manager Portal is nu makkelijk toegankelijk!** ✅

