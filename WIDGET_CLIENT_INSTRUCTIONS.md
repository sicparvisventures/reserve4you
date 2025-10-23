# 🎯 Reserve4You Widget - Installatie Gids voor Klanten

## 📖 Inhoudsopgave

1. [Wat is de Reserve4You Widget?](#wat-is-de-reserve4you-widget)
2. [Snelstart - 3 Stappen](#snelstart---3-stappen)
3. [Gedetailleerde Installatie Instructies](#gedetailleerde-installatie-instructies)
4. [Widget Aanpassen](#widget-aanpassen)
5. [Voorbeelden](#voorbeelden)
6. [Veelgestelde Vragen (FAQ)](#veelgestelde-vragen-faq)
7. [Ondersteuning](#ondersteuning)

---

## Wat is de Reserve4You Widget?

De Reserve4You Widget is een **embeddable** restaurant widget die je eenvoudig op je eigen website kunt plaatsen. Het toont:

- 🏪 Al je restaurant locaties
- 📍 Adres en contact informatie
- 🏷️ Actieve promoties en aanbiedingen
- 🍽️ Keuken type en prijsklasse
- 📅 Direct reserveren knop

**Vergelijkbaar met:** Zenchef, OpenTable, TheFork widgets

**Voordelen:**
- ✅ Volledig aanpasbaar aan je branding
- ✅ Responsive en mobiel-vriendelijk
- ✅ Automatische updates van je reserveringen
- ✅ Geen technische kennis vereist
- ✅ Gratis analytics en tracking

---

## Snelstart - 3 Stappen

### Stap 1: Kopieer je Embed Code

1. Log in op je Reserve4You Manager Portal
2. Ga naar **Instellingen** → **Widget**
3. Klik op het **"Embed Code"** tabblad
4. Klik op **"Kopieer"** naast de HTML Embed Code

Je embed code ziet er zo uit:
```html
<script src="https://reserve4you.vercel.app/widget-embed.js"></script>
<div data-r4y-widget="widget_jouw_bedrijf_12345678"></div>
```

### Stap 2: Plak de Code op je Website

Open je website editor (WordPress, Wix, Squarespace, etc.) en plak de code waar je het widget wilt tonen.

**Voor WordPress:**
1. Ga naar de pagina waar je het widget wilt plaatsen
2. Voeg een **Custom HTML** blok toe
3. Plak de embed code
4. Klik op **Bijwerken**

**Voor Wix:**
1. Klik op **Add** (+) → **Embed** → **Custom Embeds**
2. Selecteer **HTML Code**
3. Plak de embed code
4. Klik op **Apply**

**Voor HTML Website:**
1. Open je HTML bestand
2. Plak de code in de `<body>` sectie
3. Upload het bestand naar je server

### Stap 3: Test je Widget

Bezoek je website en controleer of het widget correct wordt geladen!

---

## Gedetailleerde Installatie Instructies

### Vereisten

- Een actief Reserve4You account
- Toegang tot je website's HTML of CMS
- Minstens 1 publieke locatie in je Reserve4You Manager

### Installatie Opties

#### Optie 1: Standaard Embed (Aanbevolen)

```html
<!-- Plaats dit waar je het widget wilt tonen -->
<script src="https://reserve4you.vercel.app/widget-embed.js"></script>
<div data-r4y-widget="YOUR_WIDGET_CODE"></div>
```

**Vervang `YOUR_WIDGET_CODE`** met je unieke widget code uit de Manager Portal.

#### Optie 2: Async Loading (Voor betere prestaties)

```html
<!-- Plaats dit in de <head> sectie -->
<script async src="https://reserve4you.vercel.app/widget-embed.js"></script>

<!-- Plaats dit waar je het widget wilt tonen -->
<div data-r4y-widget="YOUR_WIDGET_CODE"></div>
```

#### Optie 3: Programmatisch Laden (Voor developers)

```html
<div id="my-widget-container"></div>

<script>
  // Load widget script
  const script = document.createElement('script');
  script.src = 'https://reserve4you.vercel.app/widget-embed.js';
  script.onload = function() {
    // Initialize widget
    window.R4Y.loadWidget('my-widget-container', 'YOUR_WIDGET_CODE');
  };
  document.head.appendChild(script);
</script>
```

#### Optie 4: React/Next.js Integration

```jsx
'use client'; // For Next.js App Router

import { useEffect } from 'react';

export function RestaurantWidget({ widgetCode }) {
  useEffect(() => {
    // Load widget script
    const script = document.createElement('script');
    script.src = 'https://reserve4you.vercel.app/widget-embed.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div data-r4y-widget={widgetCode} />
  );
}
```

### Platform-specifieke Instructies

#### WordPress

1. **Via HTML Block:**
   - Edit de pagina in Block Editor
   - Voeg een **Custom HTML** block toe
   - Plak de embed code
   - Publish

2. **Via Widget Area:**
   - Ga naar **Appearance** → **Widgets**
   - Voeg een **Custom HTML** widget toe aan je sidebar/footer
   - Plak de embed code
   - Save

3. **Via Page Builder (Elementor, Divi, etc.):**
   - Voeg een HTML element toe
   - Plak de embed code
   - Save

#### Shopify

1. Ga naar **Online Store** → **Themes**
2. Klik op **Actions** → **Edit code**
3. Open het template waar je het widget wilt (bijv. `page.liquid`)
4. Plak de embed code
5. Save

#### Wix

1. Click **Add** (+) button
2. Select **Embed** → **Custom Embeds**
3. Choose **HTML Code**
4. Paste embed code
5. Click **Apply**

#### Squarespace

1. Edit de pagina
2. Klik op **Add Section** → **Code**
3. Plak de embed code
4. Save

#### Webflow

1. Drag een **Embed** element naar je pagina
2. Plak de embed code
3. Publish

---

## Widget Aanpassen

### In de Manager Portal

Log in op je Reserve4You Manager Portal en ga naar **Instellingen** → **Widget**.

#### 🎨 Design Tabblad

**Branding:**
- Upload je logo
- Kies logo positie (boven, links, gecentreerd)
- Stel primaire kleur in
- Kies thema (licht, donker, automatisch)

**Layout:**
- Grid, lijst of carrousel layout
- Aantal kaarten per rij (1-4)
- Kaart stijl (modern, klassiek, minimaal)
- Maximale breedte widget
- Hoek radius (afgeronde hoeken)
- Animaties en hover effecten

**Weergave Opties:**
- Toon/verberg promoties
- Toon/verberg keuken type
- Toon/verberg prijsklasse
- Toon/verberg stad
- Toon/verberg beschrijving

**Reserveer Knop:**
- Aanpasbare tekst (bijv. "Reserveren", "Boek nu", "Tafel reserveren")
- Knop kleur

#### ⚙️ Instellingen Tabblad

**Locaties:**
- Kies alle locaties of specifieke locaties
- Multi-select voor individuele locaties

**Geavanceerd:**
- Analytics tracking aan/uit
- Widget actief/inactief
- Custom CSS voor verdere aanpassingen

#### 📋 Embed Code Tabblad

- Kopieer HTML embed code
- Kopieer widget code
- Kopieer API URL

#### 📊 Analytics Tabblad

Bekijk statistieken over:
- Widget weergaven
- Clicks op locatie kaarten
- Gestarte reserveringen
- Voltooide reserveringen
- Conversie ratio

---

## Voorbeelden

### Voorbeeld 1: Basis Widget

```html
<!DOCTYPE html>
<html>
<head>
  <title>Mijn Restaurant</title>
</head>
<body>
  <h1>Onze Locaties</h1>
  
  <!-- Reserve4You Widget -->
  <script src="https://reserve4you.vercel.app/widget-embed.js"></script>
  <div data-r4y-widget="widget_mijn_restaurant_abc123"></div>
  
</body>
</html>
```

### Voorbeeld 2: Widget met Container Styling

```html
<!DOCTYPE html>
<html>
<head>
  <title>Mijn Restaurant</title>
  <style>
    .widget-container {
      max-width: 1200px;
      margin: 40px auto;
      padding: 0 20px;
    }
    
    .widget-header {
      text-align: center;
      margin-bottom: 40px;
    }
    
    .widget-header h2 {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .widget-header p {
      font-size: 18px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="widget-container">
    <div class="widget-header">
      <h2>Bezoek Onze Restaurants</h2>
      <p>Kies een locatie en reserveer direct online</p>
    </div>
    
    <!-- Reserve4You Widget -->
    <script src="https://reserve4you.vercel.app/widget-embed.js"></script>
    <div data-r4y-widget="widget_mijn_restaurant_abc123"></div>
  </div>
</body>
</html>
```

### Voorbeeld 3: Meerdere Widgets op 1 Pagina

```html
<!DOCTYPE html>
<html>
<head>
  <title>Mijn Restaurant</title>
</head>
<body>
  <!-- Widget Script (1x laden is genoeg) -->
  <script src="https://reserve4you.vercel.app/widget-embed.js"></script>
  
  <section>
    <h2>Restaurants in Amsterdam</h2>
    <div data-r4y-widget="widget_amsterdam_abc123"></div>
  </section>
  
  <section>
    <h2>Restaurants in Rotterdam</h2>
    <div data-r4y-widget="widget_rotterdam_def456"></div>
  </section>
</body>
</html>
```

---

## Veelgestelde Vragen (FAQ)

### 📱 Is het widget responsive en mobiel-vriendelijk?

**Ja!** Het widget past zich automatisch aan aan alle schermformaten (desktop, tablet, mobiel).

### 🎨 Kan ik het widget aanpassen aan mijn branding?

**Absoluut!** Je kunt in de Manager Portal:
- Je eigen logo uploaden
- Kleuren aanpassen
- Layout kiezen
- Eigen CSS toevoegen

### 🌍 Kan ik het widget op meerdere websites gebruiken?

**Ja!** Je kunt dezelfde embed code op meerdere websites plaatsen.

### 🔄 Worden wijzigingen automatisch doorgevoerd?

**Ja!** Alle wijzigingen die je maakt in de Manager Portal worden direct doorgevoerd in het widget op je website.

### 📊 Kan ik zien hoeveel mensen het widget gebruiken?

**Ja!** Ga naar **Instellingen** → **Widget** → **Analytics** voor statistieken.

### 💳 Kost het extra om het widget te gebruiken?

**Nee!** Het widget is gratis inbegrepen in je Reserve4You abonnement.

### 🚀 Hoe snel laadt het widget?

Het widget is geoptimaliseerd voor snelheid:
- Async loading mogelijk
- Gecached content
- Gecomprimeerde assets
- Gemiddelde laadtijd: < 1 seconde

### 🔒 Is het widget veilig?

**Ja!** Het widget:
- Gebruikt HTTPS encryptie
- Volgt privacy wetgeving (GDPR)
- Geen tracking cookies zonder toestemming
- Veilige API endpoints

### 🌐 Werkt het widget met mijn website builder?

**Ja!** Het widget werkt met:
- ✅ WordPress
- ✅ Wix
- ✅ Squarespace
- ✅ Shopify
- ✅ Webflow
- ✅ Custom HTML websites
- ✅ React/Next.js
- ✅ En veel meer!

### ❌ Wat als het widget niet laadt?

Controleer:
1. ✅ Is je widget code correct?
2. ✅ Is het widget actief in de Manager Portal?
3. ✅ Zijn je locaties publiek en actief?
4. ✅ Blokkeert je browser scripts?
5. ✅ Is je website HTTPS?

### 🎯 Kan ik specifieke locaties tonen?

**Ja!** Ga naar **Instellingen** → **Widget** → **Instellingen** en selecteer specifieke locaties.

### 📝 Kan ik de reserveer knop tekst aanpassen?

**Ja!** Ga naar **Instellingen** → **Widget** → **Design** en pas de "Reserveer Knop Tekst" aan.

### 🎨 Kan ik eigen CSS toevoegen?

**Ja!** Voor geavanceerde gebruikers: ga naar **Instellingen** → **Widget** → **Instellingen** en voeg custom CSS toe.

Voorbeeld:
```css
.r4y-widget {
  font-family: 'Mijn Custom Font', sans-serif;
}

.r4y-location-card {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.r4y-book-btn {
  text-transform: uppercase;
  letter-spacing: 1px;
}
```

---

## Ondersteuning

### 💬 Hulp Nodig?

**Manager Portal:**
- Log in op [reserve4you.vercel.app/manager](https://reserve4you.vercel.app/manager)
- Ga naar **Instellingen** → **Widget**

**Email Support:**
- support@reserve4you.com

**Live Chat:**
- Beschikbaar in de Manager Portal

**Documentatie:**
- [Complete API Documentatie](https://reserve4you.vercel.app/docs)
- [Video Tutorials](https://reserve4you.vercel.app/tutorials)

### 🐛 Bug Rapporteren

Als je een probleem vindt:
1. Check de Console in je browser (F12)
2. Neem een screenshot
3. Stuur naar support@reserve4you.com met:
   - Je widget code
   - URL van je website
   - Browser en versie
   - Stappen om het probleem te reproduceren

---

## 🎉 Succesverhalen

> "De Reserve4You widget paste perfect in onze website! Binnen 5 minuten geïnstalleerd en direct reserveringen."
> **— Poule & Poulette, Mechelen**

> "Onze klanten vinden het geweldig om direct te reserveren via onze website. 40% meer online reserveringen!"
> **— Restaurant XYZ, Amsterdam**

---

## 📚 Geavanceerde Integratie

### Custom Events Tracking

Track events voor je eigen analytics:

```javascript
// Listen for widget events
document.addEventListener('r4y-widget-loaded', function(e) {
  console.log('Widget loaded:', e.detail.widgetCode);
  
  // Track in Google Analytics
  gtag('event', 'widget_loaded', {
    widget_code: e.detail.widgetCode
  });
});

document.addEventListener('r4y-widget-click', function(e) {
  console.log('Location clicked:', e.detail.locationId);
  
  // Track in Google Analytics
  gtag('event', 'restaurant_click', {
    location_id: e.detail.locationId,
    location_name: e.detail.locationName
  });
});
```

### API Integration

Voor developers die meer controle willen:

```javascript
// Fetch widget data via API
fetch('https://reserve4you.vercel.app/api/widget/YOUR_WIDGET_CODE')
  .then(res => res.json())
  .then(data => {
    console.log('Widget config:', data.config);
    console.log('Locations:', data.locations);
    
    // Build your own custom UI
    renderCustomWidget(data);
  });
```

---

## ✨ Volgende Stappen

1. ✅ **Installeer** het widget op je website
2. 🎨 **Pas aan** in de Manager Portal
3. 📊 **Monitor** je analytics
4. 🚀 **Optimaliseer** voor betere conversie
5. 📈 **Geniet** van meer online reserveringen!

---

**Veel succes met je Reserve4You Widget! 🎉**

Vragen? Neem contact op via support@reserve4you.com

