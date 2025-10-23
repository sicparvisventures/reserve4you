'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, ArrowLeft, AlertCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PINLoginBySlugClientProps {
  slug: string;
  locationName: string;
}

export function PINLoginBySlugClient({ slug, locationName }: PINLoginBySlugClientProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
      
      // Auto-submit when 4 digits entered
      if (newPin.length === 4) {
        setTimeout(() => verifyPIN(newPin), 100);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const verifyPIN = async (pinToVerify: string) => {
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      
      // Call the location-specific PIN verification function
      const { data, error: rpcError } = await supabase
        .rpc('verify_pin_and_login_by_slug', {
          p_slug: slug,
          p_pin_code: pinToVerify,
          p_ip_address: null,
          p_user_agent: navigator.userAgent,
        });

      if (rpcError) {
        console.error('RPC error:', rpcError);
        throw rpcError;
      }

      console.log('RPC Response:', data);

      if (data && data.length > 0 && data[0].success) {
        const result = data[0];
        
        // Store session in localStorage
        localStorage.setItem('venue_user_session', JSON.stringify({
          sessionId: result.session_id,
          user: result.user_data,
          tenant_id: result.tenant_id,
          location_id: result.location_id,
        }));

        // Redirect to dashboard
        const dashboardUrl = result.dashboard_url;
        console.log('Redirecting to:', dashboardUrl);
        router.push(dashboardUrl);
      } else {
        const errorMsg = data?.[0]?.error_message || 'Ongeldige PIN code';
        console.error('Login failed:', errorMsg);
        setError(errorMsg);
        setPin('');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Fout bij inloggen. Probeer opnieuw.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

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

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Personeel Login</h1>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{locationName}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Voer je 4-cijferige PIN code in
            </p>
          </div>

          {/* PIN Display */}
          <div className="space-y-4">
            <div className="flex justify-center gap-4">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${
                    pin.length > index
                      ? 'bg-primary border-primary'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {pin.length > index && (
                    <div className="w-3 h-3 rounded-full bg-white" />
                  )}
                </div>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center justify-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          {/* Numpad */}
          <div className="space-y-3">
            {/* Numbers 1-9 */}
            <div className="grid grid-cols-3 gap-3">
              {numbers.map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  disabled={loading}
                  className="aspect-square rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors text-2xl font-semibold text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Bottom Row: Clear, 0, Backspace */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={handleClear}
                disabled={loading || pin.length === 0}
                className="aspect-square rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors text-sm font-medium text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Clear
              </button>
              <button
                onClick={() => handleNumberClick('0')}
                disabled={loading}
                className="aspect-square rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors text-2xl font-semibold text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                disabled={loading || pin.length === 0}
                className="aspect-square rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground mt-2">Verifiëren...</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <p>Geen toegang? Neem contact op met je manager</p>
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

