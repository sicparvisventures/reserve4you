/**
 * Booking Validation Schemas
 * 
 * Zod schemas for booking-related operations.
 * Used in both API routes and frontend forms.
 */

import { z } from 'zod';

// ============================================================================
// AVAILABILITY CHECK
// ============================================================================

export const availabilityCheckSchema = z.object({
  location_id: z.string().uuid('Invalid location ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  party_size: z.number().int().min(1, 'Party size must be at least 1').max(50, 'Party size too large'),
  shift_id: z.string().uuid().optional(),
});

export type AvailabilityCheckInput = z.infer<typeof availabilityCheckSchema>;

export const availabilityCheckResponseSchema = z.object({
  location_id: z.string().uuid(),
  date: z.string(),
  party_size: z.number(),
  slots: z.array(z.object({
    time: z.string(), // "18:00"
    available: z.boolean(),
    tables: z.array(z.string().uuid()),
    shift_id: z.string().uuid(),
    shift_name: z.string(),
  })),
  top_suggestions: z.array(z.string()), // Top 6 available times
});

export type AvailabilityCheckResponse = z.infer<typeof availabilityCheckResponseSchema>;

// ============================================================================
// BOOKING CREATION
// ============================================================================

export const bookingCreateSchema = z.object({
  // Idempotency
  idempotency_key: z.string().uuid('Invalid idempotency key'),
  
  // Location & timing
  location_id: z.string().uuid('Invalid location ID'),
  start_time: z.string().datetime('Invalid start time format'),
  end_time: z.string().datetime('Invalid end time format'),
  
  // Party details
  party_size: z.number().int().min(1, 'Party size must be at least 1').max(50, 'Party size too large'),
  
  // Guest info
  guest_name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  guest_email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255),
  guest_phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  guest_note: z.string().max(1000, 'Note too long').optional(),
  
  // Source tracking
  source: z.enum(['WEB', 'PHONE', 'WALKIN']).default('WEB'),
  
  // Consumer ID (if authenticated)
  consumer_id: z.string().uuid().optional(),
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;

export const bookingCreateResponseSchema = z.object({
  booking_id: z.string().uuid(),
  status: z.enum(['CONFIRMED', 'PENDING']),
  table_id: z.string().uuid().optional(),
  payment_required: z.boolean(),
  payment_intent_id: z.string().optional(),
  payment_client_secret: z.string().optional(),
  confirmation_code: z.string(),
});

export type BookingCreateResponse = z.infer<typeof bookingCreateResponseSchema>;

// ============================================================================
// GUEST FORM (Frontend)
// ============================================================================

export const guestFormSchema = z.object({
  name: z.string().min(2, 'Naam moet minimaal 2 karakters zijn').max(255),
  email: z.string()
    .email('Ongeldig e-mailadres')
    .min(1, 'E-mailadres is verplicht')
    .max(255),
  phone: z.string()
    .regex(/^(\+31|0)[1-9][0-9]{8}$/, 'Ongeldig Nederlands telefoonnummer')
    .or(z.string().regex(/^\+[1-9]\d{1,14}$/, 'Ongeldig telefoonnummer'))
    .optional()
    .or(z.literal('')),
  note: z.string().max(1000, 'Notitie mag maximaal 1000 karakters zijn').optional(),
});

export type GuestFormInput = z.infer<typeof guestFormSchema>;

// ============================================================================
// BOOKING UPDATE
// ============================================================================

export const bookingUpdateSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'NO_SHOW', 'COMPLETED']).optional(),
  internal_note: z.string().max(1000).optional(),
  table_id: z.string().uuid().optional(),
});

export type BookingUpdateInput = z.infer<typeof bookingUpdateSchema>;

// ============================================================================
// BOOKING CANCELLATION
// ============================================================================

export const bookingCancelSchema = z.object({
  booking_id: z.string().uuid('Invalid booking ID'),
  reason: z.string().max(500).optional(),
});

export type BookingCancelInput = z.infer<typeof bookingCancelSchema>;

// ============================================================================
// SEARCH & FILTERS
// ============================================================================

export const locationSearchSchema = z.object({
  query: z.string().max(255).optional(),
  cuisine_type: z.string().max(100).optional(),
  price_range: z.number().int().min(1).max(4).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().positive().max(100).optional(), // km
  open_now: z.boolean().optional(),
  available_today: z.boolean().optional(),
});

export type LocationSearchInput = z.infer<typeof locationSearchSchema>;

// ============================================================================
// ERROR CODES
// ============================================================================

export const BookingErrorCode = {
  NO_AVAILABILITY: 'NO_AVAILABILITY',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  INVALID_TIME: 'INVALID_TIME',
  BILLING_INACTIVE: 'BILLING_INACTIVE',
  LOCATION_NOT_FOUND: 'LOCATION_NOT_FOUND',
  POLICY_VIOLATION: 'POLICY_VIOLATION',
  DUPLICATE_BOOKING: 'DUPLICATE_BOOKING',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
} as const;

export type BookingErrorCode = typeof BookingErrorCode[keyof typeof BookingErrorCode];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate and parse booking input
 */
export function validateBookingInput(data: unknown): BookingCreateInput {
  return bookingCreateSchema.parse(data);
}

/**
 * Validate and parse availability check input
 */
export function validateAvailabilityInput(data: unknown): AvailabilityCheckInput {
  return availabilityCheckSchema.parse(data);
}

/**
 * Safe parse with error formatting
 */
export function safeParseBooking(data: unknown) {
  const result = bookingCreateSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    };
  }
  return {
    success: true,
    data: result.data,
  };
}

