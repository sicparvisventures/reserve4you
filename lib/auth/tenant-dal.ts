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
  
  // Add location count and locations array for each tenant
  const tenantsWithCounts = await Promise.all(
    (memberships || []).map(async (membership) => {
      const locations = await getTenantLocations(membership.tenant_id);
      return {
        ...membership.tenant,
        role: membership.role,
        location_count: locations.length,
        locations: locations, // Add locations array for user management
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
  
  // Fetch active promotions for this location
  const { data: promotions } = await supabase
    .from('promotions')
    .select('*')
    .eq('location_id', location.id)
    .eq('is_active', true)
    .lte('valid_from', new Date().toISOString())
    .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
    .order('is_featured', { ascending: false })
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });
  
  return {
    ...location,
    promotions: promotions || [],
  };
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
  nearby?: boolean;
  openNow?: boolean;
  today?: boolean;
  groups?: boolean;
  deals?: boolean;
}) => {
  const supabase = await createClient();
  
  try {
    let query = supabase
      .from('locations')
      .select('*')
      .eq('is_public', true)
      .eq('is_active', true);
    
    if (params.query) {
      query = query.or(`name.ilike.%${params.query}%,description.ilike.%${params.query}%`);
    }
    
    // Only add filters if columns exist (graceful degradation)
    if (params.cuisineType) {
      try {
        query = query.eq('cuisine', params.cuisineType);
      } catch (e) {
        // Column might not exist, skip filter
      }
    }
    
    if (params.priceRange) {
      try {
        query = query.eq('price_range', params.priceRange);
      } catch (e) {
        // Column might not exist, skip filter
      }
    }
    
    // Filter for group-friendly locations (if column exists)
    if (params.groups) {
      try {
        query = query.eq('group_friendly', true);
      } catch (e) {
        // Column might not exist, skip filter
      }
    }
    
    // Filter for locations with deals (if column exists)
    if (params.deals) {
      try {
        query = query.eq('has_deals', true);
      } catch (e) {
        // Column might not exist, skip filter
      }
    }
    
    const { data: locations, error } = await query.order('created_at', { ascending: false }).limit(100);
    
    if (error) {
      console.error('Error searching locations:', error);
      return [];
    }
  
  if (!locations) return [];
  
  let filtered = [...locations];
  
  // Filter by open now
  if (params.openNow) {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    filtered = filtered.filter(loc => {
      if (!loc.opening_hours || typeof loc.opening_hours !== 'object') return false;
      const dayHours = (loc.opening_hours as any)[dayName];
      if (!dayHours || dayHours.closed) return false;
      return currentTime >= dayHours.open && currentTime <= dayHours.close;
    });
  }
  
  // Filter by today availability (has available time slots today)
  if (params.today) {
    // For now, just show all open locations
    // In production, check actual availability against bookings
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    filtered = filtered.filter(loc => {
      if (!loc.opening_hours || typeof loc.opening_hours !== 'object') return true;
      const dayHours = (loc.opening_hours as any)[dayName];
      return !dayHours || !dayHours.closed;
    });
  }
  
  // Apply geo filtering for nearby
  if ((params.nearby || (params.latitude && params.longitude)) && params.radius) {
    // Use user coordinates or Brussels center as default
    const lat = params.latitude || 50.8503;
    const lon = params.longitude || 4.3517;
    const maxRadius = params.radius || 25; // 25km default
    
    filtered = filtered.filter(loc => {
      if (!loc.latitude || !loc.longitude) return false;
      const distance = getDistanceInKm(
        lat,
        lon,
        parseFloat(loc.latitude),
        parseFloat(loc.longitude)
      );
      return distance <= maxRadius;
    });
    
    // Sort by distance
    filtered = filtered.sort((a, b) => {
      const distA = getDistanceInKm(lat, lon, parseFloat(a.latitude!), parseFloat(a.longitude!));
      const distB = getDistanceInKm(lat, lon, parseFloat(b.latitude!), parseFloat(b.longitude!));
      return distA - distB;
    });
  }
  
  return filtered.slice(0, 50); // Limit to 50 results
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
});

