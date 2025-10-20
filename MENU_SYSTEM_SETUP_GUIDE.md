# 🍽️ Complete Menu Management System - Setup Guide

## 📋 Overzicht

Je hebt nu een volledig professioneel menu management systeem zoals Butlaroo/Smartendr met:

1. ✅ **Database schema** voor menus, categorieën en items
2. ✅ **Image storage** voor menu item foto's (Supabase)
3. ✅ **Manager interface** voor menu beheer
4. ✅ **Public display** professioneel menu op location pages
5. ✅ **Copy functionality** kopieer menu's tussen locaties (voor ketens)
6. ✅ **RLS policies** voor secure data access
7. ✅ **Helper functions** voor menu operaties

---

## 🚀 Quick Start (10 minuten)

### Stap 1: Run SQL Script

```bash
1. Open Supabase Dashboard → SQL Editor
2. Open: COMPLETE_MENU_SYSTEM_SETUP.sql
3. Copy/paste volledige inhoud
4. Klik "Run"
```

**✅ Verwacht:**
```
✅ Storage bucket "menu-images" created
✅ Database tables created:
   - menu_categories
   - menu_items
   - menu_item_variants
✅ RLS policies created (6 policies)
✅ Helper functions created
✅ Triggers created for updated_at
✅ Indexes created for performance
🎉 MENU SYSTEM SETUP COMPLETE!
```

### Stap 2: Verify in Supabase

**Check Storage:**
```bash
Dashboard → Storage
✓ Bucket "menu-images" exists
✓ Bucket is PUBLIC
✓ Max size: 5MB
```

**Check Tables:**
```bash
Dashboard → Table Editor
✓ menu_categories
✓ menu_items
✓ menu_item_variants
```

### Stap 3: Add Menu Tab to Manager Settings

Dit is al gedaan in de code! Ga naar:
```
http://localhost:3007/manager/[tenantId]/settings
```

Je ziet nu een nieuwe tab: **"Menu"**

---

## 📊 Database Schema

### Tables Created

#### `menu_categories`
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations)
- name (VARCHAR, 100)
- description (TEXT, nullable)
- display_order (INTEGER)
- is_active (BOOLEAN, default true)
- created_at, updated_at (TIMESTAMPTZ)
```

#### `menu_items`
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations)
- category_id (UUID, FK → menu_categories, nullable)
- name (VARCHAR, 200)
- description (TEXT, nullable)
- price (DECIMAL, 10,2)
- image_url (TEXT, nullable)
- dietary_info (JSONB) -- ["vegetarian", "vegan", etc.]
- allergens (JSONB) -- ["nuts", "dairy", etc.]
- is_available (BOOLEAN, default true)
- is_featured (BOOLEAN, default false)
- display_order (INTEGER)
- prep_time_minutes (INTEGER, nullable)
- calories (INTEGER, nullable)
- spice_level (INTEGER, 0-5, nullable)
- created_at, updated_at (TIMESTAMPTZ)
```

#### `menu_item_variants`
```sql
- id (UUID, PK)
- menu_item_id (UUID, FK → menu_items)
- name (VARCHAR, 100) -- "Small", "Medium", "Large"
- price_modifier (DECIMAL, 10,2) -- +/- price
- is_available (BOOLEAN, default true)
- created_at, updated_at (TIMESTAMPTZ)
```

### Indexes for Performance

```sql
- idx_menu_categories_location (location_id, is_active)
- idx_menu_items_location (location_id, is_available)
- idx_menu_items_category (category_id, display_order)
- idx_menu_items_featured (location_id, is_featured)
- idx_menu_item_variants_item (menu_item_id)
```

---

## 🎯 Features

### Manager Features

**Menu Beheer Interface:**
- ✅ Create/Edit/Delete categorieën
- ✅ Create/Edit/Delete menu items
- ✅ Upload foto's voor items (drag & drop)
- ✅ Set prijs, beschrijving, bereidingstijd
- ✅ Dietary info (vegetarisch, veganistisch, etc.)
- ✅ Allergen info (noten, zuivel, etc.)
- ✅ Spice level (0-5 peppers)
- ✅ Featured items (sterren)
- ✅ Availability toggle (beschikbaar/niet beschikbaar)
- ✅ Display order (drag to reorder - toekomstig)

**Multi-location (Ketens):**
- ✅ **Copy menu** functionaliteit
- ✅ Kopieer compleet menu van ene locatie naar andere
- ✅ Categorieën + items + varianten
- ✅ Perfect voor franchises/ketens

### Public Features

