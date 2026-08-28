import React from 'react';
import Link from 'next/link';
import { Calendar, Clock, Award, CheckCircle, ChevronRight } from 'lucide-react';

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
      <div className="bg-white rounded-3xl border border-[#E2E7E3] overflow-hidden shadow-sm">
        <div className="px-6 py-5 bg-[#10201D] text-white flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-[#C8A45D] uppercase tracking-wider block font-tabular">
              Timetable
            </span>
            <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#C8A45D]" />
              <span>Official Kerala Lottery Weekly Draw Schedule</span>
            </h3>
          </div>
          <span className="text-xs font-bold bg-white/10 text-[#C8A45D] border border-white/15 px-3 py-1 rounded-full font-tabular">
            Today is {todayDayName}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F7F4] text-[#68736E] text-[11px] uppercase font-bold border-b border-[#E2E7E3]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Day</th>
                <th className="py-3.5 px-4 sm:px-6">Lottery Scheme</th>
                <th className="py-3.5 px-4 sm:px-6">Code</th>
                <th className="py-3.5 px-4 sm:px-6">Draw Time</th>
                <th className="py-3.5 px-4 sm:px-6">Ticket Cost</th>
                <th className="py-3.5 px-4 sm:px-6">1st Prize</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E7E3]">
              {WEEKLY_SCHEDULE.map((item) => {
                const isToday = item.day.toLowerCase() === todayDayName.toLowerCase();
                return (
                  <tr
                    key={item.day}
                    className={`transition-colors ${
                      isToday
                        ? 'bg-[#F1F4F2] font-semibold'
                        : 'hover:bg-[#F7F7F4]'
                    }`}
                  >
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        {isToday && (
                          <span className="w-2 h-2 rounded-full bg-[#16845B]" />
                        )}
                        <span className={isToday ? 'text-[#0B3B32] font-extrabold' : 'text-[#17201D]'}>
                          {item.day}
                        </span>
                        {isToday && (
                          <span className="text-[10px] bg-[#0B3B32] text-white px-2 py-0.5 rounded font-bold font-tabular">
                            TODAY
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-bold text-[#17201D]">
                      {item.name}
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-mono text-xs text-[#68736E]">
                      {item.code}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-[#68736E] font-tabular">
                      {item.time}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-[#17201D] font-bold font-tabular">
                      {item.price}
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-extrabold text-[#16845B] font-tabular">
                      {item.firstPrize}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <Link
                        href={`/lottery/${item.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0B3B32] hover:text-[#16845B]"
                      >
                        <span>View</span>
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
      <div className="bg-white rounded-3xl border border-[#E2E7E3] overflow-hidden shadow-sm">
        <div className="px-6 py-5 bg-[#10201D] text-white">
          <span className="text-[10px] font-bold text-[#C8A45D] uppercase tracking-wider block font-tabular">
            Jackpot Series
          </span>
          <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
            <Award className="w-4 h-4 text-[#C8A45D]" />
            <span>Kerala State Bumper Lotteries Schedule</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F7F4] text-[#68736E] text-[11px] uppercase font-bold border-b border-[#E2E7E3]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Bumper Scheme</th>
                <th className="py-3.5 px-4 sm:px-6">Season</th>
                <th className="py-3.5 px-4 sm:px-6">Series Code</th>
                <th className="py-3.5 px-4 sm:px-6">Ticket Price</th>
                <th className="py-3.5 px-4 sm:px-6">1st Prize</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Prize Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E7E3]">
              {BUMPER_SCHEDULE.map((item) => (
                <tr key={item.name} className="hover:bg-[#F7F7F4] transition-colors">
                  <td className="py-4 px-4 sm:px-6 font-bold text-[#17201D]">
                    {item.name}
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-[#68736E]">
                    {item.season}
                  </td>
                  <td className="py-4 px-4 sm:px-6 font-mono text-xs text-[#68736E]">
                    {item.code}
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-[#17201D] font-bold font-tabular">
                    {item.price}
                  </td>
                  <td className="py-4 px-4 sm:px-6 font-extrabold text-[#C8A45D] font-tabular">
                    {item.firstPrize}
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <Link
                      href={`/lottery/${item.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0B3B32] hover:text-[#16845B]"
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
