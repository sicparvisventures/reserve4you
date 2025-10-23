#!/bin/bash

echo "🔍 Checking DNS for reserve4you.com..."
echo ""

echo "📍 Apex domain (should be 76.76.21.21):"
dig reserve4you.com A +short
echo ""

echo "📍 WWW subdomain (should be 76.76.21.21):"
dig www.reserve4you.com A +short
echo ""

echo "📧 Email MX records (should show mailprotect.be):"
dig reserve4you.com MX +short
echo ""

echo "✅ Both should show 76.76.21.21 for Vercel"
echo "⏳ If not, wait 5-10 minutes and run again"

