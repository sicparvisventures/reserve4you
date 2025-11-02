'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Users,
  UserPlus,
  Star,
  Award,
  ChefHat,
  MessageCircle,
  Settings,
  Share2,
} from 'lucide-react';
import Link from 'next/link';
import { FollowButton } from './FollowButton';

interface ProfileHeaderProps {
  profile: {
    id: string;
    name: string;
    profile_picture_url?: string | null;
    bio?: string | null;
    favorite_cuisines?: string[] | null;
    stats: {
      followers: number;
      following: number;
      reviews: number;
    };
    is_own_profile: boolean;
    is_following: boolean;
  };
  consumerId: string;
  onFollowChange?: (isFollowing: boolean, newCount: number) => void;
}

export function ProfileHeader({ profile, consumerId, onFollowChange }: ProfileHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
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
              <span className="font-semibold">{profile.stats.followers}</span>
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
              <FollowButton
                consumerId={consumerId}
                initialIsFollowing={profile.is_following}
                initialFollowersCount={profile.stats.followers}
                onFollowChange={onFollowChange}
                variant="default"
              />
              <Button variant="outline" size="icon">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          )}

          {profile.is_own_profile && (
            <div className="flex gap-3">
              <Link href="/profile">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Profiel bewerken
                </Button>
              </Link>
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

