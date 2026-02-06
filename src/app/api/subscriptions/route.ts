import { NextResponse } from 'next/server';
import {
  mockSubscriptions,
  calculatePotentialSavings,
  calculateTotalSpending,
  getTrialEndingSubscriptions,
} from '@/lib/mockData';

export async function GET() {
  const subscriptions = mockSubscriptions.map((sub) => ({
    id: sub.id,
    name: sub.name,
    cost: sub.cost,
    status: sub.status,
    logo: sub.logo,
    category: sub.category,
    trialEndsIn: sub.trialEndsIn,
    lastActivity: sub.lastActivity?.toISOString(),
    renewalDate: sub.renewalDate?.toISOString(),
    priceChange: sub.priceChange,
  }));

  return NextResponse.json({
    subscriptions,
    totalSpending: calculateTotalSpending(),
    potentialSavings: calculatePotentialSavings(),
    trialEndingCount: getTrialEndingSubscriptions().length,
    updatedAt: new Date().toISOString(),
  });
}
