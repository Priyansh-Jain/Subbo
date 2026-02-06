'use client';

import React from 'react';
import { Check, Calendar, Tag } from 'lucide-react';
import type { Subscription } from '@/lib/types';

interface ReviewCardProps {
  subscriptions: Subscription[];
  onApprove: (subs: Subscription[]) => void;
  onDecline: () => void;
  isApproved?: boolean;
}

export function ReviewCard({ subscriptions, onApprove, onDecline, isApproved = false }: ReviewCardProps) {
  const totalCost = subscriptions.reduce((sum, sub) => sum + sub.cost, 0);

  if (isApproved) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 animate-in fade-in duration-300">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Check className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-900">Subscriptions Added!</h3>
            <p className="text-sm text-emerald-800/80 mt-1">
              Successfully tracked {subscriptions.length} services totaling <strong>${totalCost.toFixed(2)}/mo</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 text-sm">Review Suggestions</h3>
        <span className="text-xs font-medium text-slate-500 bg-slate-200/50 px-2 py-1 rounded-full">
          {subscriptions.length} detected
        </span>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto custom-scrollbar">
        {subscriptions.map((sub) => (
          <div key={sub.id} className="p-3 hover:bg-slate-50/50 transition-colors flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg shadow-sm border border-slate-100/50">
              {sub.logo}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="font-medium text-slate-900 truncate">{sub.name}</p>
                <p className="font-bold text-slate-900 text-sm">${sub.cost.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {sub.category}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Monthly
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="bg-slate-50 p-3 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs text-slate-500 font-medium">TOTAL MONTHLY COST</span>
          <span className="font-bold text-slate-900">${totalCost.toFixed(2)}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onDecline}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            Discard
          </button>
          <button 
            onClick={() => onApprove(subscriptions)}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Approve All
          </button>
        </div>
      </div>
    </div>
  );
}
