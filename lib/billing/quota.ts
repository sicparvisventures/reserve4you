import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getTenantBilling } from '@/lib/auth/tenant-dal';

/**
 * Quota limits per plan - 6-Tier System
 */
export const PLAN_LIMITS = {
  FREE: {
    locations: 1,
    bookingsPerMonth: 50,
    deposits: false,
    posIntegration: false,
    whiteLabel: false,
    apiAccess: false,
  },
  STARTER: {
    locations: 1,
    bookingsPerMonth: 200,
    deposits: false,
    posIntegration: false,
    whiteLabel: false,
    apiAccess: false,
  },
  GROWTH: {
    locations: 3,
    bookingsPerMonth: 1000,
    deposits: true,
    posIntegration: false,
    whiteLabel: false,
    apiAccess: false,
  },
  BUSINESS: {
    locations: 5,
    bookingsPerMonth: 3000,
    deposits: true,
    posIntegration: true,
    whiteLabel: true,
    apiAccess: false,
  },
  PREMIUM: {
    locations: Infinity,
    bookingsPerMonth: Infinity,
    deposits: true,
    posIntegration: true,
    whiteLabel: true,
    apiAccess: true,
  },
  ENTERPRISE: {
    locations: Infinity,
    bookingsPerMonth: Infinity,
    deposits: true,
    posIntegration: true,
    whiteLabel: true,
    apiAccess: true,
  },
  // Legacy tiers (backwards compatibility)
  START: {
    locations: 1,
    bookingsPerMonth: 200,
    deposits: false,
    posIntegration: false,
    whiteLabel: false,
    apiAccess: false,
  },
  PRO: {
    locations: 3,
    bookingsPerMonth: 1000,
    deposits: true,
    posIntegration: false,
    whiteLabel: false,
    apiAccess: false,
  },
  PLUS: {
    locations: Infinity,
    bookingsPerMonth: Infinity,
    deposits: true,
    posIntegration: true,
    whiteLabel: true,
    apiAccess: true,
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

/**
 * Check if tenant can create a new location
 */
export async function canCreateLocation(tenantId: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
}> {
  // First, check how many locations this tenant already has
  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from('locations')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  if (countError) {
    console.error('Error counting locations:', countError);
    return { allowed: false, reason: 'Error checking quota' };
  }

  const currentCount = count || 0;

  // ALWAYS allow the first location, regardless of billing status
  // This ensures onboarding can be completed
  if (currentCount === 0) {
    console.log('✅ Allowing first location creation for tenant:', tenantId);
    return { 
      allowed: true, 
      currentCount: 0, 
      limit: 1,
      reason: 'First location always allowed'
    };
  }

  // For additional locations, check billing state
  const billing = await getTenantBilling(tenantId);

  // DEVELOPMENT MODE: Allow without active subscription
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!billing) {
    // If no billing state at all, allow in development
    if (isDevelopment) {
      console.warn('⚠️ DEV MODE: No billing state found, allowing location creation');
      return { allowed: true, currentCount, limit: 999 };
    }
    return {
      allowed: false,
      reason: 'No billing state found. Please contact support.',
      currentCount,
    };
  }

  if (!['ACTIVE', 'TRIALING'].includes(billing.status)) {
    // In development, allow creation even without active subscription
    if (isDevelopment) {
      console.warn('⚠️ DEV MODE: Billing status is', billing.status, ', but allowing location creation');
      return { allowed: true, currentCount, limit: 999 };
    }
    return {
      allowed: false,
      reason: 'Active subscription required to create additional locations',
      currentCount,
    };
  }

  const plan = billing.plan as Plan;
  const limit = PLAN_LIMITS[plan].locations;

  if (currentCount >= limit) {
    return {
      allowed: false,
      reason: `Location limit reached for ${plan} plan (${currentCount}/${limit})`,
      currentCount,
      limit,
    };
  }

  return {
    allowed: true,
    currentCount,
    limit,
  };
}

/**
 * Check if tenant can create a new booking
 */
export async function canCreateBooking(
  tenantId: string,
  locationId: string
): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
}> {
  const billing = await getTenantBilling(tenantId);

  // DEVELOPMENT MODE: Allow bookings without active subscription
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!billing) {
    if (isDevelopment) {
      console.warn('⚠️ DEV MODE: No billing state found, allowing booking creation');
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'No billing state found',
    };
  }

  if (!['ACTIVE', 'TRIALING'].includes(billing.status)) {
    if (isDevelopment) {
      console.warn('⚠️ DEV MODE: Billing status is', billing.status, ', but allowing booking creation');
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Active subscription required',
    };
  }

  const plan = billing.plan as Plan;
  const limit = PLAN_LIMITS[plan].bookingsPerMonth;

  // Infinite bookings allowed
  if (limit === Infinity) {
    return { allowed: true };
  }

  // Get bookings count for current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const supabase = await createClient();
  const { count, error } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('location_id', locationId)
    .gte('created_at', startOfMonth.toISOString())
    .lte('created_at', endOfMonth.toISOString());

  if (error) {
    console.error('Error counting bookings:', error);
    return { allowed: false, reason: 'Error checking quota' };
  }

  const currentCount = count || 0;

  if (currentCount >= limit) {
    return {
      allowed: false,
      reason: `Monthly booking limit reached for ${plan} plan`,
      currentCount,
      limit,
    };
  }

  return {
    allowed: true,
    currentCount,
    limit,
  };
}

