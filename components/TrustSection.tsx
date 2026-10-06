import React from 'react';
import { Database, RefreshCw, ShieldCheck, Globe, HelpCircle } from 'lucide-react';
import { getTranslation, Language } from '@/lib/translations';

export function TrustSection({ locale = 'en' }: { locale?: Language }) {
  const t = (key: string, fallback?: string) => getTranslation(locale, key, fallback);
  const steps = [
    {
      num: '01',
      title: t('trust.step1_title', 'Official LOTIS Source'),
      desc: t(
        'trust.step1_body',
        'Draws are conducted under public scrutiny by the Directorate of Kerala State Lotteries at Gorky Bhavan, Thiruvananthapuram.'
      ),
      icon: Database,
    },
    {
      num: '02',
      title: t('trust.step2_title', 'Automated Retrieval'),
      desc: t(
        'trust.step2_body',
        'Our ingestion service connects directly to the official LOTIS publication feed to capture verified draw records. Winning numbers are also shown live from the public source keralalotteries.net the moment they are announced — always labelled unofficial until verified.'
      ),
      icon: RefreshCw,
    },
    {
      num: '03',
      title: t('trust.step3_title', 'Data Integrity Audit'),
      desc: t(
        'trust.step3_body',
        'Winning numbers, series distributions, and prize structures are verified against official Gazette PDF documents. Live (unverified) numbers are replaced by the gazette record and can never overwrite it.'
      ),
      icon: ShieldCheck,
    },
    {
      num: '04',
      title: t('trust.step4_title', 'Instant Publication'),
      desc: t(
        'trust.step4_body',
        'Validated draw results and ticket search indices are published immediately to ensure speed and accuracy.'
      ),
      icon: Globe,
    },
  ];

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-sm space-y-8">
      <div className="border-b border-[#E2E7E3] pb-4 space-y-1">
        <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
          {t('trust.eyebrow', 'Verification & Integrity Workflow')}
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17201D] tracking-tight">
          {t('trust.heading', 'How Kerala Lottery Results Are Synchronized')}
        </h2>
        <p className="text-xs sm:text-sm text-[#68736E] max-w-2xl">
          {t(
            'trust.subheading',
            'An automated, four-stage verification architecture ensuring transparent, accurate, and rapid delivery of official lottery results.'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="bg-[#F7F7F4] rounded-2xl p-5 border border-[#E2E7E3] space-y-3 relative group hover:border-[#0B3B32]/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black text-[#0B3B32] bg-white border border-[#E2E7E3] px-2 py-0.5 rounded font-tabular">
                  {s.num}
                </span>
                <Icon className="w-5 h-5 text-[#0B3B32]" />
              </div>

              <h3 className="font-extrabold text-base text-[#17201D]">
                {s.title}
              </h3>

              <p className="text-xs text-[#68736E] leading-relaxed">
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
