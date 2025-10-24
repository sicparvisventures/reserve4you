# Waitlist Management System - Reserve4You

## Complete Professional Implementation

---

## What Has Been Built

### SQL Schema & Functions
- Waitlist table with comprehensive fields
- 8 SQL functions for complete CRUD operations
- Auto-notify matching system
- Priority management
- Conversion tracking
- RLS policies for security

### Location Management
- New "Wachtlijst" tab (after Kalender)
- Full CRUD operations
- Priority sorting
- Quick actions (Notify, Convert, Cancel)
- Real-time status updates
- Search and filters

### Dashboard Widget
- Waitlist statistics (all locations)
- Conversion rate tracking
- Average wait time
- Per-location breakdown
- Links to multi-location view

### Multi-Location Overview
- Combined view of all locations
- Advanced filtering (location, status, date)
- Bulk management capabilities
- Search across all entries
- Real-time statistics

---

## Installation

### Step 1: Run SQL Migration

**In Supabase Dashboard → SQL Editor:**

```
/Users/dietmar/Desktop/ray2/supabase/migrations/20250124000010_waitlist_system.sql
```

**Click "Run"**

**Expected Output:**
```
get_location_waitlist: X entries
get_waitlist_stats: X waiting
get_tenant_waitlist: X total entries

WAITLIST SYSTEM READY!

Result:
WAITLIST SYSTEM READY!
functions: 8
table_exists: 1
```

### Step 2: Verify Installation

```sql
-- Check table exists
SELECT COUNT(*) FROM waitlist;

-- Check functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%waitlist%'
AND routine_schema = 'public';

-- Should show:
-- get_location_waitlist
-- get_waitlist_stats
-- add_to_waitlist
-- update_waitlist_status
-- find_matching_waitlist
-- expire_old_notifications
-- get_tenant_waitlist
```

---

## Features

### 1. Waitlist Management (Per Location)

**URL:** `/manager/{tenantId}/location/{locationId}` → Tab "Wachtlijst"

**Features:**
- Add guests to waitlist
- Set priority levels (Normal, High, Urgent)
- Preferred date & time range
- Party size tracking
- Contact information
- Notes/special requests
- Quick actions:
  - Notify guest
  - Convert to booking
  - Cancel entry

**Stats Displayed:**
- Total waiting
- Notified count
- Converted count
- Conversion rate percentage

### 2. Dashboard Widget

**URL:** `/manager/{tenantId}/dashboard`

**Features:**
- Today's waitlist statistics
- Waiting/Notified/Converted counts
- Conversion rate
- Average wait time
- Per-location breakdown
- Link to multi-location view

### 3. Multi-Location Overview

**URL:** `/manager/{tenantId}/waitlist`

**Features:**
- All locations combined
- Advanced filters:
  - Search (name, phone, email, location)
  - Location filter
  - Status filter
  - Date filter
- Location chips (click to filter)
- Bulk status updates
- Real-time statistics

### 4. Auto-Notify System

**SQL Function:** `find_matching_waitlist`

**How It Works:**
1. When a booking is cancelled/no-show
2. System finds matching waitlist entries:
   - Same date
   - Party size fits table
   - Time preference matches
   - Priority sorting
3. Returns top 5 matches
4. Manager can notify immediately

**Implementation:**
```sql
SELECT find_matching_waitlist(
  'location-id',
  '2025-01-24',
  '19:00',
  4,  -- table seats 4
  5   -- return top 5
);
```

---

## Tab Order (Location Page)

1. **Plattegrond** - Floor plan
2. **Reserveringen** - Bookings list
3. **Kalender** - Calendar system
4. **Wachtlijst** - Waitlist management
5. **Berichten** - Guest messaging
6. **Promoties** - Promotions
7. **Locatie Instellingen** - Location settings

---

## Database Schema

