/**
 * Module-level subscription store.
 *
 * Tambo tool functions run outside the React tree, so they cannot access
 * React state or context.  This store bridges the gap: the dashboard page
 * calls `setSubscriptions()` whenever its state changes, and the tool
 * functions call `getSubscriptions()` to read the latest real data.
 *
 * Falls back to `mockSubscriptions` from mockData.ts when no real data
 * has been pushed yet (e.g. before the dashboard mounts).
 */

import type { Subscription } from './types';
import { mockSubscriptions } from './mockData';

let _subscriptions: Subscription[] | null = null;

/** Push the current user subscriptions into the store. */
export function setSubscriptions(subs: Subscription[]): void {
    _subscriptions = subs;
}

/**
 * Read the current subscriptions.
 * Returns the real user subscriptions if available, otherwise falls back
 * to the mock data so tools still work before the dashboard loads.
 */
export function getSubscriptions(): Subscription[] {
    return _subscriptions ?? mockSubscriptions;
}
