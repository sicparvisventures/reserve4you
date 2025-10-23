# 🔘 FLOATING BUTTON WIDGET - QUICK GUIDE

## ✅ **WAT IS GEMAAKT:**

### **1. Geen Emoji's Meer**
- ✅ Alle emoji's verwijderd uit widget kaarten
- ✅ Clean, professionele uitstraling
- ✅ Alleen tekst en iconen

### **2. Floating Button Widget**
- ✅ `widget-button.js` - Nieuw embed script
- ✅ Klein knopje rechtsonder op website (60x60px)
- ✅ Opent modal met alle locaties
- ✅ Volledig responsive

### **3. SQL Update**
- ✅ `WIDGET_ADD_BUTTON_LOGO.sql` - Voegt `button_logo_url` veld toe

---

## 🚀 **HOE TE GEBRUIKEN:**

### **Optie 1: Standaard Widget (Volledig Grid)**

Gebruik dit voor een dedicated pagina (zoals `/locaties`):

```html
<!-- Toont direct alle locaties in grid -->
<script src="http://localhost:3007/widget-embed.js"></script>
<div data-r4y-widget="widget_poule_&_poulette_b0402eea"></div>
```

**Voorbeeld:** www.poulepoulette.com/locaties

---

### **Optie 2: Floating Button (Voor Elke Pagina)**

Gebruik dit voor een knopje op elke pagina van je website:

```html
<!-- Knopje rechtsonder, klikt om modal te openen -->
<script src="http://localhost:3007/widget-button.js"></script>
<div data-r4y-widget-button="widget_poule_&_poulette_b0402eea"></div>
```

**Voorbeeld:** Op elke pagina van www.poulepoulette.com

---

## 📋 **SETUP INSTRUCTIES:**

### **Stap 1: Run SQL (Eenmalig)**

```sql
-- In Supabase SQL Editor
-- Run: WIDGET_ADD_BUTTON_LOGO.sql

ALTER TABLE widget_configurations
ADD COLUMN IF NOT EXISTS button_logo_url TEXT;
```

### **Stap 2: Refresh Browser**

```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### **Stap 3: Test Standaard Widget**

```
http://localhost:3007/widget/preview/widget_poule_&_poulette_b0402eea
```

Verwacht: **Geen emoji's meer!**
- ✅ Mechelen, Brussel, Gent zonder emoji's
- ✅ Clean "Aanbieding" badges
- ✅ Simpele "Reserveren" knoppen

### **Stap 4: Test Floating Button**

Maak test HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Button Test</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      background: #f9fafb;
    }
    h1 {
      color: #1f2937;
    }
  </style>
</head>
<body>
  <h1>Poule & Poulette Website</h1>
  <p>Welkom op onze website! Klik rechtsonder om een locatie te kiezen.</p>
  
  <!-- Floating Button Widget -->
  <script src="http://localhost:3007/widget-button.js"></script>
  <div data-r4y-widget-button="widget_poule_&_poulette_b0402eea"></div>
  
</body>
</html>
```

Save als `/Users/dietmar/Desktop/button-test.html` en open in browser.