```sql
CREATE TABLE waitlist (
  id UUID PRIMARY KEY,
  location_id UUID REFERENCES locations(id),
  guest_name VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(20),
  guest_email VARCHAR(255),
  party_size INT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time_start TIME NOT NULL,
  preferred_time_end TIME,
  status waitlist_status,  -- waiting|notified|converted|expired|cancelled
  notes TEXT,
  priority INT DEFAULT 0,  -- 0=normal, 1=high, 2=urgent
  notified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,  -- 30min after notification
  converted_booking_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID
);
```

---

## Status Flow

```
WAITING
  ↓ (Manager clicks "Notificeer")
NOTIFIED (expires after 30 minutes)
  ↓ (Manager clicks "Converteer")
CONVERTED (success!)

Alternative paths:
WAITING → CANCELLED (manager cancels)
NOTIFIED → EXPIRED (30min timeout)
```

---

## Test URLs

### Location Waitlist
```
http://localhost:3007/manager/b0402eea-4296-4951-aff6-8f4c2c219818/location/2ca30ee4-140a-4a09-96ae-1455406e0a02
```
→ Click tab "Wachtlijst"

### Multi-Location Waitlist
```
http://localhost:3007/manager/b0402eea-4296-4951-aff6-8f4c2c219818/waitlist
```

### Dashboard
```
http://localhost:3007/manager/b0402eea-4296-4951-aff6-8f4c2c219818/dashboard
```
→ See "Wachtlijst Overzicht" widget

---

## Usage Flow

### Add Guest to Waitlist

1. Go to location → Wachtlijst tab
2. Click "Toevoegen aan Wachtlijst"
3. Fill form:
   - Name (required)
   - Party size (required)
   - Phone/Email
   - Preferred date & time range
   - Notes
   - Priority level
4. Click "Toevoegen"
5. Guest appears in waitlist

### Notify Guest

1. Find guest with status "waiting"
2. Click "Notificeer" button
3. Status changes to "notified"
4. Guest has 30 minutes to respond
5. After 30min auto-expires

### Convert to Booking

1. Find guest with status "waiting" or "notified"
2. Click "Converteer" button
3. Status changes to "converted"
4. (Optional) Create actual booking in system

### Cancel Entry

1. Find guest with status "waiting" or "notified"
2. Click "Annuleer" button
3. Status changes to "cancelled"

---

## Files Created

### SQL
```
/supabase/migrations/20250124000010_waitlist_system.sql
- Waitlist table
- 8 SQL functions
- RLS policies
- Indexes
```

### Components
```
/components/waitlist/
├── WaitlistManager.tsx          # Location tab component
├── WaitlistWidget.tsx           # Dashboard widget
└── MultiLocationWaitlist.tsx    # Multi-location view
```

### Pages
```
/app/manager/[tenantId]/waitlist/
└── page.tsx                     # Multi-location page
```

### Updated Files
```
/app/manager/[tenantId]/location/[locationId]/
└── LocationManagement.tsx       # Added Wachtlijst tab

/app/manager/[tenantId]/dashboard/
└── ProfessionalDashboard.tsx    # Added WaitlistWidget
```

---

## Design System

