import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo';

export const metadata: Metadata = constructMetadata({
  title: 'Live Kerala Lottery Result Synchronization | KeralaDraws',
  description:
    'Live Kerala lottery result feed and 3:00 PM countdown. Monitor draw status, official LOTIS gazette releases, and verified 1st prize winning numbers.',
  path: '/live',
  keywords: [
    'Kerala Lottery Live',
    'Kerala Lottery Result Live',
    'Live Kerala Lottery Draw',
    'KeralaDraws',
  ],
});

export default function LiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
