# Reserve4You - Alle Email Templates voor Supabase

## 📧 Complete Overzicht

Dit document bevat alle email templates die je direct in Supabase kunt plakken. Alle templates zijn:
- ✅ Volledig responsive (mobile, tablet, desktop)
- ✅ In Reserve4You branding (#FF5A5F)
- ✅ In het Nederlands
- ✅ Met security warnings
- ✅ Professioneel design

---

## 📋 Template Overzicht

| Template | Subject Heading | Bestand |
|----------|----------------|---------|
| **Confirm sign up** | `Bevestig je email adres - Reserve4You` | `confirm-signup-improved.html` |
| **Magic link** | `Inloggen bij Reserve4You` | `magic-link-improved.html` |
| **Reset password** | `Wachtwoord resetten - Reserve4You` | `reset-password-improved.html` |
| **Invite user** | `Je vrienden hebben je uitgenodigd voor Reserve4You!` | `invite-user.html` |
| **Change email address** | `Bevestig je nieuwe email adres - Reserve4You` | `change-email-address.html` |
| **Reauthentication** | `Bevestig je identiteit - Reserve4You` | `reauthentication.html` |

---

## 🚀 Instructies voor Supabase

### Stap 1: Open Supabase Dashboard
1. Ga naar je Supabase project
2. Klik op **Authentication** in het menu
3. Klik op **Email Templates**

### Stap 2: Configureer Elk Template

Voor elk template type:
1. Selecteer het template in de lijst
2. Plak de **Subject Heading** in het "Subject heading" veld
3. Klik op **"Source"** tab (of **"Message body"**)
4. Verwijder alle bestaande content
5. Open het bijbehorende HTML bestand
6. Kopieer de volledige HTML code
7. Plak in Supabase
8. Klik **Save**

---

## 1️⃣ Confirm Sign Up

### Subject Heading:
```
Bevestig je email adres - Reserve4You
```

### Source Code:
Kopieer de volledige HTML uit: `confirm-signup-improved.html`

**Features:**
- Email verificatie bij nieuwe aanmelding
- 24 uur geldige link
- Features lijst met voordelen
- Security notice

---

## 2️⃣ Magic Link

### Subject Heading:
```
Inloggen bij Reserve4You
```

### Source Code:
Kopieer de volledige HTML uit: `magic-link-improved.html`

**Features:**
- Passwordless login link
- 1 uur geldig
- Eenmalig gebruik
- Security notice

---

## 3️⃣ Reset Password

### Subject Heading:
```
Wachtwoord resetten - Reserve4You
```

### Source Code:
Kopieer de volledige HTML uit: `reset-password-improved.html`

**Features:**
- Wachtwoord reset link
- 1 uur geldig
- Security notice met extra waarschuwing

---

## 4️⃣ Invite User

### Subject Heading:
```
Je vrienden hebben je uitgenodigd voor Reserve4You!
```

### Source Code:
Kopieer de volledige HTML uit: `invite-user.html`

**Features:**
- Persoonlijke uitnodiging van vrienden (sociale focus)
- Benadrukt organische groei en sociale aspecten
- Focus op samen plannen, delen en ontdekken
- 7 dagen geldig
- Features lijst met sociale voordelen (samen plannen, momenten delen, reviews van vrienden)
- Aantrekkelijk voor nieuwe gebruikers om zich aan te melden
- Security notice

---

## 5️⃣ Change Email Address

### Subject Heading:
```
Bevestig je nieuwe email adres - Reserve4You
```

### Source Code:
Kopieer de volledige HTML uit: `change-email-address.html`

**Features:**
- Bevestiging nieuwe email adres
- 24 uur geldig
- Toont nieuw email adres (als beschikbaar via `{{ .Email }}`)
- Security notice met directe support link

---

## 6️⃣ Reauthentication

### Subject Heading:
```
Bevestig je identiteit - Reserve4You
```

### Source Code:
Kopieer de volledige HTML uit: `reauthentication.html`

**Features:**
- Herbevestiging identiteit voor gevoelige acties
- 1 uur geldig
- Eenmalig gebruik
- Info box met uitleg waarom bevestiging nodig is
- Security notice met directe support link

---

## 📝 Supabase Variables

Alle templates gebruiken deze Supabase variabelen die automatisch vervangen worden:

| Variable | Beschrijving | Gebruikt in |
|----------|--------------|-------------|
| `{{ .ConfirmationURL }}` | De verificatie/login/actie link | Alle templates |
| `{{ .Email }}` | Email adres van de gebruiker | Change email address (optioneel) |
| `{{ .SiteURL }}` | Site URL | Kan gebruikt worden in footer links |
| `{{ .Token }}` | Auth token (niet zichtbaar) | Interne Supabase variabele |
| `{{ .TokenHash }}` | Token hash (niet zichtbaar) | Interne Supabase variabele |

---

## 🎨 Design Details

### Kleuren
- **Primaire Kleur**: #FF5A5F (Reserve4You Brand Red)
- **Achtergrond**: #F9F5F2 (Warm ivoor, zoals in design systeem)
- **Border**: #EAE3DF (Gebroken wit-beige)
- **Text**: #111111 (Near-black) voor headings, #52525B voor body text
- **Security Notice**: #FEF3C7 achtergrond, #F59E0B border

### Typography
- **Font**: System font stack (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, etc.)
- **Heading**: 28px, font-weight 700
- **Body**: 16px, line-height 1.7
- **Button**: 16px, font-weight 600

### Layout
- **Max Width**: 600px
- **Border Radius**: 16px (email container), 12px (buttons en boxes)
- **Padding**: 48px (desktop), 36px (mobile)

---

## ✅ Testing Checklist

Voor elk template:
- [ ] Subject heading correct
- [ ] HTML correct geplakt in Supabase
- [ ] Email ontvangen in inbox
- [ ] Reserve4You branding zichtbaar
- [ ] Button werkt en linkt correct
- [ ] Alternative link werkt
- [ ] Security notice zichtbaar
- [ ] Responsive op mobile
- [ ] Footer links werken
- [ ] Alle variabelen worden correct vervangen

---

## 🧪 Testen

### Test Flow:
1. **Confirm Sign Up**: Maak nieuw test account aan
2. **Magic Link**: Probeer in te loggen met magic link
3. **Reset Password**: Vraag wachtwoord reset aan
4. **Invite User**: Nodig een test gebruiker uit
5. **Change Email**: Wijzig email adres in account instellingen
6. **Reauthentication**: Voer gevoelige actie uit (bijv. wachtwoord wijzigen)

### Email Client Testen:
Test in verschillende email clients:
- Gmail (web & mobile)
- Outlook (web & desktop)
- Apple Mail
- Mobile email apps

---

## 🔒 Security Features

Alle templates bevatten:
- ✅ Security notices met duidelijke waarschuwingen
- ✅ Expiry notices (tijdslimiet voor links)
- ✅ Alternative links (fallback als button niet werkt)
- ✅ Support email links voor verdachte activiteit
- ✅ Duidelijke instructies wat te doen bij ongeautoriseerde emails

---

## 📞 Support

Bij vragen over email templates:
- Email: support@reserve4you.com
- Check Supabase logs voor email delivery status
- Test altijd met een test account eerst

---

## 🎯 Volgende Stappen

Na het configureren van alle templates:
1. ✅ Test alle templates met test accounts
2. ✅ Configureer SMTP settings voor productie (optioneel)
3. ✅ Monitor email delivery in Supabase dashboard
4. ✅ Pas templates aan indien nodig na feedback

---

**Klaar!** Alle Reserve4You email templates zijn nu geconfigureerd en klaar voor gebruik. 🎉

