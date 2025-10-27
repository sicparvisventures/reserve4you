# Reserve4You - Quick Start Kleur Implementatie

## 🎯 Direct Toepasbare Verbeteringen

Deze gids bevat **concrete code changes** die je **vandaag** kunt implementeren voor een levendiger Reserve4You.

---

## 1️⃣ Stap 1: Nieuwe Kleuren Toevoegen (5 minuten)

### Bestand: `app/globals.css`

Voeg deze kleuren toe aan je `:root` sectie (na regel 62):

```css
:root {
  /* 🎨 R4Y Brand Primair */
  --primary: 0 86% 67%; /* #FF5A5F - R4Y Brand Red */
  
  /* 🏠 CONSUMER FACING - Warme uitstraling */
  --background: 25 15% 96%;      /* #F9F5F2 - Zacht ivoor met warme balans */
  --border: 25 10% 88%;          /* #EAE3DF - Gebroken wit-beige */
  --neutral: 25 8% 78%;          /* #D4C9C4 - Warmgrijs voor subtiele UI-lijnen */
  
  /* 💼 MANAGER OMGEVING - Professionele uitstraling (macOS-achtig) */
  --background-manager: 220 15% 97%;  /* #F5F7FA - Blauw-grijs wit */
  --border-manager: 220 10% 88%;      /* #DCE2EA - Subtiel blauwgrijs */
  --neutral-manager: 220 8% 80%;      /* #C5CBD3 - Zachte professionele toon */
  
  /* 📐 PROFESSIONELE GRADIENT & OPACITY */
  --background-gradient: linear-gradient(180deg, hsl(var(--background)) 0%, hsl(0 0% 100%) 100%);
  --border-opacity: 0.7;
  
  /* 🌟 NIEUWE WARME KLEUREN voor restaurant sfeer */
  --primary-warm: 15 85% 60%;        /* #F27059 - Warmer oranje-rood */
  --primary-deep: 355 70% 52%;       /* #D93954 - Dieper rood voor CTA's */
  --secondary-amber: 38 92% 50%;     /* #F59E0B - Warm goud/amber */
  --accent-sunset: 25 95% 60%;       /* #FF8C42 - Zonsondergang oranje */
  --accent-ocean: 195 75% 50%;       /* #20A4BF - Frisse ocean blauw */
  --accent-forest: 140 50% 40%;      /* #338856 - Rijke forest groen */
  --secondary-wine: 330 50% 40%;     /* #994D6B - Elegante wijnrood */
  --secondary-terracotta: 14 80% 55%; /* #E07142 - Aardse terracotta */
  
  /* 🌈 Zachte variants voor backgrounds */
  --primary-soft: 0 86% 85%;         /* #FFD4D6 - Zachte coral */
  --amber-soft: 38 92% 85%;          /* #FEE8C7 - Zachte amber */
  --ocean-soft: 195 75% 85%;         /* #D4F1F8 - Zachte ocean */
  
  /* 🎨 Aanvullende neutrale warme achtergronden */
  --neutral-warm: 30 15% 94%;        /* #F7F3F0 - Extra warme beige */
  --neutral-cream: 40 30% 96%;       /* #FAF8F3 - Romige achtergrond */
}

/* 💼 Manager Dashboard Specifiek - Overschrijf basis kleuren */
.manager-layout,
[data-layout="manager"] {
  --background: var(--background-manager);
  --border: var(--border-manager);
  --neutral: var(--neutral-manager);
}
```

---

## 2️⃣ Stap 2: Nieuwe Utility Classes (5 minuten)

### Bestand: `app/globals.css`

Voeg deze utilities toe aan het einde van je `globals.css`:

