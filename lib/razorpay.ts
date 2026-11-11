import Razorpay from 'razorpay';
import crypto from 'node:crypto';

/**
 * Server-only Razorpay configuration and helpers.
 * Never import this file into client-side components.
 */

export interface RazorpayCredentials {
  key_id?: string;
  key_secret?: string;
}

export function getRazorpayCredentials(): RazorpayCredentials {
  const key_id =
    process.env.RAZORPAY_KEY_ID?.trim() ||
    process.env.PUBLIC_RAZORPAY_KEY_ID?.trim() ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
  const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();

  return { key_id, key_secret };
}

/**
 * Returns an authenticated Razorpay SDK instance.
 * Throws an error if credentials are missing.
 */
export function getRazorpayClient(): Razorpay {
  const { key_id, key_secret } = getRazorpayCredentials();

  if (!key_id || !key_secret) {
    const error: any = new Error(
      'Razorpay credentials are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
    );
    error.statusCode = 401;
    throw error;
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

export interface VerifySignatureParams {
  order_id: string;
  payment_id: string;
  signature: string;
}

/**
 * Verifies the Razorpay payment signature using HMAC-SHA256.
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * Uses constant-time comparison to prevent timing side-channel attacks.
 */
export function verifyPaymentSignature({
  order_id,
  payment_id,
  signature,
}: VerifySignatureParams): boolean {
  const { key_secret } = getRazorpayCredentials();
  if (!key_secret) {
    console.error('[Razorpay] Cannot verify signature: RAZORPAY_KEY_SECRET is not configured.');
    return false;
  }

  if (!order_id || !payment_id || !signature) {
    return false;
  }

  const payload = `${order_id}|${payment_id}`;
  const generatedSignature = crypto
    .createHmac('sha256', key_secret)
    .update(payload)
    .digest('hex');

  if (generatedSignature.length !== signature.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(generatedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  } catch {
    return false;
  }
}
