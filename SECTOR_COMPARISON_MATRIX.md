# Reserve4You - Sector Comparison Matrix

**Version**: 1.0  
**Date**: 28 Oktober 2025  
**Purpose**: Quick reference guide voor sector-specifieke features en configuraties

---

## 📊 COMPLETE SECTOR OVERVIEW

| # | Sector | Market Size (Benelux) | Tech Reusability | Priority | Launch Quarter |
|---|--------|----------------------|------------------|----------|----------------|
| 1 | Restaurant | €2.0B | 100% (baseline) | LIVE | - |
| 2 | Beauty & Wellness | €3.5B | 85% | 🔴 HIGH | Q1 2025 |
| 3 | Healthcare | €15B+ | 70% | 🔴 HIGH | Q2 2025 |
| 4 | Fitness & Sports | €2.0B | 80% | 🟡 MEDIUM | Q2 2025 |
| 5 | Professional Services | €5.0B | 90% | 🟡 MEDIUM | Q2 2025 |
| 6 | Automotive | €8.0B | 85% | 🟢 LOW | Q3 2025 |
| 7 | Education | €3.0B | 85% | 🟢 LOW | Q3 2025 |
| 8 | Home Services | €4.0B | 90% | 🟢 LOW | Q3 2025 |
| 9 | Events & Entertainment | €1.5B | 75% | 🟢 LOW | Q3 2025 |
| 10 | Accommodation | €10B+ | 60% | 🔵 FUTURE | Q4 2025 |

**Total TAM**: €53B+ (26x larger than restaurant-only)

---

## 🎯 FEATURE COMPARISON BY SECTOR

### Core Features Matrix

| Feature | Restaurant | Beauty | Healthcare | Fitness | Professional | Automotive |
|---------|-----------|--------|------------|---------|--------------|-----------|
| **Basic Booking** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Time Slots** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Calendar View** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Payments/Deposits** | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| **Notifications** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Staff Assignment** | ❌ | ✅ REQUIRED | ✅ REQUIRED | ✅ | ✅ | ⚠️ |
| **Service Menu** | ✅ (Food) | ✅ REQUIRED | ✅ REQUIRED | ✅ | ✅ | ✅ REQUIRED |
| **Recurring Bookings** | ❌ | ✅ | ✅ REQUIRED | ✅ REQUIRED | ⚠️ | ❌ |
| **Intake Forms** | ❌ | ⚠️ | ✅ REQUIRED | ⚠️ | ❌ | ⚠️ |
| **Class Bookings** | ❌ | ❌ | ❌ | ✅ REQUIRED | ❌ | ❌ |
| **Equipment Booking** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Vehicle Info** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ REQUIRED |
| **Virtual Meetings** | ❌ | ❌ | ⚠️ | ❌ | ✅ REQUIRED | ❌ |
| **Document Upload** | ❌ | ❌ | ⚠️ | ❌ | ✅ | ⚠️ |
| **GDPR Compliance** | ⚠️ | ⚠️ | ✅ CRITICAL | ⚠️ | ⚠️ | ⚠️ |
| **Insurance Tracking** | ❌ | ❌ | ✅ | ❌ | ❌ | ⚠️ |
| **Membership Mgmt** | ⚠️ | ⚠️ | ❌ | ✅ REQUIRED | ❌ | ⚠️ |

**Legend**:
- ✅ = Feature applicable and implemented
- ✅ REQUIRED = Must have for sector launch
- ✅ CRITICAL = Show-stopper if missing
- ⚠️ = Nice to have
- ❌ = Not applicable

---

## 💰 PRICING BY SECTOR

### Recommended Pricing Strategy

| Sector | START | PRO | PLUS | Justification |
|--------|-------|-----|------|---------------|
| **Restaurant** | €49 | €99 | €199 | Baseline, established |
| **Beauty & Wellness** | €59 | €119 | €249 | Higher booking volume, staff features |
| **Healthcare** | €79 | €159 | €349 | Compliance costs, critical use case, insurance |
| **Fitness & Sports** | €69 | €129 | €279 | Class-based = high volume, memberships |
| **Professional Services** | €89 | €169 | €399 | High hourly rates, can afford premium |
| **Automotive** | €49 | €99 | €199 | Similar to restaurant |
| **Education** | €59 | €119 | €249 | Medium volume |
| **Home Services** | €49 | €99 | €199 | Price-sensitive segment |
| **Events** | €79 | €149 | €299 | High-value bookings |
| **Accommodation** | €99 | €199 | €449 | Complex requirements, high revenue potential |

