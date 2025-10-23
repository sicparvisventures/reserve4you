'use client';

import { Lock, LogIn, MapPin, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function StaffLoginPrompt() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar home
            </Link>
          </Button>
        </div>

        {/* Login Prompt Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Login</h1>
            <p className="text-sm text-muted-foreground">
              Authenticatie vereist voor algemene staff login
            </p>
          </div>

          {/* Information */}
          <div className="bg-muted/50 p-6 rounded-lg space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Locatie-Specifieke Login</h3>
                  <p className="text-xs text-muted-foreground">
                    Voor snelle toegang zonder account, gebruik de locatie-specifieke staff login URL die u van uw manager heeft ontvangen.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Algemene Login</h3>
                  <p className="text-xs text-muted-foreground">
                    Voor toegang tot alle locaties en volledige beheerfuncties, log in met uw Reserve4You account.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              asChild
              size="lg"
              className="w-full rounded-xl"
            >
              <Link href="/sign-in?redirect=/staff-login">
                <LogIn className="h-5 w-5 mr-2" />
                Inloggen voor gebruik
              </Link>
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Geen account? Neem contact op met uw manager
              </p>
            </div>
          </div>

          {/* Example */}
          <div className="pt-4 border-t space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Voorbeeld locatie URL:</p>
            <code className="block text-xs bg-muted p-3 rounded-lg font-mono break-all">
              reserve4you.com/staff-login/vestiging-naam
            </code>
            <p className="text-xs text-muted-foreground">
              Deze URL ontvangt u van uw manager voor directe PIN login.
            </p>
          </div>
        </div>

        {/* Bottom Branding */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>Powered by Reserve4You</p>
        </div>
      </div>
    </div>
  );
}

