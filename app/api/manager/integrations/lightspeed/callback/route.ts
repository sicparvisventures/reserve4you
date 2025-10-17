import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Lightspeed OAuth Callback Handler
 * 
 * This endpoint receives the OAuth authorization code from Lightspeed
 * and exchanges it for access and refresh tokens.
 * 
 * For MVP, this is a stub implementation.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // This is the locationId
  const error = searchParams.get('error');

  if (error) {
    console.error('Lightspeed OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/manager/onboarding?step=7&lightspeed=error`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/manager/onboarding?step=7&lightspeed=error`
    );
  }

  const locationId = state;

  try {
    // Exchange code for tokens (MVP stub - would call Lightspeed API in production)
    if (process.env.LIGHTSPEED_CLIENT_ID && process.env.LIGHTSPEED_CLIENT_SECRET) {
      // In production, would make POST request to:
      // https://cloud.lightspeedapp.com/oauth/access_token
      // with client_id, client_secret, code, grant_type=authorization_code
      
      console.log('🔄 Would exchange Lightspeed OAuth code for tokens in production');
      console.log(`   Code: ${code}`);
      console.log(`   Location ID: ${locationId}`);

      // For MVP, just store a placeholder
      const supabase = await createServiceClient();
      
      const { error: dbError } = await supabase
        .from('pos_integrations')
        .upsert({
          location_id: locationId,
          vendor: 'LIGHTSPEED',
          access_token: 'lightspeed_stub_token', // In production: actual access token
          refresh_token: 'lightspeed_stub_refresh', // In production: actual refresh token
          meta_json: {
            connected_at: new Date().toISOString(),
            stub: true,
          },
        }, {
          onConflict: 'location_id,vendor',
        });

      if (dbError) {
        console.error('Error saving Lightspeed integration:', dbError);
        throw dbError;
      }

      console.log('✅ Lightspeed integration saved (stub mode)');
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/manager/onboarding?step=7&lightspeed=connected`
    );
  } catch (error) {
    console.error('Error processing Lightspeed callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/manager/onboarding?step=7&lightspeed=error`
    );
  }
}

