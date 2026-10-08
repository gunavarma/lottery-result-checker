import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const POST: APIRoute = async ({ request }: { request: Request }) => {
  try {
    const body = await request.json();
    const { lotteryId, drawNumber, drawDate, drawTime, status, sourceUrl, verificationLevel, prizes } = body;

    // Validate required fields
    if (!lotteryId || !drawNumber || !drawDate) {
      return Response.json(
        { success: false, error: 'lotteryId, drawNumber, and drawDate are required' },
        { status: 400 }
      );
    }

    if (!prizes || !Array.isArray(prizes) || prizes.length === 0) {
      return Response.json(
        { success: false, error: 'At least one prize tier is required' },
        { status: 400 }
      );
    }

    // Parse draw date
    const parsedDate = new Date(drawDate);
    if (isNaN(parsedDate.getTime())) {
      return Response.json(
        { success: false, error: 'Invalid drawDate' },
        { status: 400 }
      );
    }

    // Verify lottery exists
    const lottery = await prisma.lottery.findUnique({
      where: { id: lotteryId },
    });

    if (!lottery) {
      return Response.json(
        { success: false, error: 'Lottery not found' },
        { status: 404 }
      );
    }

    // Check for duplicate draw number for this lottery
    const existing = await prisma.draw.findUnique({
      where: {
        lotteryId_drawNumber: {
          lotteryId,
          drawNumber,
        },
      },
    });

    if (existing) {
      return Response.json(
        { success: false, error: `Draw ${drawNumber} for ${lottery.name} already exists` },
        { status: 409 }
      );
    }

    // Validate prize data
    for (let i = 0; i < prizes.length; i++) {
      const prize = prizes[i];
      if (!prize.category || !prize.amount) {
        return Response.json(
          { success: false, error: `Prize tier ${i + 1}: category and amount are required` },
          { status: 400 }
        );
      }
      if (!prize.numbers || !Array.isArray(prize.numbers) || prize.numbers.length === 0) {
        return Response.json(
          { success: false, error: `Prize tier ${i + 1}: at least one winning number is required` },
          { status: 400 }
        );
      }
      for (const num of prize.numbers) {
        if (!num.number && !num.displayNumber) {
          return Response.json(
            { success: false, error: `Prize tier ${i + 1}: each winning number needs number or displayNumber` },
            { status: 400 }
          );
        }
      }
    }

    // Use a transaction to create the draw + prizes + winning numbers atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create the draw
      const draw = await tx.draw.create({
        data: {
          lotteryId,
          drawNumber,
          drawDate: parsedDate,
          drawTime: drawTime || lottery.drawTime || '3:00 PM',
          status: status || 'PUBLISHED',
          sourceUrl: sourceUrl || lottery.code,
          verificationLevel: verificationLevel || 'OFFICIAL',
          publishedAt: new Date(),
        },
      });

      // Create prizes and winning numbers
      let orderIndex = 0;
      for (const prizeData of prizes) {
        const prize = await tx.prize.create({
          data: {
            drawId: draw.id,
            category: prizeData.category,
            description: prizeData.description || null,
            amount: BigInt(prizeData.amount),
            orderIndex: prizeData.orderIndex ?? orderIndex++,
          },
        });

        for (const numData of prizeData.numbers) {
          await tx.winningNumber.create({
            data: {
              prizeId: prize.id,
              series: numData.series || null,
              number: numData.number || null,
              displayNumber: numData.displayNumber || (numData.series ? `${numData.series} ${numData.number}` : numData.number),
              location: numData.location || null,
            },
          });
        }
      }

      return draw;
    });

    // Fetch the complete created draw
    const fullDraw = await prisma.draw.findUnique({
      where: { id: result.id },
      select: {
        id: true,
        lotteryId: true,
        drawNumber: true,
        drawDate: true,
        drawTime: true,
        status: true,
        verificationLevel: true,
        sourceUrl: true,
        publishedAt: true,
        lottery: {
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
        },
        prizes: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            category: true,
            description: true,
            amount: true,
            orderIndex: true,
            winningNumbers: {
              orderBy: { id: 'asc' },
              select: {
                id: true,
                series: true,
                number: true,
                displayNumber: true,
                location: true,
              },
            },
          },
        },
      },
    });

    return Response.json(
      { success: true, draw: fullDraw, message: `Result ${drawNumber} created successfully` },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error: any) {
    console.error('Admin /results POST error:', error);

    // Handle Prisma unique constraint errors
    if (error?.code === 'P2002' || error?.code === 'P2003') {
      return Response.json(
        { success: false, error: 'A draw with this number already exists for this lottery' },
        { status: 409 }
      );
    }

    return Response.json(
      { success: false, error: error.message || 'Failed to create result' },
      { status: 500 }
    );
  }
};
