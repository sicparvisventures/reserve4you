# 🌟 Spotlight Feature - Setup Instructions

## 🚨 Quick Fix for Current Errors

Je krijgt nu errors omdat de Spotlight kolommen nog niet bestaan in de database. Volg deze stappen:

---

## ✅ Step 1: Run Minimal SQL Script (RECOMMENDED)

**Waarom minimaal eerst?**
- Sneller (geen timeout in Supabase)
- Alleen essentiële kolommen
- Minder kans op errors

**In Supabase SQL Editor:**

```sql
-- Copy/paste dit in Supabase SQL Editor en run:

ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS spotlight_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS spotlight_priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS spotlight_activated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS spotlight_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS spotlight_stripe_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS idx_locations_spotlight 
ON locations(spotlight_enabled, spotlight_priority DESC, created_at DESC)
WHERE spotlight_enabled = TRUE AND is_active = TRUE AND is_public = TRUE;
```

**Dit voegt toe:**
- ✅ spotlight_enabled (boolean)
- ✅ spotlight_priority (integer)
- ✅ spotlight_activated_at (timestamp)
- ✅ spotlight_expires_at (timestamp)  
- ✅ spotlight_stripe_subscription_id (text)
- ✅ Performance index

---

## ✅ Step 2: Refresh Homepage

```bash
# In je terminal:
# Simpel de page refreshen in browser
# Of herstart dev server:
npm run dev
```

**Check:**
1. Homepage laadt zonder errors
2. Console errors zijn weg
3. Spotlight carousel is nog niet zichtbaar (geen spotlight locations)

---

## ✅ Step 3: Activeer Spotlight voor Test Restaurant

**Via Manager Dashboard:**

1. Login als manager
2. Ga naar je restaurant
3. Click "Locatie Instellingen" tab
4. Scroll naar beneden naar "Spotlight Feature"
5. Zet de toggle **AAN** ✅
6. Refresh homepage
7. **Je restaurant verschijnt nu in de Spotlight carousel!** 🎉

**OF via SQL (sneller voor testing):**

```sql
-- Activeer spotlight voor je eerste restaurant:
UPDATE locations 
SET 
  spotlight_enabled = TRUE,
  spotlight_priority = 100,
  spotlight_activated_at = NOW()
WHERE is_active = TRUE AND is_public = TRUE
LIMIT 1;
```

---

## 🎨 Step 4 (Optional): Run Full Setup Script

Als je ook de advanced features wilt (functions, RLS policies, etc):

**In Supabase SQL Editor:**
- Open `SETUP_SPOTLIGHT_FEATURE.sql`
- Copy/paste de hele inhoud
- Run het script

**Wat dit toevoegt:**
- ✅ RLS Policies voor security
- ✅ Functions (activate_spotlight, deactivate_spotlight)
- ✅ Statistics view
- ✅ Extra indexes

**Note:** De verificatie queries en sample data zijn uit-gecomment, dus dit script is veilig om te runnen.

---

## 🐛 Troubleshooting

### Error: "column city does not exist"

**Fixed!** ✅ De `tenant-dal.ts` is aangepast:
- `city` is verwijderd
- Gebruikt nu `address_line1` als fallback
- Backwards compatible

### Error: "column cuisine_type does not exist"

**Fixed!** ✅ De query gebruikt nu:
- `cuisine` (standaard kolom)
- Mapped naar `cuisine_type` voor backwards compatibility

### Error: "column spotlight_enabled does not exist"

**Oplossing:** Run Step 1 (Minimal SQL Script) hierboven!

### Homepage toont geen Spotlight carousel

**Mogelijke oorzaken:**
1. **Geen spotlight restaurants:**
   - Run Step 3 om een restaurant te activeren
   
2. **Restaurant is niet public:**
   ```sql
   UPDATE locations 
   SET is_public = TRUE 
   WHERE id = 'your-restaurant-id';
   ```

3. **Restaurant is niet active:**
   ```sql
   UPDATE locations 
   SET is_active = TRUE 
   WHERE id = 'your-restaurant-id';
   ```

### Spotlight toggle werkt niet in Manager Dashboard

**Check:**
1. Ben je ingelogd als manager/owner?
2. Refresh de page na toggle
3. Check console voor errors
4. Verify met SQL:
   ```sql
   SELECT id, name, spotlight_enabled 
   FROM locations 
   WHERE tenant_id = 'your-tenant-id';
   ```

---

## 🧪 Verification Queries

**After setup, run these to verify:**

```sql
-- 1. Check spotlight columns exist
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'locations' 
  AND column_name LIKE 'spotlight%';

-- Expected output:
-- spotlight_enabled       | boolean
-- spotlight_priority      | integer
-- spotlight_activated_at  | timestamp with time zone
-- spotlight_expires_at    | timestamp with time zone
-- spotlight_stripe_subscription_id | text

-- 2. Check spotlight restaurants
SELECT 
  id,
  name,
  spotlight_enabled,
  spotlight_priority,
  is_active,
  is_public
FROM locations
WHERE spotlight_enabled = TRUE;

-- 3. Check if index exists
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'locations' 
  AND indexname = 'idx_locations_spotlight';
```

---

## 📊 What You Get

### ✨ Spotlight Carousel on Homepage:
- Auto-rotating every 5 seconds
- Manual navigation (arrows + dots)
- Responsive design (mobile + desktop)
- Beautiful gradient UI
- Direct links to restaurant detail + booking

### 🎛️ Manager Dashboard Toggle:
- Easy on/off switch
- Premium badge UI
- Real-time status indicator
- Feature list showing benefits
- "Tijdelijk Gratis" notice

### 🔐 Security:
- RLS policies (if full script is run)
- Only managers can update their locations
- Public can only view active spotlight locations

---

## 🚀 Next Steps

1. ✅ Run Step 1 (Minimal SQL)
2. ✅ Activate spotlight for 1-2 restaurants
3. ✅ Test the carousel on homepage
4. ✅ Test toggle in manager dashboard
5. 📝 Later: Run full script for advanced features
6. 💳 Future: Add Stripe integration for payments

---

## 💰 Monetization (Future)

**Current:** Free (beta testing)

**Future with Stripe:**
- Basic: €99/month
- Premium: €199/month  
- VIP: €399/month

**Auto-billing:**
- Automatic subscription via Stripe
- Email notifications
- Expiration handling
- Analytics dashboard

---

## 🎉 You're Done!

De Spotlight feature is nu:
- ✅ Database setup compleet
- ✅ Frontend component werkend
- ✅ Manager toggle beschikbaar
- ✅ Homepage carousel geïntegreerd
- ✅ Geen errors meer!

**Test het nu:**
```bash
# Start dev server
npm run dev

# Open browser
http://localhost:3000

# Check:
# 1. No console errors ✅
# 2. Spotlight carousel visible (if you activated a restaurant) ✅
# 3. Manager toggle works ✅
```

---

**Veel succes met de Spotlight feature! 🌟**

*Questions? Check SPOTLIGHT_FEATURE_GUIDE.md for detailed documentation.*

