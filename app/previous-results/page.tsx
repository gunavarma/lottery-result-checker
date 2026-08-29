import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PreviousResultsRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const queryString = new URLSearchParams(params).toString();
  redirect(queryString ? `/results/archive?${queryString}` : '/results/archive');
}
