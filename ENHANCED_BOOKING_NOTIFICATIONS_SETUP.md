# Enhanced Booking Display & Automatic Notifications System

Complete implementation guide for detailed booking displays and automatic notification system for Reserve4You.

## 🎯 Overview

This system provides:

1. **Enhanced Profile Bookings Display** - Beautiful, detailed booking cards in `/profile` → Reserveringen
2. **Automatic Notifications** - Auto-generated notifications for booking events
3. **Notification Settings** - Customizable notification preferences per tenant/location
4. **Real-time Updates** - Notifications appear immediately in `/notifications`

## 📦 What's Included

### 1. Database Schema

- `notification_settings` table - Customizable notification preferences
- Automatic triggers on `bookings` table for instant notifications
- Helper functions for notification creation

### 2. Frontend Components

- **Enhanced ProfileClient** - Detailed booking cards with all information
- **NotificationSettings** - Settings page for managing notification preferences
- **NotificationsClient** - Display and manage notifications (already exists)

### 3. API Routes

- `/api/manager/notification-settings` - GET/POST notification preferences
- `/api/notifications` - Manage user notifications (already exists)

### 4. Manager Dashboard Integration

- New settings page: `/manager/[tenantId]/settings/notifications`
- Access from dashboard sidebar

## 🚀 Installation

### Step 1: Run SQL Migration

Run this in **Supabase SQL Editor**:

```bash
supabase/migrations/20250120000002_booking_notifications.sql
```

This will create:
- ✅ `notification_settings` table
- ✅ Automatic notification triggers
- ✅ Helper functions
- ✅ RLS policies

### Step 2: Verify Notifications System

If not already set up, run:

```bash
supabase/migrations/20250119000020_notifications_system_fixed.sql
```

This ensures the base notifications table exists.

### Step 3: Restart Development Server

```bash
pnpm dev
```

## 📋 Features in Detail

### 1. Enhanced Profile Booking Cards

**Location**: `/profile` → Tab "Reserveringen"

**Features**:
- 🎨 Beautiful gradient header with location icon
- 📅 Full date display (e.g., "donderdag 23 oktober 2025 om 17:30")
- 👥 Number of guests with icon
- 📞 Customer name and phone (if available)
- 📍 Complete location address
- 💬 Special requests highlighted in amber box
- 🔢 Booking ID and creation date
- 🏷️ Status badges (Bevestigd, In afwachting, Geannuleerd, etc.)
- 🔗 Link to location page

**Example Display**:
```
┌─────────────────────────────────────────────┐
│ 🗺️  Korenmarkt11               [Bevestigd] │
│                                             │
│ 📅 Datum & Tijd          👥 Aantal Personen│
│    donderdag                  4 personen    │
│    23 oktober 2025                          │
│    om 17:30                                 │
│                                             │
│ 👤 Op Naam Van           📞 Telefoonnummer  │
│    John Doe                  +32 9 123 45 67│
│                                             │
│ 📍 Korenmarkt 11, 9000 Gent                │
│                                             │
│ 💬 Speciale Verzoeken                       │
│    Graag bij het raam                       │
│                                             │
│ Reserveringsnummer: a1b2c3d4                │
│ Gemaakt op 20-10-2025                       │
└─────────────────────────────────────────────┘
```

### 2. Automatic Notifications

**Trigger Events**:

1. **New Booking** (`BOOKING_PENDING`)
   - Sent when a booking is created
   - Title: "Reservering Ontvangen"
   - Message: Details of the booking
   - Priority: MEDIUM

2. **Booking Confirmed** (`BOOKING_CONFIRMED`)
   - Sent when status changes to 'confirmed'
   - Title: "Reservering Bevestigd"
   - Message: Confirmation with details
   - Priority: HIGH

3. **Booking Cancelled** (`BOOKING_CANCELLED`)
   - Sent when status changes to 'cancelled'
   - Title: "Reservering Geannuleerd"
   - Message: Cancellation notice
   - Priority: HIGH

4. **Booking Modified** (`BOOKING_MODIFIED`)
   - Sent when date/time changes
   - Title: "Reservering Aangepast"
   - Message: New details
   - Priority: MEDIUM

