import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Email Open Tracking Pixel
 * Returns a 1x1 transparent GIF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ logId: string }> }
) {
  const { logId } = await params;

  try {
    const supabase = await createClient();

    // Track email open
    await supabase.rpc('track_email_open', {
      p_log_id: logId,
    });

    // Return 1x1 transparent GIF
    const gif = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    return new NextResponse(gif, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error tracking email open:', error);
    // Still return the pixel even if tracking fails
    const gif = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    return new NextResponse(gif, {
      status: 200,
      headers: { 'Content-Type': 'image/gif' },
    });
  }
}

