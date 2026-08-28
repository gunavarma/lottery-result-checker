import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma, serializeData, formatINR } from '@/lib/prisma';
import { DrawScheduleTable, WEEKLY_SCHEDULE, BUMPER_SCHEDULE } from '@/components/DrawScheduleTable';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Calendar, Clock, Award, ShieldCheck, ChevronRight } from 'lucide-react';
import { format, addDays } from 'date-fns';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Kerala Lottery Calendar 2026 | Weekly & Bumper Draw Timetable',
  description:
    'Complete Kerala State Lottery calendar and draw schedule for 2026. Weekly draw days (Monday to Sunday), 3:00 PM draw times, ticket prices, and annual bumper dates.',
};

export default async function LotteryCalendarPage() {
  const today = new Date();
  const todayDayName = format(today, 'EEEE');

  // Generate upcoming 14 days schedule
  const upcomingDraws = [];
  for (let i = 0; i < 14; i++) {
    const d = addDays(today, i);
    const dayName = format(d, 'EEEE');
    const scheduleMatch = WEEKLY_SCHEDULE.find((s) => s.day === dayName);
    upcomingDraws.push({
      date: d,
      dateFormatted: format(d, 'dd MMM yyyy (EEE)'),
      isToday: i === 0,
      scheme: scheduleMatch || {
        day: dayName,
        name: 'Kerala Lottery',
        code: 'KL',
        slug: 'kerala-lottery',
        time: '3:00 PM',
        price: '₹40',
        firstPrize: '₹1 Crore',
      },
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <Breadcrumbs items={[{ label: 'Lottery Calendar' }]} />

      <div className="border-b border-slate-200 pb-6 space-y-2">
        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
          Official Draw Timetable
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Kerala State Lottery Calendar 2026
        </h1>
        <p className="text-sm text-slate-600">
          Official weekly draw calendar and seasonal bumper dates conducted by the Directorate of Kerala State Lotteries at Gorky Bhavan, Thiruvananthapuram.
        </p>
      </div>

      {/* Upcoming 14-Day Calendar Schedule */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span>Upcoming Kerala Lottery Draws (Next 14 Days)</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Draws take place daily at 3:00 PM IST. Official LOTIS gazette published at ~4:30 PM.
            </p>
          </div>
          <span className="text-xs bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-3.5 py-1.5 rounded-full font-semibold">
            Today is {format(today, 'dd MMMM yyyy')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Date & Day</th>
                <th className="py-3.5 px-4 sm:px-6">Lottery Scheme</th>
                <th className="py-3.5 px-4 sm:px-6">Code</th>
                <th className="py-3.5 px-4 sm:px-6">Draw Time</th>
                <th className="py-3.5 px-4 sm:px-6">1st Prize</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Scheme Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {upcomingDraws.map((item, idx) => (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    item.isToday
                      ? 'bg-emerald-50/80 font-semibold'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-2">
                      {item.isToday && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      )}
                      <span className={item.isToday ? 'text-emerald-950 font-bold' : 'text-slate-900'}>
                        {item.dateFormatted}
                      </span>
                      {item.isToday && (
                        <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                          TODAY'S DRAW
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 sm:px-6 font-bold text-slate-900">
                    {item.scheme.name}
                  </td>
                  <td className="py-4 px-4 sm:px-6 font-mono text-xs text-slate-600">
                    {item.scheme.code}
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-slate-600">
                    {item.scheme.time}
                  </td>
                  <td className="py-4 px-4 sm:px-6 font-extrabold text-emerald-700">
                    {item.scheme.firstPrize}
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <Link
                      href={`/lottery/${item.scheme.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                    >
                      <span>View Scheme</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Draw Schedule Component */}
      <DrawScheduleTable />
    </div>
  );
}