**Notification Flow**:
```
User makes booking → Trigger fires → Function checks settings
→ Creates notification → User sees in /notifications
```

### 3. Notification Settings

**Location**: `/manager/[tenantId]/settings/notifications`

**Settings Categories**:

#### 📬 Booking Event Notifications
- ✅ New bookings
- ✅ Confirmed bookings
- ✅ Cancelled bookings
- ✅ Modified bookings

#### ⏰ Reminder Settings
- ✅ Send booking reminders
- 🕐 Hours before reminder (default: 24 hours)

#### 📧 Customer Notifications
- ✅ Send confirmation emails
- ✅ Send reminders to customers
- 🕐 Customer reminder timing (default: 2 hours)

#### 👥 Team Notifications
- ✅ Notify tenant owner
- ✅ Notify location managers

**Default Values**:
All toggles are **enabled by default** for maximum transparency.

## 🎨 UI/UX Features

### Profile Bookings Page

**Upcoming Bookings**:
- Large, detailed cards
- Hover effects (shadow + border)
- Status-based color coding
- Responsive grid layout (1 column mobile, 2 columns desktop)

**Past Bookings**:
- Compact card style
- Slightly faded (75% opacity)
- Hover reveals full opacity
- Quick view of essential details

**Empty State**:
- Friendly illustration
- Call-to-action button
- Helpful message

### Notification Settings Page

**Layout**:
- Clean, organized sections
- Card-based design
- Icon-based headers
- Toggle switches for easy control
- Input fields for timing settings

**Colors**:
- Primary gradient for active states
- Muted backgrounds for cards
- Status-based colors for messages

## 🔧 Configuration

### Customize Notification Messages

Edit the `notify_booking_event()` function in the migration file:

```sql
v_message := format(
  'Your custom message for %s on %s at %s',
  v_booking.location_name,
  to_char(v_booking.booking_date, 'DD-MM-YYYY'),
  v_booking.booking_time
);
```

### Customize Timing

Default reminder timings can be adjusted per tenant in the settings page or in the migration:

```sql
reminder_hours_before INTEGER NOT NULL DEFAULT 24,
customer_reminder_hours_before INTEGER NOT NULL DEFAULT 2,
```

### Add New Notification Types

1. Add to `notification_type` enum:
```sql
ALTER TYPE notification_type ADD VALUE 'YOUR_NEW_TYPE';
```

2. Update trigger function to handle new type
3. Add UI icon in `NotificationsClient.tsx`

## 🔐 Security

### Row Level Security (RLS)

**notification_settings**:
- ✅ Users can only view settings for their tenants
- ✅ Only owners can modify settings
- ✅ Automatic filtering by membership

**notifications**:
- ✅ Users can only see their own notifications
- ✅ Users can only update/delete their own notifications
- ✅ System can insert notifications for any user

### API Protection

All API routes verify:
1. User authentication
2. Tenant membership
3. Role permissions (for settings changes)

## 📱 Notification Tabs

**Location**: `/notifications`

**Tabs**:
1. **Alle** - All notifications
2. **Ongelezen** - Unread only
3. **Reserveringen** - Booking-related only
4. **Systeem** - System announcements only

**Features**:
- Mark individual as read
- Mark all as read
- Delete notifications
- Filter by type
- Real-time unread count

## 🧪 Testing

### Test Notification Flow

1. **Create a booking** (logged in with Google):
   ```
   http://localhost:3007 → Select location → Fill form → Submit
   ```

2. **Check notifications**:
   ```
   http://localhost:3007/notifications
   ```
   You should see: "Reservering Ontvangen" notification

3. **Confirm booking** (in manager dashboard):
   ```
   http://localhost:3007/manager/[tenantId]/dashboard
   → Click booking → Confirm
   ```

4. **Check notifications again**:
   You should see: "Reservering Bevestigd" notification

5. **View in profile**:
   ```
   http://localhost:3007/profile → Reserveringen tab
   ```
   You should see detailed booking card

### Test Settings

1. **Go to settings**:
   ```
   http://localhost:3007/manager/[tenantId]/settings/notifications
   ```

2. **Toggle settings** and save

3. **Create test booking** and verify notifications respect settings

## 🐛 Troubleshooting

### Notifications not appearing?

