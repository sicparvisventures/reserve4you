import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{
    tenantId: string;
  }>;
}

/**
 * Verify if current user has access to a tenant
 * Used by onboarding wizard to validate tenant access
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { tenantId } = await params;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user has membership for this tenant
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single();
    
    if (membershipError || !membership) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'You do not have access to this tenant'
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ 
      success: true,
      hasAccess: true,
      role: membership.role
    });
  } catch (error: any) {
    console.error('Error verifying tenant access:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

