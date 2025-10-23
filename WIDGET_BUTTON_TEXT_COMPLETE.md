# ✅ FLOATING BUTTON TEXT FEATURE - COMPLEET

## 🎯 **NIEUWE FEATURE:**

Tekst label bij floating button (bijv. "Reserveren", "Boek nu", etc.)

---

## 🆕 **WAT IS TOEGEVOEGD:**

### **1. Database Columns:**
- `button_text` - De tekst die wordt getoond (NULL = geen tekst)
- `button_text_position` - Positie: 'top' (boven) of 'bottom' (onder)

### **2. Widget Manager UI:**
- Input veld voor button tekst
- Keuze tussen "Boven" of "Onder" positie
- Live preview in widget preview pagina

### **3. Floating Button Display:**
- Tekst wordt getoond in een pill-vormig label
- Responsive hover effecten
- Klikbaar (opent ook de modal)
- Automatisch styling op basis van primary color

---

## 🚀 **SETUP INSTRUCTIES:**

### **Stap 1: Run SQL Script**

```sql
-- Open Supabase SQL Editor
-- Run: WIDGET_ADD_BUTTON_TEXT.sql
```

Dit voegt toe:
- ✅ `button_text` column (TEXT, nullable)
- ✅ `button_text_position` column (TEXT, default 'bottom')
- ✅ CHECK constraint (alleen 'top' of 'bottom')
- ✅ Comments voor documentatie

### **Stap 2: Hard Refresh**

```bash
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### **Stap 3: Configureer in Widget Manager**

```
1. Go to: http://localhost:3007/manager/[TENANT_ID]/settings
2. Tab: Widget
3. Section: "Floating Button (voor externe website)"
4. Vul in:
   - Button Tekst: "Reserveren" (of andere tekst)
   - Tekst Positie: "Boven" of "Onder"
5. Klik "Opslaan"
```

### **Stap 4: Test Preview**

```
1. Go to: http://localhost:3007/widget/preview/[WIDGET_CODE]
2. Toggle: "Floating Button Widget"
3. Zie button rechtsonder met tekst label! ✅
```

---

## 🎨 **VISUEEL RESULTAAT:**

### **Met Tekst Onder (bottom):**
```
┌──────────────┐
│   Button     │  ← Ronde button (60px)
│   (Logo)     │
└──────────────┘
  Reserveren      ← Tekst label (pill vorm)
```

### **Met Tekst Boven (top):**
```
  Reserveren      ← Tekst label (pill vorm)
┌──────────────┐
│   Button     │  ← Ronde button (60px)
│   (Logo)     │
└──────────────┘
```

### **Zonder Tekst:**
```
┌──────────────┐
│   Button     │  ← Alleen button
│   (Logo/+)   │
└──────────────┘
```

---

## 📊 **STYLING DETAILS:**

### **Button (unchanged):**
- Diameter: 60px
- Position: Fixed, bottom right
- Shadow: Elevated
- Hover: Scale 1.1

### **Text Label (NEW):**
- Background: White
- Color: Primary color (matches brand)
- Padding: 6px 12px
- Border-radius: 20px (pill shape)
- Font: 13px, weight 600
- Shadow: Soft elevation
- Hover: Scale 1.05
- Cursor: Pointer (ook klikbaar!)

### **Wrapper:**
- Display: Flex (column)
- Direction: Reversed for 'bottom'
- Gap: 8px (tussen button en tekst)
- Align: Center

---

## 💡 **GEBRUIK VOORBEELDEN:**

### **Voorbeeld 1: Restaurant**
```
Button Text: "Reserveren"
Position: bottom
→ Duidelijke call-to-action onder button
```

### **Voorbeeld 2: Café**
```
Button Text: "Boek nu"
Position: top
→ Tekst trekt aandacht boven button
```

### **Voorbeeld 3: Multi-location**
```
Button Text: "Onze locaties"
Position: bottom
→ Geeft context wat button doet
```

### **Voorbeeld 4: Engels**
```
Button Text: "Book now"
Position: bottom
→ Voor internationale websites
```

### **Voorbeeld 5: Geen tekst**
```
Button Text: [leeg]
→ Minimalistisch, alleen button icon
```

---

## 🧪 **TEST SCENARIOS:**

### **Test 1: Tekst Onder**
```
1. Set button_text = "Reserveren"
2. Set button_text_position = "bottom"
3. Save & Preview
4. ✅ Tekst verschijnt onder button
5. ✅ Tekst is klikbaar
6. ✅ Hover effect werkt
```

### **Test 2: Tekst Boven**
```
1. Set button_text = "Boek nu"
2. Set button_text_position = "top"
3. Save & Preview
4. ✅ Tekst verschijnt boven button
5. ✅ Styling consistent
```

### **Test 3: Geen Tekst**
```
1. Set button_text = "" (leeg)
2. Save & Preview
3. ✅ Alleen button zichtbaar
4. ✅ Geen tekst label
5. ✅ Geen lege ruimte
```

### **Test 4: Lange Tekst**
```
1. Set button_text = "Reserveer je tafel nu"
2. Save & Preview
3. ✅ Tekst blijft op één regel
4. ✅ Label past zich aan
5. ✅ Geen overflow
```

### **Test 5: Special Characters**
```
1. Set button_text = "Réserver"
2. Save & Preview
3. ✅ Accenten werken correct
```

---

## 📱 **RESPONSIVE BEHAVIOR:**

### **Desktop:**
- Button: 60px × 60px
- Text: Auto width, max-content
- Gap: 8px
- Position: Fixed bottom right

### **Mobile:**
- Button: Blijft 60px × 60px
- Text: white-space: nowrap (geen wrap)
- Gap: 8px (consistent)
- Position: Fixed (blijft zichtbaar bij scroll)

### **Tablet:**
- Zelfde als desktop
- Text volledig zichtbaar

---

## 🎯 **BEST PRACTICES:**

### **DO:**
- ✅ Korte, duidelijke tekst (1-3 woorden)
- ✅ Actie-gerichte woorden ("Reserveren", "Boek nu")
- ✅ Consistente taal met rest van website
- ✅ Test beide posities (top/bottom)
- ✅ Gebruik primary color voor branding

### **DON'T:**
- ❌ Lange zinnen (blijven op 1 regel)
- ❌ Speciale symbolen (emoji's, unicode)
- ❌ ALL CAPS (schreeuwerig)
- ❌ Te veel woorden (> 3 woorden)

---

## 🔧 **TECHNISCHE DETAILS:**

### **SQL Columns:**
```sql
-- button_text
Type: TEXT
Nullable: YES
Default: NULL

