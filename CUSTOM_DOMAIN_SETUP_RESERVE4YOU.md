# 🌐 Custom Domain Setup: reserve4you.com → Vercel

## 📋 OVERZICHT

- **Apex Domain:** `reserve4you.com` → Vercel deployment
- **WWW Subdomain:** `www.reserve4you.com` → redirect naar apex
- **Email:** Behouden via MailProtect (Combell)
- **SSL:** Automatisch via Vercel
- **Huidige A-records** (217.21.190.139) → Vervangen door Vercel

---

## STAP 1: DOMEIN TOEVOEGEN IN VERCEL

### 1.1 Ga naar je Vercel Project
```
https://vercel.com/dietmarkuh-6243s-projects/reserve4you/settings/domains
```

### 1.2 Voeg beide domains toe:

**Klik op "Add Domain" en voer in:**
```
reserve4you.com
```
Klik "Add"

**Klik nogmaals op "Add Domain" en voer in:**
```
www.reserve4you.com
```
Klik "Add"

### 1.3 Stel redirect in

Bij `www.reserve4you.com`, selecteer:
- ✅ **Redirect to:** `reserve4you.com`

---

## STAP 2: DNS CONFIGURATIE BIJ COMBELL

### 📊 EXACTE DNS RECORDS DIE JE MOET INSTELLEN

#### ✅ **TE VERWIJDEREN:**
```
Type: A
Host: @
Value: 217.21.190.139
→ VERWIJDER DEZE
```

```
Type: A
Host: www
Value: 217.21.190.139
→ VERWIJDER DEZE (indien aanwezig)
```

---

#### ✅ **TOE TE VOEGEN / TE WIJZIGEN:**

### **WEB TRAFFIC (Vercel)**

| Type | Host/Name | Value/Target | TTL |
|------|-----------|--------------|-----|
| `A` | `@` | `76.76.21.21` | `3600` |
| `CNAME` | `www` | `cname.vercel-dns.com` | `3600` |

> **COMBELL SPECIFIEK:** Voer `cname.vercel-dns.com` in **ZONDER punt** aan het einde. Combell voegt deze automatisch toe.
> 
> **ALTERNATIEF:** Als CNAME een foutmelding geeft, gebruik dan een A-record voor www met IP `76.76.21.21`

---

### **EMAIL (MailProtect - BEHOUDEN)**

| Type | Host/Name | Value/Target | TTL | Notitie |
|------|-----------|--------------|-----|---------|
| `MX` | `@` | `mx1.mailprotect.be` | `3600` | Priority: 10 |
| `MX` | `@` | `mx2.mailprotect.be` | `3600` | Priority: 20 |
| `TXT` | `@` | `"v=spf1 include:spf.mailprotect.be ~all"` | `3600` | SPF record |
| `TXT` | `_dmarc` | `"v=DMARC1; p=quarantine; rua=mailto:dmarc@reserve4you.com"` | `3600` | DMARC policy |
| `CNAME` | `autoconfig` | `autoconfig.mailprotect.be.` | `3600` | Email autoconfiguration |
| `CNAME` | `autodiscover` | `autodiscover.mailprotect.be.` | `3600` | Email autodiscovery |

> **NOTA:** Deze email records blijven **ONGEWIJZIGD**. Zorg dat je deze **NIET** verwijdert!

---

## STAP 3: STAP-VOOR-STAP IN COMBELL DNS PANEL

### 3.1 Login bij Combell
1. Ga naar: `https://www.combell.com/nl/mycombell`
2. Login met je credentials
3. Ga naar **"Mijn producten"** → **"Domeinnamen"**
4. Klik op **"reserve4you.com"**

### 3.2 Open DNS beheer
1. Klik op de tab **"DNS"** of **"DNS-instellingen"**
2. Je ziet nu een lijst van alle DNS-records

### 3.3 Verwijder oude A-records (webverkeer)

**Zoek deze records:**
```
Type: A
Host: @ (of leeg/root)
IP: 217.21.190.139
```

**Actie:**
- Klik op het **prullenbak-icoon** of **"Verwijderen"**
- ✅ Bevestig verwijdering

**Als er ook een www A-record is:**
```
Type: A
Host: www
IP: 217.21.190.139
```
- Ook deze **verwijderen**

