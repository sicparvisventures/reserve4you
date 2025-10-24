/**
 * Venue User Data Access Layer
 * Helper functions for venue user operations
 */

import { createClient } from '@/lib/supabase/server';

export interface VenueUserPermissions {
  can_view_dashboard: boolean;
  can_manage_bookings: boolean;
  can_manage_customers: boolean;
  can_manage_tables: boolean;
  can_manage_menu: boolean;
  can_manage_promotions: boolean;
  can_view_analytics: boolean;
  can_manage_settings: boolean;
  can_manage_users: boolean;
  can_manage_billing: boolean;
}

export interface VenueUser {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role: 'administrator' | 'standard' | 'viewer' | 'group_manager';
  all_locations: boolean;
  location_ids: string[];
  is_active: boolean;
  permissions: VenueUserPermissions;
}

export interface VenueUserLocation {
  location_id: string;
  location_name: string;
  tenant_id: string;
}

/**
 * Get venue user by auth user ID
 */
export async function getVenueUserByAuthId(authUserId: string): Promise<VenueUser | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('get_venue_user_by_auth_id', {
    p_auth_user_id: authUserId
  });
  
  if (error || !data || data.length === 0) {
    return null;
  }
  
  const user = data[0];
  return {
    id: user.id,
    tenant_id: user.tenant_id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    all_locations: user.all_locations,
    location_ids: user.location_ids || [],
    is_active: user.is_active,
    permissions: {
      can_view_dashboard: user.can_view_dashboard,
      can_manage_bookings: user.can_manage_bookings,
      can_manage_customers: user.can_manage_customers,
      can_manage_tables: user.can_manage_tables,
      can_manage_menu: user.can_manage_menu,
      can_manage_promotions: user.can_manage_promotions,
      can_view_analytics: user.can_view_analytics,
      can_manage_settings: user.can_manage_settings,
      can_manage_users: user.can_manage_users,
      can_manage_billing: user.can_manage_billing,
    }
  };
}

/**
 * Check if venue user has specific permission
 */
export async function checkVenueUserPermission(
  authUserId: string,
  permission: keyof VenueUserPermissions
): Promise<boolean> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('check_venue_user_permission', {
    p_auth_user_id: authUserId,
    p_permission: permission
  });
  
  if (error) {
    console.error('Error checking permission:', error);
    return false;
  }
  
  return data === true;
}

/**
 * Check if venue user has access to specific location
 */
export async function checkVenueUserLocationAccess(
  authUserId: string,
  locationId: string
): Promise<boolean> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('check_venue_user_location_access', {
    p_auth_user_id: authUserId,
    p_location_id: locationId
  });
  
  if (error) {
    console.error('Error checking location access:', error);
    return false;
  }
  
  return data === true;
}

/**
 * Get all accessible locations for venue user
 */
export async function getVenueUserAccessibleLocations(
  authUserId: string
): Promise<VenueUserLocation[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('get_venue_user_accessible_locations', {
    p_auth_user_id: authUserId
  });
  
  if (error || !data) {
    console.error('Error getting accessible locations:', error);
    return [];
  }
  
  return data.map((loc: any) => ({
    location_id: loc.location_id,
    location_name: loc.location_name,
    tenant_id: loc.tenant_id
  }));
}

/**
 * Check if current user is a venue user (not main account owner/manager)
 */
export async function isVenueUser(authUserId: string): Promise<boolean> {
  const venueUser = await getVenueUserByAuthId(authUserId);
  return venueUser !== null;
}

