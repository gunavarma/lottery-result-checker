import { redirect } from 'next/navigation';

// Served from cache with background revalidation instead of an uncached render
// per visit; the client revalidates the numbers. See the result date page.
export const revalidate = 300;

export default async function LegacyDateResultsRedirect({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  redirect(`/kerala-lottery-result/${date}`);
}
