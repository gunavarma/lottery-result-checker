import type { APIRoute } from 'astro';
import { getRazorpayClient } from '@/lib/razorpay';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'Invalid JSON request body.' },
      { status: 400 }
    );
  }

  const rawAmount = body?.amount;
  const amount = Number(rawAmount);

  // Validate amount >= 100 paise (Razorpay minimum is 100 paise = ₹1.00)
  if (rawAmount === undefined || rawAmount === null || isNaN(amount) || amount < 100) {
    return Response.json(
      { error: 'Invalid amount: minimum order amount is 100 paise (₹1.00).' },
      { status: 400 }
    );
  }

  const currency = typeof body?.currency === 'string' && body.currency.trim()
    ? body.currency.trim().toUpperCase()
    : 'INR';

  const receipt = typeof body?.receipt === 'string' && body.receipt.trim()
    ? body.receipt.trim()
    : `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  try {
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency,
      receipt,
      notes: body?.notes || undefined,
    });

    return Response.json(
      {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error: any) {
    console.error('[Razorpay create-order error]:', error);

    // Auth failures (missing or invalid credentials)
    const isAuthFailure =
      error?.statusCode === 401 ||
      error?.status === 401 ||
      error?.error?.code === 'BAD_REQUEST_ERROR' && error?.error?.description?.toLowerCase().includes('auth') ||
      error?.message?.toLowerCase().includes('credential') ||
      error?.message?.toLowerCase().includes('auth');

    if (isAuthFailure) {
      return Response.json(
        { error: error?.error?.description || error?.message || 'Razorpay authentication failed.' },
        { status: 401 }
      );
    }

    return Response.json(
      {
        error: error?.error?.description || error?.message || 'Failed to create Razorpay order.',
      },
      { status: 500 }
    );
  }
};
