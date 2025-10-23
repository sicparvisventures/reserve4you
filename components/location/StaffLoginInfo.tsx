'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Copy, Check, ExternalLink, QrCode } from 'lucide-react';

interface StaffLoginInfoProps {
  locationSlug: string;
  locationName: string;
}

export function StaffLoginInfo({ locationSlug, locationName }: StaffLoginInfoProps) {
  const [copied, setCopied] = useState(false);
  
  const staffLoginUrl = `${window.location.origin}/staff-login/${locationSlug}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(staffLoginUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const handleOpen = () => {
    window.open(staffLoginUrl, '_blank');
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Users className="h-6 w-6 text-primary" />
        </div>
        
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Personeel Login</h3>
            <p className="text-sm text-muted-foreground">
              Deel deze link met je personeel voor snelle PIN login
            </p>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Staff Login URL</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-background px-3 py-2 rounded border font-mono break-all">
                  {staffLoginUrl}
                </code>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex-1"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Gekopieerd
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Kopieer Link
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpen}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p>Personeel kan inloggen met hun 4-cijferige PIN code.</p>
            <p>Maak gebruikers aan in Profiel → Gebruikers.</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