1. **Check triggers are installed**:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%booking%notification%';
   ```

2. **Check notification_settings table exists**:
   ```sql
   SELECT * FROM notification_settings;
   ```

3. **Check RLS policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'notifications';
   ```

### Bookings not showing in profile?

1. **Check start_ts column exists**:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'bookings' AND column_name = 'start_ts';
   ```

2. **Run profile fix script**:
   ```sql
   -- From previous migration
   FIX_PROFILE_AND_BOOKINGS_FIXED.sql
   ```

3. **Check consumer linkage**:
   ```sql
   SELECT b.*, c.auth_user_id 
   FROM bookings b
   LEFT JOIN consumers c ON b.consumer_id = c.id
   WHERE b.customer_email = 'your-email@example.com';
   ```

### Settings not saving?

1. **Check user is tenant owner**:
   ```sql
   SELECT * FROM memberships 
   WHERE user_id = auth.uid() AND role = 'OWNER';
   ```

2. **Check foreign key constraints**:
   ```sql
   SELECT * FROM information_schema.table_constraints 
   WHERE table_name = 'notification_settings';
   ```

## 📊 Database Queries

### View all notification settings
```sql
SELECT 
  ns.*,
  t.name as tenant_name,
  l.name as location_name
FROM notification_settings ns
JOIN tenants t ON ns.tenant_id = t.id
LEFT JOIN locations l ON ns.location_id = l.id
ORDER BY t.name, l.name NULLS FIRST;
```

### View recent notifications for a user
```sql
SELECT 
  n.*,
  b.booking_date,
  b.booking_time,
  l.name as location_name
FROM notifications n
LEFT JOIN bookings b ON n.booking_id = b.id
LEFT JOIN locations l ON n.location_id = l.id
WHERE n.user_id = auth.uid()
ORDER BY n.created_at DESC
LIMIT 20;
```

### Check notification statistics
```sql
SELECT 
  type,
  COUNT(*) as total,
  SUM(CASE WHEN read THEN 1 ELSE 0 END) as read_count,
  SUM(CASE WHEN NOT read THEN 1 ELSE 0 END) as unread_count
FROM notifications
WHERE user_id = auth.uid()
GROUP BY type
ORDER BY total DESC;
```

## 🎯 Next Steps

### Optional Enhancements

1. **Email Integration**:
   - Send actual emails using Resend/SendGrid
   - Add email templates
   - Track email delivery

2. **SMS Notifications**:
   - Integrate Twilio
   - Send SMS reminders
   - Handle phone number verification

3. **Push Notifications**:
   - Add web push API
   - Browser notifications
   - Mobile app notifications

4. **Notification Preferences**:
   - Per-user notification preferences
   - Quiet hours
   - Notification channels (email, SMS, push)

5. **Advanced Reminders**:
   - Multiple reminders (24h, 2h, 30min)
   - Recurring booking reminders
   - Post-booking follow-ups

## 📄 Files Created/Modified

### Created:
- ✅ `/supabase/migrations/20250120000002_booking_notifications.sql`
- ✅ `/components/manager/NotificationSettings.tsx`
- ✅ `/app/api/manager/notification-settings/route.ts`
- ✅ `/app/manager/[tenantId]/settings/notifications/page.tsx`
- ✅ `/ENHANCED_BOOKING_NOTIFICATIONS_SETUP.md` (this file)

### Modified:
- ✅ `/app/profile/ProfileClient.tsx` - Enhanced booking cards
- ✅ Existing notifications system (no changes needed if already set up)

## ✅ Summary

You now have:
- 🎨 Beautiful, detailed booking cards in profile
- 🔔 Automatic notifications for all booking events
- ⚙️ Customizable notification settings per tenant
- 📱 Full notification management in `/notifications`
- 🔐 Secure, RLS-protected system
- 📊 Comprehensive database tracking

**Access Points**:
- View bookings: `http://localhost:3007/profile` → Reserveringen
- View notifications: `http://localhost:3007/notifications`
- Manage settings: `http://localhost:3007/manager/[tenantId]/settings/notifications`

## 🎉 Done!

Your notification system is now fully operational. Users will automatically receive notifications for their bookings, and you can customize the behavior per tenant/location.

For questions or issues, check the Troubleshooting section above.

