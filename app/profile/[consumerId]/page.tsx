import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PublicProfileClient } from './PublicProfileClient';

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ consumerId: string }>;
}) {
  const { consumerId } = await params;
  const supabase = await createClient();

  // Fetch profile data directly from database (server-side)
  try {
    // Get current user (optional, for privacy checks)
    const { data: { user } } = await supabase.auth.getUser();
    let currentConsumerId: string | null = null;

    if (user) {
      const { data: currentConsumer } = await supabase
        .from('consumers')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();
      currentConsumerId = currentConsumer?.id || null;
    }

    // Get profile
    const { data: consumer, error: consumerError } = await supabase
      .from('consumers')
      .select(`
        id,
        name,
        profile_picture_url,
        bio,
        favorite_cuisines,
        top_3_restaurants,
        is_profile_public,
        created_at
      `)
      .eq('id', consumerId)
      .single();

    if (consumerError || !consumer) {
      notFound();
    }

    const isOwnProfile = currentConsumerId === consumer.id;

    // Check privacy
    if (!consumer.is_profile_public && !isOwnProfile) {
      if (!currentConsumerId) {
        notFound(); // Private profile, not logged in
      }

      // Check if following
      const { data: follow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentConsumerId)
        .eq('following_id', consumerId)
        .single();

      if (!follow) {
        notFound(); // Private profile, not following
      }
    }

    // Get badges
    const { data: badges } = await supabase
      .from('user_badges')
      .select('badge_type, earned_at, metadata')
      .eq('consumer_id', consumerId)
      .order('earned_at', { ascending: false });

    // Get stats
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', consumerId);

    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', consumerId);

    const { count: reviewsCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('consumer_id', consumerId)
      .eq('is_published', true);

    // Check if following
    let isFollowing = false;
    if (currentConsumerId && !isOwnProfile) {
      const { data: follow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentConsumerId)
        .eq('following_id', consumerId)
        .single();
      isFollowing = !!follow;
    }

    const profile = {
      ...consumer,
      badges: badges || [],
      stats: {
        followers: followersCount || 0,
        following: followingCount || 0,
        reviews: reviewsCount || 0,
      },
      is_own_profile: isOwnProfile,
      is_following: isFollowing,
    };

    return (
      <Suspense fallback={<ProfileSkeleton />}>
        <PublicProfileClient initialProfile={profile} consumerId={consumerId} />
      </Suspense>
    );
  } catch (error) {
    console.error('Error fetching profile:', error);
    notFound();
  }
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-6"></div>
          <div className="flex items-start gap-4 mb-6">
            <div className="w-24 h-24 bg-muted rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ consumerId: string }>;
}) {
  const { consumerId } = await params;
  const supabase = await createClient();

  try {
    const { data: consumer } = await supabase
      .from('consumers')
      .select('name, bio, is_profile_public')
      .eq('id', consumerId)
      .single();

    if (!consumer || !consumer.is_profile_public) {
      return {
        title: 'Profiel niet gevonden',
      };
    }

    return {
      title: `${consumer.name} | Reserve4You Profiel`,
      description: consumer.bio || `Bekijk het profiel van ${consumer.name} op Reserve4You`,
    };
  } catch (error) {
    return {
      title: 'Profiel',
    };
  }
}

