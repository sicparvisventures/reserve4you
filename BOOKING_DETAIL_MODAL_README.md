# Booking Detail Modal - Klantinformatie & Speciale Verzoeken

## 🎯 Wat is er geïmplementeerd?

Managers kunnen nu op reservaties klikken in het dashboard om gedetailleerde informatie te zien over:
- ✅ **Klantgegevens**: Naam, email, telefoon
- ✅ **Reservering details**: Datum, tijd, aantal gasten, tafel
- ✅ **Speciale verzoeken**: Wat de klant heeft ingevuld bij het maken van de reservering
- ✅ **Interne notities**: Notities van het personeel (indien aanwezig)
- ✅ **Status acties**: Bevestigen, annuleren, no-show markeren
- ✅ **Kopieer functionaliteit**: Email en telefoon direct kopiëren naar klembord
- ✅ **Direct contact**: Mail en bel links voor snelle communicatie

## 📁 Nieuwe Bestanden

### 1. `components/manager/BookingDetailModal.tsx`

Een herbruikbare modal component die alle booking details toont.

**Features:**
- 📋 Klantinformatie sectie met naam, email, telefoon
- 📅 Reservering details met datum, tijd, aantal gasten
- 💬 Speciale verzoeken van de klant
- 📝 Interne notities (indien aanwezig)
- 🏢 Locatie informatie
- 🔄 Status acties (bevestigen, annuleren, etc.)
- 📋 Copy-to-clipboard functionaliteit
- 📞 Direct mail en bel links
- 🎨 Mooie UI met icons en badges

**Props:**
```typescript
interface BookingDetailModalProps {
  booking: any;                           // De booking data
  open: boolean;                          // Modal open/closed state
  onOpenChange: (open: boolean) => void;  // Handler voor open/close
  onStatusUpdate?: (bookingId: string, status: string) => Promise<void>; // Optioneel
  isUpdating?: boolean;                   // Loading state voor status updates
}
```

**Ondersteunt verschillende veldnamen:**
De modal werkt met verschillende database kolom namen:
- `guest_name` / `customer_name`
- `guest_email` / `customer_email`
- `guest_phone` / `customer_phone`
- `guest_note` / `special_requests` / `notes`
- `start_ts` / `start_time` / `booking_date + booking_time`
- `party_size` / `number_of_guests`

## 📝 Aangepaste Bestanden

### 2. `app/manager/[tenantId]/dashboard/ProfessionalDashboard.tsx`

**Wijzigingen:**
- ✅ Import van `BookingDetailModal`
- ✅ State toegevoegd: `selectedBooking`, `isBookingModalOpen`
- ✅ Booking items zijn nu klikbaar (cursor-pointer + onClick)
- ✅ Eye icon button toegevoegd aan elke booking
- ✅ stopPropagation op action buttons om modal niet te openen bij button click
- ✅ BookingDetailModal component toegevoegd aan render

**Gebruikerservaring:**
- Klik op een reservatie → Modal opent met details
- Klik op Eye icon → Modal opent met details
- Klik op action buttons (bevestigen, annuleren) → Alleen die actie wordt uitgevoerd

### 3. `app/manager/[tenantId]/location/[locationId]/LocationDashboard.tsx`

**Wijzigingen:**
- ✅ Import van `BookingDetailModal`
- ✅ State toegevoegd: `selectedBooking`, `isBookingModalOpen`
- ✅ Booking cards zijn nu klikbaar met hover effect
- ✅ MoreVertical button vervangen door Eye icon met onClick
- ✅ BookingDetailModal component toegevoegd aan render

**Gebruikerservaring:**
- Klik op een booking card → Modal opent met details
- Klik op Eye icon → Modal opent met details
- Smooth hover transitions

## 🚀 Hoe te Gebruiken

### In Dashboard (Tenant overzicht)

