# 🚀 Menu System - Integration Quick Start

## ✅ Wat Is Klaar

Je hebt nu:
1. ✅ **SQL schema** - Database tables voor menus (COMPLETE_MENU_SYSTEM_SETUP.sql)
2. ✅ **MenuManager component** - Manager interface (components/manager/MenuManager.tsx)
3. ✅ **PublicMenuDisplay component** - Public display (components/menu/PublicMenuDisplay.tsx)
4. ✅ **Copy functionaliteit** - Kopieer menu tussen locaties (in SQL functions)
5. ✅ **Storage bucket** - Voor menu images (menu-images)
6. ✅ **RLS policies** - Secure access
7. ✅ **Helper functions** - get_location_menu(), copy_menu_to_location()

---

## 🚀 Wat Je NU Moet Doen (15 minuten)

### Stap 1: Run SQL Script (2 min)

```bash
1. Open Supabase Dashboard → SQL Editor
2. Open: COMPLETE_MENU_SYSTEM_SETUP.sql
3. Copy/paste ALLES
4. Klik "Run"
```

**✅ Verwacht:** 
```
✅ Storage bucket "menu-images" created
✅ Database tables created
✅ RLS policies created
✅ Helper functions created
🎉 MENU SYSTEM SETUP COMPLETE!
```

---

### Stap 2: Voeg Menu Tab Toe aan Manager Settings (5 min)

**File:** `app/manager/[tenantId]/settings/page.tsx`

**Find** de TabsList sectie en **ADD** deze tab:

```tsx
<TabsTrigger value="menu" className="gap-2">
  <UtensilsCrossed className="h-4 w-4" />
  Menu
</TabsTrigger>
```

**Then find** de TabsContent section en **ADD**:

```tsx
// Import bovenaan file
import { MenuManager } from '@/components/manager/MenuManager';
import { UtensilsCrossed } from 'lucide-react';

// Add TabsContent (bij andere TabsContent secties)
<TabsContent value="menu">
  <MenuManager
    locationId={location.id}
    locationName={location.name}
    tenantLocations={allTenantLocations} // Pass all locations for copy feature
  />
</TabsContent>
```

**✅ Result:** Manager settings heeft nu een "Menu" tab!

---

### Stap 3: Update Public Location Page (5 min)

**File:** `app/p/[slug]/page.tsx`

**ADD** deze code om menu data te fetchen:

```tsx
// Import bovenaan
import { createClient } from '@/lib/supabase/server';

// In de page component, na location fetch:
const supabase = await createClient();

// Fetch menu data
const { data: menuCategories } = await supabase
  .from('menu_categories')
  .select('*')
  .eq('location_id', location.id)
  .eq('is_active', true)
  .order('display_order');

const { data: menuItems } = await supabase
  .from('menu_items')
  .select('*')
  .eq('location_id', location.id)
  .eq('is_available', true)
  .order('display_order');

// Group items by category
const menuData = (menuCategories || []).map(cat => ({
  ...cat,
  items: (menuItems || []).filter(item => item.category_id === cat.id)
}));

// Pass to client
<LocationDetailClient 
  location={location} 
  menuData={menuData}
/>
```

---

### Stap 4: Update LocationDetailClient (3 min)

**File:** `app/p/[slug]/LocationDetailClient.tsx`

**ADD** import:

```tsx
import { PublicMenuDisplay } from '@/components/menu/PublicMenuDisplay';
```

**ADD** menuData to props:

```tsx
interface LocationDetailClientProps {
  location: any;
  menuData?: any[]; // ADD THIS
}

export function LocationDetailClient({ location, menuData = [] }: LocationDetailClientProps) {
```

**FIND** the menu tab content en **REPLACE**:

```tsx
{activeTab === 'menu' && (
  <PublicMenuDisplay 
    menu={menuData}
    locationName={location.name}
  />
)}
```

**✅ Result:** Public location page toont nu professional menu!

---

## 🧪 Test Het Systeem

### Test 1: Manager Interface

```bash
1. Ga naar: http://localhost:3007/manager/[tenantId]/settings
2. Klik tab "Menu"
3. Klik "+ Nieuwe Categorie"
4. Naam: "Voorgerechten", Save
5. Klik "+ Nieuw Item"
6. Naam: "Caesar Salade"
7. Prijs: 8.50
8. Upload foto
9. Save
```

**✅ Verwacht:** Item verschijnt in lijst!

### Test 2: Public Display

```bash
1. Ga naar: http://localhost:3007/p/korenmarkt11
2. Klik tab "Menu"
3. Zie: Professional menu met je item
```

**✅ Verwacht:** Menu zichtbaar met foto en prijs!

