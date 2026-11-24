import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, FileText, X } from 'lucide-react';
import { WhatsAppLogo } from '@/components/WhatsAppLogo';
import type { Language } from '@/lib/translations';
import { WHATSAPP_OFFER_COPY } from '@/lib/whatsapp/offer-copy';
import { trackEvent, trackWhatsAppSubscriptionClick } from '@/lib/analytics';
import { withLocale } from '@/lib/i18n/client-path';

const SHOWN_KEY = 'kd_whatsapp_offer_shown_this_visit';

function isEligiblePath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return !/^\/(?:[a-z]{2}\/)?(?:checkout(?:\/|$)|admin(?:\/|$)|notification-settings(?:\/|$)|my-tickets(?:\/|$)|my-lotteries(?:\/|$)|whatsapp-subscription\/welcome(?:\/|$))/.test(normalized);
}

export function WhatsAppOfferPopup({ locale = 'en', pathname = '/' }: { locale?: Language; pathname?: string }) {
  const copy = WHATSAPP_OFFER_COPY[locale] || WHATSAPP_OFFER_COPY.en;
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isEligiblePath(pathname)) return;

    try {
      // Show again on a fresh visit/tab. Keep it to one display per tab session
      // so closing the dialog does not make it reopen on every page transition.
      if (sessionStorage.getItem(SHOWN_KEY) === '1') return;
    } catch {
      // Continue without persistence when browser storage is unavailable.
    }

    let elapsed = false;
    const showOffer = () => {
      if (!elapsed || document.visibilityState !== 'visible') return;
      try { sessionStorage.setItem(SHOWN_KEY, '1'); } catch { /* private browsing */ }
      trackEvent('whatsapp_offer_impression', { locale });
      setOpen(true);
      document.removeEventListener('visibilitychange', showOffer);
    };
    const timer = window.setTimeout(() => {
      elapsed = true;
      showOffer();
    }, 1800);
    document.addEventListener('visibilitychange', showOffer);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', showOffer);
    };
  }, [locale, pathname]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss();
      }
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
    // dismiss is defined below and intentionally stable for this open cycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dismiss = () => {
    try {
      trackEvent('whatsapp_offer_dismissal', { locale });
    } catch {
      // analytics should never block dismissal
    }
    setOpen(false);
  };

  const checkoutHref = withLocale('/checkout', locale);
  const goToCheckout = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    trackWhatsAppSubscriptionClick({ plan: 'offer_popup' }, () => window.location.assign(checkoutHref));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#081B16]/65 p-4 backdrop-blur-sm"
      onMouseDown={(event) => { if (event.target === event.currentTarget) dismiss(); }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-offer-title"
        aria-describedby="whatsapp-offer-description"
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-[28px] border border-white/70 bg-[#FBFCF9] shadow-2xl"
      >
        <div className="relative overflow-hidden bg-[#0B3B32] px-6 pb-6 pt-7 text-white sm:px-9 sm:pb-8 sm:pt-9">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full border-[24px] border-[#C8A45D]/20" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-white/5" />
          <button
            ref={closeRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
            }}
            aria-label={copy.close}
            className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <X size={20} />
          </button>
          <div className="relative flex items-center gap-2 pr-12 text-xs font-bold uppercase tracking-[0.16em] text-[#F0D58E]">
            <WhatsAppLogo className="h-6 w-6" /> {copy.eyebrow}
          </div>
          <h2 id="whatsapp-offer-title" className="relative mt-4 max-w-lg pr-12 text-3xl font-extrabold leading-tight sm:text-4xl">{copy.title}</h2>
          <p id="whatsapp-offer-description" className="relative mt-3 max-w-lg text-sm leading-6 text-white/85 sm:text-base">{copy.description}</p>
        </div>

        <div className="space-y-5 px-6 py-6 sm:px-9 sm:py-7">
          <p className="flex gap-3 text-sm leading-6 text-[#34423B]">
            <Check size={19} className="mt-0.5 shrink-0 text-[#0B5D45]" />
            <span>{copy.savedTickets}</span>
          </p>
          <div className="rounded-2xl border border-[#E2E7E3] bg-[#F7F8F6] p-3 sm:p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#34423B]">
              <WhatsAppLogo className="h-5 w-5" />
              <span>{copy.previewLabel}</span>
            </div>
            <div className="overflow-hidden rounded-xl border border-[#D8E0DB] bg-[#E9E5DC] p-2.5 sm:p-3">
              <div className="flex items-center gap-2 rounded-lg bg-[#075E54] px-3 py-2 text-white">
                <WhatsAppLogo className="h-7 w-7" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold">KeralaDraws</p>
                  <p className="text-[10px] text-white/75">WhatsApp</p>
                </div>
              </div>
              <div className="mt-2.5 flex min-h-[116px] flex-col items-start gap-1.5 overflow-hidden rounded-lg bg-[#F7F4EC] p-2.5 sm:min-h-[126px] sm:p-3">
                <div className="kd-wa-bubble kd-wa-bubble-one max-w-[92%] rounded-xl rounded-tl-sm bg-white px-3 py-2 text-[11px] leading-4 text-[#26332D] shadow-sm sm:text-xs">
                  <p className="font-bold">{copy.previewDraw}</p>
                  <p>{copy.previewVerified}</p>
                </div>
                <div className="kd-wa-bubble kd-wa-bubble-two max-w-[92%] rounded-xl rounded-tl-sm bg-white px-3 py-2 text-[11px] leading-4 text-[#26332D] shadow-sm sm:text-xs">
                  <p>{copy.previewNumber}</p>
                  <p className="mt-0.5 text-[#16845B]">{copy.previewTicket}</p>
                </div>
                <div className="kd-wa-bubble kd-wa-bubble-three inline-flex max-w-[92%] items-center gap-2 rounded-xl rounded-tl-sm bg-white px-3 py-2 text-[11px] font-semibold leading-4 text-[#26332D] shadow-sm sm:text-xs">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#E9F3EE] text-[#0B5D45]"><FileText size={15} /></span>
                  <span>{copy.previewPdf}</span>
                </div>
              </div>
            </div>
            <p className="mt-2 text-[10px] leading-4 text-[#75817B]">{copy.previewNote}</p>
          </div>
          <p className="text-[11px] leading-5 text-[#75817B]">{copy.note}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a href={checkoutHref} onClick={goToCheckout} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#E9730C] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#CF6408] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B5D45]">
              {copy.cta} <ArrowRight size={17} />
            </a>
            <button type="button" onClick={dismiss} className="min-h-12 rounded-xl px-5 py-3 text-sm font-semibold text-[#52615A] transition hover:bg-[#F1F3EF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B5D45]">{copy.dismiss}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
