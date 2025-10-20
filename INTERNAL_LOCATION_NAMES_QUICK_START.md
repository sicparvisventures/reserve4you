# 🏢 Interne & Publieke Locatienamen - Quick Start

## 📋 Overzicht

Je locaties hebben nu **twee namen**:
1. **Publieke Naam** - Zichtbaar voor klanten op de website
2. **Interne Naam** - Alleen zichtbaar in het dashboard (optioneel)

---

## 🚀 Setup Stappen

### 1️⃣ **Run SQL Script in Supabase**

```bash
# Open Supabase Dashboard → SQL Editor → Voer uit:
```

📄 **File:** `ADD_INTERNAL_LOCATION_NAMES.sql`

**Dit script:**
- ✅ Voegt `internal_name` kolom toe
- ✅ Kopieert huidige naam als interne naam
- ✅ Creëert helper functies
- ✅ Maakt views voor public/internal data

### 2️⃣ **Test de Functionaliteit**

**In het Dashboard:**
1. Ga naar `http://localhost:3007/manager/[tenantId]/location/[locationId]`
2. Klik op **"Instellingen"** tab
3. Je ziet nu de nieuwe **"Locatie Informatie"** sectie

**Velden:**
- **Publieke Naam** (verplicht) - Voor klanten
- **Interne Naam** (optioneel) - Voor intern gebruik

---

## 💡 Gebruik Cases

### Voorbeeld 1: Ketens met Codes
```
Publieke Naam:  "De Smaakmaker Amsterdam Centrum"
Interne Naam:   "DS-AMS-01"
```

### Voorbeeld 2: Meerdere Vestigingen
```
Publieke Naam:  "Bistro Bellevue"
Interne Naam:   "Bellevue Rotterdam"
```

### Voorbeeld 3: Test/Staging
```
Publieke Naam:  "Restaurant Paradise"
Interne Naam:   "Paradise STAGING"
```

---

## 🎯 Waar Wordt Welke Naam Getoond?

### **Publieke Naam** (klanten zien dit):
- ✅ Homepage (`localhost:3007`)
- ✅ Discover page (`/discover`)
- ✅ Location detail page (`/p/slug`)
- ✅ Booking confirmaties
- ✅ Notifications voor klanten
- ✅ Reviews en ratings

### **Interne Naam** (alleen dashboard):
- ✅ Manager Dashboard
- ✅ Location Dashboard
- ✅ Settings
- ✅ Booking Management
- ✅ Reports & Analytics
- ✅ Location selector

### **Beide Namen:**
- ✅ In Location Management header:
  ```
  [Interne Naam]
  Publieke naam: [Publieke Naam]
  [Stad]
  ```

---

## 🔧 Hoe Te Gebruiken

### **Optie 1: Alleen Publieke Naam**
Als je **geen interne naam** instelt:
- Dashboard toont: `location.name`
- Publiek toont: `location.name`
- Alles werkt zoals voorheen! ✅

### **Optie 2: Met Interne Naam**
Als je **wel een interne naam** instelt:
- Dashboard toont: `location.internal_name`
- Publiek toont: `location.name` (publieke naam)
- Dashboard header toont beide namen

---

## 🎨 UI Features

### **Locatie Informatie Card**
```tsx
┌─────────────────────────────────────────┐
│ 🏢 Locatie Informatie                   │
├─────────────────────────────────────────┤
│ Publieke Naam *                         │
│ [Restaurant De Smaakmaker        ]      │
│ Deze naam wordt getoond aan klanten     │
│                                         │
│ Interne Naam (optioneel)                │
│ [DS-AMS-01                       ]      │
│ Voor dashboard gebruik                  │
│                                         │
│ ℹ️ Wat is het verschil?                 │
│ • Publieke naam: Voor klanten           │
│ • Interne naam: Voor dashboard          │
│                                         │
│ [💾 Wijzigingen Opslaan]                │
└─────────────────────────────────────────┘
```

### **Waarschuwingen:**
- ⚠️ "Je hebt onopgeslagen wijzigingen" - Bij changes
- ✅ "Locatienamen succesvol opgeslagen" - Bij success
- ❌ "Er is een fout opgetreden" - Bij errors

