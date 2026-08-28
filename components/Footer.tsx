import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, ExternalLink, Award, FileText, HelpCircle, CheckCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand & Official Attribution */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm shadow-emerald-950 flex items-center justify-center bg-emerald-950 shrink-0">
                <Image
                  src="/logo.svg"
                  alt="Kerala Lottery Results Official Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Kerala Lottery Results
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fast, automated, and accurate Kerala State Lottery draw results directly synchronized with the official Kerala Government LOTIS portal.
            </p>
            <div className="pt-2">
              <a
                href="https://www.lotteryagent.kerala.gov.in/result/public"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium bg-emerald-950/80 border border-emerald-800/80 px-3 py-1.5 rounded-lg transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Official LOTIS Source</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          </div>

          {/* Col 2: Weekly Lottery Results */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-2">
              Weekly Lotteries
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/lottery/bhagya-thara" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Bhagya Thara</span>
                  <span className="text-slate-500">Monday</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/sthree-sakthi" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Sthree Sakthi</span>
                  <span className="text-slate-500">Tuesday</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/dhanalekshmi" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Dhanalekshmi</span>
                  <span className="text-slate-500">Wednesday</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/fifty-fifty" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Fifty-Fifty</span>
                  <span className="text-slate-500">Wednesday</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/karunya-plus" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Karunya Plus</span>
                  <span className="text-slate-500">Thursday</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/suvarna-keralam" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Suvarna Keralam</span>
                  <span className="text-slate-500">Friday</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/nirmal" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Nirmal</span>
                  <span className="text-slate-500">Friday</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/karunya" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Karunya</span>
                  <span className="text-slate-500">Saturday</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/samrudhi" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Samrudhi / Akshaya</span>
                  <span className="text-slate-500">Sunday</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Bumper Lotteries & Tools */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-2">
              Bumper Lotteries
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/lottery/thiruvonam-bumper" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Thiruvonam Bumper</span>
                  <span className="text-emerald-400 font-semibold">₹25 Cr</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/xmas-new-year-bumper" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>X'mas New Year Bumper</span>
                  <span className="text-emerald-400 font-semibold">₹20 Cr</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/vishu-bumper" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Vishu Bumper</span>
                  <span className="text-emerald-400 font-semibold">₹12 Cr</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/pooja-bumper" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Pooja Bumper</span>
                  <span className="text-emerald-400 font-semibold">₹12 Cr</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/monsoon-bumper" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Monsoon Bumper</span>
                  <span className="text-emerald-400 font-semibold">₹10 Cr</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/summer-bumper" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Summer Bumper</span>
                  <span className="text-emerald-400 font-semibold">₹10 Cr</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Quick Navigation & Verification */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-2">
              Information & Help
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/kerala-lottery-result-today" className="hover:text-emerald-400 transition-colors">
                  Today's Kerala Lottery Result
                </Link>
              </li>
              <li>
                <Link href="/previous-results" className="hover:text-emerald-400 transition-colors">
                  Previous Results Archive
                </Link>
              </li>
              <li>
                <Link href="/lottery-calendar" className="hover:text-emerald-400 transition-colors">
                  2026 Kerala Lottery Calendar
                </Link>
              </li>
              <li>
                <Link href="/prize-structure" className="hover:text-emerald-400 transition-colors">
                  Official Prize Structures
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-emerald-400 transition-colors">
                  How to Claim Prize & Validity
                </Link>
              </li>
              <li>
                <a
                  href="http://www.statelottery.kerala.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1 text-slate-400"
                >
                  <span>Directorate of State Lotteries</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="border-t border-slate-800 pt-8 pb-4">
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 text-xs text-slate-400 space-y-2">
            <p className="font-semibold text-slate-200 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Official Source Transparency & Legal Disclaimer:</span>
            </p>
            <p className="leading-relaxed">
              <strong>Result Source:</strong> Directorate of Kerala State Lotteries, Government of Kerala. All draw results, winning numbers, and prize tier data published on this website are automatically synchronized from official LOTIS public notifications and PDF Gazette releases.
            </p>
            <p className="leading-relaxed text-slate-400">
              <strong>Disclaimer:</strong> This website is an independent informational service and is <strong>not affiliated with, authorized by, or operated by the Government of Kerala</strong>. Prize winners are strongly advised to verify winning ticket numbers with the official Kerala Government Gazette and surrender original winning tickets within 90 days of draw date.
            </p>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-slate-800/60 pt-6 mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Kerala Lottery Results. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-slate-400 transition-colors">
              About Us
            </Link>
            <Link href="/prize-structure" className="hover:text-slate-400 transition-colors">
              Prize Structure
            </Link>
            <Link href="/lottery-calendar" className="hover:text-slate-400 transition-colors">
              Draw Schedule
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
