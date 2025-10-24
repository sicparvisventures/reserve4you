/**
 * Staff Login with Tabs - PIN or Email/Password
 */

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PINLoginClient } from './PINLoginClient';
import VenueUserEmailLogin from '@/components/manager/VenueUserEmailLogin';
import { Hash, Mail } from 'lucide-react';

export default function StaffLoginTabs() {
  const [activeTab, setActiveTab] = useState<'pin' | 'email'>('email');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Personeel Login</h1>
          <p className="text-muted-foreground">Kies je inlogmethode</p>
        </div>

        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'pin' | 'email')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email & Wachtwoord
            </TabsTrigger>
            <TabsTrigger value="pin" className="flex items-center gap-2">
              <Hash className="w-4 h-4" />
              PIN Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="flex justify-center">
            <VenueUserEmailLogin />
          </TabsContent>

          <TabsContent value="pin" className="flex justify-center">
            <div className="w-full max-w-md">
              <PINLoginClient />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Voor locatie-specifieke login: gebruik <code className="text-xs bg-muted px-2 py-1 rounded">/staff-login/[locatie-slug]</code>
          </p>
        </div>
      </div>
    </div>
  );
}

