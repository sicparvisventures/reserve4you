# Reserve4You Social Expansion - Product Requirements Document
## "The Social Graph of Taste"

**Versie:** 1.0  
**Datum:** Januari 2025  
**Status:** Planning  
**Doel:** Uitbreiding van Reserve4You met sociale functies zonder bestaande functionaliteit te wijzigen

---

## EXECUTIVE SUMMARY

Dit document beschrijft de implementatie van een sociale laag binnen Reserve4You die de bestaande booking-functionaliteit uitbreidt naar een sociaal platform voor het delen en ontdekken van dinerervaringen. Alle bestaande functionaliteit, UI/UX en terminologie blijft ongewijzigd. De sociale features worden toegevoegd als aanvullende functionaliteit.

**Kernprincipe:** Reservaties vormen de entry point naar het sociale ecosysteem zonder de bestaande booking flow te verstoren.

---

## 1. KERNCONCEPT EN POSITIONERING

### Taglines
- "Discover. Dine. Share."
- "Your social map of moments."
- "Reserve the moment."

### Concept
Reserve4You wordt een digitaal dagboek van het sociale leven:
- Waar je was
- Met wie
- Wat je vond
- Wat je aanbeveelt

Reservaties vormen de entry point naar het sociale ecosysteem, waarbij elke reservatie automatisch potentieel content wordt.

### Positionering ten opzichte van concurrenten

| Platform | Doel | Sociale focus |
|----------|------|---------------|
| The Fork / Resy | Utility (book a table) | Geen social layer |
| TripAdvisor / Yelp | Reviews | Verouderde UX |
| **R4Y** | Experience graph (booking + memories + social) | Sociale & AI-gedreven ontdekkingslaag |

**Unique Selling Proposition:** "The social network for real-world experiences."

---

## 2. DESIGN PRINCIPLES

### Non-Breaking Integration
1. **Geen wijzigingen aan bestaande UI/UX**
   - Alle huidige pagina's, componenten en flows blijven identiek
   - Bestaande terminologie (reservaties, locaties, etc.) blijft ongewijzigd
   - Bestaande user flows blijven volledig functioneel

2. **Additive Only**
   - Sociale features worden toegevoegd als extra tabbladen/secties
   - Nieuwe navigatie-items worden toegevoegd, geen bestaande verwijderd
   - Bestaande API endpoints blijven werken zoals voorheen

3. **Mobile-First & PWA**
   - Alle nieuwe features zijn geoptimaliseerd voor mobiele weergave
   - PWA-functionaliteit wordt verbeterd voor offline gebruik
   - Touch-optimized interacties

4. **Brand Consistent**
   - Gebruik bestaande Reserve4You kleuren: #FF5A5F (primary), warme tonen
   - Consistent met bestaande design system (Tailwind CSS, Radix UI)
   - Apple-like minimalism behouden

---

## 3. DATABASE SCHEMA UITBREIDINGEN

### 3.1 Social Profile Extensions

**Uitbreiding op `consumers` tabel:**
```sql
ALTER TABLE consumers ADD COLUMN IF NOT EXISTS 
  profile_picture_url TEXT,
  bio TEXT,
  favorite_cuisines TEXT[],
  top_3_restaurants UUID[],
  is_profile_public BOOLEAN DEFAULT true,
  show_in_discover BOOLEAN DEFAULT true;
```

