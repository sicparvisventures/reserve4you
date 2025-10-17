# 🚀 Reserve4You - Cloudflare Pages Deployment Guide

## ⚠️ BELANGRIJK: Deployment Methode

Next.js 15 met App Router en Server Components **MOET** via Git deployment worden gedeployed naar Cloudflare Pages. Direct ZIP upload werkt **NIET** voor full-stack apps met:
- Server Components
- API Routes
- Supabase SSR
- Google OAuth

---

## 📋 OPTIE 1: Cloudflare Pages via Git (AANBEVOLEN)

### Stap 1: Push naar GitHub

```bash
cd /Users/dietmar/Desktop/ray2

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Reserve4You production ready"

# Create GitHub repo en push
# Via GitHub.com: Create new repository "reserve4you"
git remote add origin https://github.com/YOUR_USERNAME/reserve4you.git
git branch -M main
git push -u origin main
```

### Stap 2: Connect Cloudflare Pages

1. Ga naar [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Klik **Workers & Pages** → **Create Application** → **Pages** → **Connect to Git**
3. Selecteer je GitHub repository: `reserve4you`
4. **Build Settings:**
   ```
   Framework preset: Next.js
   Build command: pnpm build
   Build output directory: .next
   Root directory: (leave empty)
   ```

### Stap 3: Environment Variables

Add deze in Cloudflare Pages → Settings → Environment Variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App URL (SET TO YOUR CLOUDFLARE PAGES URL)
NEXT_PUBLIC_APP_URL=https://your-project.pages.dev
```

### Stap 4: Update OAuth Redirect URLs

**Google OAuth Console:**
- Authorized redirect URIs: `https://your-project.pages.dev/auth/callback/google`

**Supabase Dashboard:**
- Site URL: `https://your-project.pages.dev`
- Redirect URLs: `https://your-project.pages.dev/**`

### Stap 5: Deploy

Cloudflare Pages zal automatisch deployen bij elke push naar `main` branch.

---

## 📋 OPTIE 2: Vercel (ALTERNATIEF)

Als Cloudflare Pages problemen geeft, is Vercel **VEEL GEMAKKELIJKER** voor Next.js:

### Deploy naar Vercel

1. Ga naar [vercel.com](https://vercel.com)
2. **Import Git Repository**
3. Selecteer `reserve4you`
4. Vercel detecteert automatisch Next.js settings
5. Add dezelfde Environment Variables als hierboven
6. Klik **Deploy**

✅ **Klaar in 2 minuten!**

---

## 🔧 Build Configuration Files

### 1. Update `next.config.ts` voor Cloudflare

```typescript
import type { NextConfig } from 'next';
import { config } from '@/lib/config';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  
  compiler: {
    removeConsole: config.app.env === 'production',
  },

  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000,
    // For Cloudflare Pages, use loader
    loader: 'custom',
    loaderFile: './lib/cloudflare-image-loader.ts',
  },

  // Output for serverless (Cloudflare Workers)
  output: 'standalone',

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### 2. Create `.nvmrc` (Node version)

```
18
```

### 3. Create `wrangler.toml` (Cloudflare config)

```toml
name = "reserve4you"
compatibility_date = "2024-01-01"

[env.production]
routes = [
  { pattern = "reserve4you.pages.dev", custom_domain = true }
]
```

---

## 🧪 Test Production Build Locally

```bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# Test production build
pnpm start
```

Visit: `http://localhost:3000`

---

## 📊 Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Cloudflare Pages connected to repo
- [ ] Environment variables configured
- [ ] Google OAuth redirect URLs updated
- [ ] Supabase redirect URLs updated
- [ ] Stripe webhook endpoint updated to production URL
- [ ] Test login flow
- [ ] Test booking flow
- [ ] Test manager dashboard
- [ ] Verify Supabase RLS policies work in production

---

## ⚠️ Common Issues

### Issue: "Module not found" errors
**Fix:** Ensure all imports use correct paths and are included in build

### Issue: "Supabase auth not working"
**Fix:** Check redirect URLs in both Supabase and OAuth providers

### Issue: "Environment variables undefined"
**Fix:** Restart Cloudflare Pages deployment after adding env vars

### Issue: "Images not loading"
**Fix:** Configure Cloudflare Images or use next/image with custom loader

---

## 🎯 Production URLs

After deployment, je krijgt:

- **Production:** `https://reserve4you.pages.dev`
- **Preview (per branch):** `https://branch-name.reserve4you.pages.dev`

---

## 💡 Pro Tips

1. **Custom Domain:** Add in Cloudflare Pages → Custom domains
2. **Analytics:** Enable Cloudflare Web Analytics
3. **Monitoring:** Use Cloudflare Logs for debugging
4. **Auto Deploy:** Every push to `main` triggers deployment
5. **Preview Branches:** Every PR gets preview URL

---

## 📞 Need Help?

- Cloudflare Docs: https://developers.cloudflare.com/pages/
- Next.js on Cloudflare: https://developers.cloudflare.com/pages/framework-guides/nextjs/
- Supabase + Next.js: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs

---

**SUCCES MET JE DEPLOYMENT!** 🚀