### Colors
- **Waiting:** Warning yellow (#FFB020)
- **Notified:** Info blue (#3B82F6)
- **Converted:** Success green (#18C964)
- **Expired:** Muted gray (#71717A)
- **Cancelled:** Destructive red (#E11D48)

### Components
- Clean, professional design
- No emojis (as requested)
- R4Y branding throughout
- Consistent with existing system

### Icons
- **UserPlus** - Waitlist main icon
- **Bell** - Notify action
- **Check** - Convert action
- **X** - Cancel action
- **Clock** - Wait time
- **Users** - Party size
- **Calendar** - Date
- **Building2** - Location

---

## Key Metrics Tracked

1. **Total Waiting** - Current active waitlist
2. **Total Notified** - Guests notified today
3. **Total Converted** - Successful conversions
4. **Conversion Rate** - % of waitlist that becomes bookings
5. **Average Wait Time** - How long guests wait
6. **Per-Location Stats** - Individual location performance

---

## Advanced Features

### Priority System
- **0 (Normal)** - Standard guests
- **1 (High)** - VIP/regulars
- **2 (Urgent)** - Special circumstances

### Auto-Expiration
- Notified entries expire after 30 minutes
- Auto-status change to "expired"
- Keeps waitlist clean

### Matching Algorithm
```sql
find_matching_waitlist(location, date, time, seats, limit)
```
- Matches party size to table capacity
- Checks time preference range
- Sorts by priority then creation time
- Returns top N matches

### Search & Filters
- Search by name, phone, email, location
- Filter by location
- Filter by status
- Filter by date
- Combined filters work together

---

## Performance

### Indexes
```sql
idx_waitlist_location     -- Fast location queries
idx_waitlist_status       -- Fast status filtering
idx_waitlist_date         -- Fast date queries
idx_waitlist_priority     -- Fast priority sorting
idx_waitlist_expires      -- Fast expiration checks
```

### Optimizations
- STABLE functions (read-only)
- JSON aggregation
- Proper RLS policies
- Efficient querying

---

## Security

### RLS Policies
- Users can only see waitlist for their tenant locations
- Full CRUD based on membership
- Tenant isolation enforced
- No cross-tenant data leaks

### Permissions
```sql
GRANT EXECUTE ON FUNCTION get_location_waitlist TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_waitlist_stats TO authenticated, anon;
GRANT EXECUTE ON FUNCTION add_to_waitlist TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_waitlist_status TO authenticated;
-- etc...
```

---

## Success Checklist

### Installation
- [ ] SQL migration run successfully
- [ ] 8 functions created
- [ ] Waitlist table exists
- [ ] RLS policies active

### Location Page
- [ ] "Wachtlijst" tab visible
- [ ] Can add new entries
- [ ] Can update status
- [ ] Stats display correctly
- [ ] Search works
- [ ] Filters work

### Dashboard
- [ ] Widget displays
- [ ] Stats load
- [ ] Per-location breakdown shows
- [ ] Link to multi-location works

### Multi-Location Page
- [ ] All locations combined
- [ ] Filters work (location, status, date)
- [ ] Search works
- [ ] Can update status
- [ ] Stats accurate

---

## Troubleshooting

### Issue: Table not found
```sql
-- Check if table exists
SELECT tablename FROM pg_tables WHERE tablename = 'waitlist';

-- If empty, re-run migration
```

### Issue: Functions not found
```sql
-- Check functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%waitlist%';

-- Should show 8 functions
```

### Issue: Widget not showing
```
Check: ProfessionalDashboard.tsx imports WaitlistWidget
Check: Widget is in JSX (<WaitlistWidget tenantId={tenant.id} />)
```

### Issue: Tab not visible
```
Check: LocationManagement.tsx imports WaitlistManager
Check: TabsTrigger with value="waitlist" exists
Check: TabsContent with value="waitlist" exists
```

---

## Future Enhancements

### Phase 1 (Optional)
- SMS notifications integration
- Email notifications
- Auto-conversion to booking
- Waitlist analytics page

### Phase 2 (Future)
- Consumer-facing waitlist form
- Public waitlist widget
- Estimated wait time calculation
- Automatic matching on cancellation

---

## API Integration (Future)

```typescript
// Example: Notify guest via API
POST /api/waitlist/notify
{
  "waitlist_id": "uuid",
  "method": "sms" | "email",
  "message": "Table available..."
}

// Example: Auto-convert
POST /api/waitlist/convert
{
  "waitlist_id": "uuid",
  "create_booking": true,
  "booking_details": {...}
}
```

---

## Complete!

You now have a professional waitlist management system!

**Key Features:**
- Full CRUD operations
- Priority management
- Auto-notify matching
- Conversion tracking
- Multi-location support
- Dashboard integration
- Professional R4Y design

**Next Steps:**
1. Run SQL migration
2. Test location waitlist tab
3. Test dashboard widget
4. Test multi-location page
5. Add test entries
6. Try all status transitions

**Enjoy your waitlist system!**

