import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo';

export const metadata: Metadata = constructMetadata({
  title: 'Kerala Lottery Ticket Checker | Instant Winning Number Verification',
  description:
    'Verify your Kerala lottery ticket online. Check single or bulk ticket numbers across 1st prize, consolation, and lower tier ending digits against official LOTIS results.',
  path: '/check-ticket',
  keywords: [
    'Kerala Lottery Ticket Check',
    'Kerala Lottery Ticket Checker',
    'Verify Kerala Lottery Ticket',
    'Check Kerala Lottery Number',
    'KeralaDraws',
  ],
});

export default function CheckTicketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
