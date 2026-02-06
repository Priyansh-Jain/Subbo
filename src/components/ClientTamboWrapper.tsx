'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const TamboWrapper = dynamic(
  () => import('@/components/TamboWrapper').then(m => ({ default: m.TamboWrapper })),
  { ssr: false }
);

export function ClientTamboWrapper({ children }: { children: React.ReactNode }) {
  return <TamboWrapper>{children}</TamboWrapper>;
}
