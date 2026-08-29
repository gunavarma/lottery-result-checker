'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Calendar, ChevronRight, Filter } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface ResultFinderProps {
  lotteries?: Array<{ id: string; name: string; slug: string; code: string }>;
}

export function ResultFinder({ lotteries = [] }: ResultFinderProps) {
  const router = useRouter();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedLottery, setSelectedLottery] = useState<string>('all');

  const handleQuickJump = (dateVal: string) => {
    setSelectedDate(dateVal);
    if (selectedLottery !== 'all') {
      router.push(`/result/${dateVal}/${selectedLottery}`);
    } else {
      router.push(`/results/date/${dateVal}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLottery !== 'all') {
      router.push(`/result/${selectedDate}/${selectedLottery}`);
    } else {
      router.push(`/results/date/${selectedDate}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E7E3] shadow-xs">
      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Quick Date Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B66] mr-1 font-tabular">
            Quick Jump:
          </span>
          <button
            type="button"
            onClick={() => handleQuickJump(todayStr)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors font-tabular ${
              selectedDate === todayStr
                ? 'bg-[#0B5D45] text-white'
                : 'bg-[#F4F5F2] hover:bg-[#E2E7E3] text-[#17201D]'
            }`}
          >
            Today's Draw
          </button>
          <button
            type="button"
            onClick={() => handleQuickJump(yesterdayStr)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors font-tabular ${
              selectedDate === yesterdayStr
                ? 'bg-[#0B5D45] text-white'
                : 'bg-[#F4F5F2] hover:bg-[#E2E7E3] text-[#17201D]'
            }`}
          >
            Yesterday
          </button>
        </div>

        {/* Right: Custom Date & Scheme Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Custom Date Input */}
          <div className="flex items-center bg-[#F4F5F2] border border-[#E2E7E3] rounded-lg px-2.5 py-1.5 focus-within:bg-white focus-within:border-[#0B5D45] transition-colors">
            <Calendar className="w-3.5 h-3.5 text-[#5F6B66] mr-2 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              max={todayStr}
              onChange={(e) => setSelectedDate(e.target.value)}
              aria-label="Select Draw Date"
              className="bg-transparent text-xs font-bold text-[#17201D] font-tabular focus:outline-hidden cursor-pointer"
            />
          </div>

          {/* Scheme Selector */}
          <div className="flex items-center bg-[#F4F5F2] border border-[#E2E7E3] rounded-lg px-2.5 py-1.5 focus-within:bg-white focus-within:border-[#0B5D45] transition-colors">
            <Filter className="w-3.5 h-3.5 text-[#5F6B66] mr-2 shrink-0" />
            <select
              value={selectedLottery}
              onChange={(e) => setSelectedLottery(e.target.value)}
              aria-label="Select Lottery Scheme"
              className="bg-transparent text-xs font-bold text-[#17201D] focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Lotteries</option>
              {lotteries.map((lot) => (
                <option key={lot.id} value={lot.slug}>
                  {lot.name} ({lot.code})
                </option>
              ))}
            </select>
          </div>

          {/* Search/Find Action */}
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B5D45] hover:bg-[#084835] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <span>Show Results</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
