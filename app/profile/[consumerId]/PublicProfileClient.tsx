'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  User,
  MapPin,
  Calendar,
  Heart,
  MessageCircle,
  Star,
  Users,
  Award,
  Settings,
  ArrowLeft,
  UserPlus,
  UserMinus,
  Share2,
  ChefHat,
  UtensilsCrossed,
} from 'lucide-react';
import Link from 'next/link';
import { FollowUnfollowButton } from '@/components/social/FollowUnfollowButton';
import { UserActivityFeed } from '@/components/social/UserActivityFeed';
import { CreditsDisplay } from '@/components/loyalty/CreditsDisplay';

interface Profile {
  id: string;
  name: string;
  profile_picture_url?: string | null;
  bio?: string | null;
  favorite_cuisines?: string[] | null;
  top_3_restaurants?: string[] | null;
  is_profile_public: boolean;
  badges?: Array<{
    badge_type: string;
    earned_at: string;
    metadata?: any;
  }>;
  stats: {
    followers: number;
    following: number;
    reviews: number;
  };
  is_own_profile: boolean;
  is_following: boolean;
  created_at: string;
}

interface PublicProfileClientProps {
  initialProfile: Profile;
  consumerId: string;
}

export function PublicProfileClient({ initialProfile, consumerId }: PublicProfileClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [isFollowing, setIsFollowing] = useState(profile.is_following);
  const [followersCount, setFollowersCount] = useState(profile.stats.followers);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getBadgeLabel = (badgeType: string) => {
    const badges: Record<string, string> = {
      food_explorer: 'Food Explorer',
      review_master: 'Review Master',
      local_hero: 'Local Hero',
      top_taster: 'Top Taster',
      social_butterfly: 'Social Butterfly',
    };
    return badges[badgeType] || badgeType;
  };

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case 'food_explorer':
        return <MapPin className="h-4 w-4" />;
      case 'review_master':
        return <Star className="h-4 w-4" />;
      case 'local_hero':
        return <Award className="h-4 w-4" />;
      case 'top_taster':
        return <UtensilsCrossed className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold flex-1 truncate">{profile.name}</h1>
          {profile.is_own_profile && (
            <Link href="/profile">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          )}
          {!profile.is_own_profile && (
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
              <AvatarImage src={profile.profile_picture_url || undefined} />
              <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">{profile.name}</h2>
                {profile.bio && (
                  <p className="text-muted-foreground">{profile.bio}</p>
                )}
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 text-sm">
                <Link
                  href={`/profile/${consumerId}/followers`}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Users className="h-4 w-4" />
                  <span className="font-semibold">{followersCount}</span>
                  <span className="text-muted-foreground">volgers</span>
                </Link>
                <Link
                  href={`/profile/${consumerId}/following`}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="font-semibold">{profile.stats.following}</span>
                  <span className="text-muted-foreground">volgend</span>
                </Link>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span className="font-semibold">{profile.stats.reviews}</span>
                  <span className="text-muted-foreground">reviews</span>
                </div>
              </div>

              {/* Favorite Cuisines */}
              {profile.favorite_cuisines && profile.favorite_cuisines.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.favorite_cuisines.map((cuisine, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1">
                      <ChefHat className="h-3 w-3" />
                      {cuisine}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              {!profile.is_own_profile && (
                <div className="flex gap-3">
                  <FollowUnfollowButton
                    consumerId={consumerId}
                    initialIsFollowing={isFollowing}
                    initialFollowersCount={followersCount}
                    onFollowChange={(newIsFollowing, newCount) => {
                      setIsFollowing(newIsFollowing);
                      setFollowersCount(newCount);
                    }}
                    className="flex-1 sm:flex-none"
                  />
                  <Button variant="outline" size="icon">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* FlowCredits - Only show for own profile */}
        {profile.is_own_profile && (
          <Card className="p-6">
            <CreditsDisplay variant="default" />
          </Card>
        )}

        {/* Badges */}
        {profile.badges && profile.badges.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="h-5 w-5" />
              Badges
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {profile.badges.map((badge, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50"
                >
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    {getBadgeIcon(badge.badge_type)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{getBadgeLabel(badge.badge_type)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(badge.earned_at).toLocaleDateString('nl-NL', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tabs */}
        <div className="border-b">
          <div className="flex gap-6">
            <button className="pb-3 border-b-2 border-primary font-medium text-primary">
              Activiteit
            </button>
            <button className="pb-3 text-muted-foreground hover:text-foreground">
              Reviews
            </button>
            <button className="pb-3 text-muted-foreground hover:text-foreground">
              Favorieten
            </button>
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <UserActivityFeed consumerId={consumerId} />
        </div>
      </div>
    </div>
  );
}

