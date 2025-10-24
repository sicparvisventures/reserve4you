/**
 * AI Chat API - Reserve4You
 * 
 * OpenAI integratie voor intelligente restaurant analytics en tips
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

// Lazy initialize OpenAI client
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    const openai = getOpenAIClient();
    if (!openai) {
      console.error('[AI Chat] OPENAI_API_KEY not configured');
      return NextResponse.json({
        message: '⚠️ AI assistent is niet geconfigureerd. Voeg OPENAI_API_KEY toe aan .env.local',
        suggestions: []
      });
    }

    const body = await request.json();
    const { message, tenantId, locationId, conversationHistory } = body;

    if (!message || !tenantId) {
      return NextResponse.json(
        { error: 'Message and tenantId required' },
        { status: 400 }
      );
    }

    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user has access to tenant
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get analytics data for context
    const analyticsData = await getAnalyticsContext(supabase, tenantId, locationId);

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(analyticsData);

    // Call OpenAI
    console.log('[AI Chat] Calling OpenAI API...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Changed from gpt-4-turbo-preview - faster & cheaper!
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory
          .filter((msg: any) => msg.role !== 'system')
          .map((msg: any) => ({
            role: msg.role,
            content: msg.content
          })),
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    console.log('[AI Chat] OpenAI response received');

    const aiResponse = completion.choices[0].message.content || 'Sorry, ik kon geen antwoord genereren.';

    // Analyze response for actionable tips
    const tipData = await analyzeTipOpportunities(aiResponse, analyticsData);

    // Generate suggestions for next questions
    const suggestions = generateSuggestions(message, analyticsData);

    return NextResponse.json({
      message: aiResponse,
      suggestions,
      createNotification: tipData.shouldNotify,
      notificationData: tipData.notification,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[AI Chat] Error:', error);
    console.error('[AI Chat] Error details:', {
      message: error.message,
      code: error.code,
      type: error.type,
      status: error.status
    });
    
    // Handle OpenAI specific errors
    if (error.code === 'insufficient_quota') {
      return NextResponse.json({
        message: '⚠️ OpenAI quota exceeded. Voeg billing toe op platform.openai.com',
        suggestions: []
      });
    }

    if (error.status === 401 || error.code === 'invalid_api_key') {
      return NextResponse.json({
        message: '⚠️ OpenAI API key is ongeldig. Check OPENAI_API_KEY in .env.local',
        suggestions: []
      });
    }

    if (error.code === 'model_not_found') {
      return NextResponse.json({
        message: '⚠️ GPT-4 model niet beschikbaar. Probeer gpt-3.5-turbo.',
        suggestions: []
      });
    }

    // Generic error response
    return NextResponse.json({
      message: `❌ Er ging iets mis: ${error.message || 'Unknown error'}. Check server logs.`,
      suggestions: ['Probeer het opnieuw', 'Check .env.local configuratie']
    });
  }
}

/**
 * Get analytics context from database
 */
async function getAnalyticsContext(supabase: any, tenantId: string, locationId?: string) {
  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get bookings stats
  let bookingsQuery = supabase
    .from('bookings')
    .select('*, locations!inner(tenant_id, name)')
    .eq('locations.tenant_id', tenantId);

  if (locationId) {
    bookingsQuery = bookingsQuery.eq('location_id', locationId);
  }

  const { data: allBookings } = await bookingsQuery;
  
  const todayBookings = allBookings?.filter((b: any) => {
    const bookingDate = new Date(b.booking_date);
    return bookingDate.toDateString() === today.toDateString();
  }) || [];

  const weekBookings = allBookings?.filter((b: any) => {
    const bookingDate = new Date(b.booking_date);
    return bookingDate >= sevenDaysAgo;
  }) || [];

  const monthBookings = allBookings?.filter((b: any) => {
    const bookingDate = new Date(b.booking_date);
    return bookingDate >= thirtyDaysAgo;
  }) || [];

  // Calculate stats
  const stats = {
    today: {
      total: todayBookings.length,
      confirmed: todayBookings.filter((b: any) => b.status === 'confirmed').length,
      pending: todayBookings.filter((b: any) => b.status === 'pending').length,
      cancelled: todayBookings.filter((b: any) => b.status === 'cancelled').length,
      totalGuests: todayBookings.reduce((sum: number, b: any) => sum + (b.number_of_guests || 0), 0)
    },
    week: {
      total: weekBookings.length,
      confirmed: weekBookings.filter((b: any) => b.status === 'confirmed').length,
      noShows: weekBookings.filter((b: any) => b.status === 'no_show').length,
      avgPartySize: weekBookings.length > 0 
        ? Math.round(weekBookings.reduce((sum: number, b: any) => sum + (b.number_of_guests || 0), 0) / weekBookings.length)
        : 0
    },
    month: {
      total: monthBookings.length,
      revenue: monthBookings.reduce((sum: number, b: any) => sum + (b.deposit_amount_cents || 0), 0) / 100,
      noShowRate: monthBookings.length > 0
        ? Math.round((monthBookings.filter((b: any) => b.status === 'no_show').length / monthBookings.length) * 100)
        : 0,
      cancellationRate: monthBookings.length > 0
        ? Math.round((monthBookings.filter((b: any) => b.status === 'cancelled').length / monthBookings.length) * 100)
        : 0
    }
  };

  // Get locations
  let locationsQuery = supabase
    .from('locations')
    .select('id, name, is_public, cuisine_type, price_range')
    .eq('tenant_id', tenantId);

  if (locationId) {
    locationsQuery = locationsQuery.eq('id', locationId);
  }

  const { data: locations } = await locationsQuery;

  // Get billing info
  const { data: billing } = await supabase
    .from('billing_state')
    .select('plan, bookings_used_this_month, max_bookings_per_month')
    .eq('tenant_id', tenantId)
    .single();

  return {
    stats,
    locations: locations || [],
    billing: billing || null,
    tenantId,
    locationId
  };
}

