import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma, serializeData, formatINR } from '@/lib/prisma';
import { DrawScheduleTable, WEEKLY_SCHEDULE, BUMPER_SCHEDULE } from '@/components/DrawScheduleTable';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Calendar, Clock, Award, ShieldCheck, ChevronRight, ArrowRight, CheckCircle2 } from 'lucide-react';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';

import { StructuredData } from '@/components/StructuredData';
import { constructMetadata, getBreadcrumbSchema } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'Kerala Lottery Calendar 2026 | Weekly & Bumper Draw Timetable',
  description:
    'Complete Kerala State Lottery calendar and draw schedule for 2026. Weekly draw days (Monday to Sunday), 3:00 PM draw times, ticket prices, and annual bumper dates.',
  path: '/lottery-calendar',
  keywords: [
    'Kerala Lottery Calendar 2026',
    'Kerala Lottery Schedule',
    'Kerala Lottery Draw Days',
    'Kerala Lottery Timetable',
    'KeralaDraws',
  ],
});

async function getCalendarDraws() {
  try {
    const today = new Date();
    const startDate = addDays(today, -3);
    const endDate = addDays(today, 14);

    const draws = await prisma.draw.findMany({
      where: {
        drawDate: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
        status: 'PUBLISHED',
      },
      include: {
        lottery: true,
      },
      orderBy: { drawDate: 'desc' },
    });

    return serializeData(draws);
  } catch (e) {
    console.error('Error fetching calendar draws:', e);
    return [];
  }
}

export default async function LotteryCalendarPage() {
  const today = new Date();
  const publishedDraws = await getCalendarDraws();

  // Generate upcoming 14 days schedule
  const upcomingDraws = [];
  for (let i = 0; i < 14; i++) {
    const d = addDays(today, i);
    const dayName = format(d, 'EEEE');
    const dateKey = format(d, 'yyyy-MM-dd');
    const scheduleMatch = WEEKLY_SCHEDULE.find((s) => s.day === dayName);

    // Check if draw is published in database
    const matchingDraw = publishedDraws.find((p: any) => {
      const pDate = format(new Date(p.drawDate), 'yyyy-MM-dd');
      return pDate === dateKey;
    });

    upcomingDraws.push({
      date: d,
      dateFormatted: format(d, 'dd MMM yyyy (EEE)'),
      isToday: i === 0,
      draw: matchingDraw || null,
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
      <StructuredData
        data={getBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Lottery Calendar', url: '/lottery-calendar' },
        ])}
      />
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Lottery Calendar 2026' },
        ]}
      />

      <div className="border-b border-[#E2E7E3] pb-6 space-y-2">
        <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
          Official Draw Timetable
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] tracking-tight">
          Kerala State Lottery Calendar 2026
        </h1>
        <p className="text-xs sm:text-sm text-[#68736E]">
          Official weekly draw calendar and seasonal bumper dates conducted by the Directorate of Kerala State Lotteries at Gorky Bhavan, Thiruvananthapuram.
        </p>
      </div>

      {/* Upcoming 14-Day Calendar Schedule */}
      <div className="bg-white rounded-3xl border border-[#E2E7E3] overflow-hidden shadow-xs">
        <div className="p-6 bg-[#10201D] text-white flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-[#C8A45D] uppercase tracking-wider block font-tabular">
              Chronological Schedule
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C8A45D]" />
              <span>Upcoming Kerala Lottery Draws (Next 14 Days)</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Draws take place daily at 3:00 PM IST. Official LOTIS gazette published at ~4:30 PM.
            </p>
          </div>
          <span className="text-xs bg-white/10 text-[#C8A45D] border border-white/15 px-3.5 py-1.5 rounded-full font-bold font-tabular">
            Today is {format(today, 'dd MMMM yyyy')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F7F4] text-[#68736E] text-[11px] uppercase font-bold border-b border-[#E2E7E3]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Date & Day</th>
                <th className="py-3.5 px-4 sm:px-6">Lottery Scheme</th>
                <th className="py-3.5 px-4 sm:px-6">Code / Draw</th>
                <th className="py-3.5 px-4 sm:px-6">Draw Time</th>
                <th className="py-3.5 px-4 sm:px-6">1st Prize</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Result Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E7E3]">
              {upcomingDraws.map((item, idx) => {
                const isPublished = !!item.draw;
                const resultUrl = item.draw
                  ? `/results/${item.draw.lottery.slug}/${item.draw.drawNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
                  : item.isToday
                  ? '/kerala-lottery-result-today'
                  : `/lotteries/${item.scheme.slug}`;

                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      item.isToday
                        ? 'bg-[#F1F4F2] font-semibold'
                        : 'hover:bg-[#F7F7F4]'
                    }`}
                  >
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        {item.isToday && (
                          <span className="w-2 h-2 rounded-full bg-[#16845B]" />
                        )}
                        <span className={item.isToday ? 'text-[#0B3B32] font-black' : 'text-[#17201D]'}>
                          {item.dateFormatted}
                        </span>
                        {item.isToday && (
                          <span className="text-[10px] bg-[#0B3B32] text-white px-2 py-0.5 rounded font-bold font-tabular">
                            TODAY
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-bold text-[#17201D]">
                      <Link href={`/lotteries/${item.scheme.slug}`} className="hover:text-[#0B3B32]">
                        {item.scheme.name}
                      </Link>
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-mono text-xs text-[#68736E]">
                      {item.draw ? item.draw.drawNumber : item.scheme.code}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-[#68736E] font-tabular">
                      {item.scheme.time}
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-extrabold text-[#16845B] font-tabular">
                      {item.scheme.firstPrize}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      {isPublished ? (
                        <Link
                          href={resultUrl}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#16845B] bg-[#16845B]/10 hover:bg-[#16845B] hover:text-white px-3 py-1.5 rounded-lg transition-colors font-tabular"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>View Result</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/lotteries/${item.scheme.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#68736E] hover:text-[#0B3B32]"
                        >
                          <span>Awaiting Result</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Draw Schedule Component */}
      <DrawScheduleTable />
    </div>
  );
}