### Test 3: Copy Menu (Als meerdere locaties)

```bash
1. In manager → Menu tab
2. Klik "Kopieer Menu"
3. Selecteer doellocatie
4. Klik "Kopiëren"
5. Ga naar andere locatie
6. Check menu → Gekopieerd!
```

**✅ Verwacht:** Menu succesvol gekopieerd!

---

## 📁 Files Overzicht

| File | Status | Action Needed |
|------|--------|---------------|
| `COMPLETE_MENU_SYSTEM_SETUP.sql` | ✅ Ready | Run in Supabase |
| `components/manager/MenuManager.tsx` | ✅ Ready | No changes needed |
| `components/menu/PublicMenuDisplay.tsx` | ✅ Ready | No changes needed |
| `app/manager/[tenantId]/settings/page.tsx` | ⚠️ Needs update | Add Menu tab (Step 2) |
| `app/p/[slug]/page.tsx` | ⚠️ Needs update | Fetch menu data (Step 3) |
| `app/p/[slug]/LocationDetailClient.tsx` | ⚠️ Needs update | Display menu (Step 4) |

---

## ✅ Checklist

### Database
- [ ] SQL script gerund
- [ ] Tables created (check in Supabase)
- [ ] Storage bucket "menu-images" exists
- [ ] Bucket is PUBLIC

### Manager
- [ ] Menu tab zichtbaar in settings
- [ ] Can create category
- [ ] Can create item
- [ ] Can upload image
- [ ] Image shows in preview

### Public
- [ ] Menu tab zichtbaar on location page
- [ ] Categories displayed
- [ ] Items displayed with images
- [ ] Prices shown correctly
- [ ] Professional design (no emoji)

**Als alles ✅:** **KLAAR!** 🎉

---

## 🎨 Design Features

### Manager
- Clean, professional interface
- Card-based layout
- Inline editing
- Image upload with preview
- Categorized items
- Copy menu between locations

### Public
- Featured items section
- Category sections
- Item cards with images
- Dietary badges
- Allergen info
- Spice level indicators
- Responsive design
- Reserve4You branding (no emoji!)

---

## 💡 Tips

1. **Start with 2-3 categories** (Voorgerechten, Hoofdgerechten, Desserts)
2. **Upload professional photos** (square format, 800x800px)
3. **Write enticing descriptions** (sells more!)
4. **Use featured items** for bestsellers
5. **Keep prices up to date**
6. **Mark unavailable items** when out of stock
7. **Copy for chains** use copy function voor consistency

---

## 🐛 Quick Troubleshooting

### Menu Tab Not Showing

**Check:**
```tsx
// Did you add the import?
import { UtensilsCrossed } from 'lucide-react';
import { MenuManager } from '@/components/manager/MenuManager';

// Did you add the TabsTrigger?
<TabsTrigger value="menu">Menu</TabsTrigger>

// Did you add the TabsContent?
<TabsContent value="menu">
  <MenuManager ... />
</TabsContent>
```

### Image Upload Error

**Check:**
```bash
1. Supabase Dashboard → Storage
2. Bucket "menu-images" exists?
3. Bucket is PUBLIC?
4. File < 5MB?
5. File type JPG/PNG/WebP?
```

### Menu Not Showing on Public Page

**Check:**
```bash
1. Did you fetch menuData in page.tsx?
2. Did you pass menuData to LocationDetailClient?
3. Did you add PublicMenuDisplay component?
4. Are items is_available = true?
5. Are categories is_active = true?
```

---

## 🚀 Next Steps (Optional)

After basic setup works:

### Phase 1: Content
1. Add 10-15 menu items
2. Upload photos for all items
3. Add descriptions
4. Set dietary info
5. Mark featured items

### Phase 2: Organization
1. Create all categories
2. Assign items to categories
3. Set display order
4. Mark unavailable items

### Phase 3: Multi-location (If applicable)
1. Setup menu for first location
2. Use copy function for other locations
3. Customize per location if needed

---

## 📊 Database Functions Available

### Get Full Menu
```sql
SELECT * FROM get_location_menu('location-id'::UUID);
```

### Copy Menu
```sql
SELECT * FROM copy_menu_to_location(
  'source-location-id'::UUID,
  'target-location-id'::UUID
);
```

### Get Statistics
```sql
SELECT * FROM get_menu_statistics('location-id'::UUID);
```

---

**Time to complete:** 15 minutes
**Difficulty:** ⭐⭐ (Medium - mostly copy/paste)
**Impact:** 🚀🚀🚀 (High - Essential feature!)

**Ready? Start with Step 1!** 🍽️

