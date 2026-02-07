'use client';

import { useTamboStreamStatus, useTamboThreadInput } from '@tambo-ai/react';

/**
 * Safely access useTamboStreamStatus — returns a default when outside Tambo context.
 * Note: This wraps the hook call in a try/catch. While this is technically a Rules of Hooks
 * edge case, the Tambo context presence is stable for the component's lifetime, so the
 * hook call count never changes between renders.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useSafeStreamStatus<T extends Record<string, any>>() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useTamboStreamStatus<T>();
  } catch {
    return { streamStatus: { isPending: false, isStreaming: false } };
  }
}

/**
 * Safely access useTamboThreadInput — returns null when outside Tambo context.
 */
export function useSafeThreadInput() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useTamboThreadInput();
  } catch {
    return null;
  }
}
