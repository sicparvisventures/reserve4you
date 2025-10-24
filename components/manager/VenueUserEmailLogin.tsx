/**
 * Venue User Email/Password Login Component
 * Login form for venue users (staff)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function VenueUserEmailLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();

      // Sign in with email/password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;
      if (!data.user) throw new Error('Geen gebruiker gevonden');

      // Get venue user details and dashboard URL
      const { data: userData, error: userError } = await supabase.rpc('get_venue_user_by_auth_id', {
        p_auth_user_id: data.user.id
      });

      if (userError || !userData || userData.length === 0) {
        throw new Error('Geen venue gebruiker gevonden voor dit account');
      }

      const venueUser = userData[0];

      if (!venueUser.is_active) {
        throw new Error('Je account is gedeactiveerd. Neem contact op met je beheerder.');
      }

      // Determine dashboard URL based on permissions and location access
      let dashboardUrl: string;

      if (venueUser.all_locations || !venueUser.location_ids || venueUser.location_ids.length === 0) {
        // User has access to all locations or no specific locations
        // Redirect to main dashboard if allowed, otherwise first location
        if (venueUser.can_view_dashboard) {
          dashboardUrl = `/manager/${venueUser.tenant_id}/dashboard`;
        } else {
          // Get first available location
          const { data: locations } = await supabase
            .from('locations')
            .select('id')
            .eq('tenant_id', venueUser.tenant_id)
            .eq('is_active', true)
            .limit(1);

          if (!locations || locations.length === 0) {
            throw new Error('Geen actieve locaties gevonden');
          }

          dashboardUrl = `/manager/${venueUser.tenant_id}/location/${locations[0].id}`;
        }
      } else if (venueUser.location_ids.length === 1) {
        // User has access to exactly one location
        dashboardUrl = `/manager/${venueUser.tenant_id}/location/${venueUser.location_ids[0]}`;
      } else {
        // User has access to multiple specific locations
        // Show dashboard if allowed, otherwise first location
        if (venueUser.can_view_dashboard) {
          dashboardUrl = `/manager/${venueUser.tenant_id}/dashboard`;
        } else {
          dashboardUrl = `/manager/${venueUser.tenant_id}/location/${venueUser.location_ids[0]}`;
        }
      }

      console.log('Redirecting venue user to:', dashboardUrl);

      // Redirect to dashboard - use replace to avoid redirect loop
      window.location.href = dashboardUrl;
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Inloggen mislukt');
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">Personeel Login</CardTitle>
        <CardDescription className="text-center">
          Log in met je email en wachtwoord
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jouw.email@voorbeeld.nl"
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Wachtwoord</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bezig met inloggen...
              </>
            ) : (
              'Inloggen'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Hulp nodig? Neem contact op met je beheerder.</p>
        </div>
      </CardContent>
    </Card>
  );
}

