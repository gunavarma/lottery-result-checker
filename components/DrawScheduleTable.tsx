import React from 'react';
import Link from 'next/link';
import { Calendar, Clock, Award, CheckCircle, ChevronRight } from 'lucide-react';
import { formatINR } from '@/lib/prisma';

export const WEEKLY_SCHEDULE = [
  { day: 'Monday', name: 'Bhagya Thara', code: 'BT', slug: 'bhagya-thara', time: '3:00 PM', price: '₹40', firstPrize: '₹1 Crore' },
  { day: 'Tuesday', name: 'Sthree Sakthi', code: 'SS', slug: 'sthree-sakthi', time: '3:00 PM', price: '₹50', firstPrize: '₹1 Crore' },
  { day: 'Wednesday', name: 'Fifty-Fifty / Dhanalekshmi', code: 'FF / DL', slug: 'fifty-fifty', time: '3:00 PM', price: '₹50', firstPrize: '₹1 Crore' },
  { day: 'Thursday', name: 'Karunya Plus', code: 'KN', slug: 'karunya-plus', time: '3:00 PM', price: '₹40', firstPrize: '₹1 Crore' },
  { day: 'Friday', name: 'Suvarna Keralam / Nirmal', code: 'SK / NR', slug: 'suvarna-keralam', time: '3:00 PM', price: '₹40', firstPrize: '₹1 Crore' },
  { day: 'Saturday', name: 'Karunya', code: 'KR', slug: 'karunya', time: '3:00 PM', price: '₹40', firstPrize: '₹1 Crore' },
  { day: 'Sunday', name: 'Samrudhi / Akshaya', code: 'SM / AK', slug: 'samrudhi', time: '3:00 PM', price: '₹40', firstPrize: '₹1 Crore' },
];

export const BUMPER_SCHEDULE = [
  { name: 'Thiruvonam Bumper', season: 'September (Annual)', code: 'BR-99', slug: 'thiruvonam-bumper', price: '₹500', firstPrize: '₹25 Crore' },
  { name: "X'mas New Year Bumper", season: 'January (New Year)', code: 'BR-98', slug: 'xmas-new-year-bumper', price: '₹400', firstPrize: '₹20 Crore' },
  { name: 'Vishu Bumper', season: 'May (Summer/Vishu)', code: 'BR-109', slug: 'vishu-bumper', price: '₹300', firstPrize: '₹12 Crore' },
  { name: 'Pooja Bumper', season: 'November (Festive)', code: 'BR-102', slug: 'pooja-bumper', price: '₹300', firstPrize: '₹12 Crore' },
  { name: 'Monsoon Bumper', season: 'July (Monsoon)', code: 'BR-104', slug: 'monsoon-bumper', price: '₹250', firstPrize: '₹10 Crore' },
  { name: 'Summer Bumper', season: 'March (Spring)', code: 'BR-100', slug: 'summer-bumper', price: '₹250', firstPrize: '₹10 Crore' },
];

export function DrawScheduleTable() {
  const todayDayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());

  return (
    <div className="space-y-8">
      {/* Weekly Schedule */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span>Official Kerala Lottery Weekly Draw Schedule</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Draws are conducted every day at 3:00 PM at Gorky Bhavan, Thiruvananthapuram.
            </p>
          </div>
          <span className="text-xs font-semibold bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full">
            Today is {todayDayName}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Day</th>
                <th className="py-3.5 px-4 sm:px-6">Lottery Scheme</th>
                <th className="py-3.5 px-4 sm:px-6">Code</th>
                <th className="py-3.5 px-4 sm:px-6">Draw Time</th>
                <th className="py-3.5 px-4 sm:px-6">Ticket Cost</th>
                <th className="py-3.5 px-4 sm:px-6">1st Prize</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">View Scheme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {WEEKLY_SCHEDULE.map((item) => {
                const isToday = item.day.toLowerCase() === todayDayName.toLowerCase();
                return (
                  <tr
                    key={item.day}
                    className={`transition-colors ${
                      isToday
                        ? 'bg-emerald-50/70 font-semibold'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        {isToday && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                        )}
                        <span className={isToday ? 'text-emerald-900 font-bold' : 'text-slate-900'}>
                          {item.day}
                        </span>
                        {isToday && (
                          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                            TODAY
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-medium text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-mono text-xs text-slate-600">
                      {item.code}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-slate-600">
                      {item.time}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-slate-700 font-semibold">
                      {item.price}
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-bold text-emerald-700">
                      {item.firstPrize}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <Link
                        href={`/lottery/${item.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bumper Lotteries Schedule */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-5 bg-gradient-to-r from-amber-900 to-amber-950 text-white">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Kerala State Bumper Lotteries Schedule</span>
          </h3>
          <p className="text-xs text-amber-200 mt-0.5">
            Special high-value bumper draws conducted by the Directorate of Kerala State Lotteries.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Bumper Scheme</th>
                <th className="py-3.5 px-4 sm:px-6">Season</th>
                <th className="py-3.5 px-4 sm:px-6">Series Code</th>
                <th className="py-3.5 px-4 sm:px-6">Ticket Price</th>
                <th className="py-3.5 px-4 sm:px-6">1st Prize</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Prize Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {BUMPER_SCHEDULE.map((item) => (
                <tr key={item.name} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 sm:px-6 font-bold text-slate-900">
                    {item.name}
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-slate-600">
                    {item.season}
                  </td>
                  <td className="py-4 px-4 sm:px-6 font-mono text-xs text-slate-600">
                    {item.code}
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-slate-700 font-semibold">
                    {item.price}
                  </td>
                  <td className="py-4 px-4 sm:px-6 font-extrabold text-amber-600">
                    {item.firstPrize}
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <Link
                      href={`/lottery/${item.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
