#!/bin/bash

# =====================================================
# REFRESH AFTER BILLING UPGRADE
# =====================================================
# Dit script cleared alle caches en herstart de server
# Gebruik dit na het upgraden van een abonnement
# =====================================================

echo "🔄 Starting cache clear and server refresh..."
echo ""

# 1. Clear Next.js cache
echo "1️⃣  Clearing Next.js cache..."
rm -rf .next/cache
echo "   ✅ Next.js cache cleared"
echo ""

# 2. Clear browser cache instruction
echo "2️⃣  Browser cache:"
echo "   ⚠️  Open je browser en doe een HARD REFRESH:"
echo "   - Mac: Cmd + Shift + R"
echo "   - Windows/Linux: Ctrl + Shift + R"
echo ""

# 3. Find and kill existing Next.js processes
echo "3️⃣  Stopping existing Next.js processes..."
pkill -f "next dev" 2>/dev/null
if [ $? -eq 0 ]; then
  echo "   ✅ Stopped existing processes"
  sleep 2
else
  echo "   ℹ️  No existing processes found"
fi
echo ""

# 4. Restart the development server
echo "4️⃣  Starting development server..."
echo "   🚀 Starting: pnpm dev"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Server will start on http://localhost:3007"
echo "After server starts, go to your dashboard and refresh!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the server on port 3007
pnpm dev

