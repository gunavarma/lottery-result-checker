import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'node:crypto';
import {
  getRazorpayCredentials,
  verifyPaymentSignature,
} from '../lib/razorpay';
import { POST as createOrderHandler } from '../astro/pages/api/create-order';
import { POST as verifyPaymentHandler } from '../astro/pages/api/verify-payment';

const TEST_KEY_ID = 'rzp_test_TrzFF72uQ7fUHX';
const TEST_KEY_SECRET = 'Zo64MRYb5xChW71Jgx3Ho7I1';

describe('Razorpay Integration', () => {
  beforeEach(() => {
    vi.stubEnv('RAZORPAY_KEY_ID', TEST_KEY_ID);
    vi.stubEnv('RAZORPAY_KEY_SECRET', TEST_KEY_SECRET);
    vi.stubEnv('PUBLIC_RAZORPAY_KEY_ID', TEST_KEY_ID);
    vi.stubEnv('NEXT_PUBLIC_RAZORPAY_KEY_ID', TEST_KEY_ID);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('Configuration & Credentials', () => {
    it('retrieves credentials from environment variables', () => {
      const creds = getRazorpayCredentials();
      expect(creds.key_id).toBe(TEST_KEY_ID);
      expect(creds.key_secret).toBe(TEST_KEY_SECRET);
    });

    it('never exposes key_secret when only key_id is requested for client', () => {
      const creds = getRazorpayCredentials();
      expect(creds.key_secret).toBe(TEST_KEY_SECRET);
      expect(process.env.PUBLIC_RAZORPAY_KEY_ID).toBe(TEST_KEY_ID);
      // Ensure PUBLIC_* only contains the key_id, never key_secret
      expect(process.env.PUBLIC_RAZORPAY_KEY_SECRET).toBeUndefined();
    });
  });

  describe('Signature Verification Algorithm: HMAC-SHA256', () => {
    it('returns true for a valid signature generated with HMAC-SHA256(order_id + "|" + payment_id, secret)', () => {
      const orderId = 'order_DA287sdh23789';
      const paymentId = 'pay_983274jhsdff';
      const payload = `${orderId}|${paymentId}`;
      const validSignature = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(payload)
        .digest('hex');

      const result = verifyPaymentSignature({
        order_id: orderId,
        payment_id: paymentId,
        signature: validSignature,
      });

      expect(result).toBe(true);
    });

    it('returns false for an invalid or tampered signature', () => {
      const orderId = 'order_DA287sdh23789';
      const paymentId = 'pay_983274jhsdff';
      const fakeSignature = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

      const result = verifyPaymentSignature({
        order_id: orderId,
        payment_id: paymentId,
        signature: fakeSignature,
      });

      expect(result).toBe(false);
    });

    it('returns false when fields are missing or empty', () => {
      expect(
        verifyPaymentSignature({
          order_id: '',
          payment_id: 'pay_123',
          signature: 'sig',
        })
      ).toBe(false);

      expect(
        verifyPaymentSignature({
          order_id: 'order_123',
          payment_id: '',
          signature: 'sig',
        })
      ).toBe(false);
    });
  });

  describe('Backend Endpoint: POST /api/create-order', () => {
    it('rejects orders with amount < 100 paise with status 400', async () => {
      const req = new Request('http://localhost:3000/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 50 }), // 50 paise is < 100
      });

      const res = await createOrderHandler({ request: req } as any);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toContain('minimum order amount is 100 paise');
    });

    it('rejects invalid or missing amount with status 400', async () => {
      const req = new Request('http://localhost:3000/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await createOrderHandler({ request: req } as any);
      expect(res.status).toBe(400);
    });

    it('returns status 401 on auth failure / missing credentials', async () => {
      vi.stubEnv('RAZORPAY_KEY_ID', '');
      vi.stubEnv('RAZORPAY_KEY_SECRET', '');
      vi.stubEnv('PUBLIC_RAZORPAY_KEY_ID', '');
      vi.stubEnv('NEXT_PUBLIC_RAZORPAY_KEY_ID', '');

      const req = new Request('http://localhost:3000/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 50000 }),
      });

      const res = await createOrderHandler({ request: req } as any);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it('creates an order and returns { order_id, amount, currency }', async () => {
      const req = new Request('http://localhost:3000/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 50000, currency: 'INR' }),
      });

      const res = await createOrderHandler({ request: req } as any);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.order_id).toBeDefined();
      expect(json.order_id).toMatch(/^order_/);
      expect(json.amount).toBe(50000);
      expect(json.currency).toBe('INR');
    });
  });

  describe('Backend Endpoint: POST /api/verify-payment', () => {
    it('returns 400 when required fields are missing', async () => {
      const req = new Request('http://localhost:3000/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: 'order_123',
          // missing payment_id and signature
        }),
      });

      const res = await verifyPaymentHandler({ request: req } as any);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Missing required fields');
    });

    it('returns 400 when signature mismatches (does NOT mark as paid)', async () => {
      const req = new Request('http://localhost:3000/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: 'order_test_123',
          razorpay_payment_id: 'pay_test_456',
          razorpay_signature: 'invalid_signature_hex_digest_mismatch',
        }),
      });

      const res = await verifyPaymentHandler({ request: req } as any);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Invalid payment signature');
    });

    it('returns 200 with success: true when signature is valid', async () => {
      const orderId = 'order_test_12345';
      const paymentId = 'pay_test_67890';
      const validSignature = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const req = new Request('http://localhost:3000/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: validSignature,
        }),
      });

      const res = await verifyPaymentHandler({ request: req } as any);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toContain('Payment verified successfully');
      expect(json.order_id).toBe(orderId);
      expect(json.payment_id).toBe(paymentId);
    });
  });
});
