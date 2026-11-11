import React from 'react';
import Link from '@/components/Link';
import Image from '@/components/Image';
import { ShieldCheck, ExternalLink, HelpCircle } from 'lucide-react';
import { getTranslation, SUPPORTED_LANGUAGES, type Language } from '@/lib/translations';
import { switchLocalePath } from '@/lib/i18n/config';
import { withLocale } from '@/lib/i18n/client-path';
import { weekdayNameForIndex } from '@/lib/i18n/server';

const WEEKLY = [
  { slug: 'bhagya-thara', name: 'Bhagya Thara', dow: 1 },
  { slug: 'sthree-sakthi', name: 'Sthree Sakthi', dow: 2 },
  { slug: 'fifty-fifty', name: 'Fifty-Fifty', dow: 3 },
  { slug: 'karunya-plus', name: 'Karunya Plus', dow: 4 },
  { slug: 'suvarna-keralam', name: 'Suvarna Keralam', dow: 5 },
  { slug: 'karunya', name: 'Karunya', dow: 6 },
  { slug: 'samrudhi', name: 'Samrudhi / Akshaya', dow: 0 },
];

const BUMPERS = [
  { slug: 'thiruvonam-bumper', name: 'Thiruvonam Bumper', prize: '₹25 Cr' },
  { slug: 'xmas-new-year-bumper', name: 'Xmas New Year Bumper', prize: '₹20 Cr' },
  { slug: 'vishu-bumper', name: 'Vishu Bumper', prize: '₹12 Cr' },
  { slug: 'pooja-bumper', name: 'Pooja Bumper', prize: '₹12 Cr' },
  { slug: 'monsoon-bumper', name: 'Monsoon Bumper', prize: '₹10 Cr' },
];

/**
 * Site footer.
 *
 * Two things make this localized without shipping an island:
 *
 *   - The language pills are real `<a href>` links to the same page in another
 *     locale. They used to be `LanguageSelector variant="footer"`, but the
 *     footer is server-rendered with no `client:*` directive, so those buttons
 *     had no React tree behind them and clicking them did nothing at all. As
 *     anchors they work with JavaScript disabled, are indexable, and cost no
 *     bundle.
 *   - Every internal link is prefixed with the page's locale, so a visitor who
 *     is reading `/ml` stays in Malayalam after clicking a footer link instead
 *     of being dropped back into the English tree.
 */
