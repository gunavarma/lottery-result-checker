import React, { useState } from 'react';
import { CheckCircle2, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import type { Language } from '@/lib/translations';
import { getOrCreateWatchlistDeviceId } from '@/lib/watchlist/device-id';
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';
import { withLocale } from '@/lib/i18n/client-path';

declare global {
  interface Window { Razorpay?: any }
}

type PlanCode = 'standard' | 'annual';
type Feedback = { kind: 'success' | 'error'; text: string } | null;

const PLANS = [
  { code: 'standard' as const, name: 'Standard', price: '₹199', cadence: 'per month', details: 'Monthly recurring payment' },
  { code: 'annual' as const, name: 'Annual', price: '₹1,999', cadence: 'per year', details: 'Save ₹389 compared with 12 monthly payments' },
];

export function RazorpayMembershipCheckout({ testMode = false, locale = 'en' }: { testMode?: boolean; liveMode?: boolean; locale?: Language }) {
  const [plan, setPlan] = useState<PlanCode>('standard');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [recurringConsent, setRecurringConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const loadCheckout = async () => {
    if (typeof window === 'undefined') return false;
    if (window.Razorpay) return true;
    return new Promise<boolean>((resolve) => {
      const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(true), { once: true });
        existing.addEventListener('error', () => resolve(false), { once: true });
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

  const startCheckout = async () => {
    setFeedback(null);
    if (!recurringConsent || !whatsappConsent) {
      setFeedback({ kind: 'error', text: 'Please accept both the WhatsApp alerts and recurring payment terms to continue.' });
      return;
    }
    setBusy(true);
    try {
      if (!(await loadCheckout())) throw new Error('Could not load secure Razorpay checkout. Please try again.');

      const watchlistUserId = getOrCreateWatchlistDeviceId();
      if (!watchlistUserId) throw new Error('Allow site storage in your browser so we can connect saved tickets to WhatsApp alerts.');
      trackEvent(ANALYTICS_EVENTS.WHATSAPP_CHECKOUT_START, { plan });

      const createResponse = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          phone,
          watchlistUserId,
          email,
          whatsappConsent: true,
          recurringConsent: true,
          website: '',
        }),
      });
      const created = await createResponse.json();
      if (!createResponse.ok) throw new Error(created.error || 'Could not start the subscription.');

      const checkout = new window.Razorpay({
        key: created.key_id,
        subscription_id: created.subscription_id,
        name: 'KeralaDraws',
        description: `${created.plan.name} Kerala lottery result alerts — ${created.plan.period}`,
        image: '/icons/icon-192.png',
        prefill: { contact: phone.replace(/\D/g, ''), email: email || undefined },
        notes: { plan: created.plan.code },
        theme: { color: '#0B5D45' },
        handler: async (response: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) => {
          try {
            const verifyResponse = await fetch('/api/razorpay/verify-subscription', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const verified = await verifyResponse.json();
            if (!verifyResponse.ok || !verified.success) throw new Error(verified.error || 'Razorpay could not verify the authorization.');
            if (created.billing_mode === 'live') {
              try { localStorage.setItem('kd_whatsapp_subscription_authorized', '1'); } catch { /* popup stays frequency-limited if storage is blocked */ }
              trackEvent(ANALYTICS_EVENTS.WHATSAPP_SUBSCRIPTION_AUTHORIZED, { plan });
              window.location.assign(withLocale('/whatsapp-subscription/welcome', locale));
              return;
            }
            setFeedback({ kind: 'success', text: 'Mandate authorization received. Your membership will activate after Razorpay confirms the subscription.' });
          } catch (error: any) {
            setFeedback({ kind: 'error', text: error?.message || 'We could not confirm the payment status. Please contact support before trying again.' });
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setFeedback({ kind: 'error', text: 'Checkout was closed. No membership was activated.' });
          },
        },
      });
      checkout.on('payment.failed', () => {
        setBusy(false);
        setFeedback({ kind: 'error', text: 'The mandate authorization did not complete. You can try again.' });
      });
      checkout.open();
    } catch (error: any) {
      setBusy(false);
      setFeedback({ kind: 'error', text: error?.message || 'Could not start checkout. Please try again.' });
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-[#E2E7E3] bg-white p-5 shadow-sm sm:p-8">
      <div className="space-y-2">
        {testMode && <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">Test mode is on. Payments here are simulated and will not charge you.</p>}
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B5D45]"><ShieldCheck size={17} /> Secure recurring checkout</span>
        <h2 className="text-2xl font-bold text-[#10201D]">Choose your result alerts plan</h2>
        <p className="text-sm leading-6 text-[#5F6B66]">Get Kerala lottery result updates and ticket-checking alerts on WhatsApp after you opt in.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PLANS.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => setPlan(item.code)}
            aria-pressed={plan === item.code}
            className={`rounded-2xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${plan === item.code ? 'border-[#0B5D45] bg-[#F1F8F4] ring-2 ring-[#0B5D45]/15' : 'border-[#E2E7E3] hover:border-[#AEBBB4]'}`}
          >
            <span className="flex items-center justify-between text-sm font-semibold text-[#10201D]">{item.name}{plan === item.code && <CheckCircle2 size={18} className="text-[#0B5D45]" />}</span>
            <span className="mt-3 block text-3xl font-extrabold text-[#10201D]">{item.price}<span className="ml-1 text-sm font-medium text-[#5F6B66]">{item.cadence}</span></span>
            <span className="mt-2 block text-xs text-[#5F6B66]">{item.details}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium text-[#24332D]">
          WhatsApp number
          <input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" autoComplete="tel" placeholder="+91 98765 43210" className="w-full rounded-xl border border-[#D8E0DB] px-4 py-3 outline-none focus:border-[#0B5D45]" />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-[#24332D]">
          Email <span className="font-normal text-[#75817B]">(optional)</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="you@example.com" className="w-full rounded-xl border border-[#D8E0DB] px-4 py-3 outline-none focus:border-[#0B5D45]" />
        </label>
      </div>

      <div className="space-y-3 rounded-2xl bg-[#F7F8F6] p-4 text-sm leading-6 text-[#394740]">
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={recurringConsent} onChange={(event) => setRecurringConsent(event.target.checked)} className="mt-1 accent-[#0B5D45]" />
          <span>I authorize Razorpay to collect <strong>{PLANS.find((item) => item.code === plan)?.price} {plan === 'standard' ? 'monthly' : 'yearly'}</strong> through a recurring UPI, card, or bank mandate. I understand I must approve the mandate in Razorpay checkout and can cancel future renewals through the mandate provider or KeralaDraws support.</span>
        </label>
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={whatsappConsent} onChange={(event) => setWhatsappConsent(event.target.checked)} className="mt-1 accent-[#0B5D45]" />
          <span>I agree to receive KeralaDraws lottery result and ticket-checking messages on WhatsApp at the number above. I can opt out at any time.</span>
        </label>
      </div>

      {feedback && (
        <div role="status" className={`rounded-xl p-4 text-sm ${feedback.kind === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
          {feedback.text}
        </div>
      )}

      <button type="button" onClick={startCheckout} disabled={busy || !phone.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B5D45] px-5 py-3.5 font-semibold text-white transition hover:bg-[#084936] disabled:cursor-not-allowed disabled:opacity-60">
        {busy ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
        {busy ? 'Opening secure checkout…' : 'Continue to Razorpay'}
      </button>
      <p className="text-center text-xs leading-5 text-[#75817B]">Recurring billing starts only after you authorize the mandate in Razorpay. Plan activation is confirmed by Razorpay’s secure webhook.</p>
    </section>
  );
}
