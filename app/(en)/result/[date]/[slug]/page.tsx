import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LegacyDateSlugResultRedirect({
  params,
}: {
  params: Promise<{ date: string; slug: string }>;
}) {
  const { date } = await params;
  redirect(`/kerala-lottery-result/${date}`);
}
