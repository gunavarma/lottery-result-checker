'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  Award,
  Clock,
  Search,
  ShieldCheck,
  ChevronRight,
  Radio,
  Ticket,
  Star,
  Calendar,
  Home,
  Archive,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: "Today's Result", href: '/kerala-lottery-result-today', highlight: true },
  { label: 'Live Draw', href: '/live', isLiveBadge: true },
  { label: 'Check Ticket', href: '/check-ticket' },
  { label: 'My Lotteries', href: '/my-lotteries' },
  { label: 'Previous Results', href: '/previous-results' },
  { label: 'Calendar', href: '/lottery-calendar' },
  { label: 'Prize Structure', href: '/prize-structure' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        {/* Top Notification Bar */}
        <div className="bg-emerald-900 text-emerald-100 text-xs py-1.5 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Official LOTIS Synchronized Data • Directorate of Kerala State Lotteries</span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-emerald-200">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Daily Draw: 3:00 PM IST
              </span>
              <Link href="/admin" className="hover:text-white transition-colors underline text-xs">
                Admin
              </Link>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12  overflow-hidden">
                <Image
                  src="/logo.svg"
                  alt="Kerala Lottery Results Official Logo"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight block leading-none">
                  Kerala Lottery Results
                </span>
                <span className="text-[11px] text-emerald-700 font-medium tracking-wide block mt-1 uppercase">
                  Official LOTIS Feed
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${item.highlight
                      ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 shadow-emerald-600/20'
                      : item.isLiveBadge
                        ? 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                        : isActive
                          ? 'bg-emerald-50 text-emerald-800 font-bold'
                          : 'text-slate-700 hover:text-emerald-700 hover:bg-slate-50'
                      }`}
                  >
                    {item.isLiveBadge && <Radio className="w-3 h-3 text-rose-600 animate-pulse" />}
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Quick Search Button */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Toggle search bar"
                className="p-2 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-slate-50 transition-colors ml-1"
              >
                <Search className="w-4 h-4" />
              </button>
            </nav>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 xl:hidden">
              <Link
                href="/live"
                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1.5"
              >
                <Radio className="w-3 h-3 text-rose-600 animate-pulse" />
                <span>Live</span>
              </Link>
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Toggle search"
                className="p-2 rounded-xl text-slate-700 hover:bg-slate-100"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className="p-2 rounded-xl text-slate-800 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Quick Search Input */}
          {searchOpen && (
            <div className="py-3 px-1 border-t border-slate-100 animate-fadeIn">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search lottery scheme, draw number (e.g. KN-638, SK-67), date or 6-digit ticket..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Search
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-1 shadow-xl animate-fadeIn">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-colors ${item.highlight
                    ? 'bg-emerald-600 text-white font-bold'
                    : item.isLiveBadge
                      ? 'bg-rose-50 text-rose-800 font-bold border border-rose-200'
                      : isActive
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    {item.isLiveBadge && <Radio className="w-4 h-4 text-rose-600 animate-pulse" />}
                    <span>{item.label}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </Link>
              );
            })}

            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Official LOTIS Source
              </span>
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="underline text-emerald-700">
                Admin Portal
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-3 flex items-center justify-around xl:hidden shadow-lg">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname === '/' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
            }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>
        <Link
          href="/live"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname === '/live' ? 'text-rose-600' : 'text-slate-500 hover:text-slate-900'
            }`}
        >
          <Radio className="w-5 h-5 animate-pulse" />
          <span>Live</span>
        </Link>
        <Link
          href="/check-ticket"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname === '/check-ticket' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
            }`}
        >
          <Ticket className="w-5 h-5" />
          <span>Check</span>
        </Link>
        <Link
          href="/my-lotteries"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname === '/my-lotteries' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-900'
            }`}
        >
          <Star className="w-5 h-5" />
          <span>Favorites</span>
        </Link>
        <Link
          href="/search"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname === '/search' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
            }`}
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </Link>
      </nav>
    </>
  );
}
