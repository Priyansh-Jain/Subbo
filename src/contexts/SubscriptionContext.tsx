'use client';

import React, { createContext, useContext } from 'react';
import type { Subscription } from '@/lib/types';

interface SubscriptionActions {
  addSubscription: (sub: Subscription) => void;
  addMultipleSubscriptions: (subs: Subscription[]) => void;
  removeSubscription: (id: string) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
}

const SubscriptionActionsContext = createContext<SubscriptionActions | null>(null);

export function SubscriptionActionsProvider({
  children,
  actions,
}: {
  children: React.ReactNode;
  actions: SubscriptionActions;
}) {
  return (
    <SubscriptionActionsContext.Provider value={actions}>
      {children}
    </SubscriptionActionsContext.Provider>
  );
}

export function useSubscriptionActions(): SubscriptionActions | null {
  return useContext(SubscriptionActionsContext);
}
