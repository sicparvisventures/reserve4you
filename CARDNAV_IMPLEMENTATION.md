# CardNav Implementation - Reserve4You

## 🎨 Kleurenschema

De CardNav gebruikt het volledige Reserve4You kleurenpalet:

### Primaire Kleuren
- **Coral (Primair)**: `#FF5A5F` - Voor CTA buttons, hover states, actieve borders
- **Wit**: `#FFFFFF` - Card achtergrond (Verkennen)
- **Subtle Tint**: `#FAFAFC` - Card achtergrond (Jouw Account)

### Tekst Kleuren
- **Primair Tekst**: `#111111` - Hoofd tekst op lichte achtergronden
- **Wit Tekst**: `#FFFFFF` - Tekst op coral achtergrond

### Borders & Shadows
- **Border**: `#E7E7EC` - Subtiele lijnen
- **Hover Border**: `#FF5A5F` - Actieve state
- **Shadow**: Coral tints voor hover effecten

## 📐 Structuur

### Card Indeling
De CardNav toont 3 cards in een grid layout:

1. **Verkennen** (Wit - `#FFFFFF`)
   - Home
   - Ontdek Restaurants

2. **Jouw Account** (Subtle - `#FAFAFC`)
   - Favorieten / Aanmelden (afhankelijk van login status)
   - Profiel / Inloggen (afhankelijk van login status)

3. **Voor Restaurants** (Coral - `#FF5A5F`)
   - Manager Portal
   - Start Gratis

## 🎯 Features

### Animaties
- **GSAP powered**: Smooth height animations met `power3.out` easing
- **Card stagger**: Cards animeren in met 0.08s vertraging
- **Hover states**: Subtiele transformaties en shadow effects

### Responsive
- **Mobile**: Hamburger menu met animated cards (< 768px)
- **Desktop**: Reguliere header navigatie (≥ 768px)
- **Dynamic height**: Automatische hoogte berekening gebaseerd op content

### Interactie
- **Hamburger animatie**: Smooth transition naar X icon
- **Auto close**: Menu sluit automatisch bij navigatie
- **Keyboard support**: Tab en Enter/Space toets navigatie
- **Hover feedback**: Visual feedback op alle interactieve elementen

## 🔧 Technische Details

### Bestanden
```
components/
  card-nav/
    CardNav.tsx       - React component met TypeScript
    CardNav.css       - Styling met Reserve4You kleuren
    index.ts          - Export barrel file
  header.tsx          - Integratie in main header
```

### Dependencies
- `react` - UI framework
- `next/link` - Next.js routing
- `gsap` - Animaties
- `react-icons/go` - GoArrowUpRight icon

### Props
```typescript
interface CardNavProps {
  logo?: React.ReactNode;          // Logo component
  logoAlt?: string;                // Alt text
  items?: NavItem[];               // Navigation items
  className?: string;              // Additional classes
  ease?: string;                   // GSAP easing
  baseColor?: string;              // Background color
  menuColor?: string;              // Hamburger color
  buttonBgColor?: string;          // CTA background
  buttonTextColor?: string;        // CTA text
  ctaHref?: string;               // CTA link
  ctaLabel?: string;              // CTA text
}
```

## 🎨 Styling Details

### Card Hover States
```css
.nav-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 90, 95, 0.15);
  border-color: #FF5A5F;
}
```

### Link Hover States
```css
.nav-card-link:hover {
  background-color: rgba(255, 90, 95, 0.08);
  border-color: #FF5A5F;
  transform: translateX(4px);
}
```

### CTA Button
```css
.card-nav-cta-button {
  background-color: #FF5A5F;
  color: #FFFFFF;
  box-shadow: 0 1px 3px rgba(255, 90, 95, 0.2);
}

.card-nav-cta-button:hover {
  box-shadow: 0 4px 8px rgba(255, 90, 95, 0.3);
}
```

## 🚀 Usage

De CardNav is automatisch geïntegreerd in de header en wordt alleen getoond op mobiele devices:

```tsx
<CardNav
  logo={<RotatingLogoMobile />}
  logoAlt="Reserve4You Logo"
  items={cardNavItems}
  baseColor="#FFFFFF"
  menuColor="#111111"
  buttonBgColor="#FF5A5F"
  buttonTextColor="#FFFFFF"
  ctaHref={userData ? "/profile" : "/sign-up"}
  ctaLabel={userData ? "Profiel" : "Aanmelden"}
  ease="power3.out"
/>
```

## 📱 Responsive Breakpoints

- **< 768px**: CardNav met hamburger menu
- **≥ 768px**: Reguliere desktop header

## ✨ Best Practices

1. **Consistente kleuren**: Alle kleuren komen uit het Reserve4You palet
2. **Smooth animaties**: GSAP voor professionele bewegingen
3. **Accessibility**: ARIA labels en keyboard navigatie
4. **Performance**: Will-change hints voor smooth animaties
5. **Reduced motion**: Respecteert gebruiker's motion preferences

## 🔄 Future Improvements

- [ ] Dark mode support
- [ ] Custom animation presets
- [ ] Nested menu items
- [ ] Search integration
- [ ] User avatar in CTA area
- [ ] Notification badges

## 📝 Notes

- De CardNav sluit automatisch wanneer er op een link wordt geklikt
- De hoogte wordt dynamisch berekend op basis van content
- Bij resize wordt de animatie opnieuw geïnitialiseerd
- Coral kleur (#FF5A5F) wordt gebruikt als accent door heel de component

