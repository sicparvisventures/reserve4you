d# Email Setup Guide - Reserve4You

## Overzicht

Deze guide legt uit hoe je:
1. ✅ Custom email templates instelt in Supabase
2. ✅ De sender email wijzigt naar `admin@reserve4you.com`
3. ✅ SMTP configureert voor productie
4. ✅ Email templates test

---

## 📧 Email Templates

We hebben 3 professionele email templates gemaakt:

1. **`confirm-signup.html`** - Email verificatie bij nieuwe aanmelding
2. **`magic-link.html`** - Passwordless login link
3. **`password-reset.html`** - Wachtwoord reset link

Alle templates zijn:
- ✅ Volledig responsive (mobile, tablet, desktop)
- ✅ In Reserve4You branding (primary red #FF5A5F)
- ✅ In het Nederlands
- ✅ Met security warnings
- ✅ Professioneel design zonder emoji's

---

## 🚀 Stap 1: Email Templates Installeren in Supabase

### Voor Development (Supabase Hosted Auth)

1. **Open Supabase Dashboard**
   - Ga naar je project
   - Klik op **Authentication** in het menu
   - Klik op **Email Templates**

2. **Configureer Confirm Signup Template**
   - Selecteer **"Confirm signup"** template
   - Verwijder de standaard content
   - Open `supabase/email-templates/confirm-signup.html`
   - Kopieer en plak de volledige HTML
   - Klik **Save**

3. **Configureer Magic Link Template**
   - Selecteer **"Magic Link"** template
   - Verwijder de standaard content
   - Open `supabase/email-templates/magic-link.html`
   - Kopieer en plak de volledige HTML
   - Klik **Save**

4. **Configureer Reset Password Template**
   - Selecteer **"Reset Password"** template
   - Verwijder de standaard content
   - Open `supabase/email-templates/password-reset.html`
   - Kopieer en plak de volledige HTML
   - Klik **Save**

### Template Variables

Supabase gebruikt deze variabelen die automatisch vervangen worden:

- `{{ .ConfirmationURL }}` - De verificatie/login link
- `{{ .Email }}` - Email van de gebruiker (optioneel)
- `{{ .Token }}` - Auth token (niet zichtbaar voor gebruiker)
- `{{ .TokenHash }}` - Token hash (niet zichtbaar voor gebruiker)
- `{{ .SiteURL }}` - Je app URL

Deze staan al correct in de templates! ✅

---

## 📮 Stap 2: Sender Email Configureren

### Development: Supabase Default Sender

**Standaard:** Supabase gebruikt `noreply@mail.app.supabase.io`

**Limitaties:**
- ⚠️ Emails kunnen in spam terechtkomen
- ⚠️ Geen custom sender name
- ⚠️ Rate limits (3-4 emails per uur in development)

**Voor testing is dit OK!**

### Production: Custom Domain Email

Om `admin@reserve4you.com` te gebruiken heb je SMTP nodig.

---

## 🔧 Stap 3: Custom SMTP Setup (Productie)

### Optie A: SendGrid (Aanbevolen)

**Voordelen:** Gratis 100 emails/dag, betrouwbaar, makkelijke setup

**Setup:**

1. **Maak SendGrid Account**
   - Ga naar https://sendgrid.com/
   - Sign up (gratis plan)
   - Verify je email

2. **Maak API Key**
   - Ga naar Settings → API Keys
   - Create API Key
   - Naam: "Reserve4You SMTP"
   - Permissions: Full Access
   - **Kopieer de key** (zie je maar 1x!)

3. **Configureer Domain in SendGrid**
   - Ga naar Settings → Sender Authentication
   - Klik "Authenticate Your Domain"
   - Voer `reserve4you.com` in
   - Volg instructies om DNS records toe te voegen:
     - CNAME records voor domain verification
     - DKIM records voor email signing
   - Wacht op verificatie (15-30 minuten)

4. **Maak Verified Sender**
   - Ga naar Settings → Sender Authentication
   - Klik "Verify a Single Sender"
   - From Email: `admin@reserve4you.com`
   - From Name: `Reserve4You`
   - Reply To: `admin@reserve4you.com`
   - Verify via email

5. **Configureer Supabase**
   - Ga naar Supabase Dashboard
   - Project Settings → Auth → SMTP Settings
   - Enable Custom SMTP
   - Vul in:
     ```
     Host: smtp.sendgrid.net
     Port: 587
     Username: apikey
     Password: [Je API Key van stap 2]
     Sender email: admin@reserve4you.com
     Sender name: Reserve4You
     ```
   - Klik **Save**

### Optie B: AWS SES

**Voordelen:** Goedkoop ($0.10 per 1000 emails), zeer schaalbaal

**Setup:**

1. **AWS SES Account Setup**
   - Ga naar AWS Console → SES
   - Request production access (anders max 200 emails/dag)
   - Verify domain: `reserve4you.com`
   - Voeg DNS records toe (SES geeft deze)

2. **SMTP Credentials Maken**
   - SES → SMTP Settings
   - Create SMTP Credentials
   - Download credentials (username + password)

3. **Configureer Supabase**
   ```
   Host: email-smtp.[region].amazonaws.com
   Port: 587
   Username: [SMTP username]
   Password: [SMTP password]
   Sender email: admin@reserve4you.com
   Sender name: Reserve4You
   ```

### Optie C: Custom Email Provider

Je kunt elke SMTP provider gebruiken:
- Mailgun
- Postmark
- SparkPost
- Je eigen email server

Configureer gewoon de SMTP settings in Supabase.

---

## 🧪 Stap 4: Testen

### Test Email Verificatie

1. **Maak test account**
   ```bash
   # In browser incognito:
   http://localhost:3007/sign-up
   ```

2. **Vul gegevens in**
   ```
   Email: test+signup@jouwdomein.com
   Password: TestPassword123!
   ```

3. **Check inbox**
   - Open email
   - **Verwacht:**
     - ✅ Sender: Reserve4You <admin@reserve4you.com> (of noreply in dev)
     - ✅ Subject: "Bevestig je email adres"
     - ✅ Rode Reserve4You header
     - ✅ Nederlandse tekst
     - ✅ Grote rode "Bevestig Email Adres" knop
     - ✅ Alternative link sectie
     - ✅ Security warning

4. **Klik verificatie link**
   - **Verwacht:**
     - ✅ Redirect naar `/app?verified=true`
     - ✅ Groene success banner "Je email is succesvol geverifieerd!"
     - ✅ "Welkom bij Reserve4You" (eerste keer)

### Test Returning User

1. **Log out**
   ```
   Klik op je profiel → Uitloggen
   ```

2. **Log in**
   ```
   Gebruik zelfde email + password
   ```

3. **Check welkomstpagina**
   - **Verwacht:**
     - ✅ "Welkom terug bij Reserve4You"
     - ✅ "Fijn dat je er weer bent!"
     - ✅ Geen success banner

### Test Magic Link (Optioneel)

Als je passwordless login wilt:

1. **Implementeer magic link form**
   ```typescript
   // In sign-in page
   const { error } = await supabase.auth.signInWithOtp({
     email: 'test@example.com',
   });
   ```

2. **Check email**
   - Verwacht: Magic link template met "Inloggen bij Reserve4You" knop

---

## 📊 Email Analytics

### Development

Check logs in Supabase:
```
Dashboard → Logs → Auth Logs
```

Filter op:
- `auth.signup`
- `auth.email.sent`

### Production

**SendGrid Dashboard:**
- Emails sent
- Delivery rate
- Open rate
- Click rate
- Spam reports

**AWS SES Dashboard:**
- Sends
- Bounces
- Complaints
- Delivery metrics

---

## 🛠️ Troubleshooting

### Emails komen niet aan

**Check:**
1. ✅ Is SMTP correct geconfigureerd?
2. ✅ Is domain geverifieerd?
3. ✅ Check spam folder
4. ✅ Check Supabase logs voor errors

**Fix:**
```bash
# Test SMTP connection
# In Supabase dashboard → Auth → SMTP Settings → Test Connection
```

### Emails gaan naar spam

**Oorzaken:**
- ⚠️ Domain niet geverifieerd
- ⚠️ Geen DKIM/SPF records
- ⚠️ Geen DMARC policy

**Fix:**
1. Verify domain in SendGrid/SES
2. Voeg DKIM records toe aan DNS
3. Voeg SPF record toe: `v=spf1 include:sendgrid.net ~all`
4. Voeg DMARC record toe: `v=DMARC1; p=none; rua=mailto:admin@reserve4you.com`

### Template niet updated

**Fix:**
1. Clear Supabase cache (wait 5 minutes)
2. Test met nieuwe email
3. Check of template correct opgeslagen is

### Verificatie link werkt niet

**Check:**
1. ✅ Is `NEXT_PUBLIC_APP_URL` correct?
2. ✅ Is callback route `/auth/callback` actief?
3. ✅ Check browser console voor errors

**Fix:**
```typescript
// In .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3007

// In Supabase Dashboard → Auth → URL Configuration:
Site URL: http://localhost:3007
Redirect URLs: http://localhost:3007/auth/callback
```

---

## 🔒 Security Best Practices

### Email Template Security

✅ **Doen:**
- Gebruik HTTPS voor alle links
- Toon expiratie tijd van links
- Waarschuw voor phishing
- Gebruik clear sender identity

❌ **Niet doen:**
- Nooit wachtwoorden in emails
- Nooit auth tokens zichtbaar maken
- Geen javascript in emails
- Geen externe resources zonder HTTPS

### SMTP Security

✅ **Doen:**
- Gebruik environment variables voor SMTP credentials
- Rotate API keys regelmatig
- Monitor bounce/complaint rates
- Enable 2FA op SMTP provider account

❌ **Niet doen:**
- Hardcode SMTP credentials
- Commit credentials to git
- Share API keys via unsecure channels

---

## 📈 Production Checklist

Voordat je live gaat:

- [ ] Domain geverifieerd in SMTP provider
- [ ] DKIM/SPF/DMARC DNS records geconfigureerd
- [ ] Custom SMTP enabled in Supabase
- [ ] Alle 3 templates ge-upload
- [ ] Test emails verstuurd en ontvangen
- [ ] Emails komen NIET in spam
- [ ] Links werken correct
- [ ] Sender email is `admin@reserve4you.com`
- [ ] Analytics dashboard bekeken
- [ ] Bounce rate < 5%
- [ ] Rate limits verhoogd (indien nodig)

---

## 🎨 Template Customization

Wil je de templates aanpassen?

### Kleuren Wijzigen

In de `<style>` sectie:

```css
/* Primary color (buttons, links) */
background: linear-gradient(135deg, #FF5A5F 0%, #E84347 100%);

/* Text colors */
.title { color: #1a1a1a; }
.text { color: #666666; }

/* Footer */
.footer { background-color: #f8f8f8; }
```

### Logo Toevoegen

In de header section:

```html
<div class="header">
  <img src="https://reserve4you.com/logo-white.png" alt="Reserve4You" style="max-width: 200px;">
</div>
```

⚠️ **Let op:** Logo moet gehost zijn op HTTPS URL!

### Teksten Aanpassen

Pas de teksten aan in de HTML, maar behoud de variabelen:
- `{{ .ConfirmationURL }}`
- `{{ .Email }}`

---

## 📚 Resources

**Supabase Docs:**
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

**SMTP Providers:**
- [SendGrid](https://sendgrid.com/) - Gratis 100/dag
- [AWS SES](https://aws.amazon.com/ses/) - $0.10/1000
- [Mailgun](https://www.mailgun.com/) - Gratis 5000/maand

**Email Testing:**
- [Mail-Tester](https://www.mail-tester.com/) - Spam score check
- [MX Toolbox](https://mxtoolbox.com/) - DNS/deliverability check

---

## ✅ Summary

Na deze setup:

✅ **Nieuwe users** ontvangen professionele verificatie email  
✅ **Emails komen van** `admin@reserve4you.com` (productie)  
✅ **Eerste login** toont "Welkom bij Reserve4You" + success banner  
✅ **Returning users** zien "Welkom terug"  
✅ **Emails zijn branded** in Reserve4You stijl  
✅ **Nederlands** in alle communicatie  
✅ **Geen spam** door correcte DNS setup  

Je email flow is nu professioneel en klaar voor productie! 🎉

---

**Questions?** Check Supabase logs of contact support@reserve4you.com

