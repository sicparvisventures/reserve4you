# 🚀 Promoties Systeem - Quick Start

## Setup in 3 Stappen (10 minuten)

### Stap 1: Database Setup (5 min)

```bash
# 1. Open Supabase SQL Editor
https://app.supabase.com/project/YOUR_PROJECT/sql

# 2. Copy-paste en Run:
PROMOTIONS_SYSTEM_SETUP.sql
```

**Dit create**:
- ✅ `promotions` table
- ✅ RLS policies
- ✅ Helper functions
- ✅ Triggers
- ✅ Sample Happy Hour promo

### Stap 2: Storage Setup (2 min)

**Optie A**: Create New Bucket
1. Supabase Dashboard → Storage → New Bucket
2. Name: `promotion-images`
3. Public: **YES** ✅
4. Save

**Optie B**: Use Existing
1. Skip bucket creation
2. Edit `PromotionsManager.tsx` line 242:
   ```typescript
   .from('images') // Your existing bucket
   ```

### Stap 3: Test! (3 min)

```bash
# Start app
pnpm dev

# Open browser
http://localhost:3007/manager/[tenantId]/location/[locationId]

# Click "Promoties" tab 🏷️
# Create your first promotion!
```

---

## ✅ Verwacht Resultaat

### In Manager Dashboard
```
Location Management
├─ Plattegrond
├─ Reserveringen
├─ Promoties ← NIEUW! 🏷️
└─ Instellingen
```

### Promoties Tab
- "Nieuwe Promotie" button
- Form met:
  - Title, description
  - Discount type (5 keuzes)
  - Validity dates
  - Days of week selector
  - Hours (optional)
  - Image upload
  - Status toggles

### Op Homepage
- Deals badge op location cards (goud/oranje)
- "Deals" filter button werkt
- Filtering toont alleen locations met promoties

---

## 🎯 Quick Promotion Example

**Maak Happy Hour in 2 minuten**:

1. Click "Nieuwe Promotie"
2. Fill in:
   - Title: `Happy Hour`
   - Description: `50% korting op alle drankjes!`
   - Type: Percentage
   - Value: `50`
   - Days: Ma-Vr
   - Hours: 17:00 - 19:00
   - Is Active: ON
   - Is Featured: ON
3. Click "Aanmaken"
4. Done! 🎉

**Resultaat**:
- ✅ Promotion saved
- ✅ `has_deals` = TRUE op location
- ✅ Deals badge verschijnt op homepage
- ✅ Restaurant filtreerbaar met "Deals"

---

## 📊 5 Discount Types

| Type | When To Use | Value Required |
|------|-------------|----------------|
| **Percentage** | "50% off drinks" | Yes (%) |
| **Fixed Amount** | "€10 off meal" | Yes (€) |
| **Special Offer** | "Free dessert" | No |
| **BOGO** | "Buy 1 Get 1" | No |
| **Happy Hour** | "Happy Hour 17-19" | Optional |

---

## 🧪 Quick Test

### Test 1: Create Promotion
```
1. Go to Promoties tab
2. Click "Nieuwe Promotie"
3. Fill basic fields
4. Click "Aanmaken"
✅ Promotion appears in list
```

### Test 2: Upload Image
```
1. Edit promotion
2. Click file input
3. Select image
✅ Image uploads and previews
```

### Test 3: Deals Badge
```
1. Create active promotion
2. Go to homepage
3. Find your location
✅ Gold/orange Deals badge visible
```

### Test 4: Deals Filter
```
1. Homepage
2. Click "Deals" button
3. Check results
✅ Only locations with promotions shown
```

---

## 🐛 Quick Fixes

### Issue: Can't upload images
```typescript
// Check bucket name in PromotionsManager.tsx
.from('promotion-images') // Match your bucket name
```

### Issue: Deals badge not showing
```sql
-- Force update has_deals
UPDATE locations 
SET has_deals = TRUE 
WHERE id = 'your-location-id';
```

### Issue: RLS error
```sql
-- Check membership
SELECT * FROM memberships WHERE user_id = auth.uid();
```

---

## 📚 Meer Info

Zie **`PROMOTIONS_COMPLETE_GUIDE.md`** voor:
- Complete feature lijst
- Uitgebreide setup
- Troubleshooting guide
- Future enhancements
- API documentation

---

## ✅ Status

**Alle 6 TODO's Compleet**:
1. ✅ Database schema met image support
2. ✅ Routing en page setup
3. ✅ CRUD component
4. ✅ API routes (via Supabase client)
5. ✅ LocationCard updates
6. ✅ Image upload functionality

---

## 🎉 Klaar!

Je hebt nu een **volledig werkend promoties systeem**!

**Test route**:
```
http://localhost:3007/manager/b0402eea-4296-4951-aff6-8f4c2c219818/location/2ca30ee4-140a-4a09-96ae-1455406e0a02
```

Klik op "Promoties" tab en maak je eerste deal! 🚀

