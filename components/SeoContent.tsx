'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, FileCheck, ShieldAlert, Award, Clock } from 'lucide-react';

const FAQS = [
  {
    question: 'When are Kerala lottery results published today?',
    answer:
      'Official Kerala State Lottery draws commence daily at 3:00 PM IST at Gorky Bhavan, near Bakery Junction, Thiruvananthapuram. The official verified results document (LOTIS PDF) is published by the Directorate of Kerala State Lotteries by approximately 4:00 PM to 4:30 PM IST.',
  },
  {
    question: 'How are winning numbers structured in Kerala lotteries?',
    answer:
      'Top prize tiers (1st, 2nd, 3rd Prize) specify a 2-letter series code followed by a 6-digit number (e.g. PS 320327). Consolation prizes are awarded to tickets possessing the matching 6-digit number in all other series. Lower prize tiers (4th through 9th Prize) are awarded to all tickets whose last 4 digits match the officially declared ending numbers.',
  },
  {
    question: 'How do I claim my Kerala Lottery prize money?',
    answer:
      'Prize amounts up to ₹1,00,000 can be claimed through recognized lottery agents or District Lottery Offices. For prizes above ₹1,00,000, winners must surrender original winning tickets with government-issued photo ID (Aadhaar, PAN Card, Passport), 2 passport photos, and bank account details directly to the Directorate of State Lotteries or a Nationalized/Scheduled Bank within 90 days from the draw date.',
  },
  {
    question: 'What taxes and deductions apply to Kerala lottery winnings?',
    answer:
      'Under Indian Income Tax regulations (Section 194B), prize winnings exceeding ₹10,000 are subject to 30% TDS (Tax Deducted at Source) plus applicable educational cess and surcharges. In addition, registered lottery agents receive the statutory agency commission from the Directorate.',
  },
  {
    question: 'Is this an official government website?',
    answer:
      'No. This website is an independent digital information service. All data is automatically synchronized from public notifications on the official LOTIS portal (lotteryagent.kerala.gov.in) operated by the Directorate of Kerala State Lotteries, Government of Kerala. Winners must always cross-verify results in the official Kerala Government Gazette.',
  },
];

export function SeoContent() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };

  return (
    <div className="space-y-10 text-slate-800">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Guide Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            How Kerala Lottery Results Are Published
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            The Directorate of Kerala State Lotteries conducts manual, transparent draws using a dedicated mechanical lottery draw machine before a panel of independent judges at Gorky Bhavan, Thiruvananthapuram. As each ball is drawn, numbers are validated and recorded onto the official LOTIS (Lottery Information and Management System) portal before formal publication in the official Kerala Gazette.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Kerala Lottery Prize Claim Guidelines
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Winning tickets must be surrendered in pristine condition within 90 days from the draw date. Winners should sign the back of the ticket with their full name and address. Prizes exceeding ₹1 Lakh require verification by the Directorate of Kerala State Lotteries along with KYC documentation (PAN card, Aadhaar card, cancelled cheque).
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" /> Frequently Asked Questions
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Kerala Lottery Results & Verification FAQs
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="py-4">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left gap-4 group"
                >
                  <span className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed pr-6 animate-fadeIn">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
