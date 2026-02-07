'use client';

import React, { createContext, useContext } from 'react';
import type { Subscription } from '@/lib/types';

interface SubscriptionActions {
  addSubscription: (sub: Subscription) => void;
  addMultipleSubscriptions: (subs: Subscription[]) => void;
  removeSubscription: (id: string) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  requestCancellation: (sub: Subscription) => void;
  clearPendingCancellation: () => void;
}

const SubscriptionActionsContext = createContext<SubscriptionActions | null>(null);
const SubscriptionListContext = createContext<Subscription[]>([]);
const PendingCancellationContext = createContext<Subscription | null>(null);

export function SubscriptionActionsProvider({
  children,
  actions,
  subscriptions,
  pendingCancellation,
}: {
  children: React.ReactNode;
  actions: SubscriptionActions;
  subscriptions: Subscription[];
  pendingCancellation: Subscription | null;
}) {
  return (
    <SubscriptionActionsContext.Provider value={actions}>
      <SubscriptionListContext.Provider value={subscriptions}>
        <PendingCancellationContext.Provider value={pendingCancellation}>
          {children}
        </PendingCancellationContext.Provider>
      </SubscriptionListContext.Provider>
    </SubscriptionActionsContext.Provider>
  );
}

export function useSubscriptionActions(): SubscriptionActions | null {
  return useContext(SubscriptionActionsContext);
}

export function useSubscriptionList(): Subscription[] {
  return useContext(SubscriptionListContext);
}

export function usePendingCancellation(): Subscription | null {
  return useContext(PendingCancellationContext);
}
