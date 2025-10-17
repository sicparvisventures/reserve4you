# PRICING PAGE - R4Y THEMA CLEANUP

## ✅ WAT IS ER VERANDERD:

### **1. EMOJI'S VERWIJDERD:**
- ❌ Geen emoji's meer in badges ("⭐ Meest Gekozen" → "Meest Gekozen")
- ❌ Geen emoji's in teksten ("✅ Geen betaalgegevens" → "Geen betaalgegevens")
- ❌ Geen emoji's in buttons ("📞 Neem Contact Op" → "Neem Contact Op")
- ✅ Clean, professional look

### **2. GEKLEURDE ICONS VERWIJDERD:**
- ❌ Geen gradient icons per tier (Sparkles, Rocket, TrendingUp, etc.)
- ❌ Geen gekleurde boxes per tier (blue, purple, orange, etc.)
- ✅ Consistent R4Y thema overal
- ✅ Alleen header Crown icon behouden (past bij "Kies je abonnement")

### **3. KLEUREN CONSISTENT:**

**Van:**
```tsx
// Elke tier had eigen kleur:
from-gray-500 to-gray-600    // FREE
from-blue-500 to-blue-600    // STARTER
from-purple-500 to-purple-600 // GROWTH
from-orange-500 to-orange-600 // BUSINESS
from-rose-500 to-rose-600    // PREMIUM
from-emerald-500 to-emerald-600 // ENTERPRISE
```

**Naar:**
```tsx
// Alles gebruikt R4Y thema:
border-primary      // Selected state
bg-primary         // Badges
text-primary       // Links
bg-muted/50        // Info box
border-border      // Borders
text-foreground    // Text
```

### **4. INFO BOX AANGEPAST:**

**Van:**
```tsx
<div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20">
  <div className="w-10 h-10 rounded-xl bg-primary/20">
    <Sparkles className="h-5 w-5 text-primary" />
  </div>
  ...
</div>
```

**Naar:**
```tsx
<div className="bg-muted/50 border border-border rounded-xl">
  <strong className="text-foreground">Niet zeker welk plan?</strong>
  <span className="text-muted-foreground">...</span>
</div>
```

### **5. BADGES CLEAN:**

**Van:**
```tsx
"⭐ Meest Gekozen"
"✨ Start Gratis"
```

**Naar:**
```tsx
"Meest Gekozen"
// (Geen "Start Gratis" badge meer)
```

### **6. FOOTER TEKST CLEAN:**

**Van:**
```tsx
{selectedPlan === 'FREE' 
  ? '✅ Geen betaalgegevens vereist • Start meteen'
  : '🔒 Veilig betalen via Stripe • Annuleer op elk moment • Geld terug garantie'}
```

**Naar:**
```tsx
{selectedPlan === 'FREE' 
  ? 'Geen betaalgegevens vereist - Start meteen'
  : 'Veilig betalen via Stripe - Annuleer op elk moment - Geld terug garantie'}
```

---

## 🎨 HUIDIGE R4Y THEMA KLEUREN:

```css
--primary: #FF5A5F           /* R4Y Brand Red */
--border: #E7E7EC            /* Subtle gray */
--muted: #F7F7F9             /* Light background */
--foreground: #111111        /* Text */
--success: #18C964           /* Green checkmarks */
--destructive: #E11D48       /* Error states */
```

---

## 📋 RESULTAAT:

### **Clean & Professional:**
- ✅ Geen afleidende emoji's
- ✅ Consistent kleurgebruik
- ✅ Focus op content, niet op decoratie
- ✅ R4Y branding consequent toegepast

### **Behouden:**
- ✅ 6-tier structuur (FREE → ENTERPRISE)
- ✅ Feature lijsten met checkmarks
- ✅ Limitations met X icons
- ✅ Hover states & animations
- ✅ Selected state met primary border
- ✅ "Meest Gekozen" badge (clean versie)

### **Visual Hierarchy:**
1. **Header:** Crown icon + Title (gradient-bg)
2. **Cards:** Clean borders, hover effects
3. **Selected:** Primary border + checkmark
4. **Popular:** Subtle ring (ring-primary/20)
5. **Info:** Muted background (bg-muted/50)

---

## 🚀 TEST HET:

```
http://localhost:3007/manager/onboarding?step=6
```

Of:

```
http://localhost:3007/manager/f327645c-a658-41f2-853a-215cce39196a/settings?step=6
```

**De pagina is nu:**
- Clean
- Professional
- Consistent met R4Y branding
- Zonder lelijke emoji's
- Focus op features, niet decoratie

---

## 📊 CARD LAYOUT:

```
┌─────────────────────────────────────┐
│ [Plan Name]              [✓]        │ ← Checkmark als selected
│ Description                          │
│                                      │
│ €XX                                  │ ← Clean price
│ per maand                            │
│ ─────────────────────────────────   │
│ ✓ Feature 1                         │ ← Success green
│ ✓ Feature 2                         │
│ ✓ Feature 3                         │
│ ─────────────────────────────────   │
│ ✗ Limitation 1                      │ ← Muted gray
│ ✗ Limitation 2                      │
└─────────────────────────────────────┘
```

**Hover:** border-primary/50 + shadow-lg
**Selected:** border-primary (2px) + shadow-xl + scale-[1.02]
**Popular:** ring-primary/20 (2px)

---

## ✅ CHECKLIST:

```
✓ Emoji's verwijderd uit badges
✓ Emoji's verwijderd uit teksten
✓ Emoji's verwijderd uit buttons
✓ Gekleurde gradient icons verwijderd
✓ Tier icons verwijderd
✓ Info box aangepast naar R4Y thema
✓ Consistent kleurgebruik (primary, muted, border)
✓ Clean & professional look
✓ Focus op content
✓ R4Y branding consistent
✓ No linter errors
```

---

**READY! De pricing page is nu volledig in R4Y thema.** 🎯

