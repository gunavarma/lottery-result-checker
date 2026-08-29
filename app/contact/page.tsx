import React from 'react';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StructuredData } from '@/components/StructuredData';
import { constructMetadata, getBreadcrumbSchema } from '@/lib/seo';
import { Mail, MessageSquare, ShieldCheck, MapPin, Phone, HelpCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'Contact KeralaDraws | Support & Inquiries',
  description:
    'Contact the KeralaDraws editorial and technical support team for website inquiries, data verification queries, or feedback regarding Kerala lottery results.',
  path: '/contact',
});

export default function ContactPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Contact', url: '/contact' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
      <StructuredData data={getBreadcrumbSchema(breadcrumbs)} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Contact Us' },
        ]}
      />

      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">
        <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
          Help & Inquiries
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          Contact KeralaDraws
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E] max-w-3xl">
          Get in touch with the KeralaDraws technical and editorial team for questions regarding result synchronization, push notification alerts, or site feedback.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KeralaDraws Contact Info */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-[#17201D]">
              KeralaDraws Platform Support
            </h2>
            <p className="text-xs text-[#68736E] leading-relaxed">
              For technical queries, notification assistance, or error corrections on the KeralaDraws website:
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] flex items-start gap-3">
              <Mail className="w-5 h-5 text-[#0B3B32] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#17201D] block">Editorial & Corrections Email</span>
                <span className="text-[#68736E] font-mono">support@keraladraws.com</span>
              </div>
            </div>

            <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-[#0B3B32] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#17201D] block">Response Time</span>
                <span className="text-[#68736E]">Inquiries are typically reviewed within 24–48 business hours.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Official Government Directorate Reference */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-xs space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-[#17201D]">
              Official Government Department
            </h2>
            <p className="text-xs text-[#68736E] leading-relaxed">
              For official ticket verification, prize claims above ₹1 Lakh, or statutory disputes, please contact the Directorate of Kerala State Lotteries directly:
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#C8A45D] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#17201D] block">Headquarters Address</span>
                <span className="text-[#68736E]">Directorate of Kerala State Lotteries, Vikas Bhavan, Thiruvananthapuram - 695033</span>
              </div>
            </div>

            <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] flex items-start gap-3">
              <Phone className="w-5 h-5 text-[#C8A45D] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#17201D] block">Official Phone Numbers</span>
                <span className="text-[#68736E] font-mono">0471-2305230 / 0471-2305193</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
