# ✅ Settings & Logo Upload - COMPLEET

## 🎯 OPGELOSTE PROBLEMEN

### 1. ✅ Settings blijven niet staan na refresh
**Probleem:** Wanneer je bedrijfsinformatie opslaat in `/manager/[tenantId]/settings`, verdwijnt de data na een page refresh.

**Oplossing:** 
- Toegevoegd `useEffect` hook die de tenant data opnieuw initialiseert wanneer de tenant prop verandert
- De component luistert nu naar wijzigingen in de tenant prop en update de state automatisch

### 2. ✅ Logo upload functionaliteit toegevoegd
**Nieuwe Features:**
- Upload een bedrijfslogo in de settings pagina
- Logo wordt opgeslagen in Supabase Storage (`tenant-logos` bucket)
- Logo wordt automatisch getoond in de dashboard sidebar
- Veilige RLS policies zorgen ervoor dat alleen OWNER en MANAGER toegang hebben

## 📁 GEWIJZIGDE BESTANDEN

### 1. **SQL Script - Storage Setup**
```
/Users/dietmar/Desktop/ray2/FIX_SETTINGS_AND_LOGO_UPLOAD.sql
```

**Wat doet dit script:**
- ✅ Voegt `logo_url` kolom toe aan `tenants` tabel (als deze nog niet bestaat)
- ✅ Maakt `tenant-logos` storage bucket aan
- ✅ Configureert RLS policies voor veilige uploads
- ✅ Maakt triggers voor cleanup van oude logo's
- ✅ Voegt indexes toe voor betere performance

### 2. **Image Upload Utility - Uitgebreid**
```
/Users/dietmar/Desktop/ray2/lib/utils/image-upload.ts
```

**Nieuwe functies:**
- `uploadTenantLogo()` - Upload tenant logo naar Supabase Storage
- `deleteTenantLogo()` - Verwijder oude tenant logo's

**Specificaties:**
- Toegestane formaten: JPEG, PNG, WebP, GIF
- Maximum bestandsgrootte: 5MB
- Minimum dimensies: 200x200px (vierkant)
- Automatische compressie naar max 800x800px

### 3. **SettingsClient - Verbeterd**
```
/Users/dietmar/Desktop/ray2/app/manager/[tenantId]/settings/SettingsClient.tsx
```

**Nieuwe Features:**
- ✅ Logo upload sectie in "Bedrijfsinformatie" tab
- ✅ Live preview van geüpload logo
- ✅ Drag & drop upload interface
- ✅ "Ander logo kiezen" knop
- ✅ Automatische image validatie en compressie
- ✅ Upload status feedback ("Logo uploaden...")
- ✅ Data blijft staan na refresh (useEffect fix)

**UI Verbeteringen:**
- Logo upload card met camera icon
- Preview van 200x200px met border
- Verwijder knop (X) rechts boven
- Clear error messages in Nederlands

### 4. **ProfessionalDashboard - Logo Display**
```
/Users/dietmar/Desktop/ray2/app/manager/[tenantId]/dashboard/ProfessionalDashboard.tsx
```

**Wijziging:**
- Linksboven in de header toont nu het logo als deze bestaat
- Fallback naar gekleurd blok met eerste letter als er geen logo is

### 5. **LocationDashboard - Logo Display**
```
/Users/dietmar/Desktop/ray2/app/manager/[tenantId]/location/[locationId]/LocationDashboard.tsx
```

**Wijziging:**
- Logo wordt ook getoond in location dashboard header
- Consistent design met ProfessionalDashboard

## 🚀 INSTALLATIE INSTRUCTIES

### Stap 1: Run het SQL script
```bash
# Open Supabase Dashboard
# Ga naar SQL Editor
# Kopieer en plak de inhoud van FIX_SETTINGS_AND_LOGO_UPLOAD.sql
# Klik op "Run"
```

**Of via terminal:**
```bash
# Als je Supabase CLI hebt geïnstalleerd
supabase db execute --file FIX_SETTINGS_AND_LOGO_UPLOAD.sql
```

### Stap 2: Restart je development server
```bash
# Stop de huidige server (Ctrl+C)
# Start opnieuw
pnpm dev
# of
npm run dev
```

### Stap 3: Test de functionaliteit
1. Ga naar: `http://localhost:3007/manager/[tenantId]/settings`
2. Klik op "Bedrijfsinformatie" tab (eerste tab)
3. Scroll naar "Bedrijfslogo" sectie
4. Upload een logo (vierkant werkt het beste)
5. Vul bedrijfsnaam en merkkleur in
6. Klik op "Wijzigingen Opslaan"
7. ✅ Logo en data blijven nu staan na refresh!

### Stap 4: Verifieer het logo in dashboard
1. Ga naar: `http://localhost:3007/manager/[tenantId]/dashboard`
2. Kijk linksboven in de header
3. ✅ Je logo wordt nu getoond in plaats van de groene cirkel met "P"

## 🎨 DESIGN SPECIFICATIES

