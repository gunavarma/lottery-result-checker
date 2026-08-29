import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, ExternalLink, Award, FileText, HelpCircle, CheckCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#10201D] text-[#E2E7E3] pt-14 pb-10 border-t border-[#0B3B32]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand & Official Attribution */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16   flex items-center justify-center shrink-0 ">
                <Image
                  src="/logo.svg"
                  alt="Kerala Lottery Logo"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-base font-extrabold text-white tracking-tight block">
                  Kerala Lottery Results
                </span>
                <span className="text-[10px] text-[#C8A45D] font-bold tracking-wider uppercase block font-tabular">
                  Data Clarity Platform
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Fast, verified, and transparent Kerala State Lottery draw results directly synchronized with the official Kerala Government LOTIS portal.
            </p>
            <div className="pt-2">
              <a
                href="https://www.lotteryagent.kerala.gov.in/result/public"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#C8A45D] hover:text-white font-semibold bg-white/5 border border-[#C8A45D]/30 px-3 py-1.5 rounded-xl transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Official LOTIS Portal</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          </div>

          {/* Col 2: Weekly Lottery Results */}
          <div>
            <h3 className="text-xs font-bold text-[#C8A45D] uppercase tracking-wider mb-4 border-l-2 border-[#C8A45D] pl-2 font-tabular">
              Weekly Lotteries
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/lottery/bhagya-thara" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Bhagya Thara</span>
                  <span className="text-slate-400">Monday</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/sthree-sakthi" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Sthree Sakthi</span>
                  <span className="text-slate-400">Tuesday</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/fifty-fifty" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Fifty-Fifty</span>
                  <span className="text-slate-400">Wednesday</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/karunya-plus" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Karunya Plus</span>
                  <span className="text-slate-400">Thursday</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/suvarna-keralam" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Suvarna Keralam</span>
                  <span className="text-slate-400">Friday</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/karunya" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Karunya</span>
                  <span className="text-slate-400">Saturday</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/samrudhi" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Samrudhi / Akshaya</span>
                  <span className="text-slate-400">Sunday</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Bumper Lotteries */}
          <div>
            <h3 className="text-xs font-bold text-[#C8A45D] uppercase tracking-wider mb-4 border-l-2 border-[#C8A45D] pl-2 font-tabular">
              Seasonal Bumpers
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/lottery/thiruvonam-bumper" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Thiruvonam Bumper</span>
                  <span className="text-[#C8A45D] font-bold">₹25 Cr</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/xmas-new-year-bumper" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Xmas New Year Bumper</span>
                  <span className="text-[#C8A45D] font-bold">₹20 Cr</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/vishu-bumper" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Vishu Bumper</span>
                  <span className="text-[#C8A45D] font-bold">₹12 Cr</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/pooja-bumper" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Pooja Bumper</span>
                  <span className="text-[#C8A45D] font-bold">₹12 Cr</span>
                </Link>
              </li>
              <li>
                <Link href="/lottery/monsoon-bumper" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Monsoon Bumper</span>
                  <span className="text-[#C8A45D] font-bold">₹10 Cr</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Help & Dispatches */}
          <div>
            <h3 className="text-xs font-bold text-[#C8A45D] uppercase tracking-wider mb-4 border-l-2 border-[#C8A45D] pl-2 font-tabular">
              Guides & Compliance
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/kerala-lottery-result-today" className="text-slate-300 hover:text-white transition-colors">
                  Today's Kerala Lottery Result
                </Link>
              </li>
              <li>
                <Link href="/check-ticket" className="text-slate-300 hover:text-white transition-colors">
                  Verify Ticket Number
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-slate-300 hover:text-white transition-colors">
                  News & Official Reports
                </Link>
              </li>
              <li>
                <Link href="/calendar" className="text-slate-300 hover:text-white transition-colors">
                  Draw Schedule Calendar
                </Link>
              </li>
              <li>
                <Link href="/prize-structure" className="text-slate-300 hover:text-white transition-colors">
                  Official Prize Structures
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-300 hover:text-white transition-colors">
                  How to Claim Prize & Validity
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Official Transparency Disclaimer */}
        <div className="border-t border-white/10 pt-8 pb-4">
          <div className="bg-black/30 rounded-2xl p-5 border border-white/5 text-xs text-slate-300 space-y-2">
            <p className="font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#C8A45D]" />
              <span>Official Source Transparency & Legal Disclaimer:</span>
            </p>
            <p className="leading-relaxed">
              <strong>Source:</strong> Results are updated from published official lottery information by the Directorate of Kerala State Lotteries, Government of Kerala. All draw results, winning numbers, and prize tier data published on this website are automatically synchronized from official LOTIS public notifications and PDF Gazette releases.
            </p>
            <p className="leading-relaxed text-slate-400">
              <strong>Disclaimer:</strong> This website is an independent informational service and is not affiliated with, authorized by, or operated by the Government of Kerala. Prize winners are advised to verify winning ticket numbers with the official Kerala Government Gazette and surrender original winning tickets within 90 days of draw date.
            </p>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-white/10 pt-6 mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} Kerala Lottery Results Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-white transition-colors">
              About Platform
            </Link>
            <Link href="/prize-structure" className="hover:text-white transition-colors">
              Prize Structure
            </Link>
            <Link href="/calendar" className="hover:text-white transition-colors">
              Draw Calendar
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
