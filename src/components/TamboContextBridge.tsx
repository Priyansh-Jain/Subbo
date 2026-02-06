'use client';

import { useEffect } from 'react';
import {
  useTamboContextHelpers,
  currentTimeContextHelper,
  currentPageContextHelper,
} from '@tambo-ai/react';
import type { Subscription } from '@/lib/types';

type FilterType = 'all' | 'active' | 'zombie' | 'renewal' | 'trialing';

interface TamboContextBridgeProps {
  activeFilter: FilterType;
  selectedSubscription: Subscription | null;
  totalSpending: number;
  potentialSavings: number;
  subscriptionCount: number;
  trialsEndingCount: number;
}

export function TamboContextBridge({
  activeFilter,
  selectedSubscription,
  totalSpending,
  potentialSavings,
  subscriptionCount,
  trialsEndingCount,
}: TamboContextBridgeProps) {
  const { addContextHelper, removeContextHelper } = useTamboContextHelpers();

  useEffect(() => {
    addContextHelper('uiState', () => ({
      activeFilter,
      selectedSubscription,
      totals: {
        totalSpending,
        potentialSavings,
        subscriptionCount,
        trialsEndingCount,
      },
    }));
    return () => removeContextHelper('uiState');
  }, [
    activeFilter,
    selectedSubscription,
    totalSpending,
    potentialSavings,
    subscriptionCount,
    trialsEndingCount,
    addContextHelper,
    removeContextHelper,
  ]);

  useEffect(() => {
    addContextHelper('currentTime', currentTimeContextHelper);
    addContextHelper('currentPage', currentPageContextHelper);
    return () => {
      removeContextHelper('currentTime');
      removeContextHelper('currentPage');
    };
  }, [addContextHelper, removeContextHelper]);

  return null;
}
