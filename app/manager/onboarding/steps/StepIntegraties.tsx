'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plug, Check, ExternalLink } from 'lucide-react';

interface StepIntegratiesProps {
  data: any;
  updateData: (key: string, value: any) => void;
  onNext: () => void;
}

export function StepIntegraties({ data, updateData, onNext }: StepIntegratiesProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const isConnected = data.posIntegration?.vendor === 'LIGHTSPEED';

  const handleConnectLightspeed = async () => {
    setIsConnecting(true);
    setError('');

    try {
      // Create Lightspeed OAuth link
      const response = await fetch('/api/manager/integrations/lightspeed/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: data.locationId,
          returnUrl: `${window.location.origin}/manager/onboarding?step=7&lightspeed=connected`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create OAuth link');
      }

      const { url } = await response.json();
      
      // Redirect to Lightspeed
      window.location.href = url;
    } catch (error: any) {
      setError(error.message);
      setIsConnecting(false);
    }
  };

  const handleSkip = () => {
    // Skip integrations for now
    onNext();
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mr-4">
            <Plug className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Integraties</h2>
            <p className="text-muted-foreground">Koppel je POS systeem (optioneel)</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Lightspeed Integration */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">LS</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Lightspeed POS</h3>
                <p className="text-sm text-muted-foreground">Synchroniseer je menu en tafels</p>
              </div>
            </div>
            {isConnected && (
              <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                <Check className="h-5 w-5 text-white" />
              </div>
            )}
          </div>

          {isConnected ? (
            <div className="p-4 bg-success/10 border border-success rounded-xl">
              <p className="text-sm text-foreground font-medium mb-1">✓ Lightspeed verbonden</p>
              <p className="text-sm text-muted-foreground">
                Je POS data wordt automatisch gesynchroniseerd
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">Voordelen:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Automatische menu synchronisatie</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Real-time tafel status updates</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Geïntegreerde bestellingen (toekomstige feature)</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleConnectLightspeed}
                disabled={isConnecting}
                variant="outline"
                className="w-full h-12 rounded-xl"
              >
                {isConnecting ? 'Verbinden...' : 'Verbind met Lightspeed'}
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}
        </Card>

        {/* Other Integrations (Coming Soon) */}
        <Card className="p-6 opacity-60">
          <div className="flex items-center mb-3">
            <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center mr-4">
              <Plug className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-muted-foreground">Andere integraties</h3>
              <p className="text-sm text-muted-foreground">Binnenkort beschikbaar</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            We werken aan integraties met Adyen, Square, Untill en meer.
          </p>
        </Card>

        {/* Info Banner */}
        <div className="p-4 bg-info/10 border border-info/20 rounded-xl">
          <p className="text-sm text-foreground">
            <strong>Optioneel:</strong> POS integraties zijn alleen beschikbaar voor het Plus abonnement. 
            Je kunt deze stap overslaan en later configureren in je dashboard.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-xl">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1 h-12 rounded-xl"
          >
            Overslaan
          </Button>
          <Button
            onClick={onNext}
            className="flex-1 h-12 gradient-bg text-white rounded-xl font-semibold"
          >
            Doorgaan
          </Button>
        </div>
      </div>
    </div>
  );
}