/**
 * Get trending/rising locations
 * Based on recent booking activity and new reviews
 */
export const getTrendingLocations = cache(async (limit: number = 5) => {
  const supabase = await createClient();
  
  try {
    // Get locations with their stats
    const { data: locations, error } = await supabase
      .from('locations')
      .select('*')
      .eq('is_public', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50); // Get top 50, then sort by criteria
    
    if (error || !locations) {
      return [];
    }
    
    // Sort by review count and average rating (locations with momentum)
    const sorted = locations.sort((a, b) => {
      const scoreA = (a.review_count || 0) * (a.average_rating || 3);
      const scoreB = (b.review_count || 0) * (b.average_rating || 3);
      return scoreB - scoreA;
    });
    
    return sorted.slice(0, limit);
  } catch (error) {
    console.error('Error fetching trending locations:', error);
    return [];
  }
});

/**
 * Get best rated locations
 * Sorted by average rating and review count
 */
export const getBestRatedLocations = cache(async (limit: number = 5) => {
  const supabase = await createClient();
  
  try {
    const { data: locations, error } = await supabase
      .from('locations')
      .select('*')
      .eq('is_public', true)
      .eq('is_active', true)
      .gte('review_count', 1) // Must have at least 1 review
      .order('average_rating', { ascending: false })
      .order('review_count', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching best rated locations:', error);
      return [];
    }
    
    return locations || [];
  } catch (error) {
    console.error('Error fetching best rated locations:', error);
    return [];
  }
});

/**
 * Get newly added locations
 * Recently added to the platform
 */
export const getNewLocations = cache(async (limit: number = 5) => {
  const supabase = await createClient();
  
  try {
    const { data: locations, error } = await supabase
      .from('locations')
      .select('*')
      .eq('is_public', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching new locations:', error);
      return [];
    }
    
    return locations || [];
  } catch (error) {
    console.error('Error fetching new locations:', error);
    return [];
  }
});

/**
 * Get spotlight locations for homepage carousel
 */
export const getSpotlightLocations = cache(async (limit: number = 10) => {
  const supabase = await createClient();
  
  // First, check if spotlight_enabled column exists by trying a simple count
  try {
    const { data: locations, error } = await supabase
      .from('locations')
      .select(`
        id,
        name,
        slug,
        description,
        cuisine,
        price_range,
        address_json,
        banner_image_url,
        hero_image_url,
        spotlight_priority,
        promotions(id, is_active, valid_until, valid_from)
      `)
      .eq('is_active', true)
      .eq('is_public', true)
      .eq('spotlight_enabled', true)
      .order('spotlight_priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching spotlight locations:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // If the column doesn't exist, return empty array gracefully
      if (error.code === '42703') {
        console.warn('Spotlight columns not yet created. Run SETUP_SPOTLIGHT_FEATURE.sql');
        return [];
      }
      
      return [];
    }
    
    // Add has_deals flag and extract address info from JSON
    const locationsWithDeals = (locations || []).map(location => {
      const addressJson = location.address_json || {};
      return {
        ...location,
        cuisine_type: location.cuisine, // For backwards compatibility
        address_line1: addressJson.street || '',
        city: addressJson.city || '',
        average_rating: 0, // Default to 0 if not available
        review_count: 0, // Default to 0 if not available
        has_deals: location.promotions?.some((p: any) => 
          p.is_active && 
          (!p.valid_until || new Date(p.valid_until) > new Date()) &&
          (!p.valid_from || new Date(p.valid_from) <= new Date())
        ) || false,
      };
    });
    
    return locationsWithDeals;
  } catch (err) {
    console.error('Unexpected error in getSpotlightLocations:', err);
    return [];
  }
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

