# 🚀 Quick Fix: Promoties Upload & Styling

## ⚡ Probleem
1. ❌ Image upload error: `Bucket not found`
2. ❌ Lelijke blauwe/oranje kleuren die niet passen bij de app

## ✅ Oplossing

### Stap 1: Run SQL Script (2 minuten)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Open het bestand: `CREATE_PROMOTION_STORAGE_BUCKET.sql`
3. Copy/paste de volledige inhoud
4. Klik op **"Run"**

**Verwacht:** Je ziet groen vinkje met "Storage bucket created successfully!"

### Stap 2: Klaar! Test Het

1. Ga naar promoties manager:
   ```
   http://localhost:3007/manager/.../location/.../
   → Tab "Promoties"
   ```

2. Upload een afbeelding (JPG/PNG, max 5MB)

3. Bekijk het resultaat op:
   ```
   http://localhost:3007/p/korenmarkt11
   ```

---

## 🎨 Wat Is Er Veranderd

### Styling Updates (Automatisch, geen actie nodig)

| Element | Voor | Na |
|---------|------|-----|
| Korting badge | Blauwe gradient "50% KORTING" | Groene badge "50% korting" |
| Deals badge | Oranje "Deals" + icon | Groene "Aanbieding" |
| Featured badge | Oranje gradient + Sparkles | Primary color "Uitgelicht" |
| Fallback image | Felle kleuren | Subtiele achtergrond |
| Icon bij titel | Sparkles (goud) | Tag (primary) |

**Resultaat:** Professioneel, consistent, geen lelijke kleuren! ✅

---

## 📝 Files Aangepast

- ✅ `CREATE_PROMOTION_STORAGE_BUCKET.sql` - Nieuwe file
- ✅ `components/promotions/PromotionsDisplay.tsx` - Styling gefixed
- ✅ `components/location/LocationCard.tsx` - Badge gefixed

---

## 🧪 Quick Test

1. **Upload test:**
   - [ ] Upload afbeelding → Werkt zonder errors

2. **Styling test:**
   - [ ] Groene korting badges op `/p/korenmarkt11`
   - [ ] "Aanbieding" badge op homepage cards
   - [ ] Geen felle blauwe/oranje kleuren meer

**Als beide ✅ zijn: KLAAR!** 🎉

---

## 🆘 Probleem?

### Upload werkt nog niet
```bash
# Check of bucket bestaat in Supabase Dashboard → Storage
# Bucket naam: "promotion-images"
# Public: Moet AAN staan
```

### Kleuren nog verkeerd
```bash
# Hard refresh browser:
# Mac: Cmd + Shift + R
# Windows: Ctrl + Shift + R
```

---

**Tijd:** 2-5 minuten total
**Complexiteit:** ⭐ (Makkelijk - alleen SQL runnen)

