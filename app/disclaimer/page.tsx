import React from 'react';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StructuredData } from '@/components/StructuredData';
import { constructMetadata, getBreadcrumbSchema } from '@/lib/seo';
import { AlertTriangle, ShieldCheck, ExternalLink, HelpCircle, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'Disclaimer & Official Verification Policy | KeralaDraws',
  description:
    'Read the KeralaDraws statutory disclaimer. Understand our non-governmental status, official LOTIS portal synchronization methodology, and physical gazette verification requirements.',
  path: '/disclaimer',
});

export default function DisclaimerPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Disclaimer', url: '/disclaimer' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
      <StructuredData data={getBreadcrumbSchema(breadcrumbs)} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Disclaimer & Verification Policy' },
        ]}
      />

      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">
        <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
          Statutory Transparency
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          Disclaimer & Verification Policy
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E]">
          Official statement of independence, non-governmental operation, and data synchronization standards.
        </p>
      </div>

      <div className="space-y-6">
        {/* Prominent Statutory Disclaimer Banner */}
        <div className="bg-white border-2 border-[#C8A45D] rounded-3xl p-6 sm:p-8 space-y-3 text-[#17201D] shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#A66A00] shrink-0" />
            <h2 className="text-sm font-extrabold tracking-wider uppercase font-tabular text-[#A66A00]">
              Statutory Independence Declaration
            </h2>
          </div>
          <p className="text-sm leading-relaxed font-bold">
            KeralaDraws (keraladraws.com) is an independent digital information platform and is NOT affiliated with, authorized by, endorsed by, or in any way officially connected to the Government of Kerala, the Directorate of Kerala State Lotteries, or any government agency.
          </p>
          <p className="text-xs text-[#68736E] leading-relaxed">
            All lottery scheme names (including Karunya Plus, Sthree Sakthi, Suvarna Keralam, Fifty-Fifty, Nirmal, Win-Win, and bumper titles) and trademarks remain the intellectual property of their respective statutory owners.
          </p>
        </div>

        {/* Verification & Claim Policy */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-4 text-xs sm:text-sm text-[#17201D] leading-relaxed">
          <h3 className="text-lg font-extrabold text-[#17201D] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0B3B32]" />
            <span>Data Synchronization & Verification Methodology</span>
          </h3>
          <p className="text-[#68736E]">
            All draw results, winning numbers, and prize tier figures published on KeralaDraws are parsed automatically from official LOTIS public notices and PDF gazettes issued by the Directorate of Kerala State Lotteries at Gorky Bhavan, Thiruvananthapuram.
          </p>
          <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] space-y-2">
            <h4 className="font-bold text-[#17201D] text-xs uppercase font-tabular">Prize Winner Legal Instructions</h4>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#68736E]">
              <li>Prize winners are legally advised to cross-verify their physical tickets with the official Kerala Government Gazette before surrendering tickets.</li>
              <li>Winning tickets must be surrendered within <strong>90 days</strong> from the draw date to the respective district lottery offices or designated banks.</li>
              <li>Taxes and TDS deductions under Section 194B of the Income Tax Act apply to prizes exceeding ₹10,000.</li>
            </ul>
          </div>

          <div className="pt-2">
            <a
              href="https://www.lotteryagent.kerala.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#0B3B32] hover:text-[#10201D] bg-[#F1F4F2] px-4 py-2.5 rounded-xl border border-[#E2E7E3] transition-colors"
            >
              <span>Visit Official Government LOTIS Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
