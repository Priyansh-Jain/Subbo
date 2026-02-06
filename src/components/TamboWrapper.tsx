'use client';

import React from 'react';
import { TamboProvider } from '@tambo-ai/react';
import { tamboComponents, tamboTools, systemPrompt } from '@/lib/tamboConfig';

interface TamboWrapperProps {
  children: React.ReactNode;
}

export function TamboWrapper({ children }: TamboWrapperProps) {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  if (!apiKey) {
    console.warn('NEXT_PUBLIC_TAMBO_API_KEY not set - running in demo mode');
    return <>{children}</>;
  }

  return (
    <TamboProvider
      apiKey={apiKey}
      components={tamboComponents}
      tools={tamboTools}
      initialMessages={[
        {
          role: 'assistant',
          content: [{ type: 'text', text: systemPrompt }],
        },
      ]}
    >
      {children}
    </TamboProvider>
  );
}
