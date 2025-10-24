# Reviews Systeem Implementatie

## Overzicht
Complete review systeem voor Reserve4You met professionele, cleane UI consistent met de bestaande branding.

## 1. Database Schema (SQL Migration)
**Bestand:** `supabase/migrations/20250124000015_reviews_system.sql`

### Tabellen:
- **reviews** - Customer reviews met sterren rating
  - Gekoppeld aan location en consumer
  - Verificatie via completed bookings
  - Published status voor moderatie
  
- **review_replies** - Owner/manager responses
  - Één reply per review
  - Gekoppeld aan auth user
  
- **review_helpful_votes** - Nuttige review votes
  - Users kunnen reviews als nuttig markeren

### Features:
- Automatische review statistieken updates
- Triggers voor cached statistics op locations tabel
- RLS policies voor security
- Helper functies voor review summaries
- Notification support

## 2. Homepage Secties
**Bestand:** `app/page.tsx`, `lib/auth/tenant-dal.ts`

### Nieuwe secties toegevoegd:
- **Stijgen** - Trending restaurants met stijgende ratings
- **Best Beoordeeld** - Hoogst gewaardeerde restaurants
- **Nieuw op Reserve4You** - Recent toegevoegde restaurants

### Functies:
- `getTrendingLocations()` - Sorteert op momentum (reviews × rating)
- `getBestRatedLocations()` - Sorteert op gemiddelde rating
- `getNewLocations()` - Nieuwste locaties
- Grid layout met 5 items per rij

## 3. LocationCard met Reviews
**Bestand:** `components/location/LocationCard.tsx`

### Updates:
- Review count en average rating display
- Star rating component integratie
- Conditionele rendering van reviews

## 4. Star Rating Component
**Bestand:** `components/reviews/StarRating.tsx`

### Features:
- Clean design zonder emoji's
- Interactive mode voor input
- Verschillende groottes (sm, md, lg)
- Half-star support
- Consistent met R4Y branding

## 5. Reviews Display op Locatie Pagina
**Bestanden:**
- `app/p/[slug]/LocationDetailClient.tsx`
- `components/reviews/ReviewsDisplay.tsx`
- `components/reviews/CreateReviewDialog.tsx`

### Features:
- Reviews tab in locatie detail
- Filter op rating (1-5 sterren)
- Verified booking badges
- Owner replies weergave
- "Schrijf een review" dialog
- Nuttige votes display

## 6. API Endpoints
**Bestanden:**
- `app/api/reviews/route.ts`
- `app/api/reviews/[reviewId]/reply/route.ts`

### Endpoints:
- `GET /api/reviews?locationId={id}&rating={rating}` - Fetch reviews
- `POST /api/reviews` - Create review
- `POST /api/reviews/{id}/reply` - Create/update reply
- `DELETE /api/reviews/{id}/reply` - Delete reply

### Security:
- Authenticated users only
- Consumer verification
- Location ownership checks
- Automatic notifications

## 7. Dashboard Reviews Management
**Bestand:** `components/manager/ReviewsManagement.tsx`

### Features voor Eigenaren:
- Review statistics dashboard
  - Totaal reviews
  - Gemiddelde rating
  - 5-sterren count
- Rating distribution visualization
- Review list met filters
- Reply functionality
  - Create reply
  - Edit reply
  - Delete reply
- Verified booking badges
- Professional reply interface

### Dashboard Integratie:
- Reviews tab toegevoegd aan LocationManagement
- Beschikbaar in `/manager/[tenantId]/location/[locationId]`
- Star icon in tab navigation

## 8. Notifications Systeem
Geïntegreerd in review creation en replies:
- Nieuwe review → Notificatie naar eigenaar/manager
- Owner reply → Notificatie naar review auteur
- Type: 'NEW_REVIEW', 'REVIEW_REPLY'
- Met action_url voor deep linking

## SQL Script Om Uit Te Voeren

```bash
cd /Users/dietmar/Desktop/ray2
npx supabase db push
```

Dit zal de reviews migration uitvoeren en alle benodigde tabellen, indexes en functies aanmaken.

## Testing Checklist

### Voor Klanten:
- [ ] Reviews bekijken op locatie pagina
- [ ] Review schrijven na completed booking
- [ ] Verified badge zien bij geverifieerde reviews
- [ ] Owner replies lezen
- [ ] Reviews filteren op rating

### Voor Eigenaren:
- [ ] Reviews bekijken in dashboard
- [ ] Review statistieken zien
- [ ] Reageren op reviews
- [ ] Replies bewerken/verwijderen
- [ ] Notificaties ontvangen voor nieuwe reviews

### Homepage:
- [ ] Stijgen sectie met trending restaurants
- [ ] Best Beoordeeld sectie met top-rated
- [ ] Nieuw op Reserve4You sectie
- [ ] Review ratings op location cards

## Toekomstige Verbeteringen

1. **Review Moderatie**
   - Flag inappropriate reviews
   - Admin moderation panel
   - Hide/unhide reviews

2. **Advanced Filtering**
   - Sort by helpfulness
   - Filter by verified only
   - Date range filters

3. **Review Analytics**
   - Sentiment analysis
   - Response time metrics
   - Customer satisfaction trends

4. **Images in Reviews**
   - Allow photo uploads
   - Image moderation
   - Gallery view

5. **Review Incentives**
   - Discount codes for reviews
   - Loyalty points
   - Review badges

## Branding & Design

Het systeem volgt de Reserve4You design guidelines:
- Clean, professionele look
- Geen emoji's (alleen icons)
- Consistent color scheme
- Responsive design
- Toegankelijk voor alle gebruikers

## Security & Privacy

- RLS policies op alle review tabellen
- Owner/manager authorization checks
- Consumer profile protection
- SQL injection prevention
- XSS protection via React

## Performance

- Cached review statistics op locations tabel
- Indexed queries voor snelle lookups
- Pagination ready (voorbereiding)
- Optimized SQL queries
- React suspense support

