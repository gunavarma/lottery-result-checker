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
      desc: 'Our ingestion service connects directly to the official LOTIS publication feed to capture verified draw records.',
      icon: RefreshCw,
    },
    {
      num: '03',
      title: 'Data Integrity Audit',
      desc: 'Winning numbers, series distributions, and prize structures are verified against official Gazette PDF documents.',
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
    <section className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-sm space-y-8">
      <div className="border-b border-[#E2E7E3] pb-4 space-y-1">
        <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
          Verification & Integrity Workflow
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17201D] tracking-tight">
          How Kerala Lottery Results Are Synchronized
        </h2>
        <p className="text-xs sm:text-sm text-[#68736E] max-w-2xl">
          An automated, four-stage verification architecture ensuring transparent, accurate, and rapid delivery of official lottery results.
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

              <h4 className="font-extrabold text-base text-[#17201D]">
                {s.title}
              </h4>

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