export function Footer({
  locale = 'en',
  pathname = '/',
}: {
  /** Locale of the page being rendered. */
  locale?: Language;
  /** Current path, used to build the "same page, other language" links. */
  pathname?: string;
}) {
  const t = (key: string, fallback?: string) => getTranslation(locale, key, fallback);
  const href = (path: string) => withLocale(path, locale);

  const tools = [
    { path: '/kerala-lottery-result-today', label: t('footer.today_result') },
    { path: '/kerala-lottery-results', label: t('footer.results_archive') },
    { path: '/previous-results', label: t('chrome.footer_previous_results') },
    { path: '/ticket-checker', label: t('footer.ticket_checker') },
    { path: '/checkout', label: 'Razorpay Checkout' },
    { path: '/guides', label: t('footer.guides') },
    { path: '/lottery-calendar', label: t('chrome.footer_timetable') },
    { path: '/prize-structure', label: t('chrome.footer_prize_breakdown') },
    { path: '/news', label: t('footer.gazette_news') },
    { path: '/disclaimer', label: t('chrome.footer_disclaimer_claims') },
  ];

  const legal = [
    { path: '/about', label: t('footer.about') },
    { path: '/contact', label: t('footer.contact') },
    { path: '/privacy-policy', label: t('footer.privacy') },
    { path: '/terms', label: t('chrome.footer_terms') },
    { path: '/disclaimer', label: t('chrome.footer_disclaimer') },
  ];

  return (
    <footer className="bg-[#10201D] text-[#E2E7E3] pt-14 pb-10 border-t border-[#0B3B32]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand & Independent Status */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 flex items-center justify-center p-1 shrink-0">
                <Image
                  src="/logo.svg"
                  alt="KeralaDraws Logo"
                  width={56}
                  height={56}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-base font-extrabold text-white tracking-tight block">
                  KeralaDraws
                </span>
                <span className="text-[10px] text-[#C8A45D] font-bold tracking-wider uppercase block font-tabular">
                  {t('footer.tagline')}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{t('footer.brand_desc')}</p>
            <div className="pt-2">
              <a
                href="https://www.lotteryagent.kerala.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#C8A45D] hover:text-white font-semibold bg-white/5 border border-[#C8A45D]/30 px-3 py-1.5 rounded-xl transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t('footer.official_portal')}</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          </div>

          {/* Col 2: Weekly Lottery Hubs */}
          <div>
            <h3 className="text-xs font-bold text-[#C8A45D] uppercase tracking-wider mb-4 border-l-2 border-[#C8A45D] pl-2 font-tabular">
              {t('footer.weekly_schemes')}
            </h3>
            <ul className="space-y-2.5 text-xs">
              {WEEKLY.map((scheme) => (
                <li key={scheme.slug}>
                  <Link
                    href={href(`/lottery/${scheme.slug}`)}
                    className="text-slate-300 hover:text-white transition-colors flex items-center justify-between"
                  >
                    <span>{scheme.name}</span>
                    <span className="text-slate-400">{weekdayNameForIndex(scheme.dow, locale)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Bumper Lotteries */}
          <div>
            <h3 className="text-xs font-bold text-[#C8A45D] uppercase tracking-wider mb-4 border-l-2 border-[#C8A45D] pl-2 font-tabular">
              {t('footer.seasonal_bumpers')}
            </h3>
            <ul className="space-y-2.5 text-xs">
              {BUMPERS.map((bumper) => (
                <li key={bumper.slug}>
                  <Link
                    href={href(`/lottery/${bumper.slug}`)}
                    className="text-slate-300 hover:text-white transition-colors flex items-center justify-between"
                  >
                    <span>{bumper.name}</span>
                    <span className="text-[#C8A45D] font-bold font-tabular">{bumper.prize}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Trust & Navigation */}
          <div>
            <h3 className="text-xs font-bold text-[#C8A45D] uppercase tracking-wider mb-4 border-l-2 border-[#C8A45D] pl-2 font-tabular">
              {t('footer.tools_trust')}
            </h3>
            <ul className="space-y-2.5 text-xs">
              {tools.map((item) => (
                <li key={item.path}>
                  <Link
                    href={href(item.path)}
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Official Statutory Disclaimer Box */}
        <div className="border-t border-white/10 pt-8 pb-4">
          <div className="bg-black/30 rounded-2xl p-5 border border-white/5 text-xs text-slate-300 space-y-2">
            <p className="font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#C8A45D]" />
              <span>{t('footer.disclaimer_heading')}</span>
            </p>
            <p className="leading-relaxed text-slate-300">{t('footer.disclaimer_body1')}</p>
            <p className="leading-relaxed text-slate-400">{t('footer.disclaimer_body2')}</p>
          </div>
        </div>

        {/* Language Switcher Bar — real links, so they work without JavaScript. */}
        <div className="border-t border-white/10 pt-6 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <nav
            aria-label={t('chrome.footer_language_label')}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <span>{t('chrome.language')}:</span>
            </span>
            <div className="flex items-center gap-1.5">
              {SUPPORTED_LANGUAGES.map((option) => {
                const isSelected = locale === option.code;
                return (
                  <a
                    key={option.code}
                    href={switchLocalePath(pathname, option.code)}
                    aria-current={isSelected ? 'true' : undefined}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      isSelected
                        ? 'bg-[#C8A45D] text-[#10201D]'
                        : 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {option.nativeName}
                  </a>
                );
              })}
            </div>
          </nav>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} KeralaDraws (KeralaDraws.com). {t('footer.rights')}
          </p>
        </div>

        {/* Bottom Legal Links */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-end text-xs text-slate-400 gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {legal.map((item, index) => (
              <Link
                key={`${item.path}-${index}`}
                href={href(item.path)}
                className="hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
