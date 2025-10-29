'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="nl">
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#f9fafb',
        }}>
          <div style={{
            maxWidth: '500px',
            textAlign: 'center',
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 20px',
              backgroundColor: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
            }}>
              ⚠️
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '12px',
              color: '#111827',
            }}>
              Er ging iets mis
            </h1>
            <p style={{
              color: '#6b7280',
              marginBottom: '24px',
              lineHeight: '1.6',
            }}>
              We konden de applicatie niet laden. Probeer de pagina opnieuw te laden.
            </p>
            {process.env.NODE_ENV === 'development' && error.message && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                textAlign: 'left',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#991b1b',
                wordBreak: 'break-all',
                maxHeight: '150px',
                overflow: 'auto',
              }}>
                {error.message}
              </div>
            )}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              marginTop: '24px',
            }}>
              <button
                onClick={reset}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#FF5A5F',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E54950'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FF5A5F'}
              >
                Probeer opnieuw
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Terug naar home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

