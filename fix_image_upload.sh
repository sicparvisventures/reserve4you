#!/bin/bash
# =====================================================
# Fix Image Upload RLS Policies
# =====================================================
# Dit script voegt de benodigde RLS policies toe voor
# het uploaden van afbeeldingen in Supabase Storage
# =====================================================

set -e

echo "🔧 Fixing Image Upload RLS Policies..."
echo ""

# Check if connected to Supabase
if ! supabase status &> /dev/null; then
  echo "❌ Supabase is niet gestart. Start eerst met: supabase start"
  exit 1
fi

echo "📤 Applying storage RLS policies..."

# Apply the fix SQL
supabase db execute --file FIX_IMAGE_UPLOAD_RLS.sql

echo ""
echo "✅ RLS Policies toegevoegd!"
echo ""
echo "🎉 Je kunt nu afbeeldingen uploaden in de instellingen pagina!"
echo ""
echo "Test het door:"
echo "1. Ga naar localhost:3007"
echo "2. Log in"
echo "3. Ga naar Manager Portal > Instellingen"
echo "4. Upload een afbeelding"
echo ""

