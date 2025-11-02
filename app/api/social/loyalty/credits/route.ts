import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/social/loyalty/credits
 * Get current user's FlowCredits balance
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifyApiSession();
    const supabase = await createClient();

    // Get consumer_id
    const { data: consumer, error: consumerError } = await supabase
      .from('consumers')
      .select('id')
      .eq('auth_user_id', session.userId)
      .single();

    if (consumerError || !consumer) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get all credits (including expired for total calculation)
    const { data: allCredits } = await supabase
      .from('flow_credits')
      .select('amount, expires_at, created_at')
      .eq('consumer_id', consumer.id)
      .order('created_at', { ascending: false });

    // Calculate active credits (not expired)
    const now = new Date().toISOString();
    const activeCredits = allCredits?.filter(
      (credit) => !credit.expires_at || credit.expires_at > now
    ) || [];

    const totalCredits = activeCredits.reduce((sum, credit) => sum + credit.amount, 0);
    const totalEarned = allCredits?.reduce((sum, credit) => sum + credit.amount, 0) || 0;
    const expiredCredits = (allCredits?.length || 0) - activeCredits.length;

    // Get credits expiring soon (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringSoon = activeCredits.filter(
      (credit) => credit.expires_at && credit.expires_at < thirtyDaysFromNow.toISOString()
    );

    const expiringSoonAmount = expiringSoon.reduce((sum, credit) => sum + credit.amount, 0);

    return NextResponse.json({
      balance: totalCredits,
      total_earned: totalEarned,
      active_credits: totalCredits,
      expired_count: expiredCredits,
      expiring_soon: expiringSoonAmount,
      expires_in_30_days: expiringSoonAmount > 0,
    });
  } catch (error: any) {
    console.error('Error in GET /api/social/loyalty/credits:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

