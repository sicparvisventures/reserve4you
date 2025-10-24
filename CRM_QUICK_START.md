# 🚀 CRM System - Quick Start

## Install in 3 Steps

### Step 1: Run SQL Migration (Required)

```sql
-- Open in Supabase SQL Editor:
/supabase/migrations/20250124000012_crm_system.sql
```

Click **Run** → Wait for success ✅

### Step 2: Verify Installation

Check Supabase Functions exist:
- `get_location_crm_stats`
- `get_tenant_crm_stats`
- `get_location_guests`
- `update_consumer_profile`
- `get_upcoming_occasions`

### Step 3: Start Using

1. Go to any location page
2. Click **CRM** tab
3. See all guests with profiles
4. Click **Edit** to add preferences
5. Check dashboard for CRM widget

---

## Quick Features Overview

### ✅ What You Get

**Guest Profiles:**
- Lifetime visits (auto-tracked)
- VIP status
- Birthday & anniversary dates
- Dietary preferences
- Allergies (red warning)
- Custom tags
- Manager notes
- Favorite location

**Auto-Tracking:**
- Visit count on booking completion
- Last visit date
- Average party size
- Favorite location

**Special Occasions:**
- Upcoming birthdays (30 days)
- Upcoming anniversaries (30 days)
- Contact info for marketing
- VIP guests highlighted

**Dashboard Widget:**
- Total guests
- VIP count
- New guests this month
- Returning guests
- Per-location breakdown

---

## Common Tasks

### Mark Guest as VIP

1. Go to CRM tab
2. Find guest
3. Click **Edit**
4. Toggle **VIP Status**
5. Click **Save**

### Add Birthday

1. Click **Edit** on guest
2. Select birthday date
3. Click **Save**
4. Automatic 30-day reminder

### Add Dietary Preferences

1. Click **Edit**
2. Type: "Vegetarian, Glutenvrij"
3. Click **Save**
4. Shows on booking

### Add Allergies

1. Click **Edit**
2. Type: "Noten, Schaaldieren"
3. Click **Save**
4. Red warning on profile

### Add Custom Tags

1. Click **Edit**
2. Type: "Stammgast, Zakelijk"
3. Click **Save**
4. Filter by tag

---

## 🎯 Pro Tips

1. **Auto-tracking works automatically** - Just mark bookings as "completed"
2. **Use VIP for regulars** - Quick identification
3. **Birthday reminders** - Check "Speciale Momenten" tab monthly
4. **Allergy safety** - Always in red for visibility
5. **Tags for segmentation** - Create your own categories

---

## 📍 Where to Find Things

- **CRM Tab**: Location page → CRM
- **Dashboard Widget**: Manager Dashboard → CRM Overzicht
- **Multi-Location View**: `/manager/{tenantId}/crm`
- **Special Occasions**: Multi-location → Speciale Momenten tab

---

## ✅ Done!

Your CRM system is now ready. Start adding guest preferences and watch the auto-tracking work its magic!

For detailed documentation, see `CRM_SYSTEM_COMPLETE.md`