```css
/* =============================================================================
   R4Y UITGEBREIDE KLEUR UTILITIES
   ============================================================================= */

/* Warme gradient backgrounds */
.gradient-bg-warm {
  background: linear-gradient(135deg, 
    hsl(var(--primary)), 
    hsl(var(--accent-sunset))
  );
}

.gradient-bg-sunset {
  background: linear-gradient(135deg, 
    hsl(var(--accent-sunset)), 
    hsl(var(--secondary-amber))
  );
}

.gradient-bg-ocean {
  background: linear-gradient(135deg, 
    hsl(var(--accent-ocean)), 
    hsl(var(--primary))
  );
}

/* Subtiele achtergrond gradients */
.bg-gradient-warm-subtle {
  background: linear-gradient(135deg, 
    hsl(var(--primary) / 0.08) 0%,
    hsl(var(--accent-sunset) / 0.05) 50%,
    hsl(var(--secondary-amber) / 0.03) 100%
  );
}

/* Professionele gradient voor backgrounds */
.bg-professional {
  background: var(--background-gradient);
}

.bg-professional-manager {
  background: linear-gradient(180deg, 
    hsl(220 15% 97%) 0%, 
    hsl(0 0% 100%) 100%
  );
}

.bg-gradient-ocean-subtle {
  background: linear-gradient(135deg, 
    hsl(var(--accent-ocean) / 0.08) 0%,
    hsl(var(--primary) / 0.05) 50%,
    transparent 100%
  );
}

/* Gradient tekst effecten */
.gradient-text-warm {
  background: linear-gradient(135deg, 
    hsl(var(--primary)), 
    hsl(var(--accent-sunset)),
    hsl(var(--secondary-amber))
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.gradient-text-ocean {
  background: linear-gradient(135deg, 
    hsl(var(--primary)), 
    hsl(var(--accent-ocean))
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Multi-color hover shadows */
.hover-shadow-warm {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hover-shadow-warm:hover {
  box-shadow: 
    0 12px 40px hsl(var(--primary) / 0.15),
    0 4px 12px hsl(var(--accent-sunset) / 0.1);
}

.hover-shadow-ocean:hover {
  box-shadow: 
    0 12px 40px hsl(var(--accent-ocean) / 0.15),
    0 4px 12px hsl(var(--primary) / 0.1);
}

/* Borders met opacity */
.border-subtle {
  border-color: hsl(var(--border));
  opacity: var(--border-opacity, 1);
}

/* Kleurrijke borders */
.border-warm {
  border-color: hsl(var(--accent-sunset) / 0.3);
}

.border-ocean {
  border-color: hsl(var(--accent-ocean) / 0.3);
}

.border-forest {
  border-color: hsl(var(--accent-forest) / 0.3);
}

/* Glassmorphism met kleur */
.glass-warm {
  background: rgba(250, 248, 243, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid hsl(var(--secondary-amber) / 0.15);
}

.glass-ocean {
  background: rgba(237, 242, 247, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid hsl(var(--accent-ocean) / 0.15);
}
```

---

## 3️⃣ Stap 3: Update Button Component (10 minuten)

### Bestand: `components/ui/button.tsx`

Voeg nieuwe variants toe aan de `buttonVariants`:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-[var(--duration-fast)] cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        
        // 🆕 NIEUWE WARME VARIANTS
        warm:
          "bg-gradient-to-r from-accent-sunset to-secondary-amber text-white shadow-lg hover:shadow-xl hover:from-accent-sunset/90 hover:to-secondary-amber/90",
        
        deep:
          "bg-gradient-to-r from-primary-deep to-primary text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:from-primary-deep/90 hover:to-primary/90",
        
        ocean:
          "bg-gradient-to-r from-accent-ocean to-info text-white shadow-lg hover:shadow-xl hover:from-accent-ocean/90 hover:to-info/90",
        
        forest:
          "bg-gradient-to-r from-accent-forest to-success text-white shadow-lg hover:shadow-xl hover:from-accent-forest/90 hover:to-success/90",
        
        // Bestaande variants blijven
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-muted hover:text-foreground",
        secondary:
          "bg-muted text-foreground shadow-sm hover:bg-muted/80",
        ghost:
          "hover:bg-muted hover:text-foreground",
        link: 
          "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        gradient:
          "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg hover:from-primary/90 hover:to-primary/80 hover:shadow-xl",
        glassmorphism:
          "bg-background/10 backdrop-blur-md border border-background/20 text-foreground shadow-lg hover:bg-background/20"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        xl: "h-14 rounded-md px-10 text-lg",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