/**
 * Check if tenant can use deposit feature
 */
export async function canUseDeposits(tenantId: string): Promise<boolean> {
  const billing = await getTenantBilling(tenantId);
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!billing || !['ACTIVE', 'TRIALING'].includes(billing.status)) {
    // Allow in development for testing
    if (isDevelopment) {
      console.warn('⚠️ DEV MODE: Allowing deposits despite billing status');
      return true;
    }
    return false;
  }

  const plan = billing.plan as Plan;
  return PLAN_LIMITS[plan].deposits;
}

/**
 * Check if tenant can use POS integration
 */
export async function canUsePosIntegration(tenantId: string): Promise<boolean> {
  const billing = await getTenantBilling(tenantId);
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!billing || !['ACTIVE', 'TRIALING'].includes(billing.status)) {
    // Allow in development for testing
    if (isDevelopment) {
      console.warn('⚠️ DEV MODE: Allowing POS integration despite billing status');
      return true;
    }
    return false;
  }

  const plan = billing.plan as Plan;
  return PLAN_LIMITS[plan].posIntegration;
}

/**
 * Get usage statistics for a tenant
 */
export async function getTenantUsage(tenantId: string): Promise<{
  plan: Plan;
  status: string;
  locations: { current: number; limit: number | 'unlimited' };
  bookingsThisMonth: { current: number; limit: number | 'unlimited' };
  features: {
    deposits: boolean;
    posIntegration: boolean;
  };
}> {
  const billing = await getTenantBilling(tenantId);

  if (!billing) {
    throw new Error('No billing state found for tenant');
  }

  const plan = billing.plan as Plan;
  const limits = PLAN_LIMITS[plan];
  const supabase = await createClient();

  // Get location count
  const { count: locationCount } = await supabase
    .from('locations')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  // Get bookings count for current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get location IDs for this tenant
  const { data: locations } = await supabase
    .from('locations')
    .select('id')
    .eq('tenant_id', tenantId);
  
  const locationIds = (locations || []).map(l => l.id);
  
  const { count: bookingCount } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .in('location_id', locationIds)
    .gte('created_at', startOfMonth.toISOString())
    .lte('created_at', endOfMonth.toISOString());

  return {
    plan,
    status: billing.status,
    locations: {
      current: locationCount || 0,
      limit: limits.locations === Infinity ? 'unlimited' : limits.locations,
    },
    bookingsThisMonth: {
      current: bookingCount || 0,
      limit: limits.bookingsPerMonth === Infinity ? 'unlimited' : limits.bookingsPerMonth,
    },
    features: {
      deposits: limits.deposits,
      posIntegration: limits.posIntegration,
    },
  };
}

