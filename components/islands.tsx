'use client';

/**
 * Document-chrome islands.
 *
 * This module is intentionally small and holds just the chrome components.
 * Navbar only needs LanguageProvider (not QueryProvider), and PWA prompt
 * needs no providers at all.
 */
import { withLanguage } from '@/components/with-providers';
import { Navbar } from '@/components/Navbar';
import { OfflineBanner } from '@/components/OfflineBanner';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';

export const NavbarIsland = withLanguage(Navbar);
export const OfflineBannerIsland = OfflineBanner;
export const PwaInstallPromptIsland = PwaInstallPrompt;
