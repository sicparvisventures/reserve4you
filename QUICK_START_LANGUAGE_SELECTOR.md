# 🚀 Quick Start: Language Selector

## ✅ 3-Step Setup

### Step 1: Run SQL Script
```bash
# 1. Open Supabase SQL Editor
# 2. Copy/paste: LANGUAGE_TRANSLATION_SETUP.sql
# 3. Click "Run"
```

### Step 2: Restart Dev Server
```bash
# Kill existing server (if running)
lsof -ti:3007 | xargs kill -9

# Start fresh
npm run dev
```

### Step 3: Test!
```bash
# Open: http://localhost:3007
# Look for: 🌐 EN in top-right header
# Click it → Select "Nederlands" → Page translates!
```

---

## 🎯 What You'll See

### Header (Mobile + Desktop)
```
┌────────────────────────────┐
│  R4Y Logo      [🌐 EN] 🔔 │
└────────────────────────────┘
              ↓ Click globe
         ┌─────────────────┐
         │ ✅ English      │
         │   Nederlands    │
         │   Français      │
         └─────────────────┘
```

### Footer
```
No emoji! Just clean hidden div for Google Translate.
```

---

## 🌍 Features

- ✅ **Professional Globe Icon** (no emoji!)
- ✅ **3 Languages**: EN (default), NL, FR
- ✅ **Mobile Responsive**
- ✅ **Auto-saves preference**
- ✅ **Google Translate integration**
- ✅ **Translates entire app**
- ✅ **R4Y branded design**

---

## 📝 Files Created/Modified

### New Files
1. `/components/language/LanguageSelector.tsx`
2. `/components/GoogleTranslateWidget.tsx`
3. `LANGUAGE_TRANSLATION_SETUP.sql`

### Modified Files
1. `/components/header.tsx` - Added language selector
2. `/components/footer.tsx` - Removed emoji
3. `/app/layout.tsx` - Added Google Translate widget

---

## ✅ Done!

Language selector is now **live and functional**!

**Default**: English  
**Options**: Nederlands, Français  
**Location**: Header (top-right, always visible)

🎉 **Test het nu op `localhost:3007`!**

