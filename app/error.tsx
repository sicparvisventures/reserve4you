'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="max-w-md space-y-6 p-8 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-50 p-4">
            <svg className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Er ging iets mis
          </h1>
          <p className="text-muted-foreground">
            We konden deze pagina niet laden. Probeer het opnieuw.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-xs text-red-800 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-[#FF5A5F] text-white rounded-lg hover:bg-[#E54950] transition-colors"
          >
            Probeer opnieuw
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Terug naar home
          </button>
        </div>
      </div>
    </div>
  );
}

