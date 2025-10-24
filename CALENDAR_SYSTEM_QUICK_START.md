# 📅 Calendar System - Quick Start

## 🚀 5-Minute Setup

### Step 1: Run SQL Migration

```bash
# In Supabase Dashboard → SQL Editor
# Copy & paste:
/Users/dietmar/Desktop/ray2/supabase/migrations/20250124000004_calendar_system.sql

# Click "Run"
```

### Step 2: Restart Server

```bash
cd /Users/dietmar/Desktop/ray2
pkill -f "next dev"
pnpm dev
```

### Step 3: Test Calendar

```
1. Navigate to: http://localhost:3007/manager/b0402eea-4296-4951-aff6-8f4c2c219818/location/2ca30ee4-140a-4a09-96ae-1455406e0a02

2. Click tab: "Instellingen" (nieuwe tab naast Promoties)

3. See calendar met drag & drop!
```

### Step 4: Test Dashboard Widget

```
1. Navigate to: http://localhost:3007/manager/b0402eea-4296-4951-aff6-8f4c2c219818/dashboard

2. Scroll down → See "Calendar Overzicht" widget

3. View stats voor alle locaties
```

---

## ✅ What You Get

### 1. Calendar Views
- **Week View** - Detailed time slots (15min increments)
- **Day View** - Full day scheduling
- **Month View** - Overview perspective

### 2. Timeline View
- Horizontal timeline (Resengo-style)
- All tables visible
- Booking blocks with duration
- Zoom in/out

### 3. Drag & Drop
- Drag bookings tussen tijdslots
- Automatic conflict detection
- Visuele feedback
- Auto-revert op error

### 4. Dashboard Widget
- Calendar stats (all locations)
- Drukste tijden
- Per-location breakdown
- Quick actions

---

## 🎨 Features

✅ **Status Colors**
- Green = Confirmed
- Yellow = Pending
- Red = Cancelled/No-show
- Blue = Completed

✅ **Interactions**
- Drag & drop bookings
- Click booking → details
- Zoom timeline
- Real-time stats

✅ **Smart Features**
- Conflict detection
- Table capacity check
- Automatic validation
- Optimistic UI updates

---

## 🐛 Troubleshooting

### Calendar not loading?

```sql
-- Check functions in Supabase
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%calendar%';

-- Should show 7 functions
```

### Drag & drop not working?

```bash
# Check browser console for errors
# Look for: [Calendar] logs
```

### Widget not showing?

```tsx
// Check ProfessionalDashboard.tsx has:
import { CalendarWidget } from '@/components/calendar/CalendarWidget';
<CalendarWidget tenantId={tenant.id} />
```

---

## 📚 Full Documentation

See: `CALENDAR_SYSTEM_COMPLETE_GUIDE.md` for:
- Complete API reference
- Customization guide
- Performance metrics
- Security details
- Future roadmap

---

## 🎉 Done!

You now have the most advanced calendar system for restaurant reservations! 🚀

**Test it:**
1. ✅ Drag bookings
2. ✅ Check conflicts
3. ✅ View timeline
4. ✅ Check dashboard widget

**Enjoy!** 🎊

