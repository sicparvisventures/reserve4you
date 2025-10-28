/**
 * DEBUG Favorites API Route
 * Use this to see detailed error information
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const debugInfo: any = {
    step: 'start',
    timestamp: new Date().toISOString()
  };

  try {
    debugInfo.step = 'creating_supabase_client';
    const supabase = await createClient();
    
    debugInfo.step = 'getting_authenticated_user';
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      debugInfo.authError = {
        message: authError.message,
        status: authError.status,
        name: authError.name
      };
      return NextResponse.json({ error: 'Auth error', debugInfo }, { status: 401 });
    }
    
    if (!user) {
      debugInfo.error = 'No user found';
      return NextResponse.json({ error: 'Not authenticated', debugInfo }, { status: 401 });
    }
    
    debugInfo.userId = user.id;
    debugInfo.userEmail = user.email;
    
    debugInfo.step = 'parsing_request_body';
    const body = await request.json();
    const { locationId, action } = body;
    
    debugInfo.locationId = locationId;
    debugInfo.action = action;
    
    if (!locationId || !action) {
      debugInfo.error = 'Missing locationId or action';
      return NextResponse.json({ error: 'Missing parameters', debugInfo }, { status: 400 });
    }
    
    debugInfo.step = 'getting_consumer_record';
    const { data: consumer, error: consumerError } = await supabase
      .from('consumers')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();
    
    if (consumerError) {
      debugInfo.consumerError = {
        code: consumerError.code,
        message: consumerError.message,
        details: consumerError.details,
        hint: consumerError.hint
      };
    }
    
    debugInfo.consumerFound = !!consumer;
    debugInfo.consumerId = consumer?.id;
    
    if (!consumer) {
      debugInfo.step = 'creating_consumer_record';
      const { data: newConsumer, error: createError } = await supabase
        .from('consumers')
        .insert({
          auth_user_id: user.id,
          email: user.email || 'user@reserve4you.com',
          name: user.user_metadata?.full_name || 
                user.user_metadata?.name || 
                user.email?.split('@')[0] || 
                'Guest User',
        })
        .select('id')
        .single();
      
      if (createError) {
        debugInfo.createConsumerError = {
          code: createError.code,
          message: createError.message,
          details: createError.details,
          hint: createError.hint
        };
        return NextResponse.json({ 
          error: 'Failed to create consumer',
          debugInfo
        }, { status: 500 });
      }
      
      debugInfo.newConsumerId = newConsumer?.id;
      debugInfo.consumerCreated = true;
    }
    
    const finalConsumerId = consumer?.id || debugInfo.newConsumerId;
    debugInfo.finalConsumerId = finalConsumerId;
    
    if (action === 'add') {
      debugInfo.step = 'adding_favorite';
      const { data: insertData, error: insertError } = await supabase
        .from('favorites')
        .insert({
          consumer_id: finalConsumerId,
          location_id: locationId,
        })
        .select();
      
      if (insertError) {
        debugInfo.insertError = {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        };
        return NextResponse.json({ 
          error: 'Failed to add favorite',
          debugInfo
        }, { status: 500 });
      }
      
      debugInfo.insertSuccess = true;
      debugInfo.insertedData = insertData;
      
      return NextResponse.json({ 
        success: true,
        message: 'Favorite added',
        debugInfo
      });
    } else {
      debugInfo.step = 'removing_favorite';
      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('consumer_id', finalConsumerId)
        .eq('location_id', locationId);
      
      if (deleteError) {
        debugInfo.deleteError = {
          code: deleteError.code,
          message: deleteError.message,
          details: deleteError.details,
          hint: deleteError.hint
        };
        return NextResponse.json({ 
          error: 'Failed to remove favorite',
          debugInfo
        }, { status: 500 });
      }
      
      debugInfo.deleteSuccess = true;
      
      return NextResponse.json({ 
        success: true,
        message: 'Favorite removed',
        debugInfo
      });
    }
  } catch (error: any) {
    debugInfo.catchError = {
      message: error.message,
      stack: error.stack,
      name: error.name
    };
    
    console.error('DEBUG API Error:', error);
    console.error('Debug Info:', JSON.stringify(debugInfo, null, 2));
    
    return NextResponse.json({ 
      error: 'Internal server error',
      debugInfo
    }, { status: 500 });
  }
}

