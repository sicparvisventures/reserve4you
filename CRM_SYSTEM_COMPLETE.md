# 🎯 CRM System - Reserve4You

## Complete Implementation Guide

Het volledige CRM systeem is nu geïmplementeerd met enhanced guest profiles, auto-tracking, tags, preferences, en birthday/anniversary reminders.

---

## 📋 What's Included

### 1. Enhanced Consumer Profiles

**New Database Fields:**
- `birthday` - Guest birthday
- `anniversary` - Special anniversary date
- `dietary_preferences` - Array of dietary requirements
- `allergies` - Array of allergies (displayed in red)
- `preferred_table_type` - Window, terrace, bar, etc.
- `vip_status` - Boolean VIP flag
- `lifetime_visits` - Auto-tracked visit count
- `lifetime_spend_cents` - Total spend tracking
- `average_party_size` - Calculated average
- `favorite_location_id` - Most visited location
- `notes` - Manager notes
- `tags` - Custom tags array
- `last_visit_date` - Auto-updated
- `preferred_booking_time` - Most common booking time

### 2. Auto-Tracking System

**Trigger on Booking Completion:**
- Increments `lifetime_visits`
- Updates `last_visit_date`
- Recalculates `average_party_size`
- Determines `favorite_location_id` (most visited)

### 3. Guest Management Features

**CRM Manager Tab:**
- Search guests by name, email, or phone
- Filter by VIP status
- Filter by tags
- View guest profiles with all details
- Edit preferences, allergies, notes
- Quick birthday/anniversary indicators
- Lifetime stats display

**Guest Profile Editor:**
- VIP status toggle
- Birthday & anniversary dates
- Dietary preferences (comma-separated)
- Allergies (red warning)
- Preferred table type
- Custom tags
- Manager notes

### 4. Special Occasions Tracking

**Upcoming Birthdays & Anniversaries:**
- Automatic detection (next 30 days)
- Badge indicators on guest cards
- Dedicated "Special Occasions" tab
- Email/phone contact info
- VIP status highlighted
- Favorite location shown

### 5. Multi-Location Overview

**Tenant-Wide CRM Stats:**
- Total guests across all locations
- VIP guests count
- New guests this month
- Returning guests
- Upcoming birthdays & anniversaries
- Location breakdown with stats

---

## 🚀 Installation Steps

### Step 1: Run SQL Migration

1. Open Supabase Dashboard → SQL Editor
2. Open `/supabase/migrations/20250124000012_crm_system.sql`
3. Run the entire script
4. Wait for success confirmation

**What it creates:**
- 13 new columns on `consumers` table
- 6 indexes for performance
- 1 trigger for auto-tracking
- 6 SQL functions for analytics
- RLS policies

### Step 2: Verify Installation

Check that these functions exist in Supabase:
- `get_location_crm_stats(location_id, date)`
- `get_tenant_crm_stats(tenant_id, date)`
- `get_location_guests(location_id, search, vip, tag, limit, offset)`
- `update_consumer_profile(...)`
- `get_upcoming_occasions(tenant_id, days_ahead)`
- `update_consumer_stats()` (trigger function)

---

## 📍 Usage Guide

### Access CRM for a Location

1. Go to Manager Dashboard
2. Click on a location
3. Navigate to **CRM** tab
4. See all guests for that location

### Search & Filter Guests

**Search:**
- Type name, email, or phone in search box
- Real-time filtering

**Filters:**
- **VIP Only** - Show only VIP guests
- **Tag Filter** - Filter by specific tags

### Edit Guest Profile

1. Click **Edit** button on any guest card
2. Update any field:
   - Toggle VIP status
   - Set birthday/anniversary
   - Add dietary preferences
   - Add allergies (red warning)
   - Set preferred table type
   - Add custom tags
   - Write manager notes
3. Click **Save**

### View Special Occasions

**In Multi-Location CRM:**
1. Go to `/manager/{tenantId}/crm`
2. Click **Speciale Momenten** tab
3. See all upcoming birthdays/anniversaries
4. Filter by location
5. Search by guest name
6. Quick contact button

### Dashboard Widget

**CRM Widget shows:**
- Total guests
- VIP guests
- New guests this month
- Returning guests
- Upcoming birthdays (30 days)
- Upcoming anniversaries (30 days)
- Per-location breakdown
- "Alle Locaties" link to full CRM page

---

## 🎨 Design & Branding

### Colors

