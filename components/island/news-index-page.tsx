/**
 * Astro island wrapper for News & Video Bulletin Page.
 */
import { withProviders } from '@/components/with-providers';
import NewsIndexPage from '@/components/pages/NewsIndexPage';

export const NewsIndexPageIsland = withProviders(NewsIndexPage);
