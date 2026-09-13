import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo';

export const metadata: Metadata = constructMetadata({
  title: 'My Saved Lottery Tickets | KeralaDraws Watchlist',
  description:
    'Monitor your saved Kerala lottery tickets in real time. Automatic winning number evaluation against official 3:00 PM LOTIS certified draw gazettes.',
  path: '/my-tickets',
  noIndex: true, // User personal state page
});

export default function MyTicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
