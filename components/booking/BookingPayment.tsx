'use client';

/**
 * Booking Payment Component
 * 
 * Handles payment collection for bookings using Stripe Payment Element.
 * Supports deposits, full payments, and pre-authorization.
 */

import { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { config } from '@/lib/config';

const stripePromise = loadStripe(config.stripe.publishableKey);

interface BookingPaymentProps {
  bookingId: string;
  paymentType: 'DEPOSIT' | 'FULL_PAYMENT' | 'PRE_AUTH';
  onSuccess: () => void;
  onCancel: () => void;
}

interface PaymentFormProps extends BookingPaymentProps {
  clientSecret: string;
  amount: number;
}

function PaymentForm({ 
  bookingId, 
  paymentType, 
  clientSecret, 
  amount, 
  onSuccess, 
  onCancel 
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${config.app.url}/booking-confirmation?booking_id=${bookingId}`,
        },
        redirect: 'if_required', // Only redirect for payment methods that require it (iDEAL, etc)
      });

      if (submitError) {
        setError(submitError.message || 'Betaling mislukt');
        setIsProcessing(false);
      } else {
        setPaymentSuccess(true);
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Er ging iets mis');
      setIsProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="rounded-full bg-green-100 p-4">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Betaling geslaagd</h3>
        <p className="text-gray-600">Uw reservering wordt bevestigd...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {paymentType === 'DEPOSIT' && 'Aanbetaling'}
            {paymentType === 'FULL_PAYMENT' && 'Volledige betaling'}
            {paymentType === 'PRE_AUTH' && 'Betaalmethode opslaan'}
          </h3>
          <span className="text-2xl font-bold text-gray-900">
            €{(amount / 100).toFixed(2)}
          </span>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-900">
            {paymentType === 'DEPOSIT' && 
              'U betaalt nu een aanbetaling. Het resterende bedrag betaalt u bij het restaurant.'}
            {paymentType === 'FULL_PAYMENT' && 
              'U betaalt het volledige bedrag nu. U hoeft niets meer te betalen bij het restaurant.'}
            {paymentType === 'PRE_AUTH' && 
              'We reserveren dit bedrag op uw kaart. Het wordt pas afgeschreven bij no-show.'}
          </p>
        </div>

        <PaymentElement />
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Betaling mislukt</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Annuleren
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verwerken...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Betaal €{(amount / 100).toFixed(2)}
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-center text-gray-500">
        Beveiligde betaling via Stripe. Uw gegevens worden veilig versleuteld.
      </p>
    </form>
  );
}

export function BookingPayment({ 
  bookingId, 
  paymentType, 
  onSuccess, 
  onCancel 
}: BookingPaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/bookings/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId,
            paymentType,
            returnUrl: `${config.app.url}/booking-confirmation?booking_id=${bookingId}`,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Kon betaling niet initialiseren');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
        setAmount(data.amount);
        setLoading(false);
      } catch (err: any) {
        console.error('Payment intent creation error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [bookingId, paymentType]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-gray-600">Betaling voorbereiden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Fout bij laden betaling</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onCancel}>
            Sluiten
          </Button>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return null;
  }

  const elementsOptions: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#2563eb',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#dc2626',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Card className="p-6">
      <Elements stripe={stripePromise} options={elementsOptions}>
        <PaymentForm
          bookingId={bookingId}
          paymentType={paymentType}
          clientSecret={clientSecret}
          amount={amount}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </Elements>
    </Card>
  );
}

