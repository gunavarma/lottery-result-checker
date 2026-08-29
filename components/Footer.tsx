import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, ExternalLink, Award, FileText, HelpCircle, CheckCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#10201D] text-[#E2E7E3] pt-14 pb-10 border-t border-[#0B3B32]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand & Independent Status */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 flex items-center justify-center p-1 shrink-0">
                <Image
                  src="/logo.svg"
                  alt="KeralaDraws Logo"
                  width={56}
                  height={56}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-base font-extrabold text-white tracking-tight block">
                  KeralaDraws
                </span>
                <span className="text-[10px] text-[#C8A45D] font-bold tracking-wider uppercase block font-tabular">
                  Results, Checker & Alerts
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Independent digital information platform delivering fast, verified Kerala State Lottery results synchronized directly with the official LOTIS government portal.
            </p>
            <div className="pt-2">
              <a
                href="https://www.lotteryagent.kerala.gov.in"
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

          {/* Col 2: Weekly Lottery Hubs */}
          <div>
            <h3 className="text-xs font-bold text-[#C8A45D] uppercase tracking-wider mb-4 border-l-2 border-[#C8A45D] pl-2 font-tabular">
              Weekly Schemes
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/lotteries/bhagya-thara" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Bhagya Thara</span>
                  <span className="text-slate-400">Monday</span>
                </Link>
              </li>
              <li>
                <Link href="/lotteries/sthree-sakthi" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Sthree Sakthi</span>
                  <span className="text-slate-400">Tuesday</span>
                </Link>
              </li>
              <li>
                <Link href="/lotteries/fifty-fifty" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Fifty-Fifty</span>
                  <span className="text-slate-400">Wednesday</span>
                </Link>
              </li>
              <li>
                <Link href="/lotteries/karunya-plus" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Karunya Plus</span>
                  <span className="text-slate-400">Thursday</span>
                </Link>
              </li>
              <li>
                <Link href="/lotteries/suvarna-keralam" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Suvarna Keralam</span>
                  <span className="text-slate-400">Friday</span>
                </Link>
              </li>
              <li>
                <Link href="/lotteries/karunya" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Karunya</span>
                  <span className="text-slate-400">Saturday</span>
                </Link>
              </li>
              <li>
                <Link href="/lotteries/samrudhi" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
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
                <Link href="/lotteries/thiruvonam-bumper" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Thiruvonam Bumper</span>
                  <span className="text-[#C8A45D] font-bold font-tabular">₹25 Cr</span>
                </Link>
              </li>
              <li>
                <Link href="/lotteries/xmas-new-year-bumper" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Xmas New Year Bumper</span>
                  <span className="text-[#C8A45D] font-bold font-tabular">₹20 Cr</span>
                </Link>
              </li>
              <li>
                <Link href="/lotteries/vishu-bumper" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Vishu Bumper</span>
                  <span className="text-[#C8A45D] font-bold font-tabular">₹12 Cr</span>
                </Link>
              </li>
              <li>
                <Link href="/lotteries/pooja-bumper" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Pooja Bumper</span>
                  <span className="text-[#C8A45D] font-bold font-tabular">₹12 Cr</span>
                </Link>
              </li>
              <li>
                <Link href="/lotteries/monsoon-bumper" className="text-slate-300 hover:text-white transition-colors flex items-center justify-between">
                  <span>Monsoon Bumper</span>
                  <span className="text-[#C8A45D] font-bold font-tabular">₹10 Cr</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Navigation */}
          <div>
            <h3 className="text-xs font-bold text-[#C8A45D] uppercase tracking-wider mb-4 border-l-2 border-[#C8A45D] pl-2 font-tabular">
              Tools & Trust
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/kerala-lottery-result-today" className="text-slate-300 hover:text-white transition-colors">
                  Today's Result
                </Link>
              </li>
              <li>
                <Link href="/results/archive" className="text-slate-300 hover:text-white transition-colors">
                  Results Archive
                </Link>
              </li>
              <li>
                <Link href="/check-ticket" className="text-slate-300 hover:text-white transition-colors">
                  Ticket Checker
                </Link>
              </li>
              <li>
                <Link href="/lottery-calendar" className="text-slate-300 hover:text-white transition-colors">
                  Draw Timetable 2026
                </Link>
              </li>
              <li>
                <Link href="/prize-structure" className="text-slate-300 hover:text-white transition-colors">
                  Prize Breakdown
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-slate-300 hover:text-white transition-colors">
                  Gazette News
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-slate-300 hover:text-white transition-colors">
                  Disclaimer & Claims
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Official Statutory Disclaimer Box */}
        <div className="border-t border-white/10 pt-8 pb-4">
          <div className="bg-black/30 rounded-2xl p-5 border border-white/5 text-xs text-slate-300 space-y-2">
            <p className="font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#C8A45D]" />
              <span>Independent Platform Disclaimer:</span>
            </p>
            <p className="leading-relaxed text-slate-300">
              <strong>KeralaDraws</strong> is an independent digital information platform and is <strong>NOT</strong> affiliated with, endorsed by, authorized by, or operated by the Government of Kerala or the Directorate of Kerala State Lotteries.
            </p>
            <p className="leading-relaxed text-slate-400">
              All draw records, winning numbers, and prize tier statistics published on this website are synchronized automatically from public official LOTIS notices and Kerala Government Gazettes. Ticket holders and prize winners are advised to verify winning tickets with the official published Gazette and claim prizes within 90 days.
            </p>
          </div>
        </div>

        {/* Bottom Legal Links & Copyright */}
        <div className="border-t border-white/10 pt-6 mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} KeralaDraws (KeralaDraws.com). All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link href="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/disclaimer" className="hover:text-white transition-colors">
              Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
