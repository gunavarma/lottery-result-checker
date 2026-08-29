'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight, ChevronRight, CheckCircle2 } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface ScheduleItem {
  date: Date;
  dayName: string;
  lotteryName: string;
  slug: string;
  code: string;
  drawTime: string;
  isToday?: boolean;
  status: string;
}

export function UpcomingDrawsTimeline() {
  const today = new Date();

  // Generate real upcoming schedule based on Kerala weekly schemes
  const SCHEMES_BY_DAY: Record<number, { name: string; slug: string; code: string }> = {
    1: { name: 'Bhagya Thara', slug: 'bhagya-thara', code: 'BT' },
    2: { name: 'Sthree Sakthi', slug: 'sthree-sakthi', code: 'SS' },
    3: { name: 'Fifty-Fifty', slug: 'fifty-fifty', code: 'FF' },
    4: { name: 'Karunya Plus', slug: 'karunya-plus', code: 'KN' },
    5: { name: 'Suvarna Keralam', slug: 'suvarna-keralam', code: 'SK' },
    6: { name: 'Karunya', slug: 'karunya', code: 'KR' },
    0: { name: 'Samrudhi / Akshaya', slug: 'samrudhi', code: 'SM' },
  };

  const schedule: ScheduleItem[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, i);
    const dayOfWeek = d.getDay();
    const scheme = SCHEMES_BY_DAY[dayOfWeek] || { name: 'Kerala Lottery', slug: 'kerala-lottery', code: 'KL' };
    schedule.push({
      date: d,
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(d, 'EEEE'),
      lotteryName: scheme.name,
      slug: scheme.slug,
      code: scheme.code,
      drawTime: '3:00 PM IST',
      isToday: i === 0,
      status: i === 0 ? 'Scheduled Today' : 'Upcoming Draw',
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#E2E7E3] pb-3">
        <div>
          <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
            Draw Schedule Timeline
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#17201D] tracking-tight">
            Upcoming Kerala Lottery Draws
          </h2>
        </div>
        <Link
          href="/calendar"
          className="text-xs font-bold text-[#0B3B32] hover:text-[#16845B] inline-flex items-center gap-1 transition-colors"
        >
          <span>Full 2026 Calendar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Horizontal Scrollable Timeline */}
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex items-stretch gap-4 min-w-[720px] lg:min-w-full">
          {schedule.map((item, idx) => {
            const dateNumber = format(item.date, 'd');
            const monthName = format(item.date, 'MMM');

            return (
              <div
                key={idx}
                className={`flex-1 rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                  item.isToday
                    ? 'bg-[#0B3B32] text-white border-[#0B3B32] shadow-md'
                    : 'bg-white text-[#17201D] border-[#E2E7E3] hover:border-[#0B3B32]/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded font-tabular ${
                        item.isToday
                          ? 'bg-[#C8A45D] text-[#10201D]'
                          : 'bg-[#F1F4F2] text-[#0B3B32]'
                      }`}
                    >
                      {item.dayName}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        item.isToday ? 'text-slate-200' : 'text-[#68736E]'
                      }`}
                    >
                      {dateNumber} {monthName}
                    </span>
                  </div>

                  <h3
                    className={`font-black text-sm sm:text-base mt-1 line-clamp-1 ${
                      item.isToday ? 'text-white' : 'text-[#17201D]'
                    }`}
                  >
                    {item.lotteryName}
                  </h3>
                </div>

                <div
                  className={`pt-3 mt-3 border-t text-xs flex items-center justify-between ${
                    item.isToday ? 'border-white/15 text-slate-300' : 'border-[#E2E7E3] text-[#68736E]'
                  }`}
                >
                  <span className="flex items-center gap-1 font-tabular">
                    <Clock className="w-3 h-3 text-[#C8A45D]" />
                    <span>{item.drawTime}</span>
                  </span>
                  <Link
                    href={`/lottery/${item.slug}`}
                    className={`font-bold inline-flex items-center gap-0.5 hover:underline ${
                      item.isToday ? 'text-[#C8A45D]' : 'text-[#0B3B32]'
                    }`}
                  >
                    <span>Details</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