```

**Gebruik voorbeeld:**
```tsx
<Button variant="warm">Reserveer nu</Button>
<Button variant="deep">Speciale aanbieding</Button>
<Button variant="ocean">Meer info</Button>
```

---

## 4️⃣ Stap 4: Update Badge Component (10 minuten)

### Bestand: `components/ui/badge.tsx`

Voeg nieuwe variants toe:

```typescript
const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary/10 text-primary hover:bg-primary/20',
        secondary:
          'border-transparent bg-muted text-muted-foreground hover:bg-muted/80',
        success:
          'border-transparent bg-success/10 text-success hover:bg-success/20',
        warning:
          'border-transparent bg-warning/10 text-[#D97706] hover:bg-warning/20',
        error:
          'border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20',
        info:
          'border-transparent bg-info/10 text-info hover:bg-info/20',
        outline:
          'border-border bg-transparent text-foreground hover:bg-muted',
        
        // 🆕 NIEUWE KLEURRIJKE BADGES
        deals:
          'border-transparent bg-accent-sunset text-white shadow-md hover:shadow-lg',
        
        popular:
          'border-transparent bg-secondary-wine text-white shadow-md hover:shadow-lg',
        
        new:
          'border-transparent bg-accent-ocean text-white shadow-md hover:shadow-lg',
        
        eco:
          'border-transparent bg-accent-forest text-white shadow-md hover:shadow-lg',
        
        premium:
          'border-transparent bg-gradient-to-r from-secondary-amber to-accent-sunset text-white shadow-md hover:shadow-lg',
        
        // Cuisine-specifieke badges
        italian:
          'border-transparent bg-secondary-wine/90 text-white backdrop-blur-sm',
        
        asian:
          'border-transparent bg-primary text-white backdrop-blur-sm',
        
        french:
          'border-transparent bg-info text-white backdrop-blur-sm',
        
        vegetarian:
          'border-transparent bg-accent-forest text-white backdrop-blur-sm',
        
        seafood:
          'border-transparent bg-accent-ocean text-white backdrop-blur-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
