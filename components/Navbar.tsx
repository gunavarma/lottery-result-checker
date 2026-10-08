import React, { useState } from 'react';
import Link from '@/components/Link';
import Image from '@/components/Image';
import { usePathname } from '@/hooks/use-pathname';
import { lazy } from '@/components/lazy';
import {
  Menu,
  X,
  Search,
  Bell,
  Clock,
  ShieldCheck,
  ChevronRight,
  Ticket,
  Calendar,
  Home,
  Award,
  Newspaper,
} from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '@/context/LanguageContext';

const SearchModal = lazy(() => import('./SearchModal').then((mod) => mod.SearchModal));
const NotificationModal = lazy(() =>
  import('./NotificationModal').then((mod) => mod.NotificationModal)
);

export function Navbar({ pathname: pathnameProp }: { pathname?: string }) {
  const pathnameFromBrowser = usePathname();
  const pathname = pathnameProp ?? pathnameFromBrowser;
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);

  const navLinks = [
    { label: t('nav.today', 'Today'), href: '/' },
    { label: t('nav.results', 'Results'), href: '/results' },
    { label: t('nav.archive', 'Archive'), href: '/kerala-lottery-results' },
    { label: t('nav.check_ticket', 'Check Ticket'), href: '/ticket-checker' },
    { label: t('nav.upcoming', 'Upcoming'), href: '/lottery-calendar' },
    { label: t('nav.news', 'News'), href: '/news' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E7E3] shadow-xs">
        {/* Top Source Bar — cleaner, better readable */}
        <div className="bg-[#0B3B32] text-white/90 text-[11px] py-1.5 px-4 font-medium">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C8A45D]" />
              <span className="tracking-wide text-[11px] font-semibold">
                {t('ui.lotis_sync', 'LOTIS Synchronized • Kerala State Lotteries Information')}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-white/80">
                <Clock className="w-3.5 h-3.5 text-[#C8A45D]" />
                <span className="text-[11px] font-medium">
                  {t('ui.daily_draw_time', 'Daily Draw: 3:00 PM IST')}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Brand — smaller logo, tighter layout */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 flex items-center justify-center p-0.5 rounded-xl bg-[#0B3B32] ring-1 ring-[#C8A45D]/30">
                <Image
                  src="/logo.svg"
                  alt="KeralaDraws Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div className="leading-tight">
                <span className="text-base font-extrabold text-[#17201D] tracking-tight block leading-none">
                  KeralaDraws
                </span>
                <span className="text-[10px] text-[#0B3B32] font-bold tracking-widest uppercase block mt-0.5 font-tabular">
                  Results, Checker & Alerts
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-[#0B3B32] text-white shadow-xs'
                        : 'text-[#17201D] hover:text-[#0B3B32] hover:bg-[#F1F4F2]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setSearchModalOpen(true)}
                aria-label="Search database"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#68736E] hover:text-[#17201D] bg-[#F7F7F4] hover:bg-[#F1F4F2] border border-[#E2E7E3] transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-[#68736E]" />
                <span>{t('nav.search', 'Search')}</span>
                <kbd className="text-[10px] font-mono text-[#68736E] bg-white px-1.5 py-0.5 rounded border border-[#E2E7E3]">
                  ⌘K
                </kbd>
              </button>

              <LanguageSelector variant="header" />

              <button
                onClick={() => setNotificationModalOpen(true)}
                aria-label="Notification Preferences"
                className="p-2 rounded-xl text-[#17201D] hover:text-[#0B3B32] hover:bg-[#F7F7F4] transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Mobile Right Icons */}
            <div className="flex items-center gap-1 lg:hidden">
              <LanguageSelector variant="compact" />
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
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E2E7E3] bg-white px-4 pt-3 pb-6 space-y-1 shadow-lg animate-fadeIn">
            <div className="pb-3 border-b border-[#E2E7E3] mb-1">
              <LanguageSelector variant="drawer" />
            </div>
            <div className="space-y-0.5">
              {navLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                      isActive
                        ? 'bg-[#0B3B32] text-white'
                        : 'text-[#17201D] hover:bg-[#F7F7F4]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-[#68736E]" />
                  </Link>
                );
              })}
            </div>
            <div className="pt-3 mt-2 border-t border-[#E2E7E3] flex items-center gap-1.5 text-xs text-[#68736E] px-2">
              <ShieldCheck className="w-4 h-4 text-[#16845B]" />
              <span>LOTIS Synchronized</span>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Nav */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E7E3] py-2 px-3 flex items-center justify-around lg:hidden shadow-lg"
      >
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            pathname === '/' ? 'text-[#0B5D45]' : 'text-[#5F6B66] hover:text-[#0B5D45]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>{t('nav.today', 'Today')}</span>
        </Link>
        <Link
          href="/results"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            pathname.startsWith('/result')
              ? 'text-[#0B5D45]'
              : 'text-[#5F6B66] hover:text-[#0B5D45]'
          }`}
        >
          <Award className="w-5 h-5" />
          <span>{t('nav.results', 'Results')}</span>
        </Link>
        <Link
          href="/ticket-checker"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            pathname === '/ticket-checker' || pathname === '/check-ticket'
              ? 'text-[#0B5D45]'
              : 'text-[#5F6B66] hover:text-[#0B5D45]'
          }`}
        >
          <Ticket className="w-5 h-5" />
          <span>{t('ui.check', 'Check')}</span>
        </Link>
        <Link
          href="/lottery-calendar"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            pathname.startsWith('/lottery-calendar')
              ? 'text-[#0B5D45]'
              : 'text-[#5F6B66] hover:text-[#0B5D45]'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span>{t('nav.upcoming', 'Upcoming')}</span>
        </Link>
        <Link
          href="/news"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            pathname.startsWith('/news')
              ? 'text-[#0B5D45]'
              : 'text-[#5F6B66] hover:text-[#0B5D45]'
          }`}
        >
          <Newspaper className="w-5 h-5" />
          <span>{t('nav.news', 'News')}</span>
        </Link>
      </nav>

      {searchModalOpen && (
        <SearchModal isOpen onClose={() => setSearchModalOpen(false)} />
      )}

      {notificationModalOpen && (
        <NotificationModal isOpen onClose={() => setNotificationModalOpen(false)} />
      )}
    </>
  );
}