### Pricing Multiplier Formula

```
Final Price = Base Price × Sector Multiplier × (1 + Compliance Factor)

Where:
- Base Price: START €49, PRO €99, PLUS €199
- Sector Multiplier: 1.0 - 2.25
- Compliance Factor: 0 (no special compliance) or 0.2 (healthcare/finance)

Examples:
- Healthcare PRO: €99 × 1.5 × 1.2 = €178 → rounded to €159
- Professional PLUS: €199 × 1.8 × 1.0 = €358 → rounded to €399
```

---

## 🏗️ TECHNICAL REQUIREMENTS BY SECTOR

### Database Schema Additions

| Sector | New Tables | Extended Columns | Special Indexes | Complexity |
|--------|-----------|------------------|-----------------|-----------|
| **Restaurant** | - | - | - | ⭐ (Baseline) |
| **Beauty** | `service_offerings`, `resources` (staff) | `bookings.assigned_staff_id` | `idx_staff_availability` | ⭐⭐ |
| **Healthcare** | `intake_forms`, `intake_responses`, `insurance_providers` | `consumers.medical_history` | `idx_patient_gdpr` | ⭐⭐⭐⭐ |
| **Fitness** | `class_schedules`, `memberships`, `class_capacity` | `bookings.class_id` | `idx_class_capacity` | ⭐⭐⭐ |
| **Professional** | `virtual_meeting_links`, `documents` | `bookings.meeting_url` | - | ⭐⭐ |
| **Automotive** | `vehicles`, `service_checklists` | `bookings.vehicle_id` | `idx_vehicle_service` | ⭐⭐ |

### API Endpoints Needed

| Endpoint | Restaurant | Beauty | Healthcare | Fitness | Professional | Automotive |
|----------|-----------|--------|------------|---------|--------------|-----------|
| `POST /bookings` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /availability` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /staff/availability` | ❌ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `GET /services` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /classes` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `POST /recurring-bookings` | ❌ | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| `POST /intake-response` | ❌ | ⚠️ | ✅ | ⚠️ | ❌ | ⚠️ |
| `POST /virtual-meeting` | ❌ | ❌ | ⚠️ | ❌ | ✅ | ❌ |

---

## 📱 UI COMPONENTS BY SECTOR

### Component Visibility Matrix

| Component | Restaurant | Beauty | Healthcare | Fitness | Professional |
|-----------|-----------|--------|------------|---------|--------------|
| **HeroSection** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **AboutSection** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **MenuSection** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **ServiceMenuSection** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **StaffGallery** | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| **ClassSchedule** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **IntakeFormModal** | ❌ | ⚠️ | ✅ | ⚠️ | ❌ |
| **BookingModal** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **StaffSelector** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **RecurringOptions** | ❌ | ✅ | ✅ | ✅ | ⚠️ |
| **VirtualMeetingLink** | ❌ | ❌ | ⚠️ | ❌ | ✅ |
| **ReviewsSection** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **InsuranceInfo** | ❌ | ❌ | ✅ | ❌ | ❌ |
| **MembershipTiers** | ⚠️ | ⚠️ | ❌ | ✅ | ❌ |
| **PromotionsSection** | ✅ | ✅ | ⚠️ | ✅ | ⚠️ |

### Dynamic Rendering Logic

```typescript
function LocationDetailPage({ location }) {
  const sector = location.business_sector;
  const config = location.sector_config;
  
  return (
    <>
      {/* Always visible */}
      <HeroSection />
      <AboutSection />
      
      {/* Sector-specific */}
      {['RESTAURANT', 'CAFE', 'BAR'].includes(sector) && <MenuSection />}
      
      {config.features.has_service_menu && <ServiceMenuSection />}
      {config.features.requires_staff_assignment && <StaffGallery />}
      {config.features.has_class_bookings && <ClassSchedule />}
      {config.features.requires_intake_form && <IntakeFormModal />}
      
      {/* Healthcare-specific */}
      {sector === 'MEDICAL_PRACTICE' && <InsuranceInfo />}
      
      {/* Fitness-specific */}
      {['GYM', 'YOGA_STUDIO'].includes(sector) && <MembershipTiers />}
      
      {/* Always visible */}
      <BookingSection />
      <ReviewsSection />
      <ContactSection />
    </>
  );
}
```

---

## 🎨 TERMINOLOGY QUICK REFERENCE

### Top 6 Most-Used Terms

| Concept | Restaurant | Beauty | Healthcare | Fitness | Professional | Automotive |
|---------|-----------|--------|------------|---------|--------------|-----------|
| **Booking** | Reservering | Afspraak | Afspraak | Sessie | Consult | Afspraak |
| **Resource** | Tafel | Behandelkamer | Spreekkamer | Studio | Kantoor | Werkplaats |
| **Customer** | Gast | Klant | Patiënt | Lid | Cliënt | Klant |
| **Staff** | Personeel | Specialist | Arts | Trainer | Adviseur | Monteur |
| **Service** | Gerecht | Behandeling | Consultatie | Training | Sessie | Service |
| **Action Verb** | Reserveren | Boeken | Plannen | Inschrijven | Reserveren | Plannen |

### Usage in Code

```typescript
const terms = useTerminology();

