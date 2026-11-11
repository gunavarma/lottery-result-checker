import React, { useState } from 'react';
import { RAZORPAY_KEY_ID } from '@/lib/public-env';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface RazorpayCheckoutProps {
  initialAmountInPaise?: number;
  currency?: string;
  name?: string;
  description?: string;
  buttonText?: string;
  onSuccess?: (payment: {
    order_id: string;
    payment_id: string;
    signature: string;
  }) => void;
  onError?: (error: any) => void;
  className?: string;
}

export function RazorpayCheckout({
  initialAmountInPaise = 50000, // ₹500.00
  currency = 'INR',
  name = 'KeralaDraws',
  description = 'Lottery Service & Ticket Verification Fee',
  buttonText = 'Pay with Razorpay',
  onSuccess,
  onError,
  className = '',
}: RazorpayCheckoutProps) {
  const [amountInPaise, setAmountInPaise] = useState<number>(initialAmountInPaise);
  const [status, setStatus] = useState<
    'idle' | 'creating_order' | 'modal_open' | 'verifying' | 'success' | 'error' | 'cancelled'
  >('idle');

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
    details?: string;
    orderId?: string;
    paymentId?: string;
  } | null>(null);

  // Helper to dynamically load the Razorpay checkout.js script if not already present
  const ensureRazorpayLoaded = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const existing = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );
      if (existing) {
        existing.addEventListener('load', () => resolve(true));
        existing.addEventListener('error', () => resolve(false));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setFeedback(null);
    setStatus('creating_order');

    try {
      // 1. Ensure SDK script is loaded
      const scriptLoaded = await ensureRazorpayLoaded();
      if (!scriptLoaded) {
        throw new Error(
          'Failed to load Razorpay SDK. Please check your network connection.'
        );
      }

      // 2. Call backend order creation endpoint
      const createOrderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt: `rcpt_${Date.now()}`,
          notes: {
            service: description,
          },
        }),
      });

      const orderData = await createOrderRes.json();

      if (!createOrderRes.ok) {
        throw new Error(
          orderData.error || `Failed to create order (Status ${createOrderRes.status})`
        );
      }

      const { order_id } = orderData;
      if (!order_id) {
        throw new Error('Order creation did not return a valid order_id.');
      }

      const keyId =
        RAZORPAY_KEY_ID ||
        (import.meta as any).env?.PUBLIC_RAZORPAY_KEY_ID ||
        (import.meta as any).env?.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!keyId) {
        throw new Error(
          'Missing Razorpay Key ID. Please configure PUBLIC_RAZORPAY_KEY_ID in .env'
        );
      }

      // 3. Configure Razorpay modal
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || currency,
        name,
        description,
        order_id,
        image: '/icons/icon-192.png',
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          setStatus('verifying');
          try {
            // 4. Verify payment signature on backend
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(
                verifyData.error || 'Payment signature verification failed.'
              );
            }

            setStatus('success');
            setFeedback({
              type: 'success',
              title: 'Payment Successful & Verified',
              message: 'Your payment was successfully processed and authenticated.',
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
            });

            if (onSuccess) {
              onSuccess({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });
            }
          } catch (verifyError: any) {
            console.error('[Verification Error]:', verifyError);
            setStatus('error');
            setFeedback({
              type: 'error',
              title: 'Verification Failed',
              message:
                verifyError.message ||
                'Payment verification failed. Please contact support.',
            });
            if (onError) onError(verifyError);
          }
        },
        prefill: {
          name: 'Guna Varma',
          email: 'support@keraladraws.com',
          contact: '9876543210',
        },
        theme: {
          color: '#0B5D45',
        },
        modal: {
          ondismiss: () => {
            // Handle modal dismiss (user cancelled)
            setStatus('cancelled');
            setFeedback({
              type: 'warning',
              title: 'Payment Cancelled',
              message: 'You closed the checkout modal before completing the payment.',
            });
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      // Handle payment.failed event
      razorpayInstance.on('payment.failed', (response: any) => {
        console.error('[Payment Failed]:', response.error);
        setStatus('error');
        setFeedback({
          type: 'error',
          title: 'Payment Failed',
          message:
            response.error?.description ||
            'Your transaction could not be processed.',
          details: response.error?.reason
            ? `Code: ${response.error.code} | Reason: ${response.error.reason}`
            : undefined,
        });
        if (onError) onError(response.error);
      });

      setStatus('modal_open');
      razorpayInstance.open();
    } catch (err: any) {
      console.error('[Razorpay Checkout Error]:', err);
      setStatus('error');
      setFeedback({
        type: 'error',
        title: 'Checkout Error',
        message: err.message || 'An unexpected error occurred during checkout.',
      });
      if (onError) onError(err);
    }
  };

  const amountInRupees = (amountInPaise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const isLoading =
    status === 'creating_order' || status === 'modal_open' || status === 'verifying';

  return (
    <div
      className={`bg-white rounded-2xl border border-[#E2E7E3] shadow-sm p-6 sm:p-8 space-y-6 ${className}`}
    >
      <div className="flex items-start justify-between border-b border-[#E2E7E3] pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#0B5D45]/10 text-[#0B5D45] mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Razorpay Secure Checkout
          </span>
          <h3 className="text-xl font-bold text-[#10201D]">{name}</h3>
          <p className="text-sm text-[#5F6B66] mt-1">{description}</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-[#5F6B66] font-medium">
            Amount
          </div>
          <div className="text-2xl font-bold font-tabular text-[#0B5D45]">
            ₹{amountInRupees}
          </div>
          <div className="text-xs text-[#5F6B66]">({amountInPaise} paise)</div>
        </div>
      </div>

      {/* Preset amount selector for testing & demonstration */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#5F6B66] mb-2">
          Select or Test Amount:
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '₹1 (Min)', paise: 100 },
            { label: '₹50', paise: 5000 },
            { label: '₹100', paise: 10000 },
            { label: '₹500', paise: 50000 },
          ].map((item) => (
            <button
              key={item.paise}
              type="button"
              disabled={isLoading}
              onClick={() => {
                setAmountInPaise(item.paise);
                setFeedback(null);
                setStatus('idle');
              }}
              className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-lg border transition-all text-center ${
                amountInPaise === item.paise
                  ? 'border-[#0B5D45] bg-[#0B5D45] text-white shadow-sm'
                  : 'border-[#E2E7E3] text-[#17201D] hover:border-[#0B5D45] hover:bg-[#F4F5F2]'
              } disabled:opacity-50`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        id="razorpay-pay-button"
        disabled={isLoading}
        onClick={handlePayment}
        className="w-full py-3.5 px-6 rounded-xl bg-[#0B5D45] hover:bg-[#084835] active:scale-[0.99] text-white font-semibold text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'creating_order' && (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Creating Order...</span>
          </>
        )}
        {status === 'modal_open' && (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Awaiting Payment...</span>
          </>
        )}
        {status === 'verifying' && (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Verifying Signature...</span>
          </>
        )}
        {(status === 'idle' ||
          status === 'success' ||
          status === 'error' ||
          status === 'cancelled') && (
          <>
            <CreditCard className="w-5 h-5" />
            <span>
              {buttonText} • ₹{amountInRupees}
            </span>
          </>
        )}
      </button>

      {/* Feedback Messages */}
      {feedback && (
        <div
          className={`rounded-xl p-4 sm:p-5 border transition-all ${
            feedback.type === 'success'
              ? 'bg-[#16845B]/10 border-[#16845B]/30 text-[#10201D]'
              : feedback.type === 'warning'
                ? 'bg-[#A66A00]/10 border-[#A66A00]/30 text-[#10201D]'
                : 'bg-[#B54747]/10 border-[#B54747]/30 text-[#10201D]'
          }`}
        >
          <div className="flex items-start gap-3">
            {feedback.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-[#16845B] shrink-0 mt-0.5" />
            )}
            {feedback.type === 'warning' && (
              <AlertTriangle className="w-5 h-5 text-[#A66A00] shrink-0 mt-0.5" />
            )}
            {feedback.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-[#B54747] shrink-0 mt-0.5" />
            )}

            <div className="space-y-1 text-sm flex-1">
              <div className="font-semibold">{feedback.title}</div>
              <div className="text-[#5F6B66]">{feedback.message}</div>

              {feedback.details && (
                <div className="text-xs text-[#5F6B66] font-mono mt-1">
                  {feedback.details}
                </div>
              )}

              {feedback.orderId && feedback.paymentId && (
                <div className="mt-3 pt-3 border-t border-[#16845B]/20 text-xs font-mono space-y-1 bg-white/60 p-2.5 rounded-lg">
                  <div>
                    <span className="text-[#5F6B66]">Order ID: </span>
                    <span className="font-semibold text-[#10201D]">
                      {feedback.orderId}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5F6B66]">Payment ID: </span>
                    <span className="font-semibold text-[#0B5D45]">
                      {feedback.paymentId}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Security Assurance footer */}
      <div className="pt-2 flex items-center justify-between text-xs text-[#5F6B66]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#0B5D45]" />
          <span>256-bit SSL encrypted • Test Mode Active</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setFeedback(null);
          }}
          className="hover:text-[#10201D] transition-colors flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" /> Reset
        </button>
      </div>
    </div>
  );
}
