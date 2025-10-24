/**
 * Staff Login Quick Access Button
 * Shows a quick link to the staff login page for the current location
 * Only visible for venue users
 */

'use client';

import { Button } from '@/components/ui/button';
import { Users, ExternalLink, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface StaffLoginQuickAccessProps {
  locationSlug?: string;
  locationName?: string;
  isVenueUser?: boolean;
}

export function StaffLoginQuickAccess({ 
  locationSlug, 
  locationName,
  isVenueUser = false 
}: StaffLoginQuickAccessProps) {
  const [copied, setCopied] = useState(false);

  // Don't show if no slug or not a venue user
  if (!locationSlug) {
    return null;
  }

  const staffLoginUrl = `${window.location.origin}/staff-login/${locationSlug}`;
  const staffLoginPath = `/staff-login/${locationSlug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(staffLoginUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Personeel Login</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-1">Personeel Inlog Link</h4>
            <p className="text-xs text-muted-foreground">
              {locationName ? `Voor ${locationName}` : 'Voor deze vestiging'}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted px-3 py-2 rounded border text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                {staffLoginPath}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button asChild className="flex-1" size="sm">
                <Link href={staffLoginPath}>
                  Open Login Pagina
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <p className="font-medium mb-1">💡 Tip:</p>
            <p>
              Deel deze link met je personeel of open op een tablet/terminal 
              voor snelle PIN login.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

