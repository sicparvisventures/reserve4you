#!/bin/bash

# ============================================================================
# RESERVE4YOU - QUICK DEPLOY SCRIPT
# ============================================================================
# This script prepares your app for production deployment
# ============================================================================

set -e  # Exit on error

echo "🚀 Reserve4You - Quick Deploy Script"
echo "===================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git initialized"
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    pnpm install
    echo "✅ Dependencies installed"
fi

# Check if build works (skip for now to speed up)
echo "⏭️  Skipping type check (will happen on deployment platform)..."

# Create .env.production if it doesn't exist
if [ ! -f .env.production ]; then
    echo "📝 Creating .env.production from example..."
    cp .env.production.example .env.production
    echo "⚠️  IMPORTANT: Update .env.production with your actual values!"
fi

# Add all files to git
echo "📦 Adding files to git..."
git add .

# Commit
echo "💾 Creating commit..."
read -p "Enter commit message (default: 'Production ready'): " commit_msg
commit_msg=${commit_msg:-"Production ready"}
git commit -m "$commit_msg" || echo "No changes to commit"

echo ""
echo "✅ PREPARATION COMPLETE!"
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. Create GitHub repository:"
echo "   - Go to https://github.com/new"
echo "   - Name: reserve4you"
echo "   - Create repository"
echo ""
echo "2. Push to GitHub:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/reserve4you.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Deploy to Cloudflare Pages:"
echo "   - Go to https://dash.cloudflare.com"
echo "   - Workers & Pages → Create → Connect to Git"
echo "   - Select your repository"
echo "   - Configure build settings (see CLOUDFLARE_DEPLOYMENT_GUIDE.md)"
echo ""
echo "4. Add Environment Variables in Cloudflare Pages settings"
echo "   (Copy from .env.production)"
echo ""
echo "5. Update OAuth redirect URLs:"
echo "   - Google: https://console.cloud.google.com"
echo "   - Supabase: https://supabase.com/dashboard"
echo ""
echo "📖 Full guide: CLOUDFLARE_DEPLOYMENT_GUIDE.md"
echo "📋 Checklist: DEPLOYMENT_CHECKLIST.md"
echo ""
echo "🎉 GOOD LUCK WITH YOUR DEPLOYMENT!"

