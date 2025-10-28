/**
 * UserSelector Component
 * Dropdown om een gebruiker te selecteren voor berichten
 */

'use client';

import { useState, useEffect } from 'react';
import { Search, User, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

interface UserOption {
  id: string;
  email: string;
  name: string;
}

interface UserSelectorProps {
  onSelectUser: (email: string, name: string) => void;
  onClose: () => void;
}

export function UserSelector({ onSelectUser, onClose }: UserSelectorProps) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // We kunnen een simpele query doen naar consumers
      const response = await fetch('/api/users/list');
      
      if (!response.ok) {
        throw new Error('Kon gebruikers niet ophalen');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Er is iets misgegaan');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.name.toLowerCase().includes(searchLower)
    );
  });

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 max-h-[500px] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          Selecteer Ontvanger
        </h3>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Zoek op naam of email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {!loading && !error && filteredUsers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Geen gebruikers gevonden
          </p>
        </div>
      )}

      {!loading && !error && filteredUsers.length > 0 && (
        <ScrollArea className="flex-1 -mx-4 px-4">
          <div className="space-y-1">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  onSelectUser(user.email, user.name);
                  onClose();
                }}
                className="w-full text-left"
              >
                <Card className="p-3 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <Avatar className="flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate">
                        {user.name}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