---

## 📊 SQL Helper Functies

### **Get Location Name by Context**
```sql
-- Get public name
SELECT get_location_name(location_id, false);

-- Get internal name (fallback to public if not set)
SELECT get_location_name(location_id, true);
```

### **Query All Location Names**
```sql
SELECT 
  id,
  name as public_name,
  internal_name,
  CASE 
    WHEN internal_name IS NOT NULL AND internal_name != name 
    THEN '✅ Has different internal name'
    ELSE '⚠️  Using public name only'
  END as status
FROM locations
ORDER BY created_at DESC;
```

---

## 🔍 Verificatie

### **Check Database:**
```sql
-- Verify column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'locations' 
AND column_name = 'internal_name';

-- Check current values
SELECT 
  name,
  internal_name,
  slug 
FROM locations;
```

### **Test UI:**
1. ✅ Open Location Settings
2. ✅ Zie beide name velden
3. ✅ Wijzig interne naam
4. ✅ Klik "Wijzigingen Opslaan"
5. ✅ Refresh page
6. ✅ Verifieer dat interne naam getoond wordt in header
7. ✅ Check publieke pagina toont publieke naam

---

## 🎯 Best Practices

### **Interne Namenconventies:**

**Voor Ketens:**
```
Format: [Brand]-[City]-[Number]
Voorbeeld: "BB-AMS-01", "BB-RTD-02"
```

**Voor Franchises:**
```
Format: [Location]-[Type]
Voorbeeld: "Amsterdam Centrum", "Rotterdam Zuid"
```

**Voor Tests:**
```
Format: [Name] [Environment]
Voorbeeld: "Paradise STAGING", "Test Restaurant DEV"
```

### **Tips:**
- 📝 Houd interne namen kort en herkenbaar
- 🔢 Gebruik codes voor snel zoeken
- 📍 Include stad/locatie voor duidelijkheid
- ⚡ Gebruik caps voor betere zichtbaarheid
- 🎯 Blijf consistent binnen je organisatie

---

## ❓ Veelgestelde Vragen

### **Q: Moet ik een interne naam instellen?**
**A:** Nee, het is optioneel. Als je geen interne naam instelt, wordt overal de publieke naam gebruikt.

### **Q: Kan ik dezelfde naam voor beide gebruiken?**
**A:** Ja, maar dan heeft de interne naam geen toegevoegde waarde.

### **Q: Wordt de interne naam gebruikt in de URL?**
**A:** Nee, de `slug` wordt gebruikt voor URLs (bijv. `/p/restaurant-paradise`).

### **Q: Kunnen klanten de interne naam zien?**
**A:** Nee, de interne naam is alleen zichtbaar in het dashboard voor ingelogde staff.

### **Q: Wat gebeurt er met bestaande locaties?**
**A:** Ze behouden hun publieke naam. Je kunt optioneel een interne naam toevoegen.

### **Q: Kan ik de namen later nog wijzigen?**
**A:** Ja, beide namen kunnen op elk moment worden gewijzigd in Location Settings.

---

## 🐛 Troubleshooting

### **Fout: "internal_name column does not exist"**
**Oplossing:** Run het SQL script opnieuw in Supabase.

### **Fout: "Locatienamen kunnen niet worden opgeslagen"**
**Oplossing:** 
1. Check console voor errors
2. Verify Supabase RLS policies
3. Check user permissions

### **Interne naam wordt niet getoond**
**Oplossing:**
1. Refresh de page
2. Check of de naam is opgeslagen in database
3. Clear browser cache

---

## ✅ Checklist

- [ ] SQL script uitgevoerd in Supabase
- [ ] Kolom `internal_name` bestaat
- [ ] Views `public_locations` en `internal_locations` zijn aangemaakt
- [ ] UI toont beide name velden in Location Settings
- [ ] Interne naam wordt getoond in dashboard
- [ ] Publieke naam wordt getoond op klant-pagina's
- [ ] Save functie werkt correct
- [ ] Bestaande locaties werken nog steeds
- [ ] Geen console errors

---

## 🎉 Klaar!

Je locaties hebben nu een professioneel systeem voor interne en publieke namen! 

**Veel succes!** 🚀