### 3.4 Voeg Vercel A-record toe (apex domain)

**Klik op "Record toevoegen" of "Nieuw record":**

```
Type:       A
Host/Name:  @          (of laat leeg voor root)
IP-adres:   76.76.21.21
TTL:        3600       (1 uur)
```

**Klik "Opslaan"**

### 3.5 Voeg Vercel CNAME toe (www subdomain)

**Klik op "Record toevoegen" of "Nieuw record":**

```
Type:       CNAME
Host/Name:  www
Doel:       cname.vercel-dns.com
TTL:        3600       (1 uur)
```

> **COMBELL SPECIFIEK:** Voer `cname.vercel-dns.com` in **ZONDER** punt aan einde. Combell voegt de punt automatisch toe.

**Klik "Opslaan"**

---

**ALTERNATIEF (indien CNAME foutmelding geeft):**

Als je de foutmelding "Geen geldige domeinnaam opgegeven" krijgt, gebruik dan een **A-record** voor www:

```
Type:       A
Host/Name:  www
IP-adres:   76.76.21.21
TTL:        3600       (1 uur)
```

> Dit werkt net zo goed als een CNAME voor Vercel!

**Klik "Opslaan"**

### 3.6 Controleer email records (NIET AANPASSEN!)

**Verifieer dat deze records nog aanwezig zijn:**

✅ **MX records:**
```
Type: MX
Host: @ (of leeg)
Priority: 10
Target: mx1.mailprotect.be
```

```
Type: MX
Host: @ (of leeg)
Priority: 20
Target: mx2.mailprotect.be
```

✅ **TXT records (SPF):**
```
Type: TXT
Host: @ (of leeg)
Value: "v=spf1 include:spf.mailprotect.be ~all"
```

✅ **CNAME records (email config):**
```
Type: CNAME
Host: autoconfig
Target: autoconfig.mailprotect.be
```

```
Type: CNAME
Host: autodiscover
Target: autodiscover.mailprotect.be
```

> **Als een van deze email records ontbreekt, voeg ze toe volgens de tabel in Stap 2.**

---

## STAP 4: WACHT OP DNS PROPAGATIE

### Tijdlijn:
- **Direct - 5 minuten:** Combell DNS servers bijgewerkt
- **15-30 minuten:** Meeste providers wereldwijd bijgewerkt
- **Max 24-48 uur:** Volledige wereldwijde propagatie

### Test DNS propagatie:

**Check via terminal (Mac):**
"```bash"
# Test apex domain
dig reserve4you.com A

# Zou moeten tonen: 76.76.21.21

# Test www subdomain
dig www.reserve4you.com CNAME

# Zou moeten tonen: cname.vercel-dns.com

# Test email
dig reserve4you.com MX

# Zou moeten tonen: mx1.mailprotect.be en mx2.mailprotect.be
```

**Check via online tool:**
- Ga naar: `https://dnschecker.org/`
- Voer in: `reserve4you.com`
- Type: `A`
- Check wereldwijde propagatie

---

## STAP 5: VERCEL SSL CERTIFICAAT

### 5.1 Automatische SSL uitgifte

**Na DNS configuratie:**
1. Ga naar Vercel Dashboard → Domains
2. Je ziet bij beide domains:
   - ⏳ **"Pending"** → Vercel valideert DNS
   - ✅ **"Valid"** → SSL certificaat uitgegeven

### 5.2 Als SSL niet automatisch werkt:

**Check:**
1. DNS records correct ingesteld?
2. Wacht 15-30 minuten voor propagatie
3. Ververs Vercel domains pagina

**Force renew (indien nodig):**
1. Vercel Dashboard → Domains
2. Klik op de drie puntjes `...` naast domein
3. Klik **"Refresh SSL Certificate"**

---

## STAP 6: UPDATE ENVIRONMENT VARIABLES

### 6.1 Update NEXT_PUBLIC_APP_URL

**Ga naar:**
```
https://vercel.com/dietmarkuh-6243s-projects/reserve4you/settings/environment-variables
```

**Vind:**
```
NEXT_PUBLIC_APP_URL
```

**Update waarde naar:**
```
https://reserve4you.com
```

**Environment:** Production
**Klik "Save"**

### 6.2 Redeploy na update

