import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { parse, isValid } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function LegacyDateSlugResultRedirect({
  params,
}: {
  params: Promise<{ date: string; slug: string }>;
}) {
  const { date, slug } = await params;
  const parsedDate = parse(date, 'yyyy-MM-dd', new Date());

  if (isValid(parsedDate)) {
    const nextDay = new Date(parsedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: parsedDate,
          lt: nextDay,
        },
        lottery: { slug },
      },
      select: { drawNumber: true },
    });

    if (draw) {
      redirect(`/results/${slug}/${draw.drawNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
    }
  }

  // Fallback: look for latest draw in this scheme or redirect to scheme hub
  const latestDraw = await prisma.draw.findFirst({
    where: { lottery: { slug }, status: 'PUBLISHED' },
    orderBy: { drawDate: 'desc' },
    select: { drawNumber: true },
  });

  if (latestDraw) {
    redirect(`/results/${slug}/${latestDraw.drawNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
  }

  redirect(`/lotteries/${slug}`);
}
