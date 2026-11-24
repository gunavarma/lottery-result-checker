export const RAZORPAY_MEMBERSHIP_PLANS = {
  standard: {
    code: 'standard',
    name: 'Standard',
    priceRupees: 199,
    period: 'monthly',
    interval: 1,
    totalCount: 100,
    envName: 'RAZORPAY_STANDARD_PLAN_ID',
  },
  annual: {
    code: 'annual',
    name: 'Annual',
    priceRupees: 1999,
    period: 'yearly',
    interval: 1,
    totalCount: 10,
    envName: 'RAZORPAY_ANNUAL_PLAN_ID',
  },
  live_test: {
    code: 'live_test',
    name: 'Live payment test',
    priceRupees: 2,
    period: 'monthly',
    interval: 1,
    totalCount: 2,
    envName: 'RAZORPAY_LIVE_TEST_PLAN_ID',
  },
} as const;

export type RazorpayMembershipPlanCode = keyof typeof RAZORPAY_MEMBERSHIP_PLANS;
