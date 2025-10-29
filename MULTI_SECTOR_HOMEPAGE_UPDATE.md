# MULTI-SECTOR HOMEPAGE & DISCOVER UPDATE

**Date:** October 28, 2025  
**Status:** ✅ **PHASE 1 COMPLETE** - Homepage Updated

---

## ✅ WAT IS GEDAAN

### **1. Business Categories Section** (NEW!)

**File:** `components/home/Business CategoriesSection.tsx`

**9 Business Categorieën toegevoegd:**
1. 🍽️ Horeca (Restaurants, cafés, bars)
2. 💅 Beauty & Wellness (Kapsalons, schoonheid, spa)
3. 🏥 Gezondheidszorg (Artsen, tandartsen, therapeuten)
4. 💪 Fitness & Sport (Sportscholen, yoga, personal training)
5. ⚖️ Professionele Diensten (Advocaten, accountants, consultants)
6. 🎓 Educatie (Bijles, muziek, rijlessen)
7. 🚗 Auto & Voertuigen (Garages, wasstraten, verhuur)
8. 🏠 Thuisdiensten (Schoonmaak, loodgieters, elektriciens)
9. ✨ Entertainment (Hotels, foto, evenementen)

**Features:**
- ✅ Professional styling (geen emoji's in UI)
- ✅ Reserve4You branding (gradients, colors)
- ✅ Responsive grid layout
- ✅ Hover effects & transitions
- ✅ Direct links naar `/discover?category=[id]`

---

### **2. Homepage Terminologie** (UPDATED!)

**File:** `app/page.tsx`

**Voor → Na:**
- ❌ "restaurants" → ✅ "professionele bedrijven"
- ❌ "Restaurants met direct beschikbare tafels" → ✅ "Horeca locaties met direct beschikbare capaciteit"
- ❌ "Populaire restaurants" → ✅ "Populaire locaties"
- ❌ "Heb je een restaurant?" → ✅ "Heb je een bedrijf?"
- ❌ "reserveringen" → ✅ "boekingen"

---

## 🎯 HOMEPAGE STRUCTUUR (NEW)

```
Homepage
├── Video Hero Section
├── Hero Section (met grid distortion)
├── Spotlight Carousel
│
├── MAIN CONTENT:
│   ├── 🔥 Business Categories Section (NEW!)
│   │   └── 9 categorieën in 3-column grid
│   │
│   ├── "Vandaag Beschikbaar" (Horeca only)
│   │   └── 12 featured locations
│   │
│   ├── "Stijgers" (Trending)
│   │   └── 5 locations
│   │
│   └── Onze Keuze Carousel
│
├── CONTINUED:
│   ├── "Best Beoordeeld"
│   ├── "Nieuw op Reserve4You"
│   ├── "Populaire keukens" (optioneel)
│   └── CTA Section (Voor bedrijven)
│
└── Footer
```

---

## 🚀 VISUELE PREVIEW

### Business Categories Section:

```
┌─────────────────────────────────────────────────────────┐
│  Ontdek alle categorieën                     Alles → │
│  Reserveer bij professionele bedrijven in heel België  │
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐               │
│  │ 🍽️      │  │ 💅      │  │ 🏥      │               │
│  │ Horeca  │  │ Beauty  │  │ Health  │               │
│  └─────────┘  └─────────┘  └─────────┘               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐               │
│  │ 💪      │  │ ⚖️      │  │ 🎓      │               │
│  │ Fitness │  │ Professional│ Education│              │
│  └─────────┘  └─────────┘  └─────────┘               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐               │
│  │ 🚗      │  │ 🏠      │  │ ✨      │               │
│  │ Auto    │  │ Home    │  │ Entertainment│          │
│  └─────────┘  └─────────┘  └─────────┘               │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 VOLGENDE STAPPEN (TODO)

### **Phase 2: Discover Page Filters** (NEXT)

**Wat nodig is:**
1. **Business sector filter** toevoegen aan discover page
2. **Category filter** (Horeca, Beauty, Health, etc.)
3. **Backend query update** om te filteren op `business_sector`
4. **"Vandaag Beschikbaar" sectie** filteren op alleen Horeca (RESTAURANT, CAFE, BAR)

**Files om te updaten:**
- `app/discover/page.tsx` - Add sector to searchParams
- `app/discover/DiscoverClient.tsx` - Add sector filter UI
- `lib/auth/tenant-dal.ts` - Update searchLocations() function
- `lib/actions/discover.ts` - Add getAvailableBusinessSectors()

---

### **Phase 3: Filter "Vandaag Beschikbaar"** (IMPORTANT)

**Probleem:**
De "Vandaag Beschikbaar" sectie toont NU alle locaties, inclusief accountants, kappers, etc.

**Oplossing:**
Filter op alleen Horeca sectors:

**SQL Update nodig:**
```typescript
// In searchLocations() function:
const locations = await searchLocations({
  businessSectors: ['RESTAURANT', 'CAFE', 'BAR'], // 🔥 NEW
});
```

---

### **Phase 4: Discover Hero Update**

**Huidige hero:**
```
Ontdek restaurants
```

**Nieuwe hero (dynamisch):**
```
Ontdek [category]
- Horeca → "Ontdek restaurants"
- Beauty → "Ontdek schoonheidssalons"
- Health → "Ontdek zorgverleners"
- etc.
```

---

## 🎨 DESIGN PRINCIPES (APPLIED)

✅ **Professional Styling:**
- Geen emoji's in UI (alleen in comments)
- Reserve4You branding colors
- Gradient accents
- Border-2 style
- Rounded-2xl cards

✅ **Responsive:**
- 1 column (mobile)
- 2 columns (tablet)
- 3 columns (desktop)

✅ **Accessible:**
- Semantic HTML
- Proper heading hierarchy
- Clear hover states
- Keyboard navigation

---

## 🔧 HOE TE TESTEN

### **Stap 1: Restart Dev Server**
```bash
Ctrl+C
npm run dev
```

### **Stap 2: Ga naar Homepage**
```
http://localhost:3007
```

### **Verwacht:**
- ✅ "Business Categories" sectie zichtbaar na Spotlight Carousel
- ✅ 9 categorieën in grid
- ✅ Professional icons & styling
- ✅ "Vandaag Beschikbaar" toont horeca (+ accountants, etc. - FIX IN PHASE 3)
- ✅ Generieke terminologie ("locaties", "bedrijf")

### **Stap 3: Click op Categorie**
```
Click "Beauty & Wellness" → Redirects to:
/discover?category=beauty
```

**Verwacht:**
- URL parameter `?category=beauty` ✅
- Discover page toont alle locations (GEEN filtering yet - FIX IN PHASE 2)

---

## 📊 IMPACT

**Homepage Update:**
- ✅ Multi-sector showcase
- ✅ Better UX voor verschillende business types
- ✅ Professional branding
- ✅ SEO friendly (generic terms)

**User Experience:**
- ✅ Clear category navigation
- ✅ Visual distinction tussen sectoren
- ✅ Direct filtering mogelijk
- ✅ Geen verwarring meer over "restaurants"

---

## 🚨 BEKENDE ISSUES (TE FIXEN)

### **Issue 1: "Vandaag Beschikbaar" toont alles**
**Status:** 🔴 Open  
**Priority:** High  
**Fix:** Filter op `business_sector IN ('RESTAURANT', 'CAFE', 'BAR')`

### **Issue 2: Discover filters missen business_sector**
**Status:** 🔴 Open  
**Priority:** High  
**Fix:** Add sector dropdown/tags to DiscoverClient

### **Issue 3: Category links werken niet volledig**
**Status:** 🟡 Partial  
**Priority:** Medium  
**Fix:** Update searchLocations() om `category` parameter te accepteren

---

## 📁 FILES UPDATED

1. ✅ **`components/home/BusinessCategoriesSection.tsx`** - NEW!
2. ✅ **`app/page.tsx`** - Categories + terminology
3. ✅ **`MULTI_SECTOR_HOMEPAGE_UPDATE.md`** - This file

**Next files to update:**
- `app/discover/page.tsx`
- `app/discover/DiscoverClient.tsx`
- `lib/auth/tenant-dal.ts` (searchLocations function)
- `lib/actions/discover.ts`

---

## 🎯 SUMMARY

**✅ DONE:**
- Homepage heeft nu 9 business categorieën
- Professional styling toegepast
- Generieke terminologie
- Links naar discover met category parameter

**🔄 TODO:**
- Discover page filters voor sectors
- Filter "Vandaag Beschikbaar" op alleen Horeca
- Dynamic hero titles per category
- Backend query updates

---

**STATUS: Homepage multi-sector ready! 🎉**

**Volgende actie:** Update discover page met sector filters!