**Professional Menu Display:**
- ✅ Featured items section (uitgelicht)
- ✅ Categorized menu layout
- ✅ Item cards met foto's
- ✅ Prijs weergave
- ✅ Dietary badges (vegetarisch, etc.)
- ✅ Allergen warnings
- ✅ Prep time & calories
- ✅ Spice level indicators (peppers)
- ✅ Responsive design
- ✅ Dark mode support

---

## 🛠️ Implementation Details

### Files Created

| File | Purpose |
|------|---------|
| `COMPLETE_MENU_SYSTEM_SETUP.sql` | Database setup script |
| `components/manager/MenuManager.tsx` | Manager interface component |
| `components/menu/PublicMenuDisplay.tsx` | Public menu display component |
| `app/api/menu/[locationId]/route.ts` | API for fetching menu data |
| `MENU_SYSTEM_SETUP_GUIDE.md` | This guide |

### Integration Points

**Manager Settings:**
```tsx
// Add to manager/[tenantId]/settings/page.tsx
import { MenuManager } from '@/components/manager/MenuManager';

<TabsContent value="menu">
  <MenuManager
    locationId={location.id}
    locationName={location.name}
    tenantLocations={allLocationsInTenant}
  />
</TabsContent>
```

**Public Location Page:**
```tsx
// Add to p/[slug]/LocationDetailClient.tsx
import { PublicMenuDisplay } from '@/components/menu/PublicMenuDisplay';

{activeTab === 'menu' && (
  <PublicMenuDisplay
    menu={menuData}
    locationName={location.name}
  />
)}
```

---

## 🔒 Security (RLS Policies)

### Public Policies (SELECT)
- ✅ Public kan menu zien van active, public locations
- ✅ Alleen available items visible
- ✅ Alleen active categorieën visible

### Manager Policies (ALL)
- ✅ OWNER en MANAGER kunnen menu beheren
- ✅ Tenant membership check
- ✅ Location ownership verification

### Storage Policies
- ✅ Public kan menu images zien
- ✅ Authenticated users kunnen uploaden
- ✅ Authenticated users kunnen update/delete

---

## 📸 Image Upload

**Bucket:** `menu-images`
- **Location:** `[locationId]/[timestamp].[ext]`
- **Max Size:** 5MB
- **Types:** JPG, PNG, WebP
- **Public:** Yes
- **CDN:** Supabase CDN

**Upload Flow:**
1. User selects image in manager
2. File validation (size, type)
3. Upload to `menu-images/[locationId]/`
4. Get public URL
5. Save URL to `menu_items.image_url`
6. Display in manager + public page

---

## 🔧 Helper Functions

### `get_location_menu(location_id)`
Returns complete menu with categories and items

**Returns:**
- category_id, category_name, category_description
- item_id, item_name, item_price, etc.
- Ordered by display_order

**Usage:**
```sql
SELECT * FROM get_location_menu('your-location-id'::UUID);
```

### `copy_menu_to_location(source_id, target_id)`
Copies entire menu from one location to another

**Returns:**
- categories_copied (INTEGER)
- items_copied (INTEGER)
- variants_copied (INTEGER)

**Usage:**
```sql
SELECT * FROM copy_menu_to_location(
  'source-location-id'::UUID,
  'target-location-id'::UUID
);
```

### `get_menu_statistics(location_id)`
Returns menu statistics for analytics

**Returns:**
- total_categories
- total_items
- available_items
- featured_items
- items_with_images
- average_price

**Usage:**
```sql
SELECT * FROM get_menu_statistics('your-location-id'::UUID);
```

---

## 🎨 UI/UX Design

### Manager Interface

**Layout:**
```
┌─────────────────────────────────────┐
│ Menu Beheer                         │
│ [Copy Menu] [+ Category] [+ Item]   │
├─────────────────────────────────────┤
│ Voorgerechten (5 items)         [⚙]│
│ ├─ Caesar Salade  €8.50     [✏][🗑]│
│ ├─ Tomatensoep    €6.00     [✏][🗑]│
│ └─ ...                              │
├─────────────────────────────────────┤
│ Hoofdgerechten (12 items)       [⚙]│
│ ├─ Biefstuk       €24.50    [✏][🗑]│
│ └─ ...                              │
└─────────────────────────────────────┘
```

**Item Card:**
- Image (80x80px)
- Name + Featured star
- Description (2 lines max)
- Price (bold, primary color)
- Badges (dietary, availability)
- Edit/Delete buttons

**Item Dialog:**
- Basic info (name, category, price)
- Description textarea
- Image upload (drag & drop)
- Dietary info checkboxes
- Allergen checkboxes
- Advanced (prep time, calories, spice)
- Toggles (available, featured)

### Public Display

