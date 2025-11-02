'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, UserPlus, Users } from 'lucide-react';
import { UserCard } from '@/components/social/UserCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

export function FriendsClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchUsers();
    } else if (activeTab === 'following') {
      fetchFollowing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'discover') {
      const timeoutId = setTimeout(() => {
        fetchUsers();
      }, 300); // Debounce search
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('query', searchQuery);
      }

      const response = await fetch(`/api/social/discover/users?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowing = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/social/following');
      if (response.ok) {
        const data = await response.json();
        setFollowing(data.friends || []);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold mb-2">Vind Vrienden</h1>
          <p className="text-sm text-muted-foreground">
            Ontdek en volg gebruikers op Reserve4You
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="discover">
              <Search className="h-4 w-4 mr-2" />
              Ontdekken
            </TabsTrigger>
            <TabsTrigger value="following">
              <Users className="h-4 w-4 mr-2" />
              Gevolgd
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-4 mt-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Zoek naar gebruikers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12"
              />
            </div>

            {/* Users List */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="h-20 bg-muted rounded" />
                  </Card>
                ))}
              </div>
            ) : users.length === 0 ? (
              <Card className="p-12 text-center">
                <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">
                  {searchQuery ? 'Geen gebruikers gevonden' : 'Geen gebruikers om te tonen'}
                </p>
                {searchQuery && (
                  <p className="text-sm text-muted-foreground">
                    Probeer een andere zoekterm
                  </p>
                )}
              </Card>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <UserCard
                    key={user.id}
                    consumerId={user.id}
                    name={user.name}
                    profilePictureUrl={user.profile_picture_url}
                    bio={user.bio}
                    stats={user.stats}
                    isFollowing={user.is_following}
                    showFollowButton={true}
                    onClick={() => {
                      window.location.href = `/profile/${user.id}`;
                    }}
                    onFollowChange={() => {
                      // Refresh users list after follow/unfollow
                      setTimeout(() => {
                        fetchUsers();
                      }, 500);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="following" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="h-20 bg-muted rounded" />
                  </Card>
                ))}
              </div>
            ) : following.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">
                  Je volgt nog niemand
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Gebruik het tabblad "Ontdekken" om gebruikers te vinden en te volgen
                </p>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('discover')}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Gebruikers zoeken
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {following.map((friend) => (
                  <UserCard
                    key={friend.id}
                    consumerId={friend.id}
                    name={friend.name}
                    profilePictureUrl={friend.profile_picture_url}
                    bio={friend.bio}
                    stats={{
                      followers: 0, // Will be fetched separately if needed
                      reviews: 0,
                    }}
                    isFollowing={true}
                    showFollowButton={true}
                    onClick={() => {
                      window.location.href = `/profile/${friend.id}`;
                    }}
                    onFollowChange={() => {
                      // Refresh following list after unfollow
                      setTimeout(() => {
                        fetchFollowing();
                      }, 500);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

