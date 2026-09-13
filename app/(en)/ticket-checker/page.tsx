import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StructuredData } from '@/components/StructuredData';
import { TicketChecker } from '@/components/TicketChecker';
import { constructMetadata, getBreadcrumbSchema, getFAQSchema, SITE_URL } from '@/lib/seo';
import {
  Ticket,
  ShieldCheck,
  HelpCircle,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Building,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: 'Kerala Lottery Ticket Checker – Instant Winning Number Verification | KeralaDraws',
    description:
      'Check your Kerala State Lottery ticket numbers against official LOTIS certified gazette results. Learn how 1st to 9th prize matching works, claim guidelines, and prize verification rules.',
    path: '/ticket-checker',
    keywords: [
      'Kerala lottery ticket check',
      'Kerala lottery ticket number search',
      'Kerala lottery scanner',
      'check my Kerala lottery ticket',
      'Kerala lottery winning verification',
      'KeralaDraws ticket checker',
    ],
  });
}

export default async function TicketCheckerLandingPage() {
  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Ticket Checker', url: `${SITE_URL}/ticket-checker` },
  ];

  const faqs = [
    {
      question: 'How do I enter my ticket number into the checker?',
      answer:
        'You can enter either your full ticket code including the 2-letter series (e.g. "KB 192899" or "KB192899") to check for the 1st prize and consolation prizes, or enter the last 4 digits (e.g. "0329") to check for the 4th through 9th prize tiers.',
    },
    {
      question: 'What is the deadline to claim prize money for Kerala State Lotteries?',
      answer:
        'All prizes must be claimed within 30 days from the date of the draw publication. Tickets submitted after 30 days are subject to rejection by the Directorate of Kerala State Lotteries.',
    },
    {
      question: 'Where can I claim my winning prize money?',
      answer:
        'Prizes up to ₹1,00,000 can be claimed through any authorized district lottery office. Prizes exceeding ₹1,00,000 must be claimed directly from the Directorate of Kerala State Lotteries in Vikas Bhavan, Thiruvananthapuram, along with valid government photo identification (Aadhaar/PAN/Voter ID) and passport-sized photographs.',
    },
    {
      question: 'Is tax deducted from Kerala lottery winnings?',
      answer:
        'Yes. For any prize amount exceeding ₹10,000, Income Tax (TDS) of 30% is deducted at source under Section 194B of the Income Tax Act before disbursement to the prize winner.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
      <StructuredData data={[getBreadcrumbSchema(breadcrumbs), getFAQSchema(faqs)]} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Ticket Checker' },
        ]}
      />

      {/* Page Header */}
      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider font-tabular">
            Instant Verification Tool
          </span>
          <span className="font-bold text-xs bg-[#0B3B32] text-white px-3 py-0.5 rounded-md">
            LOTIS CERTIFIED
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          Kerala Lottery Ticket Checker – Instant Number Verification
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E] max-w-3xl leading-relaxed">
          Verify your ticket number against verified Kerala State Lottery draw records. Compare your 6-digit ticket code or ending 4 digits against official LOTIS gazette results.
        </p>
      </div>

      {/* Interactive Checker Component (Client-Side Seek Engine) */}
      <div>
        <TicketChecker />
      </div>

      {/* Educational Guide: How Ticket Matching Works */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E2E7E3] shadow-xs space-y-6">
        <div className="flex items-center gap-2 text-[#17201D]">
          <Award className="w-5 h-5 text-[#0B3B32]" />
          <h2 className="text-xl sm:text-2xl font-extrabold">
            How Kerala Lottery Winning Numbers Are Evaluated
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm">
          <div className="bg-[#F7F7F4] p-5 rounded-2xl border border-[#E2E7E3] space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#0B3B32] text-white flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h3 className="font-bold text-[#17201D] text-sm sm:text-base">
              1st & Consolation Prizes
            </h3>
            <p className="text-[#68736E] leading-relaxed">
              The 1st prize matches both the exact <strong>2-letter series</strong> and the <strong>6-digit number</strong> (e.g. <code className="bg-white px-1.5 py-0.5 rounded border border-[#E2E7E3] font-mono font-bold">KB 192899</code>). Consolation prizes match the same 6 digits across the remaining series codes (e.g. KA, KC, KD).
            </p>
          </div>

          <div className="bg-[#F7F7F4] p-5 rounded-2xl border border-[#E2E7E3] space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#0B3B32] text-white flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h3 className="font-bold text-[#17201D] text-sm sm:text-base">
              2nd & 3rd Prizes
            </h3>
            <p className="text-[#68736E] leading-relaxed">
              2nd and 3rd prizes typically specify the full 6-digit number and may or may not require series matching depending on whether the draw is a standard weekly scheme or a bumper lottery.
            </p>
          </div>

          <div className="bg-[#F7F7F4] p-5 rounded-2xl border border-[#E2E7E3] space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#0B3B32] text-white flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h3 className="font-bold text-[#17201D] text-sm sm:text-base">
              4th through 9th Prizes
            </h3>
            <p className="text-[#68736E] leading-relaxed">
              Lower-tier prizes (4th, 5th, 6th, 7th, 8th, 9th) are decided by the <strong>last 4 digits</strong> only (e.g. <code className="bg-white px-1.5 py-0.5 rounded border border-[#E2E7E3] font-mono font-bold">0329</code>). Series letters do not matter for these prize tiers.
            </p>
          </div>
        </div>
      </div>

      {/* Prize Claim Information & Procedures */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-6">
        <div className="flex items-center gap-2 text-[#17201D]">
          <Building className="w-5 h-5 text-[#0B3B32]" />
          <h2 className="text-lg sm:text-xl font-extrabold">
            Official Kerala Lottery Prize Claim Requirements
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] space-y-1">
            <span className="font-bold text-[#17201D] block">30-Day Claim Period</span>
            <span className="text-[#68736E] block">
              Prizes must be presented within 30 days from the draw publication date.
            </span>
          </div>

          <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] space-y-1">
            <span className="font-bold text-[#17201D] block">Original Ticket & Signature</span>
            <span className="text-[#68736E] block">
              The physical ticket must be intact with signature and address on the reverse side.
            </span>
          </div>

          <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] space-y-1">
            <span className="font-bold text-[#17201D] block">Valid Photo Identification</span>
            <span className="text-[#68736E] block">
              Attested copies of Aadhaar Card, PAN Card, or Voter ID are mandatory.
            </span>
          </div>

          <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] space-y-1">
            <span className="font-bold text-[#17201D] block">TDS Deduction (30%)</span>
            <span className="text-[#68736E] block">
              Under Section 194B, 30% tax is deducted on winnings over ₹10,000.
            </span>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] space-y-6">
        <div className="flex items-center gap-2 text-[#17201D]">
          <HelpCircle className="w-5 h-5 text-[#0B3B32]" />
          <h2 className="text-lg sm:text-xl font-extrabold">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-[#F7F7F4] p-5 rounded-2xl border border-[#E2E7E3] space-y-1.5">
              <h3 className="font-bold text-[#17201D] text-sm">{faq.question}</h3>
              <p className="text-[#68736E] leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trust & Source Notice */}
      <div className="bg-[#F7F7F4] rounded-3xl p-6 border border-[#E2E7E3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#68736E]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#16845B] shrink-0" />
          <span>
            KeralaDraws is an independent informational publisher. Final verification and prize payouts are administered exclusively by the Directorate of Kerala State Lotteries.
          </span>
        </div>
        <Link
          href="/kerala-lottery-results"
          className="font-bold text-[#0B3B32] hover:underline shrink-0"
        >
          Browse All Historical Results →
        </Link>
      </div>
    </div>
  );
}
