'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UtensilsCrossed, Plus, ArrowRight, Store, Trash2 } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  brand_color: string | null;
  role: string;
  location_count: number;
}

interface ManagerClientProps {
  tenants: Tenant[];
}

export function ManagerClient({ tenants }: ManagerClientProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleDelete = async (tenantId: string, tenantName: string) => {
    const confirmed = confirm(
      `Weet je zeker dat je "${tenantName}" wilt verwijderen?\n\n` +
      `Dit verwijdert permanent:\n` +
      `- Alle locaties\n` +
      `- Alle tafels en shifts\n` +
      `- Alle reserveringen\n` +
      `- Alle instellingen\n\n` +
      `Deze actie kan niet ongedaan gemaakt worden.`
    );

    if (!confirmed) return;

    setDeletingId(tenantId);
    setError('');

    try {
      const response = await fetch(`/api/manager/tenants/${tenantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete tenant');
      }

      // Refresh the page to show updated tenant list
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen gradient-bg-subtle">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-slide-up">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
              <UtensilsCrossed className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Kies je bedrijf
            </h1>
            <p className="text-lg text-muted-foreground">
              Selecteer het bedrijf waarmee je wilt werken
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-xl">
              <p className="text-destructive text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Tenants Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {tenants.map((tenant, index) => (
              <Card 
                key={tenant.id}
                className="p-6 hover:shadow-lg transition-all duration-200 border-2 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <Link 
                    href={`/manager/${tenant.id}/dashboard`}
                    className="flex items-center flex-1 hover:opacity-80 transition-opacity"
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl mr-4"
                      style={{ backgroundColor: tenant.brand_color || '#FF5A5F' }}
                    >
                      {tenant.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {tenant.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {tenant.role}
                      </p>
                    </div>
                  </Link>
                  <ArrowRight className="h-5 w-5 text-muted-foreground ml-4" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Store className="h-4 w-4 mr-2" />
                    <span>{tenant.location_count || 0} locatie(s)</span>
                  </div>
                  
                  {tenant.role === 'OWNER' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tenant.id, tenant.name)}
                      disabled={deletingId === tenant.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      {deletingId === tenant.id ? (
                        'Verwijderen...'
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Verwijder
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Create New Tenant Button */}
          <div className="text-center animate-fade-in" style={{ animationDelay: '300ms' }}>
            <Link href="/manager/onboarding?step=1">
              <Button 
                size="lg" 
                className="gradient-bg text-white hover:opacity-90 transition-opacity rounded-xl"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nieuw bedrijf starten
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

