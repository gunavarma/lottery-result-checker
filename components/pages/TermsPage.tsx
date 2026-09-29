import React from 'react';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StructuredData } from '@/components/StructuredData';
import { constructMetadata, getBreadcrumbSchema } from '@/lib/seo';
import { FileText, ShieldAlert, CheckCircle, Scale } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'Terms of Service | KeralaDraws',
  description:
    'Terms of service and user agreements for accessing KeralaDraws lottery result feeds, ticket verification widgets, and gazette archives.',
  path: '/terms',
});

export default function TermsPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Terms of Service', url: '/terms' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
      <StructuredData data={getBreadcrumbSchema(breadcrumbs)} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Terms of Service' },
        ]}
      />

      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">
        <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
          Usage Agreement
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          Terms of Service
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E]">
          Please read these terms carefully before utilizing the KeralaDraws platform.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2E7E3] shadow-xs space-y-8 text-xs sm:text-sm text-[#17201D] leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold text-[#17201D] flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#0B3B32]" />
            <span>1. Informational Service Only</span>
          </h2>
          <p className="text-[#68736E]">
            KeralaDraws provides public lottery result archives and automated ticket matching algorithms purely for educational, informational, and personal convenience purposes. We do not sell lottery tickets, conduct lotteries, or handle prize claim settlements.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-extrabold text-[#17201D] flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#0B3B32]" />
            <span>2. Official Verification Mandatory</span>
          </h2>
          <p className="text-[#68736E]">
            While our systems utilize automated synchronization with the official Government of Kerala LOTIS portal, ticket holders must always verify physical tickets against the official <strong>Kerala Government Gazette</strong> before making financial or legal commitments. KeralaDraws is not liable for typographical discrepancies or third-party telecom delays.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-extrabold text-[#17201D] flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#0B3B32]" />
            <span>3. Responsible Participation</span>
          </h2>
          <p className="text-[#68736E]">
            Lottery participation in Kerala is regulated under the Lotteries (Regulation) Act, 1998. Purchase of lottery tickets is restricted to individuals aged 18 and above within authorized state jurisdictions.
          </p>
        </section>
      </div>
    </div>
  );
}
