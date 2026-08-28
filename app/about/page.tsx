import React from 'react';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ShieldCheck, HelpCircle, FileCheck, Phone, Mail, MapPin, ExternalLink, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Platform & Official Disclaimer | Kerala Lottery Results',
  description:
    'About Kerala Lottery Results information portal, official LOTIS synchronization methodology, prize claim instructions, tax guidelines, and government disclaimers.',
};

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'About & Disclaimer' },
        ]}
      />

      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">
        <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
          Transparency & Verification
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          About Kerala Lottery Results Platform
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E]">
          An independent digital information platform dedicated to delivering fast, automated, and accurate Kerala State Lottery results.
        </p>
      </div>

      {/* Prominent Legal Disclaimer Banner */}
      <div className="bg-white border-2 border-[#C8A45D] rounded-3xl p-6 sm:p-8 space-y-3 text-[#17201D] shadow-xs">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-[#A66A00] shrink-0" />
          <h2 className="text-sm font-extrabold tracking-wider uppercase font-tabular text-[#A66A00]">
            Mandatory Statutory Disclaimer
          </h2>
        </div>
        <p className="text-sm leading-relaxed font-bold">
          This website is an independent information service and is NOT affiliated with, sponsored by, authorized by, or operated by the Government of Kerala or the Directorate of Kerala State Lotteries.
        </p>
        <p className="text-xs text-[#68736E] leading-relaxed">
          All lottery names, draw numbers, dates, and prize numbers displayed on this platform are synchronized automatically from public official gazette releases and LOTIS portal publications solely for the convenience of participants. Users and prize winners are legally advised to verify their tickets with the published Kerala Government Gazette and official lottery offices.
        </p>
      </div>

      {/* Core Mission & Technology Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-xl bg-[#F1F4F2] text-[#0B3B32] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-extrabold text-[#17201D]">
            Official Data Source & Synchronization
          </h3>
          <p className="text-xs sm:text-sm text-[#68736E] leading-relaxed">
            Our backend connects directly to the official <strong>Lottery Information and Management System (LOTIS)</strong> portal operated by the Government of Kerala (`lotteryagent.kerala.gov.in`). Whenever a draw is concluded and certified at Gorky Bhavan, Thiruvananthapuram, our automated server synchronizes and validates the official PDF result without manual modification.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-xl bg-[#F1F4F2] text-[#0B3B32] flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-extrabold text-[#17201D]">
            How Kerala Lottery Draws Are Conducted
          </h3>
          <p className="text-xs sm:text-sm text-[#68736E] leading-relaxed">
            Established in 1967, Kerala State Lotteries is the first lottery program in India operated by a state government. Draws are held physically under strict observation by a panel of appointed judges, government officials, and the public using mechanical rotating drum draw machines.
          </p>
        </div>
      </div>

      {/* Push Notification Privacy Policy */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-sm space-y-4">
        <div className="w-10 h-10 rounded-xl bg-[#F1F4F2] text-[#0B3B32] flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-extrabold text-[#17201D]">
          Browser Push Notifications & Privacy Policy
        </h3>
        <div className="text-xs text-[#68736E] space-y-2 leading-relaxed">
          <p>
            When you subscribe to receive Kerala lottery result alerts, our website uses <strong>Firebase Cloud Messaging (FCM)</strong> provided by Google.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#68736E]">
            <li><strong>No Personal Identifiers:</strong> We do not collect your name, phone number, email address, physical location, or ticket numbers for push notifications.</li>
            <li><strong>FCM Device Token:</strong> A random, anonymous registration token generated by your browser is stored securely to dispatch notification payloads when official results are published.</li>
            <li><strong>Selective Subscriptions:</strong> You can select individual lotteries or all lotteries, and update your preferences at any time.</li>
            <li><strong>Unsubscribing:</strong> You can disable notifications instantly by clicking &quot;Disable Alerts&quot; on the <a href="/notification-settings" className="text-[#0B3B32] underline font-bold">Notification Settings</a> page.</li>
            <li><strong>Automated Cleanup:</strong> Unregistered or expired browser tokens are automatically deactivated and purged from our database.</li>
          </ul>
        </div>
      </div>

      {/* Official Government Contacts Reference */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-sm space-y-6">
        <h3 className="text-lg font-extrabold text-[#17201D]">
          Official Kerala State Lotteries Directorate Contact
        </h3>
        <p className="text-xs text-[#68736E]">
          For ticket claim processing, queries, or official dispute resolutions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] space-y-1">
            <div className="flex items-center gap-2 text-[#0B3B32] font-bold">
              <MapPin className="w-4 h-4 text-[#C8A45D]" />
              <span>Office Address</span>
            </div>
            <p className="text-[#17201D] font-medium pt-1">
              Directorate of Kerala State Lotteries, Vikas Bhavan, Thiruvananthapuram, Kerala - 695033
            </p>
          </div>

          <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] space-y-1">
            <div className="flex items-center gap-2 text-[#0B3B32] font-bold">
              <Phone className="w-4 h-4 text-[#C8A45D]" />
              <span>Phone Numbers</span>
            </div>
            <p className="text-[#17201D] font-mono font-medium pt-1">
              0471-2305230 / 0471-2305193
            </p>
          </div>

          <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#E2E7E3] space-y-1">
            <div className="flex items-center gap-2 text-[#0B3B32] font-bold">
              <Mail className="w-4 h-4 text-[#C8A45D]" />
              <span>Official Email</span>
            </div>
            <p className="text-[#17201D] font-mono font-medium pt-1">
              cru.dir.lotteries@kerala.gov.in
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
