import React from 'react';
import { Database, RefreshCw, ShieldCheck, Globe, HelpCircle } from 'lucide-react';

export function TrustSection() {
  const steps = [
    {
      num: '01',
      title: 'Official LOTIS Source',
      desc: 'Draws are conducted under public scrutiny by the Directorate of Kerala State Lotteries at Gorky Bhavan, Thiruvananthapuram.',
      icon: Database,
    },
    {
      num: '02',
      title: 'Automated Retrieval',
      desc: 'Our ingestion service connects directly to the official LOTIS publication feed to capture verified draw records. Winning numbers are also shown live from the public source keralalotteries.net the moment they are announced — always labelled unofficial until verified.',
      icon: RefreshCw,
    },
    {
      num: '03',
      title: 'Data Integrity Audit',
      desc: 'Winning numbers, series distributions, and prize structures are verified against official Gazette PDF documents. Live (unverified) numbers are replaced by the gazette record and can never overwrite it.',
      icon: ShieldCheck,
    },
    {
      num: '04',
      title: 'Instant Publication',
      desc: 'Validated draw results and ticket search indices are published immediately to ensure speed and accuracy.',
      icon: Globe,
    },
  ];

  return (
    <section id="verification-workflow" className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-xs space-y-8 scroll-mt-24">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E7E3] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#0B5D45] uppercase tracking-wider block font-tabular">
              Government Verification &amp; Architecture
            </span>
            <span className="text-[10px] font-bold bg-[#E9F3EE] text-[#0B5D45] px-2 py-0.5 rounded-full font-tabular border border-[#0B5D45]/20">
              4-Stage Verification
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17201D] tracking-tight">
            How Kerala Lottery Results Are Synchronized
          </h2>
          <p className="text-xs sm:text-sm text-[#5F6B66] max-w-2xl">
            An automated, four-stage verification architecture ensuring transparent, accurate, and rapid delivery of official lottery results.
          </p>
        </div>
        <div className="text-[11px] text-[#5F6B66] font-medium bg-[#F7F7F4] border border-[#E2E7E3] px-3.5 py-2 rounded-xl shrink-0 space-y-0.5">
          <div className="font-bold text-[#17201D]">Draw Venue: Gorky Bhavan, TVM</div>
          <div>Audit Source: Official Government Gazette</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="bg-gradient-to-br from-[#FAFAF7] to-white rounded-2xl p-5 border border-[#E2E7E3] space-y-3 relative group hover:border-[#0B5D45]/40 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-[#0B5D45] bg-[#E9F3EE] border border-[#0B5D45]/20 px-2.5 py-1 rounded-md font-tabular">
                    {s.num}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B5D45] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4 text-[#0B5D45]" />
                  </div>
                </div>

                <h3 className="font-extrabold text-base text-[#17201D]">
                  {s.title}
                </h3>

                <p className="text-xs text-[#5F6B66] leading-relaxed">
                  {s.desc}
                </p>
              </div>

              <div className="pt-2 text-[10px] font-bold text-[#0B5D45] uppercase tracking-wider font-tabular">
                Stage {idx + 1} of 4 Complete
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
