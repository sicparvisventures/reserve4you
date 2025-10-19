import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';

/**
 * Tenant Data Access Layer
 * 
 * Multi-tenant helpers for restaurant managers and staff.
 * These functions handle tenant-scoped operations with proper RLS.
 */

export type MembershipRole = 'OWNER' | 'MANAGER' | 'STAFF';

/**
 * Get tenants for the current user
 * Returns all tenants where user is a member
 */
export const getUserTenants = cache(async (userId: string) => {
  const supabase = await createClient();
  
  const { data: memberships, error } = await supabase
    .from('memberships')
    .select(`
      id,
      role,
      tenant:tenants(*),
      tenant_id
    `)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching user tenants:', error);
    return [];
  }
  
  // Add location count for each tenant
  const tenantsWithCounts = await Promise.all(
    (memberships || []).map(async (membership) => {
      const locations = await getTenantLocations(membership.tenant_id);
      return {
        ...membership.tenant,
        role: membership.role,
        location_count: locations.length,
      };
    })
  );
  
  return tenantsWithCounts;
});

/**
 * Get tenant by ID with membership check
 * Redirects if user is not a member
 */
export const getTenant = cache(async (tenantId: string) => {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/manager');
  }
  
  // Check membership
  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .single();
  
  if (membershipError || !membership) {
    redirect('/manager');
  }
  
  // Get tenant
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();
  
  if (error || !tenant) {
    redirect('/manager');
  }
  
  return {
    tenant,
    role: membership.role as MembershipRole,
    userId: user.id,
  };
});

/**
 * Check if user has required role for tenant
 */
export const checkTenantRole = async (
  userId: string,
  tenantId: string,
  allowedRoles: MembershipRole[]
): Promise<boolean> => {
  const supabase = await createClient();
  
  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single();
  
  if (!membership) return false;
  
  return allowedRoles.includes(membership.role as MembershipRole);
};

/**
 * Get locations for a tenant
 */
export const getTenantLocations = cache(async (tenantId: string) => {
  const supabase = await createClient();
  
  const { data: locations, error } = await supabase
    .from('locations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching tenant locations:', error);
    return [];
  }
  
  return locations || [];
});

/**
 * Get location with tenant membership check
 */
export const getLocation = cache(async (locationId: string) => {
  const supabase = await createClient();
  
  const { data: location, error } = await supabase
    .from('locations')
    .select(`
      *,
      tenant:tenants(*)
    `)
    .eq('id', locationId)
    .single();
  
  if (error || !location) {
    throw new Error('Location not found');
  }
  
  return location;
});

/**
 * Get public location by slug (for consumers)
 */
export const getPublicLocation = cache(async (slug: string) => {
  const supabase = await createClient();
  
  const { data: location, error } = await supabase
    .from('locations')
    .select(`
      *,
      tables(*),
      shifts(*),
      policy:policies(*)
    `)
    .eq('slug', slug)
    .eq('is_public', true)
    .eq('is_active', true)
    .single();
  
  if (error || !location) {
    return null;
  }
  
  return location;
});

/**
 * Search public locations
 */
export const searchLocations = cache(async (params: {
  query?: string;
  cuisineType?: string;
  priceRange?: number;
  latitude?: number;
  longitude?: number;
  radius?: number; // in km
}) => {
  const supabase = await createClient();
  
  let query = supabase
    .from('locations')
    .select('*')
    .eq('is_public', true)
    .eq('is_active', true);
  
  if (params.query) {
    query = query.or(`name.ilike.%${params.query}%,description.ilike.%${params.query}%`);
  }
  
  if (params.cuisineType) {
    query = query.eq('cuisine_type', params.cuisineType);
  }
  
  if (params.priceRange) {
    query = query.eq('price_range', params.priceRange);
  }
  
  // Geo filtering would require PostGIS or custom function
  // For MVP, filter in application layer
  
  const { data: locations, error } = await query.order('created_at', { ascending: false }).limit(50);
  
  if (error) {
    console.error('Error searching locations:', error);
    return [];
  }
  
  // Apply geo filtering if coordinates provided
  if (params.latitude && params.longitude && params.radius && locations) {
    const filtered = locations.filter(loc => {
      if (!loc.latitude || !loc.longitude) return false;
      const distance = getDistanceInKm(
        params.latitude!,
        params.longitude!,
        parseFloat(loc.latitude),
        parseFloat(loc.longitude)
      );
      return distance <= params.radius!;
    });
    return filtered;
  }
  
  return locations || [];
});

/**
 * Get billing state for tenant
 * Note: No cache() to ensure fresh billing data after upgrades
 */
export async function getTenantBilling(tenantId: string) {
  const supabase = await createClient();
  
  const { data: billing, error } = await supabase
    .from('billing_state')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();
  
  if (error) {
    console.error('Error fetching billing state:', error);
    return null;
  }
  
  return billing;
}

/**
 * Check if location can be published (all requirements met)
 */
export const canPublishLocation = cache(async (locationId: string) => {
  const supabase = await createClient();
  
  // Get location
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('*, tenant_id')
    .eq('id', locationId)
    .single();
  
  if (locationError || !location) {
    return { allowed: false, reason: 'Location not found' };
  }
  
  // Check billing status
  const billing = await getTenantBilling(location.tenant_id);
  if (!billing || !['ACTIVE', 'TRIALING'].includes(billing.status)) {
    return { allowed: false, reason: 'Active subscription required' };
  }
  
  // Check tables exist
  const { data: tables } = await supabase
    .from('tables')
    .select('id')
    .eq('location_id', locationId)
    .limit(1);
  
  if (!tables || tables.length === 0) {
    return { allowed: false, reason: 'At least one table required' };
  }
  
  // Check shifts exist
  const { data: shifts } = await supabase
    .from('shifts')
    .select('id')
    .eq('location_id', locationId)
    .limit(1);
  
  if (!shifts || shifts.length === 0) {
    return { allowed: false, reason: 'At least one shift required' };
  }
  
  // Check policy exists
  const { data: policy } = await supabase
    .from('policies')
    .select('id')
    .eq('location_id', locationId)
    .single();
  
  if (!policy) {
    return { allowed: false, reason: 'Policy configuration required' };
  }
  
  return { allowed: true };
});

/**
 * Get consumer record for authenticated user
 */
export const getConsumer = cache(async () => {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return null;
  }
  
  const { data: consumer, error } = await supabase
    .from('consumers')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();
  
  if (error) {
    // Consumer record might not exist yet, that's okay
    return null;
  }
  
  return consumer;
});

/**
 * Get consumer favorites
 */
export const getConsumerFavorites = cache(async () => {
  const consumer = await getConsumer();
  if (!consumer) return [];
  
  const supabase = await createClient();
  
  const { data: favorites, error } = await supabase
    .from('favorites')
    .select(`
      *,
      location:locations(*)
    `)
    .eq('consumer_id', consumer.id);
  
  if (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
  
  return favorites || [];
});

/**
 * Get consumer bookings
 */
export const getConsumerBookings = cache(async () => {
  const consumer = await getConsumer();
  if (!consumer) return [];
  
  const supabase = await createClient();
  
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      location:locations(name, slug, address_json, phone)
    `)
    .eq('consumer_id', consumer.id)
    .order('start_ts', { ascending: false });
  
  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
  
  return bookings || [];
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate distance between two points (Haversine formula)
 */
function getDistanceInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