// Buttons
<Button>{terms.booking.verb}</Button> // "Reserveren", "Boeken", etc.

// Headings
<h1>{terms.booking.plural}</h1> // "Reserveringen", "Afspraken", etc.

// Labels
<Label>{terms.customer.singular} Naam</Label> // "Gast Naam", "Patiënt Naam"

// Descriptions
<p>
  {terms.customer.singular} wacht in {terms.resource.singular}
</p>
// "Gast wacht in tafel" or "Patiënt wacht in spreekkamer"
```

---

## 🚀 LAUNCH CHECKLIST PER SECTOR

### Beauty & Wellness Launch Checklist

**Technical**:
- [ ] `service_offerings` table created
- [ ] `resources` table with STAFF type
- [ ] Staff availability calendar
- [ ] Service duration management
- [ ] Recurring bookings support
- [ ] Staff assignment UI

**Content**:
- [ ] Beauty-specific terminology implemented
- [ ] Service categories (Hair, Nails, Spa, Massage)
- [ ] Staff profile pages
- [ ] Before/after photo gallery (optional)

**Marketing**:
- [ ] Landing page: "reserve4you.com/beauty"
- [ ] 10 beta salons onboarded
- [ ] Case study created
- [ ] Instagram/Facebook ads ready
- [ ] Beauty industry partnerships

**Success Metrics**:
- [ ] 25 paying locations in 3 months
- [ ] 500 bookings/month
- [ ] <5% churn
- [ ] NPS >50

---

### Healthcare Launch Checklist

**Technical**:
- [ ] GDPR compliance audit completed
- [ ] Data encryption at rest + transit
- [ ] Intake forms system
- [ ] Patient consent management
- [ ] Insurance provider database
- [ ] Medical history tracking (optional)

**Legal**:
- [ ] Privacy policy updated
- [ ] Terms of service reviewed by legal
- [ ] Data processing agreements
- [ ] GDPR consultant sign-off

**Content**:
- [ ] Healthcare terminology
- [ ] Medical specializations
- [ ] Insurance filters

**Marketing**:
- [ ] Landing page: "reserve4you.com/healthcare"
- [ ] 15 beta practices
- [ ] Medical association partnerships
- [ ] LinkedIn ads for doctors
- [ ] Healthcare conference presence

**Success Metrics**:
- [ ] 15 paying practices in 3 months
- [ ] Zero data breaches
- [ ] GDPR audit passed
- [ ] NPS >60

---

## 📊 COMPETITIVE POSITIONING

### Sector-Specific Competitors

| Sector | Top Competitor | Their Strength | Their Weakness | Our Advantage |
|--------|---------------|----------------|----------------|---------------|
| **Restaurant** | Zenchef, Resengo | Established, many features | Legacy tech, expensive | Modern stack, better UX, cheaper |
| **Beauty** | Booksy, Treatwell | Large network, mobile apps | Basic features, commissions | Better dashboard, no commissions |
| **Healthcare** | Doctolib, Quin | Healthcare-focused | Healthcare-only, expensive | Multi-sector, better price |
| **Fitness** | Mindbody, Glofox | Industry standard | Expensive, complex | Simpler, more affordable |
| **Professional** | Calendly, Acuity | Simple, popular | Generic, not specialized | Sector customization, richer features |
| **Automotive** | Fragmented market | - | No dominant player | First mover advantage |

### Universal Advantage

**Reserve4You's Unique Position**:
- ✅ **Only platform serving ALL sectors**
- ✅ **Commission-free model** (competitors charge 3-5€/booking or commissions)
- ✅ **Modern tech stack** (faster, more reliable)
- ✅ **Universal consumer account** (book anything with one login)
- ✅ **Cross-sector insights** (data advantages)

---

## 🎯 IMPLEMENTATION PRIORITY MATRIX

### Priority = Market Size × Reusability × Competition Gap

| Sector | Market | Reusability | Competition | **Priority Score** | **Launch Order** |
|--------|--------|-------------|-------------|-------------------|------------------|
| Beauty & Wellness | 9/10 | 9/10 | 7/10 | **8.3** | #1 (Q1 2025) |
| Healthcare | 10/10 | 7/10 | 8/10 | **8.3** | #2 (Q2 2025) |
| Professional Services | 8/10 | 9/10 | 9/10 | **8.7** | #3 (Q2 2025) |
| Fitness & Sports | 7/10 | 8/10 | 6/10 | **7.0** | #4 (Q2 2025) |
| Automotive | 9/10 | 9/10 | 9/10 | **9.0** | #5 (Q3 2025) |
| Education | 7/10 | 9/10 | 8/10 | **8.0** | #6 (Q3 2025) |
| Home Services | 8/10 | 9/10 | 9/10 | **8.7** | #7 (Q3 2025) |
| Events | 6/10 | 8/10 | 7/10 | **7.0** | #8 (Q3 2025) |
| Accommodation | 10/10 | 6/10 | 5/10 | **7.0** | #9 (Q4 2025) |

**Note**: Automotive scores highest but pushed to Q3 to focus on sectors with higher urgency

---

## 💡 SECTOR-SPECIFIC INSIGHTS

### Beauty & Wellness

**Key Success Factors**:
- Visual appeal (before/after photos)
- Staff photos and bios
- Instagram integration
- Mobile-first (60% book on phone)

**Common Services**:
- Haircut: 30-90 min, €25-€100
- Hair coloring: 90-180 min, €50-€200
- Manicure: 30-60 min, €20-€50
- Massage: 60-90 min, €60-€120
- Facial: 60-90 min, €50-€100

**Peak Times**:
- Friday 14:00-19:00
- Saturday 09:00-17:00
- Weekdays 18:00-20:00

---

### Healthcare

**Key Success Factors**:
- Trust and security (GDPR critical)
- Ease of use for elderly
- Insurance integration
- SMS reminders (reduces no-shows)

**Common Services**:
- GP consultation: 15-30 min
- Dental checkup: 30-60 min
- Physiotherapy: 30-45 min
- Psychology session: 45-60 min

**Peak Times**:
- Weekday mornings 09:00-12:00
- After work 17:00-19:00
- Lunchtime 12:00-13:00

**Regulations**:
- Must comply with GDPR
- Patient data encryption required
- Medical professional verification needed

---

### Fitness & Sports

**Key Success Factors**:
- Class schedule visibility
- Capacity indicators (10/15 spots)
- Waitlist for popular classes
- Mobile app essential

**Common Classes**:
- Yoga: 60-90 min, 15-25 people
- Spinning: 45-60 min, 15-30 people
- CrossFit: 60 min, 10-20 people
- Personal training: 30-60 min, 1-1

**Peak Times**:
- Early morning 06:00-08:00
- Lunch 12:00-13:00
- After work 17:00-20:00

---

## 🔄 MIGRATION PATH FOR EXISTING CUSTOMERS

### If Current Restaurant Wants to Add Services

**Scenario**: A restaurant wants to offer "Wine Tasting Classes" or "Cooking Workshops"

**Solution**: Multi-mode location
```json
{
  "business_sector": "RESTAURANT",
  "additional_modes": ["EVENT_VENUE"],
  "sector_config": {
    "enable_class_bookings": true,
    "terminology_override": {
      "class": "Workshop"
    }
  }
}
```

**UI**: Toggle in settings "Enable Additional Services" → Select types → Automatically adapts

---

## ✅ QUICK DECISION TREE

```
Is client a restaurant/café/bar?
├─ YES → Use existing system (no changes)
└─ NO → What sector?
    ├─ Beauty/Wellness → Requires: Staff assignment, Service menu
    ├─ Healthcare → Requires: GDPR compliance, Intake forms, Staff
    ├─ Fitness → Requires: Class bookings, Memberships
    ├─ Professional → Requires: Virtual meetings, Document upload
    └─ Other → Use generic setup, customize terminology
```

---

## 📞 SUPPORT RESOURCES

- **Full PRD**: See `PRD_RESERVE4YOU_MULTI_SECTOR_EXPANSION.md`
- **Technical Guide**: See `TECHNICAL_IMPLEMENTATION_GUIDE_MULTI_SECTOR.md`
- **Executive Summary**: See `MULTI_SECTOR_EXECUTIVE_SUMMARY.md`

---

**Document Version**: 1.0  
**Last Updated**: 28 Oktober 2025  
**Maintained By**: Product Team