- **VIP Badge**: Warning (yellow/amber)
- **Birthday Badge**: Pink (#EC4899)
- **Anniversary Badge**: Purple (#A855F7)
- **New Guest**: Success (green)
- **Returning**: Info (blue)
- **Allergies**: Red warning text

### Icons

- **CRM Tab**: Users icon
- **VIP**: Star icon
- **Birthday**: Cake icon
- **Anniversary**: Heart icon
- **New Guest**: UserPlus icon
- **Tags**: Tag icon
- **Notes**: StickyNote icon
- **Contact**: Mail, Phone icons

### Layout

- Mobile-first responsive design
- Card-based layout
- Hover effects on guest cards
- Modal editor for profile updates
- Badge indicators for special statuses
- Grid stats cards at top

---

## 🔧 Technical Details

### SQL Functions

1. **get_location_crm_stats**
   - Returns stats for single location
   - Total/VIP/new/returning guests
   - Upcoming occasions

2. **get_tenant_crm_stats**
   - Returns stats across all locations
   - Includes per-location breakdown
   - Used by dashboard widget

3. **get_location_guests**
   - Paginated guest list
   - Search & filter support
   - Returns all profile fields
   - Calculates upcoming occasions

4. **update_consumer_profile**
   - Updates guest preferences
   - Secure (SECURITY DEFINER)
   - Returns updated profile

5. **get_upcoming_occasions**
   - Next 30 days by default
   - Returns birthdays & anniversaries
   - Includes guest contact info

6. **update_consumer_stats** (Trigger)
   - Fires on booking completion
   - Auto-increments lifetime_visits
   - Updates last_visit_date
   - Recalculates averages
   - Determines favorite location

### Performance

**Indexes Created:**
- `idx_consumers_birthday` - Birthday lookups
- `idx_consumers_anniversary` - Anniversary lookups
- `idx_consumers_vip` - VIP filtering
- `idx_consumers_tags` - GIN index for tag searches
- `idx_consumers_favorite_location` - Location filtering
- `idx_consumers_last_visit` - Recent activity sorting

### Security

- RLS policies enforced
- Functions use SECURITY DEFINER
- Permissions granted to authenticated/anon roles
- Tenant isolation via location_id

---

## 📊 Analytics & Insights

### Guest Segmentation

**Automatic Tags:**
- VIP guests (manually set)
- New guests (lifetime_visits = 1)
- Returning guests (lifetime_visits > 1)
- Birthday upcoming
- Anniversary upcoming

**Custom Tags:**
- Stammgast (Regular)
- Feestganger (Party-goer)
- Zakelijk (Business)
- Allergic
- Special Dietary
- Any custom tag

### Growth Tracking

**Dashboard Shows:**
- New guests this month
- Growth indicator
- Retention (returning vs new)
- VIP conversion rate

### Occasion Marketing

**Automatic Detection:**
- 30-day lookahead
- Birthday reminders
- Anniversary reminders
- Quick contact button
- Location preference shown

---

## 🎯 Use Cases

### 1. VIP Program

- Mark regular guests as VIP
- Quick filter to see all VIPs
- Special service notes
- Track VIP distribution per location

### 2. Allergy Management

- Record allergies in red warning text
- Automatically displayed on booking
- Kitchen can see immediately
- Prevents incidents

### 3. Dietary Preferences

- Vegetarian, vegan, gluten-free
- Displayed on guest profile
- Staff can prepare accordingly
- Better service quality

### 4. Birthday Marketing

- Automatic birthday detection
- Send promotional offers
- Auto-tag bookings around birthday
- Surprise & delight guests

### 5. Anniversary Celebrations

- Romantic occasion tracking
- Special table preparation
- Champagne service
- Create memorable moments

### 6. Loyalty Tracking

- Lifetime visits counter
- Average party size
- Favorite location
- Preferred booking time
- Personalized service

---

## 🚨 Troubleshooting

### No Guests Showing

**Check:**
1. Location has bookings with consumer_id
2. consumers table has matching records
3. RLS policies are active
4. User has access to tenant

### Stats Not Updating

**Check:**
1. Trigger is active: `update_consumer_stats`
2. Booking status changed to 'completed'
3. consumer_id is not null
4. Trigger fires on UPDATE

### Occasions Not Showing

**Check:**
1. Birthday/anniversary dates are set
2. Dates are within 30 days
3. Guest has booking history
4. Function `get_upcoming_occasions` has access

### Edit Not Saving

**Check:**
1. User is authenticated
2. Function `update_consumer_profile` exists
3. RLS allows UPDATE on consumers
4. All required fields provided

---

## 📈 Future Enhancements

**Planned Features:**
- Email automation for birthdays
- SMS notifications for VIP guests
- Spending analytics per guest
- Visit frequency charts
- Recommendation engine
- Loyalty points system
- Guest feedback integration

---

## ✅ Checklist

- [x] SQL migration created
- [x] CRMManager component
- [x] CRMWidget for dashboard
- [x] Multi-location CRM page
- [x] Tab added to location management
- [x] Auto-tracking trigger
- [x] Birthday/anniversary detection
- [x] VIP status management
- [x] Tags system
- [x] Notes system
- [x] Dietary preferences
- [x] Allergy warnings
- [x] Search & filters
- [x] Mobile responsive
- [x] Reserve4You branding
- [x] Professional styling

---

## 🎉 Success Confirmation

After installation, you should see:

1. **CRM tab** on location pages
2. **CRM Widget** on manager dashboard
3. **Guest profiles** with all details
4. **Edit functionality** for preferences
5. **Special occasions** tab in multi-location view
6. **Auto-updating** lifetime visits on booking completion
7. **Birthday/anniversary** badges on upcoming events

---

**System Version:** 1.0.0
**Last Updated:** October 24, 2025
**Status:** ✅ Production Ready