### Logo Weergave in Dashboard
```
┌─────────────────────────────────────┐
│  [LOGO]  Bedrijfsnaam              │  ← Header
│          OWNER • Pro Plan          │
└─────────────────────────────────────┘
```

**Logo container:**
- Grootte: 40x40px (w-10 h-10)
- Border radius: rounded-xl
- Achtergrond: wit met border
- Padding: p-1 (voor spacing)
- Object-fit: contain (behoudt aspect ratio)

**Fallback (geen logo):**
- Gekleurd blok met brand_color
- Eerste letter van bedrijfsnaam in wit
- Zelfde grootte en border radius

### Settings Page - Logo Upload
```
┌─────────────────────────────────────┐
│  📷 Bedrijfslogo                    │
│                                      │
│  ┌──────────────┐                  │
│  │              │                   │
│  │  [PREVIEW]   │  X               │
│  │              │                   │
│  └──────────────┘                  │
│  [Ander logo kiezen]               │
└─────────────────────────────────────┘
```

**Upload zone (geen logo):**
- 256x256px (w-64)
- Border: 2px dashed border
- Hover: border-primary met lichte achtergrond
- Upload icon: 48x48px

## 🔒 BEVEILIGING

### RLS Policies
1. **Upload:** Alleen OWNER en MANAGER van de tenant
2. **Read:** Publiek (logo's moeten zichtbaar zijn)
3. **Delete:** Alleen OWNER en MANAGER van de tenant
4. **Update:** Alleen OWNER en MANAGER van de tenant

### File Validatie
- ✅ Type check: alleen image/jpeg, image/jpg, image/png, image/webp
- ✅ Size check: max 5MB
- ✅ Dimension check: min 200x200px
- ✅ Automatische compressie naar 800x800px
- ✅ Cache control: 3600 seconds (1 uur)

## 📊 DATABASE SCHEMA

### Tenants Table
```sql
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS logo_url TEXT;
```

### Storage Bucket
```
Bucket: tenant-logos
├── Public: true
├── File size limit: 5MB
└── Allowed MIME types: 
    - image/jpeg
    - image/jpg
    - image/png
    - image/webp
    - image/gif
```

### Folder Structure in Storage
```
tenant-logos/
  └── [tenant-id]/
      ├── logo-1234567890.png
      └── logo-1234567891.jpg
```

## 🐛 TROUBLESHOOTING

### Probleem: "Failed to upload logo"
**Oplossing:**
1. Check of het SQL script succesvol is uitgevoerd
2. Verifieer dat de `tenant-logos` bucket bestaat in Supabase Storage
3. Check de RLS policies in Supabase Dashboard

### Probleem: Logo verdwijnt na refresh
**Oplossing:**
- Dit probleem is opgelost met de useEffect hook
- Als het nog steeds gebeurt, check de browser console voor errors
- Verifieer dat `logo_url` correct wordt opgeslagen in de database

### Probleem: "Ongeldige afbeelding afmetingen"
**Oplossing:**
- Upload een grotere afbeelding (min 200x200px)
- Vierkante afbeeldingen werken het beste
- Try PNG of JPEG formaat

### Probleem: Upload duurt lang
**Oplossing:**
- Grote bestanden worden automatisch gecomprimeerd
- Max grootte is 5MB - kleinere bestanden uploaden sneller
- Check je internet verbinding

## ✅ VERIFICATIE CHECKLIST

Gebruik deze checklist om te verifiëren dat alles werkt:

- [ ] SQL script succesvol uitgevoerd
- [ ] `tenant-logos` bucket bestaat in Supabase Storage
- [ ] RLS policies zijn aangemaakt (4 policies)
- [ ] Settings pagina toont "Bedrijfslogo" sectie
- [ ] Logo upload werkt (vierkante afbeelding)
- [ ] Preview toont geüploade logo
- [ ] "Wijzigingen Opslaan" werkt zonder errors
- [ ] Data blijft staan na page refresh
- [ ] Logo wordt getoond in ProfessionalDashboard (linksboven)
- [ ] Logo wordt getoond in LocationDashboard (linksboven)
- [ ] Geen console errors

## 🎉 KLAAR!

Je kunt nu:
1. ✅ Bedrijfslogo uploaden via settings
2. ✅ Bedrijfsnaam en merkkleur aanpassen
3. ✅ Data blijft staan na refresh
4. ✅ Logo wordt automatisch getoond in alle dashboards
5. ✅ Vervangt de groene cirkel met "P" links boven

## 📞 SUPPORT

Als je problemen hebt:
1. Check de browser console voor errors
2. Verifieer dat het SQL script succesvol is uitgevoerd
3. Check de Supabase Storage RLS policies
4. Herstart je development server

**SQL Script Locatie:**
`/Users/dietmar/Desktop/ray2/FIX_SETTINGS_AND_LOGO_UPLOAD.sql`

---

**Gemaakt op:** ${new Date().toLocaleDateString('nl-NL')}
**Versie:** 1.0.0