**Nieuwe tabel: `consumer_social_preferences`**
```sql
CREATE TABLE consumer_social_preferences (
  consumer_id UUID PRIMARY KEY REFERENCES consumers(id) ON DELETE CASCADE,
  auto_share_bookings BOOLEAN DEFAULT false,
  auto_share_reviews BOOLEAN DEFAULT false,
  show_location_to_friends BOOLEAN DEFAULT true,
  allow_friend_requests BOOLEAN DEFAULT true,
  notification_new_follower BOOLEAN DEFAULT true,
  notification_activity_feed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Social Graph

**Nieuwe tabel: `follows`**
```sql
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
```

**Nieuwe tabel: `location_follows`**
```sql
CREATE TABLE location_follows (
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (consumer_id, location_id)
);
```

### 3.3 Activity Feed & Moments

**Nieuwe tabel: `activity_feed`**
```sql
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'booking', 'review', 'photo', 'check_in', 'follow'
  target_type VARCHAR(50) NOT NULL, -- 'location', 'booking', 'review', 'consumer'
  target_id UUID NOT NULL,
  metadata JSONB, -- Flexible storage for activity-specific data
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_feed_actor ON activity_feed(actor_id, created_at DESC);
CREATE INDEX idx_activity_feed_public ON activity_feed(is_public, created_at DESC);
CREATE INDEX idx_activity_feed_type ON activity_feed(activity_type, created_at DESC);
```

**Nieuwe tabel: `moment_photos`**
```sql
CREATE TABLE moment_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_moment_photos_booking ON moment_photos(booking_id);
CREATE INDEX idx_moment_photos_location ON moment_photos(location_id, created_at DESC);
CREATE INDEX idx_moment_photos_consumer ON moment_photos(consumer_id, created_at DESC);
```

### 3.4 Social Interactions

**Nieuwe tabel: `feed_likes`**
```sql
CREATE TABLE feed_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, consumer_id)
);

CREATE INDEX idx_feed_likes_activity ON feed_likes(activity_id);
```

**Nieuwe tabel: `feed_comments`**
```sql
CREATE TABLE feed_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feed_comments_activity ON feed_comments(activity_id, created_at DESC);
```

### 3.5 Seen Together (Social Discovery)

**Nieuwe tabel: `booking_companions`**
```sql
CREATE TABLE booking_companions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES consumers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id, consumer_id)
);

CREATE INDEX idx_booking_companions_booking ON booking_companions(booking_id);
CREATE INDEX idx_booking_companions_consumer ON booking_companions(consumer_id);
```

### 3.6 Loyalty & Gamification

**Nieuwe tabel: `flow_credits` (of uitbreiding bestaande loyalty)**
```sql
CREATE TABLE flow_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  amount INT NOT NULL DEFAULT 0,
  source VARCHAR(50) NOT NULL, -- 'review', 'invite', 'share', 'photo', 'referral'
  source_id UUID, -- Reference to source (review_id, booking_id, etc.)
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flow_credits_consumer ON flow_credits(consumer_id, created_at DESC);
```

**Nieuwe tabel: `user_badges`**
```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL, -- 'food_explorer', 'local_hero', 'top_taster', etc.
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  UNIQUE(consumer_id, badge_type)
);

CREATE INDEX idx_user_badges_consumer ON user_badges(consumer_id);
```

### 3.7 Chat & Invites

**Nieuwe tabel: `conversations`**
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL DEFAULT 'direct', -- 'direct', 'group'
  name TEXT, -- For group conversations
  created_by UUID REFERENCES consumers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Nieuwe tabel: `conversation_participants`**
```sql
CREATE TABLE conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, consumer_id)
);
```

**Nieuwe tabel: `messages`**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'booking_invite', 'location_share'
  metadata JSONB, -- For booking invites, location shares, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at DESC);
```

