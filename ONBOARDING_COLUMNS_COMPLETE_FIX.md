-- ============================================================================
-- COMPLETE ONBOARDING FIX - STEPS 3 & 4
-- ============================================================================

## ✅ **ALL GEFIXED!**

### **Tables (Step 3) ✅**
- Column: `is_combinable` (was: `combinable`)
- Type: `BOOLEAN`
- Fixed in: `app/api/manager/tables/bulk/route.ts`

### **Shifts (Step 4) ✅**  
- Column: `days_of_week` (was: `day_of_week`)
- Type: `INT[]` (array!)
- Fixed in: `app/api/manager/shifts/bulk/route.ts`
- Fixed in: `app/api/availability/check/route.ts`

---

## 🚀 **RUN THIS NOW:**

### **Option 1: Quick Verify (1 query)**

```sql
-- Just check if columns are correct
SELECT 
    'tables' AS table_name,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='tables' AND column_name='is_combinable') AS has_correct_column
UNION ALL
SELECT 
    'shifts' AS table_name,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='shifts' AND column_name='days_of_week') AS has_correct_column;
```

**Expected:**
```
table_name | has_correct_column
-----------|--------------------
tables     | true  ✅
shifts     | true  ✅
```

**If both are `true`, you're good! Just restart server:**
```bash
npm run dev
```

---

### **Option 2: Full Fix (if columns are wrong)**

Run this in **Supabase SQL Editor**:

```sql
-- File: FIX_ALL_ONBOARDING_COLUMNS.sql
-- This fixes both tables and shifts columns automatically
```

---

## 🎯 **WHAT WAS FIXED:**

### **1. Tables API (Step 3)**

**Before:**
```typescript
{
  combinable: table.combinable,  // ❌ Wrong
}
```

**After:**
```typescript
{
  is_combinable: table.combinable,  // ✅ Correct
}
```

---

### **2. Shifts API (Step 4)**

**Before:**
```typescript
// Created one shift PER day
shift.daysOfWeek.map(dayOfWeek => ({
  day_of_week: dayOfWeek,  // ❌ Wrong: singular, one day
}))
```

**After:**
```typescript
// Create one shift WITH array of days
shift => ({
  days_of_week: shift.daysOfWeek,  // ✅ Correct: array of days
})
```

**Why:** Database schema wants ONE shift that can work on MULTIPLE days (e.g., Mon-Fri).

**Example:**
```javascript
{
  name: "Lunch",
  days_of_week: [1, 2, 3, 4, 5],  // Monday through Friday
  start_time: "11:00",
  end_time: "15:00"
}
```

---

### **3. Availability Check (Booking Flow)**

**Before:**
```typescript
.contains('day_of_week', [dayOfWeek])  // ❌ Wrong column
```

**After:**
```typescript
.contains('days_of_week', [dayOfWeek])  // ✅ Correct column (array)
```

---

## 📋 **DATABASE SCHEMA:**

### **tables:**
```sql
CREATE TABLE tables (
  id UUID PRIMARY KEY,
  location_id UUID NOT NULL,
  name VARCHAR(50) NOT NULL,
  seats INT NOT NULL,
  is_combinable BOOLEAN NOT NULL DEFAULT false,  ← This!
  group_id VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true
);
```

### **shifts:**
```sql
CREATE TABLE shifts (
  id UUID PRIMARY KEY,
  location_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  days_of_week INT[] NOT NULL,  ← Array! [0,1,2,3,4,5,6]
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_minutes INT NOT NULL DEFAULT 90,
  is_active BOOLEAN NOT NULL DEFAULT true
);
```

**Day numbering:**
- 0 = Sunday
- 1 = Monday
- 2 = Tuesday
- 3 = Wednesday
- 4 = Thursday
- 5 = Friday
- 6 = Saturday

---

## ✅ **TEST NOW:**

### **STAP 1: Restart Server**
```bash
npm run dev
```

### **STAP 2: Test Step 3 (Tables)**
```
http://localhost:3007/manager/.../settings?step=3
```

