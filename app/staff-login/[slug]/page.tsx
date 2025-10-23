/**
 * Location-Specific Staff PIN Login Page
 * No authentication required - PIN only
 */

import { PINLoginBySlugClient } from './PINLoginBySlugClient';
import { createServiceClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function LocationStaffLoginPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Verify location exists
  const supabase = await createServiceClient();
  const { data: location } = await supabase
    .from('locations')
    .select('id, name, staff_login_slug, tenant_id')
    .eq('staff_login_slug', slug)
    .eq('is_active', true)
    .single();
  
  if (!location) {
    notFound();
  }
  
  return <PINLoginBySlugClient slug={slug} locationName={location.name} />;
}

