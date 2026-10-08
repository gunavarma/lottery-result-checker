import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const GET: APIRoute = async () => {
  try {
    const lotteries = await prisma.lottery.findMany({
      where: { active: true },
      orderBy: [{ isBumper: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        code: true,
        drawDay: true,
        drawTime: true,
        ticketPrice: true,
        isBumper: true,
      },
    });

    return Response.json({ success: true, lotteries });
  } catch (error: any) {
    console.error('Admin /lotteries error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch lotteries' },
      { status: 500 }
    );
  }
};
