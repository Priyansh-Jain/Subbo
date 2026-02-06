'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useTamboStreamStatus } from '@tambo-ai/react';

interface CancellationStep {
  location: string;
  description: string;
  warning?: string;
}

interface CancellationRoadmapProps {
  serviceName?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'nightmare';
  steps?: CancellationStep[];
  legalScript?: string;
  directUrl?: string;
}

const difficultyConfig = {
  easy: { label: 'Easy', color: 'bg-green-100 text-green-700', bar: 'bg-green-500', width: '25%' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700', bar: 'bg-yellow-500', width: '50%' },
  hard: { label: 'Hard', color: 'bg-orange-100 text-orange-700', bar: 'bg-orange-500', width: '75%' },
  nightmare: { label: 'Nightmare', color: 'bg-red-100 text-red-700', bar: 'bg-red-500', width: '100%' },
};

function Skeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mt-3 animate-pulse">
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="h-6 w-16 rounded-full bg-slate-200" />
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CancellationRoadmap({
  serviceName,
  difficulty,
  steps,
  legalScript,
  directUrl,
}: CancellationRoadmapProps) {
  const [copied, setCopied] = useState(false);
  const { streamStatus } = useTamboStreamStatus<CancellationRoadmapProps>();

  if (streamStatus.isPending) {
    return <Skeleton />;
  }

  const config = difficulty ? difficultyConfig[difficulty] : null;

  const copyScript = async () => {
    if (!legalScript) return;
    try {
      await navigator.clipboard.writeText(legalScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = legalScript;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden mt-3"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900">
            {serviceName ? `Cancel ${serviceName}` : 'Cancellation Guide'}
          </h3>
          {config && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          )}
        </div>
        {config && (
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${config.bar} rounded-full`} style={{ width: config.width }} />
          </div>
        )}
      </div>

      {/* Steps */}
      {steps && steps.length > 0 && (
        <div className="p-4">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-3"
              >
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-px h-full bg-slate-200 my-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm font-medium text-slate-900">{step.location}</p>
                  <p className="text-sm text-slate-600 mt-0.5">{step.description}</p>
                  {step.warning && (
                    <div className="mt-2 flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">{step.warning}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Direct URL */}
      {directUrl && (
        <div className="px-4 pb-4">
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Go to Cancellation Page
          </a>
        </div>
      )}

      {/* Legal Script */}
      {legalScript && (
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">GDPR Legal Script</span>
            <button
              onClick={copyScript}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-sm transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-green-600 text-xs font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-600 text-xs font-medium">Copy Script</span>
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
            &ldquo;{legalScript}&rdquo;
          </p>
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            Use this script in support chat or email to bypass retention offers
          </p>
        </div>
      )}
    </motion.div>
  );
}
