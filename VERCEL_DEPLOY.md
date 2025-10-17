# 🚀 Reserve4You - Vercel Deployment (SNELSTE OPTIE)

## ⚡ 2-MINUTEN DEPLOYMENT

Vercel is **GEMAAKT VOOR NEXT.JS** en is de snelste manier om te deployen.

---

## 📋 STAP-VOOR-STAP

### Stap 1: Push naar GitHub (1 minuut)

```bash
cd /Users/dietmar/Desktop/ray2

# Run het quick deploy script
./QUICK_DEPLOY.sh

# Volg de instructies om naar GitHub te pushen
```

### Stap 2: Deploy via Vercel (1 minuut)

**Optie A: Via Web UI** ⭐ MAKKELIJKST

1. Ga naar https://vercel.com/new
2. Import je GitHub repository
3. Vercel detecteert automatisch Next.js
4. Klik **"Deploy"**
5. ✅ **KLAAR!**

**Optie B: Via CLI**

```bash
# Install Vercel CLI
pnpm i -g vercel

# Login
vercel login

# Deploy
vercel

# Production deploy
vercel --prod
```

### Stap 3: Environment Variables (2 minuten)

In Vercel Dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
STRIPE_SECRET_KEY=your_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_public
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

### Stap 4: Update OAuth URLs (1 minuut)

**Google OAuth Console:**
```
Authorized redirect URIs:
https://your-project.vercel.app/auth/callback/google
```

**Supabase Dashboard:**
```
Site URL: https://your-project.vercel.app
Redirect URLs: https://your-project.vercel.app/**
```

---

## ✅ DAT IS ALLES!

Je app draait nu op: `https://your-project.vercel.app`

---

## 🎯 VERCEL VOORDELEN

### Automatisch Geconfigureerd
- ✅ Next.js optimalisatie
- ✅ Image optimalisatie
- ✅ Edge Functions
- ✅ Incremental Static Regeneration
- ✅ Serverless Functions

### Developer Experience
- ✅ Instant preview deploys
- ✅ Rollback in 1 klik
- ✅ Real-time logs
- ✅ Analytics included
- ✅ Performance insights

### Performance
- ✅ Global Edge Network
- ✅ Automatic HTTPS
- ✅ DDoS protection
- ✅ 99.99% uptime SLA
- ✅ Zero config caching

---

## 🔧 VERCEL CONFIGURATION

### vercel.json (optional - auto-detected)

```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "regions": ["cdg1", "iad1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

## 📊 MONITORING

### Built-in Analytics

Vercel provides:
- ✅ Real User Monitoring
- ✅ Web Vitals tracking
- ✅ Error tracking
- ✅ Function logs
- ✅ Deployment logs

Access via: Dashboard → Analytics

---

## 🚀 DEPLOYMENT WORKFLOW

### Development
```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
```
→ Auto-deploy to preview URL

### Staging
```bash
git checkout staging
git merge feature/new-feature
git push origin staging
```
→ Auto-deploy to staging URL

### Production
```bash
git checkout main
git merge staging
git push origin main
```
→ Auto-deploy to production URL

---

## 🆘 TROUBLESHOOTING

### Build Fails
Check build logs in Vercel Dashboard → Deployments → [failed build]

### Environment Variables Not Working
- Redeploy after adding env vars
- Check variable names match exactly

### Auth Not Working
- Verify redirect URLs
- Check NEXT_PUBLIC_APP_URL is set

---

## 💡 PRO TIPS

### Custom Domain
1. Vercel Dashboard → Settings → Domains
2. Add your domain
3. Update DNS records
4. ✅ Auto HTTPS!

### Preview Deployments
Every PR gets its own URL:
`https://reserve4you-git-branch-name-youruser.vercel.app`

### Rollback
If something breaks:
1. Vercel Dashboard → Deployments
2. Find working deployment
3. Click "..." → "Promote to Production"
4. ✅ Instant rollback!

### Speed Up Builds
```json
// vercel.json
{
  "github": {
    "silent": true
  },
  "buildCommand": "pnpm build --no-lint"
}
```

---

## 📈 SCALING

### Free Tier Includes:
- ✅ 100 GB bandwidth
- ✅ 1000 serverless function executions
- ✅ Unlimited static requests
- ✅ Unlimited preview deployments

### Need More?
Upgrade to Pro for:
- 1 TB bandwidth
- Higher function limits
- Advanced analytics
- Team collaboration

---

## 🎉 SUCCESS CHECKLIST

- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Environment variables set
- [ ] OAuth URLs updated
- [ ] Custom domain added (optional)
- [ ] Test login flow
- [ ] Test booking flow
- [ ] Test manager dashboard
- [ ] Monitor for errors

---

## 📞 SUPPORT

- Vercel Docs: https://vercel.com/docs
- Next.js on Vercel: https://vercel.com/docs/frameworks/nextjs
- Community: https://github.com/vercel/next.js/discussions

---

## ⚡ QUICK COMMANDS

```bash
# Install CLI
pnpm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# Open dashboard
vercel dashboard
```

---

**JE BENT NU LIVE!** 🚀

Vercel = Next.js op zijn best. Zero config, maximum performance.

**ENJOY!** 🎉

