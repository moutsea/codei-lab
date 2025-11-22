/**
 * Plan interface with pricing information
 * Used for displaying plan data with computed pricing fields
 */
export interface PlanWithPricing {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  interval: string;
  intervalCount: number;
  trialPeriodDays: number | null;
  active: boolean;
  stripeProductId: string | null;
  stripePriceId: string | null;
  quota: string;
  modelAccess: string[] | null;
  features: string[] | null;
  membershipLevel: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  monthlyPrice: number;
  quarterlyPrice: number;
  yearlyPrice: number;
  quarterlyDiscount: number;
  yearlyDiscount: number;
}

export type BillingInterval = 'month' | 'quarter' | 'year';
export type PlanType = 'frontpage' | 'renew' | 'extra' | 'pay';