```

**Gebruik voorbeeld:**
```tsx
<Badge variant="deals">⚡ Deal</Badge>
<Badge variant="popular">🔥 Populair</Badge>
<Badge variant="italian">🍝 Italiaans</Badge>
<Badge variant="eco">🌱 Bio</Badge>
```

---

## 5️⃣ Stap 5: Update Card Component (10 minuten)

### Bestand: `components/ui/card.tsx`

Voeg nieuwe variants toe:

```typescript
const cardVariants = cva(
  "rounded-lg border transition-all duration-[var(--duration-medium)]",
  {
    variants: {
      variant: {
        default: 
          "bg-background text-foreground shadow-md hover:shadow-lg",
        elevated: 
          "bg-background text-foreground shadow-lg hover:shadow-xl transform hover:-translate-y-1",
        glassmorphism: 
          "bg-background/10 backdrop-blur-md border-background/20 text-foreground shadow-lg hover:bg-background/15 hover:shadow-xl",
        gradient: 
          "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-md hover:shadow-lg hover:from-primary/10 hover:to-primary/15",
        interactive: 
          "bg-background text-foreground shadow-md hover:shadow-xl transform hover:-translate-y-2 hover:scale-[1.02] cursor-pointer",
        glow: 
          "bg-background text-foreground shadow-lg hover:shadow-2xl hover:shadow-primary/20 border-primary/20",
        
        // 🆕 NIEUWE WARME CARD VARIANTS
        warm: 
          "bg-gradient-to-br from-primary-soft/10 to-amber-soft/10 border-accent-sunset/20 shadow-md hover:shadow-lg hover:shadow-accent-sunset/10",
        
        ocean: 
          "bg-gradient-to-br from-ocean-soft/10 to-primary/5 border-accent-ocean/20 shadow-md hover:shadow-lg hover:shadow-accent-ocean/10",
        
        forest: 
          "bg-gradient-to-br from-success/5 to-accent-forest/5 border-accent-forest/20 shadow-md hover:shadow-lg hover:shadow-accent-forest/10",
        
        sunset: 
          "bg-gradient-to-br from-accent-sunset/5 via-secondary-amber/5 to-primary/5 border-accent-sunset/15 shadow-md hover:shadow-lg hover:shadow-accent-sunset/15",
        
        glassWarm:
          "bg-neutral-warm/80 backdrop-blur-md border-secondary-amber/15 shadow-lg hover:bg-neutral-warm/90",
        
        glassOcean:
          "bg-neutral-cool/80 backdrop-blur-md border-accent-ocean/15 shadow-lg hover:bg-neutral-cool/90",
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
```

**Gebruik voorbeeld:**
```tsx
<Card variant="warm">...</Card>
<Card variant="ocean">...</Card>
<Card variant="glassWarm">...</Card>
```

---

## 6️⃣ Stap 6: Update Hero Section (15 minuten)

### Bestand: `components/hero/HeroSection.tsx`

Replace het huidige gradient gedeelte:

```tsx
// ❌ VOOR (regel 94-99):
<div className="absolute inset-0 bg-gradient-to-br from-background/92 via-background/88 to-background/85" />
<div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/8 blur-3xl rounded-full" />
<div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-primary/6 blur-3xl rounded-full" />

// ✅ NA:
<div className="absolute inset-0 bg-gradient-to-br from-background/92 via-neutral-warm/88 to-background/85" />

{/* Multi-color accent blobs */}
<div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-primary/8 via-accent-sunset/6 to-secondary-amber/4 blur-3xl rounded-full" />
<div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-accent-sunset/6 via-secondary-amber/4 to-primary/5 blur-3xl rounded-full" />
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-accent-ocean/4 blur-3xl rounded-full" />
```

Update ook de heading gradient (regel 109):

```tsx
// ❌ VOOR:
<span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
  Start booking
</span>

// ✅ NA:
<span className="gradient-text-warm">
  Start booking
</span>
```

Update de search button (regel 184-199):

```tsx
// ❌ VOOR:
<Button
  onClick={handleSearch}
  className="w-full gap-2 shadow-lg hover:shadow-xl transition-shadow h-10"
>
  ...
</Button>

// ✅ NA:
<Button
  onClick={handleSearch}
  variant="deep"
  className="w-full gap-2 h-10"
>
  ...
</Button>
```

---

## 7️⃣ Stap 7: Update Location Cards (15 minuten)

### Bestand: `components/location/LocationCard.tsx`

Voeg dynamische kleuren toe op basis van cuisine (regel 64):

```tsx
// ❌ VOOR:
<div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">

// ✅ NA - Dynamische gradient op basis van cuisine:
<div 
  className="relative h-48 overflow-hidden"
  style={{
    background: getCuisineGradient(cuisine)
  }}
>
```

Voeg deze helper functie toe bovenaan het bestand:

```typescript
function getCuisineGradient(cuisine?: string): string {
  const cuisineMap: Record<string, string> = {
    'Italian': 'linear-gradient(135deg, hsl(330 50% 40% / 0.15), hsl(0 86% 67% / 0.05))',
    'Italiaans': 'linear-gradient(135deg, hsl(330 50% 40% / 0.15), hsl(0 86% 67% / 0.05))',
    'Asian': 'linear-gradient(135deg, hsl(0 86% 67% / 0.15), hsl(38 92% 50% / 0.05))',
    'Aziatisch': 'linear-gradient(135deg, hsl(0 86% 67% / 0.15), hsl(38 92% 50% / 0.05))',
    'French': 'linear-gradient(135deg, hsl(221 83% 62% / 0.15), hsl(265 50% 65% / 0.05))',
    'Frans': 'linear-gradient(135deg, hsl(221 83% 62% / 0.15), hsl(265 50% 65% / 0.05))',
    'Vegetarian': 'linear-gradient(135deg, hsl(140 50% 40% / 0.15), hsl(142 76% 45% / 0.05))',
    'Vegetarisch': 'linear-gradient(135deg, hsl(140 50% 40% / 0.15), hsl(142 76% 45% / 0.05))',
    'Seafood': 'linear-gradient(135deg, hsl(195 75% 50% / 0.15), hsl(221 83% 62% / 0.05))',
    'Zeevruchten': 'linear-gradient(135deg, hsl(195 75% 50% / 0.15), hsl(221 83% 62% / 0.05))',
  };
  
  return cuisineMap[cuisine || ''] || 'linear-gradient(135deg, hsl(0 86% 67% / 0.2), hsl(0 86% 67% / 0.05))';
}
```

Update ook de card hover effect:

```tsx
// ❌ VOOR:
<Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">

// ✅ NA:
<Card className="overflow-hidden hover-shadow-warm transition-all duration-300 group">
```

---

## 8️⃣ Stap 8: Update Discover Page (10 minuten)

### Bestand: `app/discover/page.tsx`

Update de heading gradient (regel 73-75):

```tsx
// ❌ VOOR:
<span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
  restaurants
</span>

// ✅ NA:
<span className="gradient-text-warm">
  restaurants
</span>
```

---

## 9️⃣ Stap 9: Update Footer & Header (10 minuten)

### Bestand: `components/header.tsx`

Update de Manager Portal button (regel 116-118):

```tsx
// ❌ VOOR:
<Button variant="outline" size="sm" asChild className="gradient-bg text-white border-0">
  <Link href={managerDashboardUrl}>Manager Portal</Link>
</Button>

// ✅ NA:
<Button variant="deep" size="sm" asChild>
  <Link href={managerDashboardUrl}>Manager Portal</Link>
</Button>
```

### Bestand: `components/footer.tsx`

Update het logo (regel 71):

```tsx
// ❌ VOOR:
<div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
  <span className="text-lg font-bold text-primary-foreground">R</span>
</div>

// ✅ NA:
<div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent-sunset flex items-center justify-center shadow-md">
  <span className="text-lg font-bold text-white">R</span>
</div>
```

---

## 🔟 Stap 10: Update Dashboard (Optioneel, 15 minuten)

### Bestand: `app/manager/[tenantId]/dashboard/ProfessionalDashboard.tsx`

Update de stats cards met kleuraccenten. Voeg deze functie toe:

```typescript
function getStatCardColor(type: 'bookings' | 'revenue' | 'customers' | 'rating') {
  const colors = {
    bookings: {
      bg: 'bg-gradient-to-br from-ocean-soft/20 to-background',
      border: 'border-accent-ocean/30',
      icon: 'text-accent-ocean',
      value: 'text-accent-ocean'
    },
    revenue: {
      bg: 'bg-gradient-to-br from-amber-soft/20 to-background',
      border: 'border-secondary-amber/30',
      icon: 'text-secondary-amber',
      value: 'text-secondary-amber'
    },
    customers: {
      bg: 'bg-gradient-to-br from-primary-soft/20 to-background',
      border: 'border-primary/30',
      icon: 'text-primary',
      value: 'text-primary'
    },
    rating: {
      bg: 'bg-gradient-to-br from-success/10 to-background',
      border: 'border-success/30',
      icon: 'text-success',
      value: 'text-success'
    }
  };
  return colors[type];
}
```

---

## ✅ Testing Checklist

Na implementatie, check het volgende:

### Visueel
- [ ] Homepage hero heeft multi-color gradients
- [ ] Buttons hebben verschillende kleuren voor verschillende acties
- [ ] Restaurant cards hebben cuisine-specifieke kleuren
- [ ] Badges zijn kleurrijk en onderscheidend
- [ ] Hover effecten hebben multi-color shadows

### Toegankelijkheid
- [ ] Alle tekst heeft minimaal 4.5:1 contrast ratio
- [ ] Focus states zijn duidelijk zichtbaar
- [ ] Kleur wordt niet als enige indicator gebruikt voor belangrijke info

### Performance
- [ ] Geen layout shifts
- [ ] Smooth transitions en animations
- [ ] Geen flashing of flickering

### Consistentie
- [ ] Kleurgebruik is consistent binnen contexten
- [ ] Coral blijft de primaire merkkleur
- [ ] Professional uitstraling behouden in dashboard

---

## 🎨 Voorbeelden van Gebruik

### Homepage CTA Section
```tsx
<section className="py-20 bg-gradient-warm-subtle">
  <div className="max-w-4xl mx-auto text-center px-4">
    <h2 className="text-4xl font-bold mb-6">
      Klaar om te beginnen met{' '}
      <span className="gradient-text-warm">Reserve4You</span>?
    </h2>
    <p className="text-lg text-muted-foreground mb-8">
      Ontdek duizenden restaurants en reserveer direct online
    </p>
    <div className="flex gap-4 justify-center flex-wrap">
      <Button variant="deep" size="lg">
        Start nu gratis
      </Button>
      <Button variant="warm" size="lg">
        Bekijk restaurants
      </Button>
      <Button variant="outline" size="lg">
        Meer informatie
      </Button>
    </div>
  </div>
</section>
```

### Restaurant Card met Badges
```tsx
<Card variant="warm" className="hover-shadow-warm">
  <div style={{ background: getCuisineGradient('Italian') }}>
    <img src={restaurant.image} alt={restaurant.name} />
  </div>
  <div className="p-4">
    <div className="flex gap-2 mb-3">
      <Badge variant="italian">🍝 Italiaans</Badge>
      <Badge variant="deals">⚡ Deal</Badge>
      <Badge variant="popular">🔥 Populair</Badge>
    </div>
    <h3 className="text-xl font-bold">{restaurant.name}</h3>
    <p className="text-muted-foreground">{restaurant.description}</p>
    <Button variant="deep" className="w-full mt-4">
      Reserveer nu
    </Button>
  </div>
</Card>
```

### Dashboard Stat Card
```tsx
<Card className={getStatCardColor('revenue').bg + ' ' + getStatCardColor('revenue').border}>
  <div className="flex items-center gap-3 mb-3">
    <DollarSign className={'h-5 w-5 ' + getStatCardColor('revenue').icon} />
    <span className="text-sm text-muted-foreground">Omzet</span>
  </div>
  <div className={'text-3xl font-bold ' + getStatCardColor('revenue').value}>
    €12,450
  </div>
  <div className="text-sm text-success mt-2">
    ↑ 15% deze maand
  </div>
</Card>
```

---

## 🚀 Implementatie Volgorde

1. **Start met globals.css** - Voeg alle nieuwe kleuren en utilities toe (30 min)
2. **Update components** - Button, Badge, Card (30 min)
3. **Update hero sections** - Homepage en discover (20 min)
4. **Update cards** - Location cards met cuisine kleuren (20 min)
5. **Polish details** - Header, footer, kleine aanpassingen (20 min)

**Totale tijd: ~2 uur voor basis implementatie**

---

## 💡 Tips

1. **Test incrementeel** - Implementeer één stap tegelijk en test in browser
2. **Use browser DevTools** - Inspecteer elementen en tweak kleuren live
3. **Screenshot before/after** - Maak screenshots voor vergelijking
4. **Get feedback** - Laat anderen naar het nieuwe design kijken
5. **Iterate** - Verfijn kleuren op basis van feedback

---

## 🆘 Troubleshooting

### Kleuren werken niet
- Check of je `globals.css` correct import in `layout.tsx`
- Ververs de browser cache (Cmd+Shift+R)
- Check of CSS variabelen correct zijn gedefinieerd in `:root`

### Gradients zien er vreemd uit
- Check of HSL waarden correct zijn
- Verify dat alpha/opacity values kloppen
- Test in verschillende browsers

### Performance issues
- Gebruik `will-change: transform` voor animaties
- Reduce aantal blur effects
- Optimize gradient complexity

---

## 📞 Volgende Stappen

Na deze quick start implementatie:

1. **Review het resultaat** - Evalueer de visuele impact
2. **Collect feedback** - Van team en gebruikers
3. **Iterate** - Verfijn kleuren waar nodig
4. **Expand** - Implementeer advanced features uit hoofddocument
5. **Document** - Update design system documentatie

---

*Quick Start Gids - Versie 1.0*  
*Geschatte implementatie tijd: 2 uur*  
*Niveau: Intermediate*