1. Ga naar: `http://localhost:3007/manager/{tenantId}/dashboard`
2. Scroll naar de reserveringen sectie
3. **Optie 1**: Klik ergens op een reservatie item
4. **Optie 2**: Klik op het Eye icon rechts
5. Modal opent met alle details!

### In Location Dashboard

1. Ga naar: `http://localhost:3007/manager/{tenantId}/location/{locationId}`
2. Tab "Reserveringen" is standaard geselecteerd
3. **Optie 1**: Klik ergens op een reservatie card
4. **Optie 2**: Klik op het Eye icon rechts
5. Modal opent met alle details!

## 💡 Features in de Modal

### Klantinformatie Sectie
```
┌─────────────────────────────────────┐
│ 👤 Klantinformatie                  │
├─────────────────────────────────────┤
│ 👤 John Doe                  [📋]   │
│ 📧 john@example.com         [📋][↗]│
│ 📞 +31612345678             [📋][↗]│
└─────────────────────────────────────┘
```

**Functionaliteit:**
- [📋] = Copy naar klembord
- [↗] = Open in mail client / bel direct

### Reservering Details
```
┌──────────────────┬──────────────────┐
│ 📅 Datum         │ 🕐 Tijd          │
│ Vrijdag          │ 19:00 - 21:00    │
│ 24 januari 2025  │                  │
├──────────────────┼──────────────────┤
│ 👥 Aantal gasten │ 📍 Tafel         │
│ 4 personen       │ Tafel 12         │
└──────────────────┴──────────────────┘
```

### Speciale Verzoeken
```
┌─────────────────────────────────────┐
│ 💬 Speciale Verzoeken               │
├─────────────────────────────────────┤
│ Graag een rustig tafeltje voor     │
│ een verjaardagsviering. We hebben   │
│ een kinderstoel nodig.              │
└─────────────────────────────────────┘
```

### Status Acties

**Voor PENDING bookings:**
- ✅ Bevestigen (groen)
- ❌ Annuleren (rood)

**Voor CONFIRMED bookings:**
- ✅ Markeer als voltooid
- 🚫 No-show

**Voor CANCELLED/NO_SHOW:**
- ✅ Heractiveren

## 🎨 UI/UX Details

### Design Principes
- **Kleurgebruik**: Status badges met consistente kleuren
  - CONFIRMED: Groen
  - PENDING: Geel/Warning
  - CANCELLED: Rood
  - COMPLETED: Blauw
  - NO_SHOW: Grijs

- **Icons**: Elke sectie heeft een duidelijk icon
  - 👤 User voor klantinfo
  - 📅 Calendar voor datum
  - 🕐 Clock voor tijd
  - 👥 Users voor aantal gasten
  - 💬 MessageSquare voor speciale verzoeken

- **Interactiviteit**:
  - Hover effects op klikbare items
  - Smooth transitions
  - Loading states voor acties
  - Duidelijke focus states

### Responsive
- Maximale breedte: 2xl (768px)
- Maximale hoogte: 90vh met scroll
- Grid layout past zich aan aan schermgrootte
- Touch-friendly op mobile

## 🔧 Technische Details

### State Management
```typescript
// In dashboard component
const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
```

### Modal Trigger
```typescript
// Optie 1: Klik op hele card
onClick={() => {
  setSelectedBooking(booking);
  setIsBookingModalOpen(true);
}}

// Optie 2: Klik op button (met stopPropagation)
onClick={(e) => {
  e.stopPropagation();
  setSelectedBooking(booking);
  setIsBookingModalOpen(true);
}}
```

### Status Update Handler
```typescript
<BookingDetailModal
  booking={selectedBooking}
  open={isBookingModalOpen}
  onOpenChange={setIsBookingModalOpen}
  onStatusUpdate={handleUpdateBookingStatus} // Bestaande handler hergebruikt
  isUpdating={updatingBookingId === selectedBooking?.id}
/>
```

## 📊 Data Mapping

De modal handelt automatisch verschillende veldnamen af:

| Database Veld 1 | Database Veld 2 | Database Veld 3 | Modal Gebruik |
|----------------|----------------|----------------|--------------|
| guest_name | customer_name | - | Naam |
| guest_email | customer_email | - | Email |
| guest_phone | customer_phone | - | Telefoon |
| guest_note | special_requests | notes | Verzoeken |
| start_ts | start_time | booking_date + booking_time | Start tijd |
| end_ts | end_time | - | Eind tijd |
| party_size | number_of_guests | - | Aantal gasten |

## 🐛 Troubleshooting

### Modal opent niet
**Check 1**: Zijn de imports correct?
```typescript
import { BookingDetailModal } from '@/components/manager/BookingDetailModal';
```

**Check 2**: Is de modal component toegevoegd aan de render?
```typescript
<BookingDetailModal
  booking={selectedBooking}
  open={isBookingModalOpen}
  onOpenChange={setIsBookingModalOpen}
/>
```

**Check 3**: Wordt de state correct geset?
```typescript
console.log('Selected booking:', selectedBooking);
console.log('Modal open:', isBookingModalOpen);
```

### Data toont niet correct
**Check**: Welke veldnamen gebruikt jouw database?
```sql
SELECT * FROM bookings LIMIT 1;
```

Pas de BookingDetailModal.tsx aan als je andere veldnamen hebt.

### Buttons werken niet
**Check**: Is `stopPropagation` correct toegepast?
```typescript
onClick={(e) => {
  e.stopPropagation(); // ✅ Belangrijk!
  handleAction();
}}
```

## 🎯 Volgende Stappen (Optioneel)

1. **Email template**: Stuur bevestigingsmail vanuit de modal
2. **SMS integratie**: Stuur SMS reminder vanuit de modal
3. **Edit mode**: Laat managers booking details aanpassen
4. **Geschiedenis**: Toon status wijzigingen tijdlijn
5. **Notes toevoegen**: Laat managers interne notities toevoegen
6. **Print functie**: Print booking details voor keuken/bar
7. **QR code**: Genereer QR code voor check-in

## 📸 Screenshots

### Modal Overzicht
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  Reservering Details     [CONFIRMED] ┃
┃  Reservering ID: a1b2c3d4...        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                      ┃
┃  👤 Klantinformatie                 ┃
┃  [Naam, Email, Telefoon sectie]     ┃
┃                                      ┃
┃  📅 Reservering Details              ┃
┃  [Datum, Tijd, Gasten, Tafel grid]  ┃
┃                                      ┃
┃  💬 Speciale Verzoeken              ┃
┃  [Guest note text]                   ┃
┃                                      ┃
┃  🎯 Acties                           ┃
┃  [Bevestigen] [Annuleren] [...]     ┃
┃                                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## ✅ Checklist

- [x] BookingDetailModal component gemaakt
- [x] ProfessionalDashboard geïntegreerd
- [x] LocationDashboard geïntegreerd
- [x] Klantinformatie sectie
- [x] Reservering details sectie
- [x] Speciale verzoeken sectie
- [x] Status acties werkend
- [x] Copy-to-clipboard functionaliteit
- [x] Direct mail/bel links
- [x] Responsive design
- [x] Error handling
- [x] Loading states
- [x] Geen linter fouten
- [x] README documentatie

## 🎉 Klaar!

Managers kunnen nu:
- ✅ Op reservaties klikken in beide dashboards
- ✅ Alle klantinformatie zien (naam, email, telefoon)
- ✅ Speciale verzoeken lezen
- ✅ Contact gegevens direct kopiëren of gebruiken
- ✅ Status van reservaties aanpassen
- ✅ Volledige context per reservering

---

**Created**: 2025-01-20  
**Author**: AI Assistant  
**Status**: ✅ Complete en getest  
**Locaties**: 
- `/manager/{tenantId}/dashboard`
- `/manager/{tenantId}/location/{locationId}`

