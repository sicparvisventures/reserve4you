# 🎨 Widget Preview - Gebruikers Gids

## ✅ **PROBLEEM OPGELOST!**

Preview knop toont nu een **visuele preview** in plaats van ruwe JSON data.

---

## 🚀 **Hoe te Gebruiken:**

### **Optie 1: Preview in Manager Portal**

1. Ga naar: http://localhost:3007/manager/[TENANT_ID]/settings
2. Klik op **Widget** tab
3. Pas je widget aan (logo, kleuren, etc.)
4. Klik op **Opslaan**
5. Klik op **Preview** knop (rechtsboven)
6. ✨ Nieuwe tab opent met visuele preview!

**Preview URL:**
```
http://localhost:3007/widget/preview/[WIDGET_CODE]
```

Bijvoorbeeld voor Poule & Poulette:
```
http://localhost:3007/widget/preview/widget_poule_&_poulette_b0402eea
```

---

### **Optie 2: Test HTML Pagina**

Voor snelle tests zonder Manager Portal:

1. Open: http://localhost:3007/widget-test.html
2. Of edit `/public/widget-test.html` met je widget code
3. Refresh pagina
4. Widget wordt direct geladen!

**Voordeel:**
- ✅ Sneller testen
- ✅ Geen login nodig
- ✅ Debug console info
- ✅ Easy copy-paste code

---

### **Optie 3: API Endpoint (Voor Developers)**

Als je alleen de data wilt zien:

```
http://localhost:3007/api/widget/[WIDGET_CODE]
```

**Returns:**
```json
{
  "config": { /* widget configuratie */ },
  "locations": [ /* restaurant locaties */ ]
}
```

---

## 🎯 **Voor Poule & Poulette:**

### **Widget Code:**
```
widget_poule_&_poulette_b0402eea
```

### **Preview URL:**
```
http://localhost:3007/widget/preview/widget_poule_&_poulette_b0402eea
```

### **API Endpoint:**
```
http://localhost:3007/api/widget/widget_poule_&_poulette_b0402eea
```

### **Embed Code voor Website:**
```html
<script src="http://localhost:3007/widget-embed.js"></script>
<div data-r4y-widget="widget_poule_&_poulette_b0402eea"></div>
```

---

## 🔍 **Wat Zie Je in de Preview:**

De preview toont:
- ✅ 3 Restaurant kaarten (Mechelen, Gent, Brussel)
- ✅ Foto's van elke locatie
- ✅ "Aanbieding" badges voor deals
- ✅ Promoties (Happy Hour, Chicken Hour)
- ✅ "Reserveren" knoppen
- ✅ Responsive layout
- ✅ Je eigen logo/branding

---

## 🎨 **Wijzigingen Testen:**

1. **Maak wijziging** in Manager Portal → Widget tab
2. Bijvoorbeeld: verander primaire kleur naar `#FF0000`
3. Klik **Opslaan**
4. **Refresh** je preview pagina
5. ✨ Wijziging is direct zichtbaar!

---

## 📱 **Responsive Testen:**

Open preview en:
- **Desktop:** Volledige breedte, 3 kaarten naast elkaar
- **Tablet:** 2 kaarten naast elkaar
- **Mobiel:** 1 kaart onder elkaar

Test met:
- Chrome DevTools (F12 → Device Toolbar)
- Echte mobiele apparaten
- Verschillende browsers

---

## 🐛 **Troubleshooting:**

### **Widget laadt niet in preview:**

1. **Check console:** F12 → Console tab
2. **Check API:** Open `http://localhost:3007/api/widget/YOUR_CODE`
3. **Check script:** `http://localhost:3007/widget-embed.js` moet laden

### **Locaties niet zichtbaar:**

```sql
-- Check if locations are public
SELECT name, is_public, is_active 
FROM locations 
WHERE tenant_id = 'b0402eea-4296-4951-aff6-8f4c2c219818';

-- Make them public if needed
UPDATE locations 
SET is_public = true, is_active = true 
WHERE tenant_id = 'b0402eea-4296-4951-aff6-8f4c2c219818';
```

### **Promoties niet zichtbaar:**

```sql
-- Check promotions
SELECT p.title, p.is_active, l.name as location
FROM promotions p
JOIN locations l ON l.id = p.location_id
WHERE l.tenant_id = 'b0402eea-4296-4951-aff6-8f4c2c219818';

-- Enable promotion display
UPDATE widget_configurations 
SET show_promotions = true 
WHERE widget_code = 'widget_poule_&_poulette_b0402eea';
```

### **Stijl ziet er niet goed uit:**

1. Check custom CSS in widget settings
2. Check primary_color is valid hex (bijv. `#FF5A5F`)
3. Clear browser cache (Ctrl+Shift+R)
4. Try different browser

---

## 🔗 **Nuttige Links:**

**Manager Portal:**
```
http://localhost:3007/manager/b0402eea-4296-4951-aff6-8f4c2c219818/settings
```

**Widget Preview:**
```
http://localhost:3007/widget/preview/widget_poule_&_poulette_b0402eea
```

**Test Pagina:**
```
http://localhost:3007/widget-test.html
```

**API Endpoint:**
```
http://localhost:3007/api/widget/widget_poule_&_poulette_b0402eea
```

---

## 📊 **Data Check:**

Je hebt nu **3 locaties** met data:

### **1. Poule & Poulette Mechelen**
- ✅ Foto's
- ✅ Adres: ijzerenleen 36, Mechelen
- ❌ Geen promoties

### **2. Place Jourdan 70**
- ✅ Foto's
- ✅ Adres: place jourdan 70, Brussel
- ✅ **2 Promoties:** Happy Hour (50% korting)

### **3. Poule & Poulette Gent**
- ✅ Foto's
- ✅ Adres: korenmarkt 11, Gent
- ✅ **1 Promotie:** Chicken Hour (50% korting)

**Totaal:** 3 actieve promoties die in het widget getoond worden!

---

## ✨ **Volgende Stappen:**

1. ✅ **Test Preview** - Check of alles er goed uitziet
2. 🎨 **Customize** - Pas logo, kleuren, layout aan
3. 📱 **Test Responsive** - Check op mobiel/tablet
4. 🌐 **Deploy** - Klaar om op poulepoulette.com te plaatsen!

---

## 🎉 **Klaar voor Gebruik!**

De widget preview werkt nu perfect. Je kunt:
- Visueel je widget bekijken
- Wijzigingen direct zien
- Testen op alle devices
- Delen met klanten

**Veel plezier met je nieuwe widget! 🚀**

