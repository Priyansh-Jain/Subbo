'use client';

import React, { useState, useCallback } from 'react';
import { Check, ListChecks } from 'lucide-react';
import { useTamboStreamStatus, useTamboComponentState } from '@tambo-ai/react';
import { useSubscriptionActions } from '@/contexts/SubscriptionContext';
import type { Subscription } from '@/lib/types';

interface DraftItem {
 name?: string;
 cost?: number;
 billingCycle?: 'monthly' | 'annual' | 'weekly';
 category?: string;
 logo?: string;
 confidenceScore?: number;
}

interface SubscriptionDraftListProps {
 drafts?: DraftItem[];
 sourceText?: string;
}

function Skeleton() {
 return (
 <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mt-3 animate-pulse">
 <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
 <div className="w-20 h-4 bg-slate-200 rounded" />
 </div>
 {[1, 2, 3].map((i) => (
 <div key={i} className="p-3 flex items-center gap-3 border-b border-slate-50 last:border-b-0">
 <div className="w-9 h-9 rounded-lg bg-slate-200" />
 <div className="flex-1 space-y-1.5">
 <div className="w-24 h-3.5 bg-slate-200 rounded" />
 <div className="w-16 h-3 bg-slate-100 rounded" />
 </div>
 <div className="w-12 h-3 bg-slate-100 rounded" />
 </div>
 ))}
 </div>
 );
}

function ConfidenceBar({ score }: { score: number }) {
 const pct = Math.round(score * 100);
 const color =
 score >= 0.8
 ? 'bg-emerald-500'
 : score >= 0.5
 ? 'bg-amber-400'
 : 'bg-red-400';

 return (
 <div className="flex items-center gap-1.5">
 <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
 <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
 </div>
 <span className="text-[10px] text-slate-400 font-medium w-7 text-right">{pct}%</span>
 </div>
 );
}

const BILLING_LABELS: Record<string, string> = {
 monthly: '/mo',
 annual: '/yr',
 weekly: '/wk',
};

export function SubscriptionDraftList({ drafts, sourceText }: SubscriptionDraftListProps) {
 const { streamStatus } = useTamboStreamStatus<SubscriptionDraftListProps>();
 const [currentDrafts, setCurrentDrafts] = useTamboComponentState(
 'drafts',
 drafts ?? [],
 drafts,
 );
 const actions = useSubscriptionActions();
 const [saved, setSaved] = useState(false);

 const effectiveDrafts: DraftItem[] = currentDrafts ?? [];
 const validDrafts = effectiveDrafts.filter((d) => d.name);

 const handleSave = useCallback(() => {
 if (!actions || validDrafts.length === 0) return;

 const converted: Subscription[] = validDrafts.map((d, i) => ({
 id: `draft-${Date.now()}-${i}`,
 name: d.name!,
 cost: d.cost ?? 0,
 status: 'active' as const,
 logo: d.logo ?? d.name!.charAt(0).toUpperCase(),
 category: d.category ?? 'Uncategorized',
 billingCycle: d.billingCycle ?? 'monthly',
 currency: 'USD',
 confidenceScore: d.confidenceScore,
 sourceText,
 }));

 actions.addMultipleSubscriptions(converted);
 setSaved(true);
 }, [actions, validDrafts, sourceText]);

 if (streamStatus.isPending) {
 return <Skeleton />;
 }

 if (saved) {
 return (
 <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mt-3 animate-in fade-in duration-300">
 <div className="flex items-start gap-3">
 <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
 <Check className="w-5 h-5 text-emerald-600" />
 </div>
 <div>
 <h3 className="font-bold text-emerald-900">Added to Dashboard!</h3>
 <p className="text-sm text-emerald-800/80 mt-1">
 Successfully tracked {validDrafts.length} subscription{validDrafts.length !== 1 ? 's' : ''}.
 </p>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mt-3 shadow-sm">
 {/* Header */}
 <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <ListChecks className="w-4 h-4 text-slate-500" />
 <h3 className="font-semibold text-slate-800 text-sm">Detected Subscriptions</h3>
 </div>
 {validDrafts.length > 0 && (
 <span className="text-[10px] font-medium text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-full">
 {validDrafts.length} found
 </span>
 )}
 </div>

 {/* Drafts List */}
 <div className="divide-y divide-slate-50">
 {validDrafts.map((draft, idx) => {
 const billing = BILLING_LABELS[draft.billingCycle ?? 'monthly'] ?? '/mo';
 return (
 <div key={idx} className="p-3 flex items-center gap-3">
 <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-base flex-shrink-0">
 {draft.logo ?? draft.name!.charAt(0)}
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-medium text-sm text-slate-900 truncate">{draft.name}</p>
 <div className="flex items-center gap-2 mt-0.5">
 <span className="text-xs font-semibold text-slate-600">
 ${(draft.cost ?? 0).toFixed(2)}{billing}
 </span>
 {draft.category && (
 <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
 {draft.category}
 </span>
 )}
 </div>
 </div>
 {draft.confidenceScore !== undefined && (
 <ConfidenceBar score={draft.confidenceScore} />
 )}
 </div>
 );
 })}
 </div>

 {/* Footer */}
 {validDrafts.length > 0 && (
 <div className="p-3 border-t border-slate-100 bg-slate-50">
 <button
 onClick={handleSave}
 disabled={!actions}
 className="w-full py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <Check className="w-4 h-4" />
 Add {validDrafts.length} to Dashboard
 </button>
 </div>
 )}
 </div>
 );
}
