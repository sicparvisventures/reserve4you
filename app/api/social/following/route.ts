/**
 * Social Following API
 * GET: Get list of users that the current user is following (friends)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Niet geauthenticeerd' },
        { status: 401 }
      );
    }

    // Get current user's consumer record
    const { data: currentConsumer, error: consumerError } = await supabase
      .from('consumers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (consumerError || !currentConsumer) {
      return NextResponse.json(
        { error: 'Consumer profiel niet gevonden' },
        { status: 404 }
      );
    }

    // Get all consumers that current user is following
    const { data: following, error: followingError } = await supabase
      .from('follows')
      .select(`
        following_id,
        created_at,
        following:consumers!follows_following_id_fkey(
          id,
          name,
          email,
          profile_picture_url,
          bio
        )
      `)
      .eq('follower_id', currentConsumer.id)
      .order('created_at', { ascending: false });

    if (followingError) {
      console.error('Error fetching following:', followingError);
      return NextResponse.json(
        { error: 'Fout bij ophalen van gevolgde gebruikers' },
        { status: 500 }
      );
    }

    // Transform the data to a simpler format
    const friends = (following || []).map(f => ({
      id: f.following.id,
      name: f.following.name,
      email: f.following.email,
      profile_picture_url: f.following.profile_picture_url,
      bio: f.following.bio,
      followed_since: f.created_at,
    }));

    return NextResponse.json({ 
      friends: friends,
      count: friends.length
    });
  } catch (error: any) {
    console.error('Error in GET /api/social/following:', error);
    return NextResponse.json(
      { error: error.message || 'Interne serverfout' },
      { status: 500 }
    );
  }
}

