/**
 * Widget Analytics Tracking API Route
 * 
 * POST /api/widget/[widgetCode]/track - Track widget events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ widgetCode: string }> }
) {
  try {
    const { widgetCode } = await params;
    const body = await request.json();
    const { event_type, location_id, referrer_url, user_agent } = body;

    if (!event_type) {
      return NextResponse.json(
        { error: 'event_type is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get widget ID
    const { data: config } = await supabase
      .from('widget_configurations')
      .select('id, track_clicks')
      .eq('widget_code', widgetCode)
      .eq('is_active', true)
      .single();

    if (!config || !config.track_clicks) {
      // Widget not found or tracking disabled, return success anyway
      return NextResponse.json({ success: true });
    }

    // Insert analytics event
    const { error } = await supabase
      .from('widget_analytics')
      .insert({
        widget_id: config.id,
        location_id: location_id || null,
        event_type,
        referrer_url: referrer_url || null,
        user_agent: user_agent || null,
        // Note: IP and location data could be added here from request headers
      });

    if (error) {
      console.error('Error inserting analytics:', error);
    }

    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Widget tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

