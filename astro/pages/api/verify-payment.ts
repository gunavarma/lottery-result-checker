import type { APIRoute } from 'astro';
import { verifyPaymentSignature } from '@/lib/razorpay';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: 'Invalid JSON request body.' },
      { status: 400 }
    );
  }

  const order_id =
    typeof body?.razorpay_order_id === 'string' && body.razorpay_order_id.trim()
      ? body.razorpay_order_id.trim()
      : typeof body?.order_id === 'string' && body.order_id.trim()
        ? body.order_id.trim()
        : null;

  const payment_id =
    typeof body?.razorpay_payment_id === 'string' && body.razorpay_payment_id.trim()
      ? body.razorpay_payment_id.trim()
      : typeof body?.payment_id === 'string' && body.payment_id.trim()
        ? body.payment_id.trim()
        : null;

  const signature =
    typeof body?.razorpay_signature === 'string' && body.razorpay_signature.trim()
      ? body.razorpay_signature.trim()
      : typeof body?.signature === 'string' && body.signature.trim()
        ? body.signature.trim()
        : null;

  // Missing fields: return 400
  if (!order_id || !payment_id || !signature) {
    return Response.json(
      {
        success: false,
        error:
          'Missing required fields: order_id, payment_id, and signature are all required.',
      },
      { status: 400 }
    );
  }

  // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
  const isValid = verifyPaymentSignature({
    order_id,
    payment_id,
    signature,
  });

  if (!isValid) {
    // Signature mismatch: return 400, do NOT mark as paid
    return Response.json(
      {
        success: false,
        error: 'Invalid payment signature. Payment could not be verified.',
      },
      { status: 400 }
    );
  }

  // Return success only if signatures match
  return Response.json(
    {
      success: true,
      message: 'Payment verified successfully.',
      order_id,
      payment_id,
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
};