**Verwacht:**
- ✅ Rond knopje rechtsonder (60x60px)
- ✅ Groene achtergrond (#263e0f - Poule & Poulette kleur)
- ✅ "+" symbool (of logo als geüpload)
- ✅ Hover effect: groter
- ✅ Klik: modal opent met alle locaties
- ✅ Modal: clean header, grid met locaties
- ✅ "X" knop om te sluiten

---

## 🎨 **FLOATING BUTTON FEATURES:**

### **Positie:**
- Fixed rechtsonder
- 24px from bottom, 24px from right
- Blijft altijd zichtbaar bij scrollen

### **Styling:**
- Rond (border-radius: 50%)
- 60x60 pixels
- Schaduw voor diepte
- Hover: groter (scale 1.1)
- Smooth transitions

### **Modal:**
- Centered overlay
- Max-width: 1200px
- Responsive grid (auto-fill, min 280px)
- Scroll als veel locaties
- Click overlay om te sluiten
- ESC key (future)

### **Locatie Kaarten in Modal:**
- Compacter dan standaard (160px image)
- Alle features: foto, badges, promoties
- Direct reserveer knop
- Opens in new tab

---

## 🔧 **BUTTON LOGO UPLOAD (Future):**

In Manager Portal → Settings → Widget:

1. Nieuw veld: "Button Logo"
2. Upload klein logo (recommended: 36x36px, square)
3. Formats: PNG, SVG (met transparantie)
4. Voorbeeld: Poule & Poulette kip logo

### **Update Widget Manager:**

Voeg toe aan handleSave():
```typescript
button_logo_url: config.button_logo_url,
```

Voeg toe aan Design tab:
```tsx
<div className="space-y-2">
  <Label>Knop Logo (voor floating button)</Label>
  <div className="flex items-center gap-4">
    {config.button_logo_url && (
      <img src={config.button_logo_url} alt="Button Logo" className="h-9 w-9" />
    )}
    <Button variant="outline" onClick={() => buttonFileInputRef.current?.click()}>
      <Upload className="mr-2 h-4 w-4" />
      Upload Button Logo
    </Button>
  </div>
  <p className="text-xs text-muted-foreground">
    Aanbevolen: 36x36px, transparante achtergrond
  </p>
</div>
```

---

## 📊 **VOOR POULE & POULETTE:**

### **Standaard Widget:**

```html
<!-- Op /locaties pagina -->
<script src="https://reserve4you.vercel.app/widget-embed.js"></script>
<div data-r4y-widget="widget_poule_&_poulette_b0402eea"></div>
```

### **Floating Button:**

```html
<!-- In footer van elke pagina, of in header -->
<script src="https://reserve4you.vercel.app/widget-button.js"></script>
<div data-r4y-widget-button="widget_poule_&_poulette_b0402eea"></div>
```

### **Locaties Getoond:**
1. ✅ Poule & Poulette Mechelen (ijzerenleen 36)
2. ✅ Place Jourdan 70, Brussel (2x Happy Hour promotie)
3. ✅ Poule & Poulette Gent (korenmarkt 11, Chicken Hour promotie)

---

## ✨ **VOORDELEN FLOATING BUTTON:**

1. **Altijd Zichtbaar**
   - Op elke pagina
   - Geen dedicated pagina nodig
   - Gebruikers kunnen altijd reserveren

2. **Niet Opdringerig**
   - Klein, subtiel knopje
   - Gebruikt geen ruimte op pagina
   - Pas zichtbaar bij klik

3. **Better UX**
   - Modal overlay = focus
   - Makkelijk te sluiten
   - Responsive

4. **Professioneel**
   - Zoals chat widgets
   - Modern design
   - Smooth animaties

---

## 🐛 **TROUBLESHOOTING:**

### **Knop Laadt Niet:**

```javascript
// Check console
[R4Y Button] Script loaded successfully
[R4Y Button] Found 1 button(s)
[R4Y Button] Initializing: widget_poule_&_poulette_b0402eea
[R4Y Button] Rendered successfully
```

### **Modal Opent Niet:**

- Check if `fetch()` succeeds
- Check API URL in console
- Verify widget_code is correct

### **Styling Issues:**

```javascript
// Button should be:
position: fixed
bottom: 24px
right: 24px
z-index: 999998

// Modal overlay should be:
z-index: 999999
```

---

## 📝 **NEXT STEPS:**

### **Voor Launch:**

1. ✅ Test beide widgets (standaard + button)
2. ✅ Verify geen emoji's
3. ⏳ Upload button logo (optioneel)
4. ⏳ Deploy to production
5. ⏳ Update embed codes to production URLs
6. ⏳ Test op poulepoulette.com staging

### **Documentation voor Klant:**

Update `WIDGET_CLIENT_INSTRUCTIONS.md` met:
- Floating button optie
- Keuze tussen full widget vs button
- Voorbeelden van beide
- Button logo upload guide

---

## 🎉 **READY TO USE!**

**Twee Widget Opties:**
1. ✅ Standaard Widget (full grid op pagina)
2. ✅ Floating Button (modal popup overal)

**No Emoji:**
- ✅ Professional look
- ✅ Clean design
- ✅ Reserve4You branding

**Next:** Test beide en kies wat best werkt voor www.poulepoulette.com!