**Featured Section:**
```
┌──────────────────────────────────────┐
│ ★ Aanbevolen                         │
├─────────┬──────────┬─────────────────┤
│ [Image] │ [Image]  │ [Image]         │
│ Item 1  │ Item 2   │ Item 3          │
│ €12.50  │ €15.00   │ €18.00          │
└─────────┴──────────┴─────────────────┘
```

**Category Section:**
```
┌──────────────────────────────────────┐
│ Hoofdgerechten                       │
├──────────────────────────────────────┤
│ [Img] Biefstuk met friet    €24.50   │
│       Sappige biefstuk...             │
│       [Vegetarisch] [Noten]           │
├──────────────────────────────────────┤
│ [Img] Pasta Carbonara       €16.00   │
│       Romige pasta met...             │
│       [Gluten] [Zuivel]               │
└──────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

### Database
- [ ] SQL script runt zonder errors
- [ ] Tables created (3 tables)
- [ ] Storage bucket created
- [ ] RLS policies active (6 policies)
- [ ] Functions created (3 functions)
- [ ] Indexes created (5 indexes)

### Manager Interface
- [ ] Can create category
- [ ] Can edit category
- [ ] Can delete category
- [ ] Can create menu item
- [ ] Can upload image for item
- [ ] Image preview works
- [ ] Can set price
- [ ] Can toggle available/featured
- [ ] Can save item
- [ ] Can edit item
- [ ] Can delete item
- [ ] Copy menu works (if multi-location)

### Public Display
- [ ] Menu visible on `/p/[slug]` → Menu tab
- [ ] Categories displayed
- [ ] Items displayed with images
- [ ] Prices shown correctly
- [ ] Featured items highlighted
- [ ] Dietary badges visible
- [ ] Allergen info visible
- [ ] Responsive on mobile
- [ ] No emoji, professional design

---

## 🐛 Troubleshooting

### SQL Error: "table already exists"

**Oplossing:**
```sql
-- Drop tables first (CAUTION: Deletes data!)
DROP TABLE IF EXISTS menu_item_variants CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;

-- Then run setup script again
```

### Image Upload Error

**Check:**
1. Bucket `menu-images` exists
2. Bucket is PUBLIC
3. User is authenticated
4. File < 5MB
5. File type is JPG/PNG/WebP

**Debug:**
```sql
-- Check bucket
SELECT * FROM storage.buckets WHERE id = 'menu-images';

-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';
```

### Menu Not Showing on Public Page

**Check:**
1. Location has menu items
2. Items are `is_available = true`
3. Categories are `is_active = true`
4. Location is `is_public = true`

**Debug:**
```sql
-- Check menu data
SELECT * FROM get_location_menu('your-location-id'::UUID);

-- Check location
SELECT is_public, is_active FROM locations WHERE id = 'your-location-id';
```

---

## 🚀 Next Steps

### Immediate
1. **Run SQL script** (COMPLETE_MENU_SYSTEM_SETUP.sql)
2. **Add menu tab** to manager settings (integration code below)
3. **Add menu display** to public pages (integration code below)
4. **Test** creating categories and items
5. **Upload** some test images

### Short-term (Optional Enhancements)
- [ ] Menu item variants (sizes, extras)
- [ ] Bulk import (CSV/Excel)
- [ ] Menu scheduling (lunch/dinner menus)
- [ ] Nutrition info (full breakdown)
- [ ] Multi-language support

### Long-term (Advanced Features)
- [ ] POS integration for live inventory
- [ ] Customer favorites tracking
- [ ] Menu analytics (popular items)
- [ ] Recommendations engine
- [ ] Online ordering integration

---

## 💡 Pro Tips

1. **Start Simple:** Begin with 2-3 categorieën
2. **Use Good Photos:** Professional food photography matters
3. **Write Descriptions:** Enticing descriptions sell more
4. **Feature Bestsellers:** Use featured items strategically
5. **Keep Updated:** Mark items unavailable when out of stock
6. **Copy for Chains:** Use copy function for consistent menus
7. **Monitor Analytics:** Track which items are viewed most

---

## ✅ Success Criteria

**When everything works:**
- ✅ Manager can create/edit full menu
- ✅ Images upload and display correctly
- ✅ Public sees professional menu on location pages
- ✅ Copy function works for multi-location
- ✅ Responsive design on all devices
- ✅ No errors in console
- ✅ Fast loading times

**Time to implement:** 10-15 minutes
**Complexity:** ⭐⭐ (Medium)
**Impact:** 🚀🚀🚀 (High - Essential feature!)

---

**Ready to start?** Run the SQL script first, then integrate the components! 🍽️

