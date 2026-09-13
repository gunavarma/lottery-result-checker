'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ResultCard } from '@/components/ResultCard';
import { NotificationModal } from '@/components/NotificationModal';
import { Star, Bell, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function MyLotteriesPage() {
  const [allLotteries, setAllLotteries] = useState<any[]>([]);
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);
  const [favoriteDraws, setFavoriteDraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  // 1. Load all schemes
  useEffect(() => {
    fetch('/api/lotteries')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.lotteries) {
          setAllLotteries(data.lotteries);
        }
      })
      .catch((err) => console.warn('Failed to load lotteries:', err));

    // Load from LocalStorage
    const saved = localStorage.getItem('kl_favorites');
    if (saved) {
      try {
        setFavoriteSlugs(JSON.parse(saved));
      } catch {
        setFavoriteSlugs(['suvarna-keralam', 'karunya-plus', 'sthree-sakthi']);
      }
    } else {
      const defaults = ['suvarna-keralam', 'karunya-plus', 'sthree-sakthi'];
      setFavoriteSlugs(defaults);
      localStorage.setItem('kl_favorites', JSON.stringify(defaults));
    }
  }, []);

  // 2. Fetch latest draws for favorites
  useEffect(() => {
    if (favoriteSlugs.length === 0) {
      setFavoriteDraws([]);
      setLoading(false);
      return;
    }

    fetch('/api/results/latest')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.draws) {
          const matched = data.draws.filter((d: any) =>
            favoriteSlugs.includes(d.lottery?.slug)
          );
          setFavoriteDraws(matched);
        }
      })
      .catch((err) => console.warn('Failed to load favorite draws:', err))
      .finally(() => setLoading(false));
  }, [favoriteSlugs]);

  const toggleFavorite = (slug: string) => {
    let updated: string[];
    if (favoriteSlugs.includes(slug)) {
      updated = favoriteSlugs.filter((s) => s !== slug);
    } else {
      updated = [...favoriteSlugs, slug];
    }
    setFavoriteSlugs(updated);
    localStorage.setItem('kl_favorites', JSON.stringify(updated));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Favorite Lotteries' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E7E3] pb-6">
        <div>
          <span className="text-[11px] font-bold text-[#0B3B32] uppercase tracking-wider block font-tabular">
            Personalized Feed
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17201D] mt-1 tracking-tight">
            Favorite Lottery Schemes
          </h1>
          <p className="text-xs sm:text-sm text-[#68736E] mt-1">
            Track your preferred Kerala lottery schemes, view latest results, and customize draw alerts.
          </p>
        </div>

        <button
          onClick={() => setShowNotifyModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#0B3B32] hover:bg-[#16845B] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors w-fit font-tabular"
        >
          <Bell className="w-4 h-4 text-[#C8A45D]" />
          <span>Notification Alerts</span>
        </button>
      </div>

      {/* Favorite Schemes Selector */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E7E3] shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-[#17201D] uppercase tracking-wide flex items-center gap-2">
          <Star className="w-4 h-4 text-[#C8A45D] fill-[#C8A45D]" />
          <span>Select Your Lotteries</span>
        </h2>

        <div className="flex flex-wrap gap-2">
          {allLotteries.map((lot) => {
            const isFav = favoriteSlugs.includes(lot.slug);
            return (
              <button
                key={lot.id}
                onClick={() => toggleFavorite(lot.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  isFav
                    ? 'bg-[#0B3B32] text-white border-[#0B3B32] shadow-xs'
                    : 'bg-[#F7F7F4] text-[#17201D] border-[#E2E7E3] hover:bg-[#F1F4F2]'
                }`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${isFav ? 'fill-[#C8A45D] text-[#C8A45D]' : 'text-[#68736E]'}`}
                />
                <span>{lot.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Latest Draws for Favorites */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#E2E7E3] pb-3">
          <h2 className="text-xl font-extrabold text-[#17201D]">
            Latest Results for Your Schemes ({favoriteDraws.length})
          </h2>
          <Link
            href="/previous-results"
            className="text-xs font-bold text-[#0B3B32] hover:text-[#16845B] flex items-center gap-1 transition-colors"
          >
            <span>All Results</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[#68736E] text-xs">Loading your lotteries...</div>
        ) : favoriteDraws.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteDraws.map((draw) => (
              <ResultCard key={draw.id} draw={draw} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center text-[#68736E] border border-[#E2E7E3] space-y-2">
            <Star className="w-8 h-8 text-[#C8A45D] mx-auto" />
            <p className="text-base font-bold text-[#17201D]">No active favorites selected.</p>
            <p className="text-xs text-[#68736E]">
              Click the lottery buttons above to add schemes to your personal watchlist.
            </p>
          </div>
        )}
      </div>

      {/* Notification Modal */}
      {showNotifyModal && (
        <NotificationModal
          lotteryName="Your Favorite Schemes"
          onClose={() => setShowNotifyModal(false)}
        />
      )}
    </div>
  );
}
