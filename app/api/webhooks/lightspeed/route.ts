import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Lightspeed Webhook Handler
 * 
 * This endpoint receives real-time updates from Lightspeed POS.
 * For MVP, this is a stub implementation that logs events.
 * 
 * In production, this would handle events like:
 * - Order updates (new orders, cancellations)
 * - Menu changes (items added/removed, price changes)
 * - Table status changes (occupied, available)
 * - Inventory updates
 */
export async function POST(request: NextRequest) {
  console.log('🔔 Lightspeed webhook received');

  try {
    const body = await request.json();
    const eventType = body.event || body.type;
    const locationId = body.location_id || body.locationId;

    console.log(`   Event type: ${eventType}`);
    console.log(`   Location ID: ${locationId}`);
    console.log(`   Payload:`, JSON.stringify(body, null, 2));

    // Verify webhook signature (in production)
    // const signature = request.headers.get('x-lightspeed-signature');
    // if (!verifyLightspeedSignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    // Route to appropriate handler based on event type
    switch (eventType) {
      case 'order.created':
      case 'order.updated':
        await handleOrderEvent(body, locationId);
        break;

      case 'menu.updated':
        await handleMenuUpdate(body, locationId);
        break;

      case 'table.status_changed':
        await handleTableStatusChange(body, locationId);
        break;

      case 'inventory.updated':
        await handleInventoryUpdate(body, locationId);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing Lightspeed webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle order events from Lightspeed
 * 
 * In production, this would:
 * - Create/update bookings based on walk-in orders
 * - Update table occupancy status
 * - Sync order totals for billing
 */
async function handleOrderEvent(body: any, locationId: string) {
  console.log(`📝 Processing order event for location ${locationId}`);
  
  // MVP stub - in production would:
  // 1. Parse order data
  // 2. Update table status if order includes table assignment
  // 3. Create booking record if walk-in
  // 4. Send notifications if needed
  
  console.log('   Order event logged (stub mode)');
}

/**
 * Handle menu updates from Lightspeed
 * 
 * In production, this would:
 * - Update menu items in our database
 * - Update prices and availability
 * - Trigger cache invalidation
 */
async function handleMenuUpdate(body: any, locationId: string) {
  console.log(`🍽️ Processing menu update for location ${locationId}`);
  
  // MVP stub - in production would:
  // 1. Fetch updated menu from Lightspeed API
  // 2. Store in database
  // 3. Invalidate cached menu data
  // 4. Update location's menu_last_synced timestamp
  
  console.log('   Menu update logged (stub mode)');
}

/**
 * Handle table status changes from Lightspeed
 * 
 * In production, this would:
 * - Update table occupancy in real-time
 * - Block/unblock tables for new reservations
 * - Update availability calculations
 */
async function handleTableStatusChange(body: any, locationId: string) {
  console.log(`🪑 Processing table status change for location ${locationId}`);
  
  const supabase = await createServiceClient();
  
  // MVP stub - in production would:
  // 1. Get table ID from Lightspeed
  // 2. Map to our table ID
  // 3. Update table status in database
  // 4. Trigger availability recalculation
  
  // Example stub implementation:
  const tableExternalId = body.table_id;
  const status = body.status; // 'occupied', 'available', 'reserved', 'cleaning'
  
  console.log(`   Table ${tableExternalId} status: ${status} (stub mode)`);
  
  // Store event log for debugging
  try {
    const { error } = await supabase
      .from('pos_integration_logs')
      .insert({
        location_id: locationId,
        vendor: 'LIGHTSPEED',
        event_type: 'table.status_changed',
        payload: body,
        processed_at: new Date().toISOString(),
      });
    
    if (!error) {
      console.log('   Event logged to database');
    }
  } catch (err) {
    // Fail silently in MVP - table might not exist yet
    console.log('   Unable to log event (table may not exist)');
  }
}

/**
 * Handle inventory updates from Lightspeed
 * 
 * In production, this would:
 * - Update menu item availability
 * - Mark items as sold out
 * - Send notifications to managers
 */
async function handleInventoryUpdate(body: any, locationId: string) {
  console.log(`📦 Processing inventory update for location ${locationId}`);
  
  // MVP stub - in production would:
  // 1. Update menu item stock levels
  // 2. Mark items as unavailable if out of stock
  // 3. Send low stock alerts to managers
  
  console.log('   Inventory update logged (stub mode)');
}