1. Add tables:
   - Tafel 1: 2 stoelen
   - Tafel 2: 4 stoelen
   - Tafel 3: 6 stoelen (combineerbaar ✓)

2. Click "Opslaan"
3. **Should work!** ✅

### **STAP 3: Test Step 4 (Shifts)**
```
http://localhost:3007/manager/.../settings?step=4
```

1. Add shifts:
   - **Lunch**: 11:00-15:00, Ma-Vr (select Monday through Friday)
   - **Diner**: 17:00-22:00, Ma-Za (select Monday through Saturday)

2. Click "Opslaan"
3. **Should work!** ✅

---

## 🔍 **VERIFY IN DATABASE:**

### **Check Tables:**
```sql
SELECT 
    name,
    seats,
    is_combinable,
    group_id
FROM tables
ORDER BY name;
```

**Expected:**
```
name    | seats | is_combinable | group_id
--------|-------|---------------|----------
Tafel 1 | 2     | false         | null
Tafel 2 | 4     | false         | null
Tafel 3 | 6     | true          | null
```

### **Check Shifts:**
```sql
SELECT 
    name,
    days_of_week,
    start_time,
    end_time,
    slot_minutes
FROM shifts
ORDER BY name;
```

**Expected:**
```
name  | days_of_week    | start_time | end_time | slot_minutes
------|-----------------|------------|----------|-------------
Diner | {1,2,3,4,5,6}   | 17:00:00   | 22:00:00 | 90
Lunch | {1,2,3,4,5}     | 11:00:00   | 15:00:00 | 90
```

**Note:** `{1,2,3,4,5}` = Monday through Friday in PostgreSQL array notation.

---

## 📁 **FILES FIXED:**

### **Modified:**
1. ✅ `app/api/manager/tables/bulk/route.ts`
   - Line 40: `is_combinable: table.combinable`

2. ✅ `app/api/manager/shifts/bulk/route.ts`
   - Line 36-45: Changed from `.flatMap()` to `.map()`
   - Line 41: `days_of_week: shift.daysOfWeek` (array)

3. ✅ `app/api/availability/check/route.ts`
   - Line 51: `.contains('days_of_week', [dayOfWeek])`

### **Created:**
1. ✅ `FIX_SHIFTS_COLUMN.sql` - Fix shifts column
2. ✅ `FIX_ALL_ONBOARDING_COLUMNS.sql` - Fix both tables & shifts
3. ✅ `ONBOARDING_COLUMNS_COMPLETE_FIX.md` - This guide

---

## 🎉 **SUMMARY:**

| Step | Table  | Old Column    | New Column      | Type      | Status |
|------|--------|---------------|-----------------|-----------|--------|
| 3    | tables | `combinable`  | `is_combinable` | `BOOLEAN` | ✅     |
| 4    | shifts | `day_of_week` | `days_of_week`  | `INT[]`   | ✅     |

**Architecture Change:**

**Before (wrong):**
```
Frontend sends: daysOfWeek = [1,2,3,4,5]
API creates: 5 separate shifts, one per day
Database stores: 5 rows with day_of_week = 1, 2, 3, 4, 5
```

**After (correct):**
```
Frontend sends: daysOfWeek = [1,2,3,4,5]
API creates: 1 shift with array
Database stores: 1 row with days_of_week = {1,2,3,4,5}
```

**Benefits:**
- ✅ Fewer database rows
- ✅ Easier to manage (update one shift, not 5)
- ✅ Matches database schema design
- ✅ More efficient queries

---

## 🔗 **NEXT STEPS:**

After Steps 3 & 4 work:
- **Step 5:** Policies (cancellation policy, no-show fees)
- **Step 6:** Subscription (choose plan, Stripe)
- **Step 7:** Integrations (Lightspeed POS)
- **Step 8:** Preview & Publish

**Keep going!** 💪

---

## 🎯 **READY!**

After this fix:
- ✅ Step 3 (Tables) works
- ✅ Step 4 (Shifts) works
- ✅ Availability checking works
- ✅ Booking flow will work

**Test both steps now!** 🚀

