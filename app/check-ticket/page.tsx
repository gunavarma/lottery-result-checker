import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LegacyCheckTicketRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const queryString = new URLSearchParams(query as any).toString();
  redirect(`/ticket-checker${queryString ? `?${queryString}` : ''}`);
}
