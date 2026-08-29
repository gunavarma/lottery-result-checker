import { redirect } from 'next/navigation';

export default async function LegacyLotterySlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/lotteries/${slug}`);
}
