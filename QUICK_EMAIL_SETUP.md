# 🚀 Quick Email Setup

## TL;DR

1. **Upload Templates naar Supabase** (5 minuten)
2. **Test met nieuwe signup** (2 minuten)
3. **Optioneel: Custom SMTP voor productie** (30 minuten)

---

## Stap 1: Templates Uploaden

### Supabase Dashboard
1. Open **Authentication → Email Templates**
2. Voor elk template type:

**Confirm Signup:**
```
Kopieer: supabase/email-templates/confirm-signup.html
Plak in Supabase
Save
```

**Magic Link:**
```
Kopieer: supabase/email-templates/magic-link.html
Plak in Supabase
Save
```

**Reset Password:**
```
Kopieer: supabase/email-templates/password-reset.html
Plak in Supabase
Save
```

⏱️ **Tijd:** 5 minuten  
✅ **Klaar!** Templates zijn actief

---

## Stap 2: Test

### Nieuwe Signup
```
1. Ga naar http://localhost:3007/sign-up
2. Maak account aan
3. Check email
4. Klik verificatie link
5. Zie success banner + "Welkom bij Reserve4You"
```

### Returning User
```
1. Log uit
2. Log weer in
3. Zie "Welkom terug bij Reserve4You"
```

⏱️ **Tijd:** 2 minuten  
✅ **Werkt!** Emails zijn professioneel

---

## Stap 3: Custom Email (Optioneel)

### Voor Productie: SendGrid

**Quick Setup:**
```
1. Maak SendGrid account (gratis)
2. Create API Key
3. Verify domain reserve4you.com
4. Verify sender: admin@reserve4you.com
5. In Supabase → SMTP Settings:
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [API key]
   Sender: admin@reserve4you.com
```

⏱️ **Tijd:** 30 minuten  
✅ **Live!** Emails van admin@reserve4you.com

---

## Features

✅ Success banner bij email verificatie  
✅ "Welkom bij" vs "Welkom terug" detectie  
✅ Professionele Reserve4You branding  
✅ Responsive design  
✅ Nederlandse teksten  
✅ Security warnings  

---

## Wat is Veranderd?

### Code
- ✅ `app/auth/callback/route.ts` - Success parameter doorgeven
- ✅ `app/app/page.tsx` - Detecteert eerste login vs returning

### Templates
- ✅ `confirm-signup.html` - Email verificatie
- ✅ `magic-link.html` - Passwordless login
- ✅ `password-reset.html` - Wachtwoord reset

### Docs
- 📄 `EMAIL_SETUP_GUIDE.md` - Volledige guide
- 📄 `QUICK_EMAIL_SETUP.md` - Deze file

---

## Troubleshooting

**Emails komen niet aan?**
→ Check spam folder (development gebruikt Supabase default sender)

**Template niet updated?**
→ Wacht 5 minuten voor cache refresh

**Success banner verschijnt niet?**
→ Check of `?verified=true` in URL staat na callback

---

Voor gedetailleerde instructies: **`EMAIL_SETUP_GUIDE.md`**

🎉 **Klaar!** Je email flow is professioneel en in thema.

