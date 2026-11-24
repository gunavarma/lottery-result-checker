import React, { useState } from 'react';
import { CreditCard, Loader2, ShieldCheck } from 'lucide-react';

declare global {
  interface Window { Razorpay?: any }
}

type Feedback = { kind: 'success' | 'error'; text: string } | null;

export function RazorpayLiveTestCheckout() {
  const [accessCode, setAccessCode] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [recurringConsent, setRecurringConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const loadCheckout = async () => {
    if (window.Razorpay) return true;
    return new Promise<boolean>((resolve) => {
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
    if (!recurringConsent) {
      setFeedback({ kind: 'error', text: 'Please accept the recurring payment terms to continue.' });
      return;
    }
    setBusy(true);
    try {
      if (!(await loadCheckout())) throw new Error('Could not load secure Razorpay checkout.');
      const response = await fetch('/api/razorpay/live-test/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode, phone, email, recurringConsent: true }),
      });
      const created = await response.json();
      if (!response.ok) throw new Error(created.error || 'Could not start the live test checkout.');

      const checkout = new window.Razorpay({
        key: created.key_id,
        subscription_id: created.subscription_id,
        name: 'KeralaDraws',
        description: 'Private live UPI AutoPay test — ₹2 monthly, maximum two cycles',
        image: '/icons/icon-192.png',
        prefill: { contact: phone.replace(/\D/g, ''), email: email || undefined },
        notes: { plan: 'live_test' },
        theme: { color: '#0B5D45' },
        handler: async (result: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) => {
          try {
            const verifiedResponse = await fetch('/api/razorpay/live-test/verify-subscription', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...result, accessCode }),
            });
            const verified = await verifiedResponse.json();
            if (!verifiedResponse.ok || !verified.success) throw new Error(verified.error || 'Razorpay authorization could not be verified.');
            setFeedback({ kind: 'success', text: 'Live test mandate authorized. Razorpay will confirm its status; this test subscription is limited to two monthly cycles (up to ₹4 total).' });
          } catch (error: any) {
            setFeedback({ kind: 'error', text: error?.message || 'We could not confirm the authorization. Check Razorpay before retrying.' });
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      checkout.on('payment.failed', () => {
        setBusy(false);
        setFeedback({ kind: 'error', text: 'The authorization did not complete. Check Razorpay before trying again.' });
      });
      checkout.open();
    } catch (error: any) {
      setBusy(false);
      setFeedback({ kind: 'error', text: error?.message || 'Could not start checkout. Please try again.' });
    }
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-[#E2E7E3] bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B5D45]"><ShieldCheck size={17} /> Private live payment test</span>
        <h1 className="text-2xl font-bold text-[#10201D]">Test a ₹2 monthly UPI mandate</h1>
        <p className="text-sm leading-6 text-[#5F6B66]">This checkout uses live Razorpay and can make real charges. The subscription is limited to two monthly cycles: up to ₹4 total, then it ends. You must approve the mandate in your UPI app. Cancel it earlier from your UPI app or Razorpay if you no longer want it.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium text-[#24332D]">Private access code
          <input value={accessCode} onChange={(event) => setAccessCode(event.target.value)} type="password" autoComplete="current-password" required className="w-full rounded-xl border border-[#D8E0DB] px-4 py-3 outline-none focus:border-[#0B5D45]" />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-[#24332D]">WhatsApp number
          <input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" autoComplete="tel" required className="w-full rounded-xl border border-[#D8E0DB] px-4 py-3 outline-none focus:border-[#0B5D45]" />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-[#24332D] sm:col-span-2">Email <span className="font-normal text-[#75817B]">(optional)</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" className="w-full rounded-xl border border-[#D8E0DB] px-4 py-3 outline-none focus:border-[#0B5D45]" />
        </label>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[#F7F8F6] p-4 text-sm leading-6 text-[#394740]">
        <input type="checkbox" checked={recurringConsent} onChange={(event) => setRecurringConsent(event.target.checked)} className="mt-1 accent-[#0B5D45]" />
        <span>I authorize Razorpay to set up a live ₹2 monthly recurring UPI mandate for no more than two billing cycles (maximum ₹4 total). I understand the first charge may occur during authorization, future renewals are automatic, and I can cancel earlier through my UPI app or Razorpay.</span>
      </label>

      {feedback && <div role="status" className={`rounded-xl p-4 text-sm ${feedback.kind === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>{feedback.text}</div>}
      <button type="button" onClick={startCheckout} disabled={busy || !phone.trim() || !accessCode.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B5D45] px-5 py-3.5 font-semibold text-white transition hover:bg-[#084936] disabled:cursor-not-allowed disabled:opacity-60">
        {busy ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
        {busy ? 'Opening secure Razorpay checkout…' : 'Continue to live Razorpay checkout'}
      </button>
    </section>
  );
}