**Na het opslaan:**
1. Ga naar: Deployments tab
2. Klik op de drie puntjes `...` bij laatste deployment
3. Klik **"Redeploy"**
4. Of: push een nieuwe commit naar GitHub (auto-deploy)

---

## STAP 7: UPDATE OAUTH & SUPABASE

### 7.1 Supabase URL Configuration

**Ga naar:**
```
https://supabase.com/dashboard/project/jrudqxovozqnmxypjtij/auth/url-configuration
```

**1. Site URL - Update naar:**
```
https://reserve4you.com
```

**2. Redirect URLs - Voeg toe:**
```
https://reserve4you.com/auth/callback
https://reserve4you.com/*
https://www.reserve4you.com/auth/callback
https://www.reserve4you.com/*
```

> **NOTA:** Behoud ook je Vercel preview URLs en localhost URLs

**3. Klik "Save"**

### 7.2 Google OAuth Console

**Ga naar:**
```
https://console.cloud.google.com/apis/credentials
```

**1. Selecteer je OAuth 2.0 Client ID**
**2. Voeg toe aan "Authorized redirect URIs":**
```
https://reserve4you.com/auth/callback
https://www.reserve4you.com/auth/callback
```

**3. Klik "Save"**

---

## 📋 COMPLETE DNS RECORD CHECKLIST

### ✅ Finale DNS configuratie overzicht:

```dns
# WEB TRAFFIC (Vercel)
@ (apex)        A       76.76.21.21
www             CNAME   cname.vercel-dns.com.

# EMAIL (MailProtect)
@               MX      10 mx1.mailprotect.be
@               MX      20 mx2.mailprotect.be
@               TXT     "v=spf1 include:spf.mailprotect.be ~all"
_dmarc          TXT     "v=DMARC1; p=quarantine; rua=mailto:dmarc@reserve4you.com"
autoconfig      CNAME   autoconfig.mailprotect.be.
autodiscover    CNAME   autodiscover.mailprotect.be.
```

---

## 🧪 TESTING CHECKLIST

### Na DNS propagatie, test:

- [ ] `https://reserve4you.com` → Laadt je app
- [ ] `https://www.reserve4you.com` → Redirect naar apex
- [ ] `http://reserve4you.com` → Redirect naar HTTPS
- [ ] SSL certificaat geldig (groene hangslot in browser)
- [ ] Google login werkt
- [ ] Email signup werkt
- [ ] Emails ontvangen/versturen werkt nog
- [ ] Geen mixed content warnings
- [ ] Alle API calls werken

### Test tools:
```bash
# DNS
dig reserve4you.com A
dig www.reserve4you.com CNAME
dig reserve4you.com MX

# SSL
curl -I https://reserve4you.com

# Headers
curl -sI https://www.reserve4you.com | grep -i location
```

---

## 🆘 TROUBLESHOOTING

### ❌ Domain blijft "Pending" in Vercel

**Oorzaken:**
- DNS records nog niet gepropageerd
- Verkeerde DNS configuratie
- TTL te hoog (wacht langer)

**Oplossing:**
1. Check DNS met `dig` commando
2. Wacht 30-60 minuten
3. Ververs Vercel domains pagina
4. Check of punt (`.`) aan einde van CNAME staat

---

### ❌ SSL certificaat niet uitgegeven

**Oorzaken:**
- DNS niet correct
- Domain ownership niet geverifieerd
- Vercel kan domain niet valideren

**Oplossing:**
1. Check DNS configuratie nogmaals
2. Wacht 24 uur voor volledige propagatie
3. Klik "Refresh SSL Certificate" in Vercel
4. Contact Vercel support indien probleem aanhoudt

---

### ❌ Email werkt niet meer

**Oorzaken:**
- MX records verwijderd
- SPF record verwijderd
- Verkeerde prioriteit op MX records

**Oplossing:**
1. Check of alle email records aanwezig zijn
2. Test met: `dig reserve4you.com MX`
3. Voeg ontbrekende records toe volgens Stap 2
4. Test email verzenden/ontvangen

---

### ❌ www redirect werkt niet

**Oorzaken:**
- www CNAME niet correct
- Redirect niet ingesteld in Vercel

