# Quick Start - Dashboard Insights

## Stap 1: Restart Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

## Stap 2: Open Dashboard

```
http://localhost:3007/manager/[tenantId]/dashboard
```

## Stap 3: Scroll Down

Nieuwe widgets zijn ONDER de bestaande content:

```
[Bestaande Content]
├─ Top Navigation
├─ Location Selector
├─ Stats Cards (4)
├─ Filters & Search
├─ Bookings List
├─ Calendar Widget
├─ Waitlist Widget
├─ CRM Widget
│
└─ [NIEUW] Dashboard Insights
    ├─ Growth Metrics (4 cards)
    ├─ Detailed Analysis (3 cards)
    └─ Status Distribution
```

## Wat Je Ziet

### Growth Metrics (4 Cards)

1. **Groei Deze Week**
   - Percentage vs vorige week
   - Groen voor positief, rood voor negatief

2. **Laatste 30 Dagen**
   - Totaal reserveringen
   - Gemiddeld per dag

3. **Bevestigingsratio**
   - Percentage bevestigd
   - Van totaal reserveringen

4. **Geannuleerd/No-show**
   - Totaal aantal
   - Percentage van totaal

### Detailed Analysis (3 Cards)

1. **Populairste Tijden**
   - Top 5 drukste uren
   - Visual bars
   - Absolute aantallen

2. **Vestigingen**
   - Performance per locatie
   - Bevestigingsratio
   - Gasten statistieken

3. **Drukste Dagen**
   - Alle dagen van de week
   - Populariteit ranking
   - Visual bars

### Status Distribution (Full Width)

5 categorieën met grote getallen en iconen:
- Bevestigd (groen)
- In afwachting (oranje)
- Voltooid (blauw)
- Geannuleerd (rood)
- No-show (oranje)

## Responsive Design

**Mobile (< 640px):**
- 1 kolom layout
- Alle widgets stapelen verticaal
- Readable text sizes

**Tablet (640px - 1024px):**
- 2 kolommen waar mogelijk
- Optimaal ruimtegebruik

**Desktop (> 1024px):**
- 4 kolommen growth metrics
- 3 kolommen detailed analysis
- 5 kolommen status distribution

## Features

### Real-time Data
- Automatisch berekend uit bookings
- Geen API calls nodig
- Instant updates

### Visual Indicators
- Progress bars voor vergelijkingen
- Color coding per status
- Trend icons (up/down)
- Badge rankings

### Professional Design
- Reserve4You branding
- Consistent kleuren
- Clean typography
- No emoji (professioneel)

## Extra Analytics (Optional)

**File:** `DASHBOARD_INSIGHTS_QUERIES.sql`

Run in Supabase SQL Editor voor:
- Weekly growth detailed
- Location rankings
- Time slot analysis
- Customer loyalty
- Revenue estimates
- No-show patterns
- Much more...

## Verificatie

**Checklist:**
- [ ] Server gestart
- [ ] Dashboard geladen
- [ ] Scroll naar beneden
- [ ] Zie "Inzichten & Analyses" header
- [ ] 4 growth metric cards zichtbaar
- [ ] 3 detailed analysis cards zichtbaar
- [ ] Status distribution zichtbaar
- [ ] Data klopt met bookings
- [ ] Responsive op mobiel
- [ ] Geen console errors

## Troubleshooting

### Widgets niet zichtbaar?
```bash
# Hard refresh browser
Cmd+Shift+R (Mac)
Ctrl+Shift+R (Windows)

# Clear cache
Cmd+Option+E (Safari)
Ctrl+Shift+Delete (Chrome)
```

### Data niet correct?
- Check of je bookings hebt in database
- Verify locations zijn actief
- Check datum formats

### Layout broken?
- Resize browser window
- Check responsive breakpoints
- Test op echt mobiel device

## Success!

Als alles werkt zie je:
- Professionele analytics widgets
- Real-time data
- Responsive design
- Reserve4You branding
- Waardevolle business insights

Dashboard is nu compleet met geavanceerde analytics!

