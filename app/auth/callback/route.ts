import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { config } from '@/lib/config';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/app';

  console.log('[AUTH CALLBACK] Processing callback', { 
    hasCode: !!code, 
    hasError: !!error,
    next 
  });

  // Handle OAuth errors
  if (error) {
    console.error('[AUTH CALLBACK] OAuth error:', error, error_description);
    const errorMessage = encodeURIComponent(
      error_description || 'Authenticatie mislukt. Probeer het opnieuw.'
    );
    return NextResponse.redirect(`${origin}${config.auth.paths.signIn}?error=${errorMessage}`);
  }

  if (code) {
    const supabase = await createClient();
    
    try {
      // Exchange code for session
      const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('[AUTH CALLBACK] Session exchange error:', exchangeError);
        const errorMessage = encodeURIComponent('Kon sessie niet aanmaken. Probeer het opnieuw.');
        return NextResponse.redirect(`${origin}${config.auth.paths.signIn}?error=${errorMessage}`);
      }
      
      if (!data.user) {
        console.error('[AUTH CALLBACK] No user data after session exchange');
        const errorMessage = encodeURIComponent('Gebruikersdata niet gevonden. Probeer het opnieuw.');
        return NextResponse.redirect(`${origin}${config.auth.paths.signIn}?error=${errorMessage}`);
      }

      console.log(`[AUTH CALLBACK] ✅ User authenticated: ${data.user.id} (${data.user.email})`);

      // Wait a moment to let the trigger create the user record
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify user profile was created (by trigger or RPC)
      let userExists = false;
      let retries = 0;
      const maxRetries = 3;

      while (!userExists && retries < maxRetries) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('supabase_user_id', data.user.id)
          .single();

        if (userData && !userError) {
          userExists = true;
          console.log(`[AUTH CALLBACK] ✅ User profile verified: ${data.user.id}`);
        } else if (userError?.code === 'PGRST116') {
          // User not found, try to create with RPC
          console.log(`[AUTH CALLBACK] User profile not found, creating... (attempt ${retries + 1}/${maxRetries})`);
          
          try {
            const { error: rpcError } = await supabase.rpc('create_user_profile');
            if (rpcError) {
              console.error('[AUTH CALLBACK] RPC error:', rpcError);
            } else {
              console.log('[AUTH CALLBACK] ✅ User profile created via RPC');
            }
          } catch (createError) {
            console.error('[AUTH CALLBACK] Error creating user record:', createError);
          }

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 300));
          retries++;
        } else {
          console.error('[AUTH CALLBACK] Error checking user:', userError);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      if (!userExists) {
        console.warn('[AUTH CALLBACK] ⚠️  Could not verify user profile, but continuing auth flow');
        // Don't fail - the getUser() function in DAL will handle profile creation
      }

      // Redirect to destination with success message
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = config.app.env === 'development';
      
      // Add success parameter for first-time signup confirmation
      const isNewSignup = searchParams.get('type') === 'signup';
      const redirectUrl = new URL(next, origin);
      if (isNewSignup) {
        redirectUrl.searchParams.set('verified', 'true');
      }
      
      console.log(`[AUTH CALLBACK] ✅ Redirecting to: ${redirectUrl.pathname}`);
      
      if (isLocalEnv) {
        return NextResponse.redirect(redirectUrl.toString());
      } else if (forwardedHost) {
        const productionUrl = `https://${forwardedHost}${redirectUrl.pathname}${redirectUrl.search}`;
        return NextResponse.redirect(productionUrl);
      } else {
        return NextResponse.redirect(redirectUrl.toString());
      }

    } catch (err) {
      console.error('[AUTH CALLBACK] Unexpected error:', err);
      const errorMessage = encodeURIComponent('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
      return NextResponse.redirect(`${origin}${config.auth.paths.signIn}?error=${errorMessage}`);
    }
  }

  // No code and no error - invalid callback
  console.error('[AUTH CALLBACK] Invalid callback - no code or error');
  const errorMessage = encodeURIComponent('Ongeldige authenticatie link. Probeer opnieuw in te loggen.');
  return NextResponse.redirect(`${origin}${config.auth.paths.signIn}?error=${errorMessage}`);
} 