-- button_text_position
Type: TEXT
Nullable: NO
Default: 'bottom'
Check: IN ('top', 'bottom')
```

### **JavaScript Implementation:**
```javascript
// Wrapper met flex direction based on position
wrapper.style.flexDirection = 
  (config.button_text_position === 'top' ? 'column' : 'column-reverse');

// Text label styling
textLabel.style.cssText = 
  'background: white; 
   color: ' + config.primary_color + '; 
   padding: 6px 12px; 
   border-radius: 20px; 
   ...';
```

### **Database Update:**
```typescript
// In handleSave
button_text: config.button_text,
button_text_position: config.button_text_position,
```

---

## 📊 **ANALYTICS TRACKING:**

De tekst label kan gebruikt worden voor tracking:

```javascript
// Track welke tekst users zien
trackEvent(widgetCode, 'button_view', {
  button_text: config.button_text,
  button_text_position: config.button_text_position
});

// Track clicks op tekst vs button
textLabel.onclick = function() {
  trackEvent(widgetCode, 'text_click');
  showModal(...);
};
```

---

## 🐛 **TROUBLESHOOTING:**

### **Tekst verschijnt niet?**
→ Check: button_text is ingevuld (niet NULL)
→ Check: SQL script gerund
→ Check: Browser cache cleared

### **Tekst op verkeerde positie?**
→ Check: button_text_position waarde ('top' of 'bottom')
→ Check: Flex direction in wrapper element

### **Tekst te lang / overflowt?**
→ Use: white-space: nowrap
→ Shorten: Tekst tot max 20 karakters

### **Styling niet consistent?**
→ Check: primary_color is correct ingesteld
→ Check: Config wordt correct opgehaald uit API

### **Hover werkt niet?**
→ Check: Event listeners correct toegevoegd
→ Check: Cursor: pointer op textLabel

---

## 📝 **FILES GEWIJZIGD:**

1. ✅ `WIDGET_ADD_BUTTON_TEXT.sql` - SQL setup script
2. ✅ `components/manager/WidgetManager.tsx` - UI toegevoegd
3. ✅ `public/widget-button.js` - Text label rendering
4. ✅ `WIDGET_BUTTON_TEXT_COMPLETE.md` - Deze guide

---

## ✨ **FEATURES OVERVIEW:**

### **Voor Managers:**
- Eenvoudige input in Widget Manager
- Keuze uit 2 posities (boven/onder)
- Real-time preview
- Volledig optioneel (kan leeg blijven)

### **Voor Bezoekers:**
- Duidelijke call-to-action
- Professionele styling
- Clickable label
- Responsive hover effects
- Geen impact op performance

### **Voor Developers:**
- Clean SQL schema
- Type-safe TypeScript
- Vanilla JS implementation
- No dependencies
- Fully customizable

---

## 🎉 **READY TO USE!**

Je floating button heeft nu een professionele tekst label feature!

**Test het:**
1. ✅ Run SQL script
2. ✅ Refresh browser
3. ✅ Configure in Widget Manager
4. ✅ Preview & Deploy

**Common configurations:**
- "Reserveren" + bottom → Most popular
- "Boek nu" + bottom → Action-focused
- "Onze locaties" + top → Informative
- [empty] + n/a → Minimalist

**Je widget is compleet! 🚀**

