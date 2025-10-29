#!/bin/bash

echo "🔥 HARD RESTART - Clearing All Caches..."
echo ""

# Stop any running dev servers
echo "1️⃣ Killing any running Next.js processes..."
pkill -f "next dev" 2>/dev/null || echo "   No processes to kill"
sleep 2

# Clear Next.js cache
echo ""
echo "2️⃣ Clearing .next cache..."
rm -rf .next
echo "   ✅ .next deleted"

# Clear node cache (optional but helpful)
echo ""
echo "3️⃣ Clearing node cache..."
rm -rf node_modules/.cache 2>/dev/null || echo "   No node cache found"
echo "   ✅ Done"

echo ""
echo "4️⃣ Starting fresh dev server..."
echo "   Run: npm run dev"
echo ""
echo "✅ READY TO START!"

