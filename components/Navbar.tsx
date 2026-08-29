'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Search,
  Bell,
  Clock,
  ShieldCheck,
  ChevronRight,
  Ticket,
  Star,
  Calendar,
  Home,
  Award,
  Newspaper,
  Layers,
  User,
} from 'lucide-react';
import { SearchModal } from './SearchModal';
import { NotificationModal } from './NotificationModal';

const NAV_LINKS = [
  { label: 'Results', href: '/results' },
  { label: 'Lotteries', href: '/lotteries' },
  { label: 'Archive', href: '/results/archive' },
  { label: 'Check Ticket', href: '/check-ticket' },
  { label: 'Calendar', href: '/lottery-calendar' },
  { label: 'News', href: '/news' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E7E3] shadow-xs">
        {/* Top Source Bar */}
        <div className="bg-[#10201D] text-[#E2E7E3] text-[11px] py-1.5 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#16845B]" />
              <span className="tracking-wide">
                LOTIS Synchronized • Kerala State Lotteries Information
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-slate-300">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#C8A45D]" /> Daily Draw: 3:00 PM IST
              </span>
              <Link
                href="/admin"
                className="hover:text-white transition-colors underline text-[11px]"
              >
                Admin Center
              </Link>
            </div>
          </div>
        </div>

        {/* Main Desktop & Mobile Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-14 h-14 flex items-center justify-center p-1 shrink-0">
                <Image
                  src="/logo.svg"
                  alt="KeralaDraws Logo"
                  width={56}
                  height={56}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div>
                <span className="text-base sm:text-lg font-extrabold text-[#17201D] tracking-tight block leading-none">
                  KeralaDraws
                </span>
                <span className="text-[10px] text-[#0B3B32] font-bold tracking-wider uppercase block mt-1 font-tabular">
                  Results, Checker & Alerts
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${isActive
                      ? 'bg-[#F1F4F2] text-[#0B3B32]'
                      : 'text-[#17201D] hover:text-[#0B3B32] hover:bg-[#F7F7F4]'
                      }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Icons (Desktop) */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setSearchModalOpen(true)}
                aria-label="Search database"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#68736E] hover:text-[#17201D] bg-[#F7F7F4] hover:bg-[#F1F4F2] border border-[#E2E7E3] transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-[#68736E]" />
                <span>Search</span>
                <kbd className="text-[10px] font-mono text-[#68736E] bg-white px-1.5 py-0.5 rounded border border-[#E2E7E3]">
                  ⌘K
                </kbd>
              </button>

              <button
                onClick={() => setNotificationModalOpen(true)}
                aria-label="Notification Preferences"
                className="p-2.5 rounded-xl text-[#17201D] hover:text-[#0B3B32] hover:bg-[#F7F7F4] border border-transparent hover:border-[#E2E7E3] transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
              </button>

              <Link
                href="/admin"
                aria-label="Admin Portal"
                className="p-2.5 rounded-xl text-[#17201D] hover:text-[#0B3B32] hover:bg-[#F7F7F4] border border-transparent hover:border-[#E2E7E3] transition-colors"
                title="Admin Account"
              >
                <User className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Header Right Icons */}
            <div className="flex items-center gap-1.5 lg:hidden">
              <button
                onClick={() => setSearchModalOpen(true)}
                aria-label="Open search"
                className="p-2 rounded-xl text-[#17201D] hover:bg-[#F7F7F4]"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setNotificationModalOpen(true)}
                aria-label="Notifications"
                className="p-2 rounded-xl text-[#17201D] hover:bg-[#F7F7F4]"
              >
                <Bell className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className="p-2 rounded-xl text-[#17201D] hover:bg-[#F7F7F4]"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E2E7E3] bg-white px-4 pt-2 pb-6 space-y-1 shadow-lg animate-fadeIn">
            {NAV_LINKS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-colors ${isActive
                    ? 'bg-[#F1F4F2] text-[#0B3B32]'
                    : 'text-[#17201D] hover:bg-[#F7F7F4]'
                    }`}
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-[#68736E]" />
                </Link>
              );
            })}

            <div className="pt-4 mt-3 border-t border-[#E2E7E3] flex items-center justify-between text-xs text-[#68736E] px-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#16845B]" />
                <span>LOTIS Synchronized</span>
              </span>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="underline text-[#0B3B32] font-semibold"
              >
                Admin Center
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E7E3] py-2 px-3 flex items-center justify-around lg:hidden shadow-lg">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname === '/' ? 'text-[#0B3B32]' : 'text-[#68736E] hover:text-[#17201D]'
            }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>
        <Link
          href="/results"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname.startsWith('/result')
            ? 'text-[#0B3B32]'
            : 'text-[#68736E] hover:text-[#17201D]'
            }`}
        >
          <Award className="w-5 h-5" />
          <span>Results</span>
        </Link>
        <Link
          href="/lotteries"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname.startsWith('/lotteries')
            ? 'text-[#0B3B32]'
            : 'text-[#68736E] hover:text-[#17201D]'
            }`}
        >
          <Layers className="w-5 h-5" />
          <span>Lotteries</span>
        </Link>
        <Link
          href="/check-ticket"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname === '/check-ticket' ? 'text-[#0B3B32]' : 'text-[#68736E] hover:text-[#17201D]'
            }`}
        >
          <Ticket className="w-5 h-5" />
          <span>Check</span>
        </Link>
        <Link
          href="/news"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${pathname.startsWith('/news') ? 'text-[#0B3B32]' : 'text-[#68736E] hover:text-[#17201D]'
            }`}
        >
          <Newspaper className="w-5 h-5" />
          <span>News</span>
        </Link>
      </nav>

      {/* Global Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

      {/* Notification Preferences Modal */}
      <NotificationModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
      />
    </>
  );
}