**Nieuwe tabel: `group_booking_invites`**
```sql
CREATE TABLE group_booking_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  proposed_date TIMESTAMPTZ,
  proposed_time TIME,
  party_size INT,
  created_by UUID NOT NULL REFERENCES consumers(id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.8 Discovery & Trends

**Nieuwe tabel: `location_trends` (cache voor trending)**
```sql
CREATE TABLE location_trends (
  location_id UUID PRIMARY KEY REFERENCES locations(id) ON DELETE CASCADE,
  momentum_score DECIMAL(10,2) DEFAULT 0, -- Calculated from recent activity
  trending_in_city TEXT,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_location_trends_momentum ON location_trends(momentum_score DESC);
```

---

## 4. FEATURE SPECIFICATIES

### 4.1 Profiles & Social Graph

#### 4.1.1 Public Consumer Profiles
**Locatie:** `/profile/[consumerId]` (nieuwe route naast bestaande `/profile`)

**Functionaliteit:**
- Publiek profiel met foto, bio, favoriete keukens
- Top 3 restaurants weergave
- Activity timeline tab (reservaties, foto's, reviews)
- Volgers/volgend overzicht
- Badges en achievements display

**Design:**
- Consistent met bestaande profile pagina
- Mobile-optimized card layout
- Warme kleuren consistent met branding

**API Endpoints:**
- `GET /api/social/profile/[consumerId]` - Fetch public profile
- `PUT /api/social/profile` - Update own profile
- `GET /api/social/profile/[consumerId]/activity` - Activity timeline

#### 4.1.2 Follow System
**Functionaliteit:**
- Volg andere consumers en restaurants
- Follow/unfollow buttons op profielen
- Followers/following count display

**API Endpoints:**
- `POST /api/social/follow` - Follow user/location
- `DELETE /api/social/follow` - Unfollow
- `GET /api/social/followers/[consumerId]` - Get followers list
- `GET /api/social/following/[consumerId]` - Get following list

#### 4.1.3 Seen Together Tagging
**Functionaliteit:**
- AI-gedreven detectie van mensen die samen reserveerden
- Opt-in tagging systeem
- "Invite to dinner" functionaliteit via booking flow

**Implementatie:**
- Trigger na booking completion
- Optie om companion toe te voegen via booking_companions tabel
- Display "Seen together" badge op profielen

### 4.2 Feed & Discovery

#### 4.2.1 Activity Feed
**Locatie:** `/feed` (nieuwe route)

**Functionaliteit:**
- Chronologische feed van activiteiten van gevolgde users
- Types: booking, review, photo upload, check-in, follow
- Like en comment functionaliteit
- Infinite scroll met pagination

**Design:**
- Instagram-achtige feed layout (mobile-first)
- Cards voor elke activity type
- Smooth scroll animaties

**API Endpoints:**
- `GET /api/social/feed` - Get activity feed (paginated)
- `POST /api/social/feed/like` - Like activity
- `POST /api/social/feed/comment` - Comment on activity

#### 4.2.2 Trending Now Feed
**Locatie:** `/discover/trending` (uitbreiding op bestaande discover pagina)

**Functionaliteit:**
- Top plekken per stad (real-time momentum)
- "Trending this week" sectie
- Trending badges op location cards

**Calculation:**
- Momentum score = (recent reviews × rating) + (recent bookings × weight) + (social shares × weight)
- Gecached in `location_trends` tabel
- Dagelijkse update via cron job

#### 4.2.3 AI-Curated Discovery
**Functionaliteit:**
- "Hidden gems you'd love" - AI suggesties op basis van voorkeuren
- "Date night spots trending in Ghent" - Context-aware suggesties
- "Places your friends loved" - Social graph based recommendations

**Implementatie:**
- OpenAI API voor taste profiling
- Personalization engine op basis van:
  - Review history
  - Booking history
  - Followed locations
  - Friends' preferences

**API Endpoints:**
- `GET /api/social/discover/ai-recommendations` - Get AI suggestions
- `GET /api/social/discover/friends-loved` - Friends' recommendations

#### 4.2.4 Map View met Social Layer
**Locatie:** Uitbreiding op bestaande `/discover` map

**Functionaliteit:**
- Pins voor vrienden' check-ins
- "Friends checked in here" markers
- Popular restaurants overlay
- Real-time activity heatmap

**Design:**
- Integratie in bestaande DiscoverMap component
- Toggle tussen standard en social view
- Mobile-optimized map controls

### 4.3 Reviews, Stories & Moments

#### 4.3.1 Mini-Stories na Reservatie
**Functionaliteit:**
- Na booking completion: optie "Add your night"
- Foto/video upload mogelijkheid
- Auto-tagging van venue via image recognition
- Korte caption optioneel

**UX Flow:**
1. Na booking completion modal verschijnt optionele "Share your night" button
2. Photo picker + caption input
3. Auto-suggested tags van venue
4. Post to feed optie

**Storage:**
- Supabase Storage voor foto's
- `moment_photos` tabel voor metadata
- Activity feed entry automatisch aangemaakt

#### 4.3.2 1-Click Review UX
**Functionaliteit:**
- Emoji + korte caption review optie
- Quick rating (1-5 stars)
- Auto-tagging van dishes via AI

**Design:**
- Bottom sheet modal (mobile-first)
- Emoji picker voor snelheid
- Voice-to-text optie voor caption

**API Endpoints:**
- `POST /api/reviews/quick` - Quick review creation
- `POST /api/reviews/photo` - Review with photo

#### 4.3.3 AI Review Summary
**Functionaliteit:**
- Automatische korte captions genereren ("Romantic vibe, great service")
- Sentiment analysis
- Key highlights extractie

**Implementatie:**
- OpenAI API voor text generation
- Background job na review creation

### 4.4 Chat & Invites

#### 4.4.1 In-App Chat
**Locatie:** `/messages` (nieuwe route)

**Functionaliteit:**
- Direct messaging tussen consumers
- Group conversations
- Booking planning polls ("Dinner next Friday?")
- Share location in chat
- Share booking in chat

**Design:**
- WhatsApp/Telegram-achtige interface
- Mobile-first chat bubbles
- Real-time updates via Supabase Realtime

**API Endpoints:**
- `GET /api/social/conversations` - List conversations
- `GET /api/social/conversations/[id]/messages` - Get messages
- `POST /api/social/conversations/[id]/messages` - Send message
- `POST /api/social/conversations` - Create conversation

#### 4.4.2 Group Planning & Booking
**Functionaliteit:**
- Poll voor datum/tijd ("Dinner next Friday?")
- "Reserve for all?" integratie met R4Y booking flow
- Group booking invites via chat

**UX Flow:**
1. User start poll in group chat
2. Members vote
3. "Reserve for all" button verschijnt
4. Redirect naar booking flow met pre-filled group size

#### 4.4.3 Smart Invites
**Functionaliteit:**
- Deelbare links met reservering direct geïntegreerd
- "Join my table" dynamic QR code
- One-click join via invite link

**Implementation:**
- Unique invite codes per booking
- QR code generation via booking_id
- Accept invite flow die booking_companions toevoegt

### 4.5 Loyalty, Gamification & Economy

#### 4.5.1 FlowCredits System
**Functionaliteit:**
- Verdien credits voor:
  - Review plaatsen: 10 credits
  - Vriend uitnodigen: 50 credits
  - Deelbare reservatie maken: 5 credits
  - Foto uploaden: 5 credits
  - Eerste reservatie: 20 credits
- Inwisselbaar voor:
  - Kortingen op restaurants
  - Priority bookings
  - Exclusive events access

**Display:**
- Credits counter in profile
- Transaction history
- Redemption options

**API Endpoints:**
- `GET /api/social/loyalty/credits` - Get balance
- `GET /api/social/loyalty/history` - Transaction history
- `POST /api/social/loyalty/redeem` - Redeem credits

#### 4.5.2 Levels & Badges
**Functionaliteit:**
- Badges:
  - "Food Explorer" (10 nieuwe plekken bezocht)
  - "Local Hero" (5 reviews in één stad)
  - "Top Taster" (leaderboard top 10 per stad)
  - "Social Butterfly" (50 followers)
  - "Review Master" (25 reviews geschreven)

**Display:**
- Badge showcase op profiel
- Achievement notifications
- Leaderboards per stad

**API Endpoints:**
- `GET /api/social/badges` - Get user badges
- `GET /api/social/leaderboard/[city]` - Get leaderboard

### 4.6 AI & Personalization Layer

#### 4.6.1 R4Y Taste AI
**Functionaliteit:**
- Leert smaakvoorkeuren (keukens, vibes, prijscategorie)
- Automatische reservatie suggesties
- "1-tap booking" voor AI-suggesties

**Data Sources:**
- Booking history
- Review content (sentiment analysis)
- Favorites
- Followed locations
- Friends' preferences

**Implementation:**
- OpenAI embeddings voor taste profiling
- Vector database voor similarity search
- Daily personalized recommendations

**API Endpoints:**
- `GET /api/social/ai/taste-profile` - Get taste profile
- `GET /api/social/ai/recommendations` - Get personalized recommendations
- `POST /api/social/ai/feedback` - Feedback on recommendations

#### 4.6.2 Smart Rewind
**Functionaliteit:**
- "Where you ate a year ago today" herinneringen
- Monthly "Your Dining Story" recap
- Similar to Spotify Wrapped

**Display:**
- Push notification trigger
- Dedicated recap page
- Shareable summary

**Implementation:**
- Background job voor daily checks
- Template-based recap generation
- Image carousel van visited locations

#### 4.6.3 Auto-Highlights
**Functionaliteit:**
- Maandelijkse "Your Dining Story" recap
- Top 5 restaurants van de maand
- Most shared moments
- Favorite cuisines discovery

### 4.7 Integraties

#### 4.7.1 Instagram Auto-Share (Future)
**Functionaliteit:**
- Optionele Instagram sharing na booking/review
- Formatted post met venue info
- Link back to R4Y

**Implementation:**
- Instagram Basic Display API
- User opt-in required
- OAuth flow voor permissions

#### 4.7.2 Apple Wallet / Google Wallet
**Functionaliteit:**
- Digital booking tickets met QR-code
- Auto-add to wallet na booking confirmation
- Offline access

**Implementation:**
- Apple Wallet PassKit
- Google Wallet API
- QR code generation per booking

#### 4.7.3 Google Maps Places API
**Functionaliteit:**
- Map-based stories
- "Friends checked in here" markers
- Enhanced location data

---

## 5. TECHNISCHE IMPLEMENTATIE

### 5.1 Frontend Architecture

#### 5.1.1 Nieuwe Routes
```
app/
├── feed/                          # Activity feed
│   ├── page.tsx
│   └── FeedClient.tsx
├── messages/                      # Chat
│   ├── page.tsx
│   ├── [conversationId]/
│   │   └── page.tsx
│   └── MessagesClient.tsx
├── profile/
│   ├── [consumerId]/              # Public profiles (nieuw)
│   │   ├── page.tsx
│   │   └── PublicProfileClient.tsx
│   └── ... (bestaande blijft)
└── discover/
    └── trending/                  # Trending feed (nieuw)
        └── page.tsx
```

#### 5.1.2 Componenten Structuur
```
components/
├── social/
│   ├── ActivityFeed.tsx           # Main feed component
│   ├── ActivityCard.tsx           # Individual activity item
│   ├── FollowButton.tsx           # Follow/unfollow button
│   ├── ProfileHeader.tsx          # Public profile header
│   ├── BadgeDisplay.tsx           # Badges showcase
│   ├── Leaderboard.tsx            # Leaderboard component
│   ├── MomentUpload.tsx           # Photo upload for moments
│   └── ShareBookingModal.tsx      # Share booking flow
├── chat/
│   ├── ChatList.tsx               # Conversations list
│   ├── ChatWindow.tsx             # Chat interface
│   ├── MessageBubble.tsx          # Individual message
│   ├── GroupBookingPoll.tsx       # Poll component
│   └── BookingInvite.tsx          # Booking invite in chat
└── loyalty/
    ├── CreditsDisplay.tsx         # Credits counter
    ├── CreditsHistory.tsx         # Transaction history
    └── BadgesList.tsx             # Badges grid
```

#### 5.1.3 State Management
- React Query voor server state (feed, profiles, messages)
- Zustand voor client-side state (chat, active conversations)
- Supabase Realtime voor live updates (messages, feed, notifications)

### 5.2 Backend Architecture

#### 5.2.1 API Routes
```
app/api/
├── social/
│   ├── profile/
│   │   ├── [consumerId]/
│   │   │   └── route.ts           # Get public profile
│   │   └── route.ts               # Update own profile
│   ├── follow/
│   │   └── route.ts               # Follow/unfollow
│   ├── feed/
│   │   ├── route.ts               # Get activity feed
│   │   ├── like/
│   │   │   └── route.ts           # Like activity
│   │   └── comment/
│   │       └── route.ts           # Comment on activity
│   ├── discover/
│   │   ├── trending/
│   │   │   └── route.ts           # Trending locations
│   │   ├── ai-recommendations/
│   │   │   └── route.ts           # AI suggestions
│   │   └── friends-loved/
│   │       └── route.ts           # Friends' recommendations
│   ├── moments/
│   │   └── route.ts               # Upload moment photo
│   ├── loyalty/
│   │   ├── credits/
│   │   │   └── route.ts           # Credits balance
│   │   ├── history/
│   │   │   └── route.ts           # Transaction history
│   │   └── redeem/
│   │       └── route.ts           # Redeem credits
│   └── badges/
│       └── route.ts               # Get badges
├── conversations/
│   ├── route.ts                   # List/create conversations
│   ├── [conversationId]/
│   │   ├── messages/
│   │   │   └── route.ts           # Get/send messages
│   │   └── route.ts               # Conversation details
└── ai/
    ├── taste-profile/
    │   └── route.ts               # Get taste profile
    └── recommendations/
        └── route.ts               # Get recommendations
```

#### 5.2.2 Database Functions & Triggers

**Activity Feed Auto-Generation:**
```sql
-- Trigger: Auto-create activity feed entry on booking completion
CREATE OR REPLACE FUNCTION create_booking_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    INSERT INTO activity_feed (actor_id, activity_type, target_type, target_id, metadata)
    VALUES (
      NEW.consumer_id,
      'booking',
      'location',
      NEW.location_id,
      jsonb_build_object(
        'booking_id', NEW.id,
        'location_name', (SELECT name FROM locations WHERE id = NEW.location_id),
        'party_size', NEW.party_size,
        'date', NEW.start_time
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_activity_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_booking_activity();
```

**FlowCredits Auto-Award:**
```sql
-- Trigger: Award credits on review creation
CREATE OR REPLACE FUNCTION award_review_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO flow_credits (consumer_id, amount, source, source_id)
  VALUES (NEW.consumer_id, 10, 'review', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER review_credits_trigger
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION award_review_credits();
```

**Trending Calculation:**
```sql
-- Function: Calculate location momentum score
CREATE OR REPLACE FUNCTION calculate_location_momentum(loc_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  momentum DECIMAL;
BEGIN
  SELECT 
    COALESCE((
      -- Recent reviews (last 7 days) weighted by rating
      SELECT SUM(rating * 2) 
      FROM reviews 
      WHERE location_id = loc_id 
      AND created_at > NOW() - INTERVAL '7 days'
    ), 0) +
    COALESCE((
      -- Recent bookings (last 7 days)
      SELECT COUNT(*) * 1.5 
      FROM bookings 
      WHERE location_id = loc_id 
      AND created_at > NOW() - INTERVAL '7 days'
    ), 0) +
    COALESCE((
      -- Social shares (last 7 days)
      SELECT COUNT(*) * 3 
      FROM activity_feed 
      WHERE target_type = 'location' 
      AND target_id = loc_id 
      AND created_at > NOW() - INTERVAL '7 days'
    ), 0)
  INTO momentum;
  
  RETURN momentum;
END;
$$ LANGUAGE plpgsql;
```

#### 5.2.3 Edge Functions (Supabase)

**AI Taste Profile Generator:**
```typescript
// supabase/functions/generate-taste-profile/index.ts
// Generates taste profile embeddings using OpenAI
```

**AI Recommendation Engine:**
```typescript
// supabase/functions/ai-recommendations/index.ts
// Generates personalized recommendations
```

**Daily Trending Update:**
```typescript
// supabase/functions/update-trending/index.ts
// Cron job to update location_trends table
```

### 5.3 Real-time Updates

**Supabase Realtime Subscriptions:**
- Activity feed updates
- New messages in conversations
- New followers
- Like/comment notifications
- Friend activity updates

**Implementation:**
```typescript
// Example: Real-time feed updates
const subscription = supabase
  .channel('activity_feed')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'activity_feed',
    filter: `actor_id=in.(${followingIds.join(',')})`
  }, (payload) => {
    // Add new activity to feed
  })
  .subscribe();
```

### 5.4 Storage

**Supabase Storage Buckets:**
- `profile-pictures` - User profile photos
- `moment-photos` - Moment/story photos
- `review-photos` - Review attachments

**RLS Policies:**
- Users can upload their own profile pictures
- Users can upload photos for their own bookings/moments
- Public read access for published content

---

## 6. UI/UX SPECIFICATIES

### 6.1 Mobile-First Design

**Breakpoints:**
- Mobile: < 768px (primary focus)
- Tablet: 768px - 1024px
- Desktop: > 1024px (enhanced features)

**Touch Targets:**
- Minimum 44x44px voor alle interactive elements
- Generous spacing tussen clickable items
- Swipe gestures waar mogelijk

### 6.2 Navigation Additions

**Bottom Navigation (Mobile):**
```
[Home] [Discover] [Feed] [Messages] [Profile]
```

**Hamburger Menu (Desktop):**
- Bestaande items blijven
- Nieuwe items toegevoegd:
  - Feed
  - Messages
  - Leaderboards
  - Badges

### 6.3 Feed Design

**Activity Card Layout:**
- Profile picture (circular, 40px)
- User name + activity type
- Location card preview
- Photo (if applicable)
- Like/comment actions
- Timestamp

**Card Types:**
1. Booking card - "Lisa reserved a table at MESH Surf & Turf"
2. Review card - "Tom reviewed MESH Surf & Turf with 5 stars"
3. Photo card - "Sarah shared a photo from MESH Surf & Turf"
4. Follow card - "Mike followed MESH Surf & Turf"

### 6.4 Profile Design

**Public Profile Layout:**
- Hero section met profile picture, name, bio
- Stats row: Following, Followers, Reviews, Badges
- Tab navigation: Activity | Favorites | Reviews | Badges
- Grid layout voor activity items
- Follow/Message buttons prominent

### 6.5 Chat Design

**Conversation List:**
- Avatar + name
- Last message preview
- Unread badge
- Timestamp

**Chat Window:**
- Message bubbles (sent/received styling)
- Input bar met emoji picker
- Attachment button
- Send button

### 6.6 Color Scheme

**Bestaande Reserve4You Kleuren:**
- Primary: #FF5A5F (coral red)
- Background: Warm tones (#F9F5F2)
- Text: Near black (#111111)

**Social Layer Additions:**
- Activity feed: Subtle warm backgrounds
- Chat: Light gray bubbles, primary for sent
- Badges: Gradient backgrounds
- Trends: Primary accent voor trending badges

---

## 7. IMPLEMENTATIE ROADMAP

### Phase 1: Foundation (MVP v1.0)
**Timeline:** 4-6 weken

**Database:**
- Alle schema migrations
- RLS policies
- Basic triggers

**Backend:**
- Profile API endpoints
- Follow system API
- Basic activity feed generation
- FlowCredits system

**Frontend:**
- Public profile pages
- Follow/unfollow functionality
- Basic activity feed display
- Credits display in profile

**Deliverables:**
- Users can follow each other
- Basic activity feed visible
- Profile pages functional

### Phase 2: Content & Discovery (MVP v1.1)
**Timeline:** 3-4 weken

**Backend:**
- Photo upload endpoints
- Moment creation
- Review sharing to feed
- Trending calculation

**Frontend:**
- Photo upload UI
- Moment cards in feed
- "Share your night" flow
- Trending locations page

**Deliverables:**
- Users can upload photos after bookings
- Feed shows rich content
- Trending discovery functional

### Phase 3: Social Interactions (MVP v1.2)
**Timeline:** 3-4 weken

**Backend:**
- Like/comment endpoints
- Real-time notifications
- Chat API

**Frontend:**
- Like/comment UI
- Chat interface
- Notification center
- Real-time updates

**Deliverables:**
- Full social interaction layer
- Chat functional
- Real-time notifications

### Phase 4: AI & Personalization (MVP v1.3)
**Timeline:** 4-5 weken

**Backend:**
- AI taste profile generation
- Recommendation engine
- Daily trending updates
- Smart rewind generation

**Frontend:**
- AI recommendations display
- Personalized feed
- Smart rewind page
- Taste profile visualization

**Deliverables:**
- AI-powered discovery
- Personalized recommendations
- Monthly recaps

### Phase 5: Advanced Features
**Timeline:** Ongoing

- Group booking planning
- Badges & gamification
- Leaderboards
- Advanced analytics
- Instagram integration
- Wallet integration

---

## 8. TESTING STRATEGY

### 8.1 Unit Tests
- API endpoint tests
- Database function tests
- Component tests

### 8.2 Integration Tests
- Full user flows (follow → see in feed)
- Chat message delivery
- Activity feed generation
- Credits awarding

### 8.3 E2E Tests
- Complete social flows
- Mobile interactions
- Real-time updates

### 8.4 Performance Tests
- Feed loading performance
- Chat message throughput
- Real-time subscription limits
- Image upload optimization

---

## 9. SECURITY & PRIVACY

### 9.1 RLS Policies

**Activity Feed:**
- Users can only see public activities or activities from followed users
- Private activities only visible to creator

**Messages:**
- Users can only access conversations they're part of
- No cross-conversation access

**Profiles:**
- Public profiles visible to all
- Private profiles only to followers

### 9.2 Data Privacy

**User Controls:**
- Privacy settings for auto-sharing
- Opt-out van discover
- Block users functionality
- Report content

**GDPR Compliance:**
- Data export functionality
- Account deletion (cascade)
- Privacy policy updates

### 9.3 Content Moderation

**Automated:**
- Profanity filter for reviews/comments
- Image content moderation (future)
- Spam detection

**Manual:**
- Flag content functionality
- Admin moderation dashboard
- Review approval workflow

---

## 10. PERFORMANCE OPTIMIZATIONS

### 10.1 Database

**Indexing:**
- All foreign keys indexed
- Activity feed indexed on actor_id, created_at
- Messages indexed on conversation_id, created_at

**Caching:**
- Trending locations cached (daily refresh)
- Profile data cached (5 min TTL)
- Feed pagination cached

### 10.2 Frontend

**Code Splitting:**
- Lazy load feed component
- Lazy load chat interface
- Route-based code splitting

**Image Optimization:**
- Next.js Image component
- WebP format
- Responsive sizes
- Lazy loading

### 10.3 Real-time

**Subscription Optimization:**
- Channel filters for efficiency
- Debounce updates
- Batch notifications

---

## 11. MONITORING & ANALYTICS

### 11.1 Metrics

**Engagement:**
- Daily active users (DAU)
- Feed interactions per user
- Messages sent per day
- Follow growth rate

**Content:**
- Photos uploaded per day
- Reviews shared to feed
- Trending locations views

**Retention:**
- Weekly returning users
- Feed engagement rate
- Chat usage frequency

### 11.2 Error Tracking

**Tools:**
- Sentry voor error tracking
- Supabase logs voor database errors
- Vercel Analytics voor performance

---

## 12. SUCCESS METRICS

### 12.1 KPIs

**Month 1:**
- 50% of users have public profiles
- 30% of users following at least 5 people
- 1000+ activities in feed per day

**Month 3:**
- Average 5 feed interactions per user per day
- 40% of bookings result in photo upload
- 20% of reviews shared to feed

**Month 6:**
- 60% daily active users
- Average 10 minutes per session
- 500+ conversations per day

### 12.2 Engagement Goals

- Feed visit frequency: 3+ times per week
- Average session duration: 8+ minutes
- Content creation rate: 20% of users create content monthly

---

## 13. FUTURE ENHANCEMENTS

### 13.1 Advanced Features

- Video stories (24-hour expiration)
- Live location sharing
- Event creation & RSVP
- Restaurant partnerships & exclusive deals
- Influencer program

### 13.2 Integrations

- Instagram auto-share
- Apple/Google Wallet
- Calendar sync
- Email digest
- SMS notifications

### 13.3 Monetization

- Sponsored content in feed
- Premium features (R4Y+)
- Restaurant advertising
- Affiliate partnerships

---

## 14. APPENDIX

### 14.1 Terminology Reference

**Bestaande Terminologie (Blijft Ongewijzigd):**
- Reservatie / Booking
- Locatie / Location
- Gast / Consumer
- Restaurant / Venue

**Nieuwe Sociale Terminologie:**
- Activiteit / Activity
- Moment / Moment
- Feed / Feed
- Volger / Follower
- Credits / Credits
- Badge / Badge

### 14.2 API Response Examples

**Activity Feed Response:**
```json
{
  "activities": [
    {
      "id": "uuid",
      "actor": {
        "id": "uuid",
        "name": "Lisa",
        "profile_picture_url": "https://..."
      },
      "activity_type": "booking",
      "target": {
        "type": "location",
        "id": "uuid",
        "name": "MESH Surf & Turf"
      },
      "metadata": {
        "party_size": 2,
        "date": "2025-01-20"
      },
      "likes_count": 5,
      "comments_count": 2,
      "created_at": "2025-01-20T19:00:00Z"
    }
  ],
  "pagination": {
    "next_cursor": "cursor",
    "has_more": true
  }
}
```

### 14.3 Database Migration Order

1. Extend `consumers` table
2. Create `consumer_social_preferences`
3. Create `follows` and `location_follows`
4. Create `activity_feed`
5. Create `moment_photos`
6. Create `feed_likes` and `feed_comments`
7. Create `booking_companions`
8. Create `flow_credits`
9. Create `user_badges`
10. Create `conversations`, `conversation_participants`, `messages`
11. Create `group_booking_invites`
12. Create `location_trends`
13. Create triggers and functions
14. Create RLS policies
15. Create indexes

---

**Einde Document**

