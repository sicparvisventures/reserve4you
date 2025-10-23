#!/bin/bash

echo "🔍 Testing WWW DNS..."
echo ""
echo "Testing: www.reserve4you.com"
echo "Should show Vercel CNAME, not 217.21.190.139"
echo ""

echo "CNAME lookup:"
dig www.reserve4you.com CNAME +short
echo ""

echo "Final IP (after CNAME resolution):"
dig www.reserve4you.com A +short
echo ""

echo "✅ Should show 76.76.21.21 or Vercel CNAME"
echo "❌ If it shows 217.21.190.139, wait 5 more minutes"

