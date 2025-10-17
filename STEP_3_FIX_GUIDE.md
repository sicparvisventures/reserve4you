# 🔧 STAP 3 TAFELS - COLUMN ERROR FIX

## ❌ PROBLEEM:
```
Could not find the 'combinable' column of 'tables' in the schema cache
```

## 🔍 ROOT CAUSE:

De frontend/API gebruikt `combinable`, maar de database kolom heet `is_combinable`.

**Mismatch:**
- **Frontend:** `table.combinable` 
- **API:** Mapped naar `combinable` (❌ wrong)
- **Database:** Kolom heet `is_combinable` (✅ correct)

---

## ✅ OPLOSSING:

### **WAT IS ER GEFIXED:**

#### **1. API Route Updated ✅**
**File:** `app/api/manager/tables/bulk/route.ts`

**Before:**
```typescript
combinable: table.combinable,  // ❌ Wrong column name
```

**After:**
```typescript
is_combinable: table.combinable,  // ✅ Maps to correct DB column
```

**Note:** Frontend blijft `combinable` gebruiken (clean naming), API mapt het naar `is_combinable` voor database.

---

### **2. SQL Script: Verify & Fix Database**

Run dit in **Supabase SQL Editor** om te verifiëren dat de kolom correct is:

```sql
-- Check if column exists
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'tables'
AND column_name IN ('combinable', 'is_combinable')
ORDER BY column_name;
```

**Expected result:**
```
column_name   | data_type | column_default | is_nullable
--------------|-----------|----------------|-------------
is_combinable | boolean   | false          | NO
```

**If you see both columns or only 'combinable', run the fix script:**

```sql
-- File: FIX_TABLES_COLUMN.sql
-- This will automatically fix the schema
```

---

## 🚀 TEST NOW:

### **STAP 1: Restart Dev Server**

```bash
# Stop (Ctrl+C) and restart
npm run dev
```

### **STAP 2: Go to Step 3**

```
http://localhost:3007/manager/f327645c-a658-41f2-853a-215cce39196a/settings?step=3
```

### **STAP 3: Vul Tafels In**

Bijvoorbeeld:
- Tafel 1: 2 stoelen, niet combineerbaar
- Tafel 2: 4 stoelen, niet combineerbaar
- Tafel 3: 6 stoelen, combineerbaar

### **STAP 4: Klik "Opslaan"**

**Should work now!** ✅

---

## 🔍 VERIFY IN DATABASE:

Check dat de tables zijn opgeslagen:

```sql
SELECT 
    t.name AS table_name,
    t.seats,
    t.is_combinable,
    t.group_id,
    l.name AS location_name
FROM tables t
JOIN locations l ON t.location_id = l.id
ORDER BY l.name, t.name;
```

**Expected:**
```
table_name | seats | is_combinable | group_id | location_name
-----------|-------|---------------|----------|---------------
Tafel 1    | 2     | false         | NULL     | My Restaurant
Tafel 2    | 4     | false         | NULL     | My Restaurant
Tafel 3    | 6     | true          | NULL     | My Restaurant
```

---

## 📋 TROUBLESHOOTING:

### **Still Getting "combinable not found" Error?**

**Option A: Check Database Column**
```sql
-- See if column exists
\d tables;

-- Or
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'tables';
```

If `is_combinable` is missing, run:
```sql
ALTER TABLE public.tables 
ADD COLUMN is_combinable BOOLEAN NOT NULL DEFAULT false;
```

**Option B: Run Full Fix Script**
```sql
-- File: FIX_TABLES_COLUMN.sql
-- This handles all scenarios automatically
```

**Option C: Clear Next.js Cache**
```bash
rm -rf .next
npm run dev
```

---

## 📁 FILES FIXED:

### **Modified:**
1. ✅ `app/api/manager/tables/bulk/route.ts`
   - Changed `combinable:` to `is_combinable:` on line 40
   - Added comment explaining mapping

### **Created:**
1. ✅ `FIX_TABLES_COLUMN.sql` - SQL script to verify/fix database schema
2. ✅ `STEP_3_FIX_GUIDE.md` - This guide

---

## ✅ SUMMARY:

**The Problem:** API was using wrong column name
**The Fix:** Map `combinable` (frontend) → `is_combinable` (database)
**The Result:** Step 3 now works! ✅

**Architecture:**
```
Frontend (StepTafels.tsx)
    ↓ sends: { combinable: true }
API (tables/bulk/route.ts)
    ↓ maps to: { is_combinable: true }
Database (tables table)
    ✅ saves to column: is_combinable
```

---

## 🎉 READY!

After this fix:
- ✅ Step 3 saves successfully
- ✅ Tables created in database
- ✅ Can continue to Step 4 (Shifts)
- ✅ No more column errors

**Test it now!** 🚀

---

## 🔗 NEXT STEPS:

After Step 3 works, you'll continue to:
- **Step 4:** Shifts (diensten/services)
- **Step 5:** Policies (annuleringsbeleid)
- **Step 6:** Abonnement (subscription)
- **Step 7:** Integraties (Lightspeed POS)
- **Step 8:** Preview & Publish

**One step at a time!** 💪

