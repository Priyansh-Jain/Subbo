export type SubscriptionStatus = 'active' | 'zombie' | 'price_hike' | 'trial_ending';

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  status: SubscriptionStatus;
  logo: string;
  category: string;
  lastActivity?: Date;
  renewalDate?: Date;
  trialEndsIn?: number;
  priceChange?: { from: number; to: number };
  billingCycle?: 'monthly' | 'annual' | 'weekly';
  currency?: string;
  confidenceScore?: number;
  sourceText?: string;
}
