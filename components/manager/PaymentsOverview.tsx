'use client';

/**
 * Payments Overview Component
 * 
 * Toont overzicht van betalingen, transacties en payouts voor restaurant managers.
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Euro,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  RefreshCw,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface PaymentTransaction {
  id: string;
  booking_id: string;
  transaction_type: 'CHARGE' | 'REFUND' | 'TRANSFER' | 'FEE';
  amount_cents: number;
  currency: string;
  platform_fee_cents: number;
  net_amount_cents: number;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  created_at: string;
  description: string;
}

interface PaymentsStats {
  totalRevenue: number;
  totalRefunds: number;
  platformFees: number;
  netAmount: number;
  transactionCount: number;
  pendingAmount: number;
}

export function PaymentsOverview({ locationId }: { locationId: string }) {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState<PaymentsStats>({
    totalRevenue: 0,
    totalRefunds: 0,
    platformFees: 0,
    netAmount: 0,
    transactionCount: 0,
    pendingAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [connectUrl, setConnectUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentData();
    checkStripeConnection();
  }, [locationId]);

  const fetchPaymentData = async () => {
    try {
      // Fetch transactions via RPC or API
      // For now, using mock data
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      setLoading(false);
    }
  };

  const checkStripeConnection = async () => {
    try {
      const response = await fetch(
        `/api/manager/stripe/connect-onboarding?locationId=${locationId}`
      );
      if (response.ok) {
        const data = await response.json();
        setStripeConnected(data.status === 'ENABLED');
        if (data.status !== 'ENABLED' && data.onboardingUrl) {
          setConnectUrl(data.onboardingUrl);
        }
      }
    } catch (error) {
      console.error('Error checking Stripe connection:', error);
    }
  };

  const handleConnectStripe = async () => {
    try {
      const response = await fetch('/api/manager/stripe/connect-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.onboardingUrl) {
          window.location.href = data.onboardingUrl;
        }
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'FAILED':
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'error' | 'success' | 'warning' | 'info' | 'outline'> = {
      SUCCEEDED: 'success',
      PENDING: 'warning',
      FAILED: 'error',
      CANCELLED: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status.toLowerCase()}
      </Badge>
    );
  };

  if (!stripeConnected) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="rounded-full bg-blue-100 p-4">
            <CreditCard className="h-12 w-12 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Betalingen activeren
            </h3>
            <p className="text-gray-600 max-w-md">
              Verbind uw Stripe account om betalingen te ontvangen voor reserveringen.
              Dit duurt slechts enkele minuten.
            </p>
          </div>
          <Button onClick={handleConnectStripe} size="lg" className="mt-4">
            <CreditCard className="mr-2 h-5 w-5" />
            Stripe verbinden
          </Button>
          <p className="text-xs text-gray-500">
            Veilig en beveiligd via Stripe
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totale omzet</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                €{(stats.totalRevenue / 100).toFixed(2)}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Terugbetalingen</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                €{(stats.totalRefunds / 100).toFixed(2)}
              </p>
            </div>
            <div className="rounded-full bg-red-100 p-3">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Platform fee</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                €{(stats.platformFees / 100).toFixed(2)}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Euro className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Netto ontvangen</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                €{(stats.netAmount / 100).toFixed(2)}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Recente transacties
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exporteren
              </Button>
              <Button variant="outline" size="sm" onClick={fetchPaymentData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Beschrijving</TableHead>
                <TableHead className="text-right">Bedrag</TableHead>
                <TableHead className="text-right">Platform fee</TableHead>
                <TableHead className="text-right">Netto</TableHead>
                <TableHead>Datum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    Nog geen transacties
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transaction.status)}
                        {getStatusBadge(transaction.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {transaction.transaction_type.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {transaction.description}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      €{(transaction.amount_cents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      -€{(transaction.platform_fee_cents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      €{(transaction.net_amount_cents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {format(new Date(transaction.created_at), 'dd MMM yyyy HH:mm', {
                        locale: nl,
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

