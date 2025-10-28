import { z } from 'zod';

// Step 1: Bedrijf (branding)
export const tenantCreateSchema = z.object({
  name: z.string().min(2, 'Bedrijfsnaam moet minimaal 2 karakters zijn').max(100),
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Ongeldige hex kleur').optional(),
  description: z.string().max(500).optional(),
});

// Step 2: Locatie (adres, openingstijden)
export const locationCreateSchema = z.object({
  tenantId: z.string().uuid(),
  business_sector: z.string().optional().default('RESTAURANT'), // Multi-sector support
  name: z.string().min(2, 'Locatie naam is verplicht').max(100),
  slug: z.string()
    .min(3, 'Slug moet minimaal 3 karakters zijn')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug mag alleen kleine letters, cijfers en streepjes bevatten'),
  address: z.object({
    street: z.string().min(1, 'Straat is verplicht'),
    number: z.string().min(1, 'Huisnummer is verplicht'),
    city: z.string().min(1, 'Stad is verplicht'),
    postalCode: z.string().min(1, 'Postcode is verplicht'),
    country: z.string().default('NL'),
  }),
  phone: z.string().min(10, 'Telefoonnummer is verplicht'),
  email: z.string().email('Ongeldig e-mailadres'),
  openingHours: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6), // 0 = Sunday, 6 = Saturday
    openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Ongeldige tijd'),
    closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Ongeldige tijd'),
    isClosed: z.boolean().default(false),
  })),
  cuisine: z.string().optional(),
  priceRange: z.enum(['€', '€€', '€€€', '€€€€']).optional(),
  description: z.string().max(1000).optional(),
  slotMinutes: z.number().min(15).max(120).default(90),
  bufferMinutes: z.number().min(0).max(60).default(15),
});

// Step 3: Tafels
export const tableCreateSchema = z.object({
  locationId: z.string().uuid(),
  name: z.string().min(1, 'Tafel naam is verplicht').max(50),
  seats: z.number().min(1, 'Minimaal 1 zitplaats').max(20),
  combinable: z.boolean().default(false),
  groupId: z.string().max(50).optional(),
});

export const tablesBulkCreateSchema = z.object({
  locationId: z.string().uuid(),
  tables: z.array(tableCreateSchema.omit({ locationId: true })),
});

// Step 3: Shifts
export const shiftCreateSchema = z.object({
  locationId: z.string().uuid(),
  name: z.string().min(1, 'Shift naam is verplicht').max(50),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Ongeldige tijd'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Ongeldige tijd'),
  daysOfWeek: z.array(z.number().min(0).max(6)).min(1, 'Selecteer minimaal 1 dag'),
  maxParallel: z.number().min(1, 'Minimaal 1 parallelle reservering').max(100).optional(),
});

export const shiftsBulkCreateSchema = z.object({
  locationId: z.string().uuid(),
  shifts: z.array(shiftCreateSchema.omit({ locationId: true })),
});

// Step 4: Policies
export const policyCreateSchema = z.object({
  locationId: z.string().uuid(),
  cancellationHours: z.number().min(0, 'Moet 0 of meer uren zijn').max(168), // max 7 days
  noShowFeeCents: z.number().min(0, 'Moet 0 of meer zijn').max(100000), // max €1000
  depositRequired: z.boolean().default(false),
  depositType: z.enum(['PERCENT', 'FIXED']).default('FIXED'),
  depositValue: z.number().min(0).max(10000), // For PERCENT: 0-100, for FIXED: cents
});

// Step 5: Stripe Connect (optional for now, will integrate later)
export const stripeConnectSchema = z.object({
  locationId: z.string().uuid(),
  stripeAccountId: z.string().optional(),
});

// Step 6: Subscription (Stripe Checkout)
export const subscriptionCreateSchema = z.object({
  tenantId: z.string().uuid(),
  plan: z.enum(['START', 'PRO', 'PLUS']),
});

// Step 7: POS Integration
export const posIntegrationSchema = z.object({
  locationId: z.string().uuid(),
  vendor: z.enum(['LIGHTSPEED']),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  meta: z.record(z.any()).optional(),
});

// Step 8: Publish Location
export const publishLocationSchema = z.object({
  locationId: z.string().uuid(),
});

// Membership management
export const membershipCreateSchema = z.object({
  tenantId: z.string().uuid(),
  userEmail: z.string().email('Ongeldig e-mailadres'),
  role: z.enum(['OWNER', 'MANAGER', 'STAFF']),
});

export const membershipUpdateSchema = z.object({
  membershipId: z.string().uuid(),
  role: z.enum(['OWNER', 'MANAGER', 'STAFF']),
});

export const membershipDeleteSchema = z.object({
  membershipId: z.string().uuid(),
});

export type TenantCreate = z.infer<typeof tenantCreateSchema>;
export type LocationCreate = z.infer<typeof locationCreateSchema>;
export type TableCreate = z.infer<typeof tableCreateSchema>;
export type TablesBulkCreate = z.infer<typeof tablesBulkCreateSchema>;
export type ShiftCreate = z.infer<typeof shiftCreateSchema>;
export type ShiftsBulkCreate = z.infer<typeof shiftsBulkCreateSchema>;
export type PolicyCreate = z.infer<typeof policyCreateSchema>;
export type StripeConnect = z.infer<typeof stripeConnectSchema>;
export type SubscriptionCreate = z.infer<typeof subscriptionCreateSchema>;
export type PosIntegration = z.infer<typeof posIntegrationSchema>;
export type PublishLocation = z.infer<typeof publishLocationSchema>;
export type MembershipCreate = z.infer<typeof membershipCreateSchema>;
export type MembershipUpdate = z.infer<typeof membershipUpdateSchema>;
export type MembershipDelete = z.infer<typeof membershipDeleteSchema>;

