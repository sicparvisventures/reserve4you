import { NextResponse } from 'next/server';

/**
 * Environment Variables Diagnostic Endpoint
 * 
 * Checks which environment variables are configured
 * Returns OK/MISSING status without exposing actual values (security)
 */
export async function GET() {
  const envVars = {
    // Google APIs
    'GOOGLE_PLACES_API_KEY': !!process.env.GOOGLE_PLACES_API_KEY,
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY': !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    
    // Supabase
    'NEXT_PUBLIC_SUPABASE_URL': !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'SUPABASE_SERVICE_ROLE_KEY': !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    
    // Stripe
    'STRIPE_SECRET_KEY': !!process.env.STRIPE_SECRET_KEY,
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    'STRIPE_WEBHOOK_SECRET': !!process.env.STRIPE_WEBHOOK_SECRET,
    
    // Email
    'RESEND_API_KEY': !!process.env.RESEND_API_KEY,
    
    // App Config
    'NEXT_PUBLIC_BASE_URL': !!process.env.NEXT_PUBLIC_BASE_URL,
  };

  // Count missing variables
  const missingVars = Object.entries(envVars)
    .filter(([_, isSet]) => !isSet)
    .map(([name, _]) => name);

  const allConfigured = missingVars.length === 0;

  return NextResponse.json({
    status: allConfigured ? 'OK' : 'INCOMPLETE',
    environment: process.env.NODE_ENV || 'unknown',
    timestamp: new Date().toISOString(),
    variables: envVars,
    missing: missingVars,
    configured: Object.keys(envVars).length - missingVars.length,
    total: Object.keys(envVars).length,
    message: allConfigured 
      ? '✅ All environment variables are configured!' 
      : `⚠️ ${missingVars.length} environment variable(s) missing. Check VERCEL_ENV_SETUP.md for setup instructions.`,
  }, {
    status: allConfigured ? 200 : 500,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  });
}