/**
 * Build system prompt with context
 */
function buildSystemPrompt(analyticsData: any): string {
  return `Je bent een professionele AI assistent voor Reserve4You, een intelligent restaurant reserveringssysteem.

Je rol:
- Analyseer restaurant data en geef bruikbare inzichten
- Beantwoord vragen over reserveringen, omzet en gasten
- Geef concrete tips om het restaurant te verbeteren
- Wees vriendelijk, professioneel en to-the-point
- Gebruik Nederlandse taal
- Gebruik emoji's voor visuele impact (maar met mate)

Huidige context:
${JSON.stringify(analyticsData, null, 2)}

Belangrijke richtlijnen:
1. Geef concrete cijfers en percentages waar mogelijk
2. Vergelijk met vorige periodes als relevant
3. Suggereer actie-items, niet alleen observaties
4. Wees positief en opbouwend, ook bij slechte cijfers
5. Focus op wat de manager kan DOEN om te verbeteren
6. Gebruik duidelijke formatting met bullet points

Voorbeeld goede antwoorden:
- "📊 Vandaag heb je 12 reserveringen met 38 gasten. Dat is 20% meer dan gisteren!"
- "⚠️ Je no-show rate is 15% - dat is hoger dan gemiddeld. Tip: Stuur herinneringen 24u van tevoren."
- "💡 Je dinsdagen zijn rustig. Overweeg een speciale aanbieding om meer gasten te trekken."

Geef geen algemene marketing adviezen, maar specifieke tips gebaseerd op de DATA.`;
}

/**
 * Analyze if response contains actionable tips that should become notifications
 */
async function analyzeTipOpportunities(response: string, analyticsData: any) {
  const tipKeywords = ['tip:', '💡', 'overweeg', 'suggestie', 'advies', 'probeer'];
  const shouldNotify = tipKeywords.some(keyword => response.toLowerCase().includes(keyword.toLowerCase()));

  if (!shouldNotify) {
    return { shouldNotify: false, notification: null };
  }

  // Extract the tip from response
  const tipMatch = response.match(/💡\s*(.+?)(?:\n|$)/);
  const tipText = tipMatch ? tipMatch[1] : response.substring(0, 200);

  return {
    shouldNotify: true,
    notification: {
      message: tipText,
      actionUrl: '/manager/' + analyticsData.tenantId + '/dashboard',
      actionLabel: 'Bekijk Dashboard'
    }
  };
}

/**
 * Generate follow-up suggestions
 */
function generateSuggestions(userMessage: string, analyticsData: any): string[] {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('vandaag') || lowerMessage.includes('today')) {
    return [
      'Hoe vergeleken met gisteren?',
      'Voorspel morgen',
      'Geef bezettingsgraad',
    ];
  }

  if (lowerMessage.includes('week') || lowerMessage.includes('analyse')) {
    return [
      'Welke dag was het drukst?',
      'Vergelijk met vorige week',
      'Geef omzet breakdown',
    ];
  }

  if (lowerMessage.includes('tips') || lowerMessage.includes('verbeter')) {
    return [
      'Hoe kan ik no-shows verminderen?',
      'Tips voor meer reserveringen',
      'Optimaliseer bezettingsgraad',
    ];
  }

  if (lowerMessage.includes('gasten') || lowerMessage.includes('klanten')) {
    return [
      'Wie zijn mijn beste gasten?',
      'Gemiddelde party size',
      'Nieuwe vs returning gasten',
    ];
  }

  // Default suggestions
  return [
    'Geef tips voor deze week',
    'Analyseer mijn prestaties',
    'Voorspel drukke periodes',
  ];
}

