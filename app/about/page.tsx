import React from 'react';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ShieldCheck, HelpCircle, FileCheck, Phone, Mail, MapPin, ExternalLink, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us & Official Disclaimer | Kerala Lottery Results',
  description:
    'About Kerala Lottery Results information portal, official LOTIS synchronization methodology, prize claim instructions, tax guidelines, and government disclaimers.',
};

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
      <Breadcrumbs items={[{ label: 'About' }]} />

      <div className="border-b border-slate-200 pb-6 space-y-2">
        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
          Transparency & Information
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          About Kerala Lottery Results
        </h1>
        <p className="text-sm text-slate-600">
          An independent digital information platform dedicated to delivering fast, automated, and accurate Kerala State Lottery results.
        </p>
      </div>

      {/* Prominent Legal Disclaimer Banner */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 space-y-3 text-amber-950 shadow-xs">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
          <h2 className="text-lg font-black tracking-tight uppercase">
            Mandatory Legal Disclaimer
          </h2>
        </div>
        <p className="text-sm leading-relaxed">
          <strong>This website is an independent information service and is NOT affiliated with, sponsored by, or operated by the Government of Kerala or the Directorate of Kerala State Lotteries.</strong>
        </p>
        <p className="text-xs text-amber-900 leading-relaxed">
          All lottery names, draw numbers, dates, and prize numbers displayed on this platform are synchronized automatically from public official gazette releases and LOTIS portal publications solely for the convenience of participants. Users and prize winners are legally advised to verify their tickets with the published Kerala Government Gazette and official lottery offices.
        </p>
      </div>

      {/* Core Mission & Technology Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Official Data Source & Synchronization
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Our backend connects directly to the official <strong>Lottery Information and Management System (LOTIS)</strong> portal operated by the Government of Kerala (`lotteryagent.kerala.gov.in`). Whenever a draw is concluded and certified at Gorky Bhavan, Thiruvananthapuram, our automated server synchronizes and validates the official PDF result without manual modification.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            How Kerala Lottery Draws Are Conducted
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Established in 1967, Kerala State Lotteries is the first lottery program in India operated by a state government. Draws are held physically under strict observation by a panel of appointed judges, government officials, and the public using mechanical rotating drum draw machines.
          </p>
        </div>
      </div>

      {/* Push Notification Privacy Policy */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">
          Browser Push Notifications & Privacy Policy
        </h3>
        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            When you subscribe to receive Kerala lottery result alerts, our website uses <strong>Firebase Cloud Messaging (FCM)</strong> provided by Google.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-500">
            <li><strong>No Personal Identifiers:</strong> We do not collect your name, phone number, email address, physical location, or ticket numbers for push notifications.</li>
            <li><strong>FCM Device Token:</strong> A random, anonymous registration token generated by your browser is stored securely to dispatch notification payloads when official results are published.</li>
            <li><strong>Selective Subscriptions:</strong> You can select individual lotteries or all lotteries, and update your preferences at any time.</li>
            <li><strong>Unsubscribing:</strong> You can disable notifications instantly by clicking &quot;Disable Notifications&quot; on the <a href="/notification-settings" className="text-emerald-700 underline font-bold">Notification Settings</a> page or by revoking notification permission in your browser site settings.</li>
            <li><strong>Automated Cleanup:</strong> Unregistered or expired browser tokens are automatically deactivated and purged from our database.</li>
          </ul>
        </div>
      </div>

      {/* Official Government Contacts Reference */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-xl font-bold text-slate-900">
          Official Kerala State Lotteries Directorate Contact
        </h3>
        <p className="text-xs text-slate-500">
          For ticket claim processing, queries, or official dispute resolutions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <MapPin className="w-4 h-4" />
              <span>Office Address</span>
            </div>
            <p className="text-slate-700 font-medium pt-1">
              Directorate of Kerala State Lotteries, Vikas Bhavan, Thiruvananthapuram, Kerala - 695033
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <Phone className="w-4 h-4" />
              <span>Phone Numbers</span>
            </div>
            <p className="text-slate-700 font-medium pt-1">
              0471-2305230 / 0471-2305193
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <Mail className="w-4 h-4" />
              <span>Official Email</span>
            </div>
            <p className="text-slate-700 font-medium pt-1">
              cru.dir.lotteries@kerala.gov.in
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