**Oplossing:**
1. Check: `dig www.reserve4you.com CNAME`
2. Vercel Dashboard → Domains → Check redirect setting
3. Test: `curl -I https://www.reserve4you.com`

---

### ❌ OAuth login werkt niet

**Oorzaken:**
- Redirect URLs niet bijgewerkt
- NEXT_PUBLIC_APP_URL nog oude waarde
- Cookies/cache issue

**Oplossing:**
1. Verify Supabase redirect URLs (Stap 7.1)
2. Verify Google OAuth URLs (Stap 7.2)
3. Verify environment variable bijgewerkt
4. Clear browser cache / test incognito
5. Redeploy na env var changes

---

## 📊 DNS PROPAGATIE CHECKERS

**Online tools:**
- https://dnschecker.org/ (wereldwijd)
- https://www.whatsmydns.net/ (wereldwijd)
- https://mxtoolbox.com/ (email specifiek)

**Terminal (Mac/Linux):**
```bash
# A record
dig reserve4you.com A +short

# CNAME
dig www.reserve4you.com CNAME +short

# MX records
dig reserve4you.com MX +short

# All records
dig reserve4you.com ANY

# Specific nameserver
dig @8.8.8.8 reserve4you.com A
```

---

## ⚡ QUICK REFERENCE - COMBELL DNS

### DNS Panel toegang:
1. `https://www.combell.com/nl/mycombell`
2. Mijn producten → Domeinnamen
3. reserve4you.com → DNS tab

### Record formaten bij Combell:

**A Record:**
```
Naam: @ (of leeg voor root)
Type: A
IPv4-adres: 76.76.21.21
TTL: 3600
```

**CNAME Record (optie 1):**
```
Naam: www
Type: CNAME
Doel: cname.vercel-dns.com (ZONDER punt aan einde!)
TTL: 3600
```

**A Record voor www (optie 2 - indien CNAME fout geeft):**
```
Naam: www
Type: A
IPv4-adres: 76.76.21.21
TTL: 3600
```

**MX Record:**
```
Naam: @ (of leeg)
Type: MX
Prioriteit: 10
Mailserver: mx1.mailprotect.be
TTL: 3600
```

**TXT Record:**
```
Naam: @ (of leeg)
Type: TXT
Waarde: v=spf1 include:spf.mailprotect.be ~all
TTL: 3600
```

> **Combell specifiek:** Vaak worden domeinnamen automatisch aangevuld, dus voor root gebruik `@` of laat leeg.

---

## 🎯 VERWACHTE RESULTATEN

### Na succesvolle setup:

✅ **Website:**
- `reserve4you.com` → Je Vercel app (HTTPS)
- `www.reserve4you.com` → Redirect naar apex (HTTPS)
- Automatisch SSL certificaat
- Groene hangslot in alle browsers

✅ **Email:**
- Verzenden/ontvangen blijft werken
- SPF checks passeren
- DMARC policy actief
- Autoconfiguratie werkt

✅ **Authentication:**
- Google OAuth werkt
- Email signup/login werkt
- Redirects correct naar custom domain
- Sessions blijven behouden

✅ **Performance:**
- Vercel Edge Network actief
- Global CDN serving
- Automatic caching
- Image optimization

---

## 📞 SUPPORT

### Vercel Support:
- Dashboard: https://vercel.com/support
- Docs: https://vercel.com/docs/projects/domains

### Combell Support:
- Support: https://www.combell.com/nl/support
- Telefoon: +32 9 218 79 79
- Email: support@combell.com

### DNS Hulp:
- Combell DNS guide: https://www.combell.com/nl/help/kb/dns-instellingen-aanpassen
- Vercel custom domains: https://vercel.com/docs/projects/domains/add-a-domain

---

## 🎉 SUCCESS!

**Na voltooiing van alle stappen heb je:**

✅ Custom domain `reserve4you.com` op Vercel  
✅ Automatic HTTPS met SSL certificaat  
✅ WWW redirect naar apex domain  
✅ Email volledig functioneel via MailProtect  
✅ Global CDN met edge network  
✅ Production-ready deployment  

**Je app is nu live op:** `https://reserve4you.com` 🚀

---

**SETUP TIMESTAMP:** 2025-10-21
**DEPLOYMENT:** Custom domain configuration for Vercel


