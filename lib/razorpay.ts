import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import { env as cloudflareEnv } from 'cloudflare:workers';

/**
 * Server-only Razorpay configuration and helpers.
 * Never import this file into client-side components.
 */

export interface RazorpayCredentials {
  key_id?: string;
  key_secret?: string;
}

export function isRazorpayTestMode(): boolean {
  return getRazorpaySetting('RAZORPAY_USE_TEST_MODE') === 'true';
}

export function getRazorpayCredentials(): RazorpayCredentials {
  const testMode = isRazorpayTestMode();
  if (testMode) {
    return {
      key_id: getRazorpaySetting('RAZORPAY_TEST_KEY_ID')?.trim(),
      key_secret: getRazorpaySetting('RAZORPAY_TEST_KEY_SECRET')?.trim(),
    };
  }

  const bindings = cloudflareEnv as Record<string, string | undefined>;
  const runtimeEnv = typeof process === 'undefined' ? {} : process.env;
  const key_id =
    bindings.RAZORPAY_KEY_ID?.trim() ||
    runtimeEnv.RAZORPAY_KEY_ID?.trim() ||
    bindings.PUBLIC_RAZORPAY_KEY_ID?.trim() ||
    runtimeEnv.PUBLIC_RAZORPAY_KEY_ID?.trim() ||
    bindings.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() ||
    runtimeEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
  const key_secret = bindings.RAZORPAY_KEY_SECRET?.trim() || runtimeEnv.RAZORPAY_KEY_SECRET?.trim();

  return { key_id, key_secret };
}

/** Live credentials are only used by the password-protected live test flow. */
export function getRazorpayLiveCredentials(): RazorpayCredentials {
  const bindings = cloudflareEnv as Record<string, string | undefined>;
  const runtimeEnv = typeof process === 'undefined' ? {} : process.env;
  return {
    key_id: bindings.RAZORPAY_KEY_ID?.trim() || runtimeEnv.RAZORPAY_KEY_ID?.trim(),
    key_secret: bindings.RAZORPAY_KEY_SECRET?.trim() || runtimeEnv.RAZORPAY_KEY_SECRET?.trim(),
  };
}

function getRazorpaySetting(name: string): string | undefined {
  const bindings = cloudflareEnv as Record<string, string | undefined>;
  const runtimeEnv = typeof process === 'undefined' ? {} : process.env;
  return bindings[name]?.trim() || runtimeEnv[name]?.trim();
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

/**
 * Worker-compatible Razorpay REST request helper. The official Node SDK's
 * Axios error normalizer assumes `err.response` is always present, which
 * throws a second TypeError in Workers and hides the actual API response.
 */
export async function razorpayApiRequest<T>(
  path: string,
  method: 'GET' | 'POST',
  body?: Record<string, unknown>,
  credentials: RazorpayCredentials = getRazorpayCredentials()
): Promise<T> {
  const { key_id, key_secret } = credentials;
  if (!key_id || !key_secret) {
    const error: any = new Error('Razorpay credentials are not configured.');
    error.statusCode = 503;
    throw error;
  }

  const endpoint = path.startsWith('/') ? path.slice(1) : path;
  const response = await fetch(`https://api.razorpay.com/v1/${endpoint}`, {
    method,
    headers: {
      Authorization: `Basic ${btoa(`${key_id}:${key_secret}`)}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json().catch(() => ({})) as Record<string, any>;
  if (!response.ok) {
    const error: any = new Error(
      payload?.error?.description || payload?.error?.reason || `Razorpay request failed (${response.status}).`
    );
    error.statusCode = response.status;
    throw error;
  }
  return payload as T;
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

export function verifySubscriptionSignature({
  payment_id,
  subscription_id,
  signature,
}: {
  payment_id: string;
  subscription_id: string;
  signature: string;
}): boolean {
  return verifySubscriptionSignatureWithCredentials(
    { payment_id, subscription_id, signature },
    getRazorpayCredentials()
  );
}

export function verifySubscriptionSignatureWithCredentials(
  { payment_id, subscription_id, signature }: { payment_id: string; subscription_id: string; signature: string },
  credentials: RazorpayCredentials
): boolean {
  const { key_secret } = credentials;
  if (!key_secret || !payment_id || !subscription_id || !signature) return false;

  const expected = crypto
    .createHmac('sha256', key_secret)
    .update(`${payment_id}|${subscription_id}`)
    .digest('hex');
  if (expected.length !== signature.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string): boolean {
  if (!signature) return false;
  const secrets = [
    getRazorpaySetting(isRazorpayTestMode() ? 'RAZORPAY_TEST_WEBHOOK_SECRET' : 'RAZORPAY_WEBHOOK_SECRET'),
    getRazorpaySetting(isRazorpayTestMode() ? 'RAZORPAY_WEBHOOK_SECRET' : 'RAZORPAY_TEST_WEBHOOK_SECRET'),
  ].filter((secret): secret is string => Boolean(secret));
  return secrets.some((secret) => {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (expected.length !== signature.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
    } catch {
      return false;
    }
  });
}

export function getRazorpaySettingValue(name: string): string | undefined {
  if (isRazorpayTestMode()) {
    const testNameByLiveName: Record<string, string> = {
      RAZORPAY_STANDARD_PLAN_ID: 'RAZORPAY_TEST_STANDARD_PLAN_ID',
      RAZORPAY_ANNUAL_PLAN_ID: 'RAZORPAY_TEST_ANNUAL_PLAN_ID',
    };
    const testName = testNameByLiveName[name];
    if (testName) return getRazorpaySetting(testName);
  }
  return getRazorpaySetting(name);
}

export function getRazorpayLiveTestSetting(name: string): string | undefined {
  return getRazorpaySetting(name);
}

export function verifyRazorpayLiveTestAccessCode(presented: string): boolean {
  const expected = getRazorpaySetting('RAZORPAY_LIVE_TEST_ACCESS_CODE');
  if (!expected || !presented) return false;
  const expectedBytes = Buffer.from(expected, 'utf8');
  const presentedBytes = Buffer.from(presented, 'utf8');
  if (expectedBytes.length !== presentedBytes.length) return false;
  return crypto.timingSafeEqual(expectedBytes, presentedBytes);
}
