'use client';

import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, Clock, Plus, X } from 'lucide-react';
import type { Subscription } from '@/lib/types';

interface ReviewSubscriptionsViewProps {
  subscriptions: Subscription[];
  onConfirm: (approvedSubs: Subscription[]) => void;
  onBack: () => void;
}

export function ReviewSubscriptionsView({
  subscriptions,
  onConfirm,
  onBack,
}: ReviewSubscriptionsViewProps) {
  const [stagedIds, setStagedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleSubs = useMemo(
    () => subscriptions.filter(s => !dismissedIds.has(s.id)),
    [subscriptions, dismissedIds],
  );

  const pendingCount = visibleSubs.filter(s => !stagedIds.has(s.id)).length;

  const handleAdd = (id: string) => {
    setStagedIds(prev => new Set(prev).add(id));
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
    setStagedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleApproveAll = () => {
    setStagedIds(new Set(visibleSubs.map(s => s.id)));
  };

  const handleConfirm = () => {
    const approved = subscriptions.filter(s => stagedIds.has(s.id));
    if (approved.length > 0) onConfirm(approved);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-bold text-slate-900">Review Subscriptions</h2>
          {pendingCount > 0 && (
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {pendingCount} Pending
            </span>
          )}
        </div>
        {visibleSubs.length > 0 && (
          <button
            onClick={handleApproveAll}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Approve All
          </button>
        )}
      </div>

      {/* Subscription List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/30">
        {visibleSubs.length > 0 ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-100">
                {visibleSubs.map((sub) => {
                  const isStaged = stagedIds.has(sub.id);
                  return (
                    <div
                      key={sub.id}
                      className="p-4 flex items-center gap-4"
                    >
                      {/* Icon */}
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                        {sub.logo}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-slate-900 truncate">
                          {sub.name}
                        </h4>
                        <div className="mt-0.5 flex items-center gap-3">
                          <span className="text-xs font-medium text-slate-600">
                            ${sub.cost.toFixed(2)}/mo
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Monthly
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isStaged ? (
                          <div className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded">
                            <Check className="w-3 h-3" />
                            Added
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAdd(sub.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded shadow-sm transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Add
                          </button>
                        )}
                        <button
                          onClick={() => handleDismiss(sub.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Confirm Button */}
            {stagedIds.size > 0 && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow transition-colors"
                >
                  Confirm {stagedIds.size} Addition{stagedIds.size !== 1 ? 's' : ''}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-slate-500">All subscriptions have been dismissed.</p>
            <button
              onClick={onBack}
              className="mt-3 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Go back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
