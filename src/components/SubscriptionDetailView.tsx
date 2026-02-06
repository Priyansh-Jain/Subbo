'use client';

import React, { useMemo } from 'react';
import { ArrowLeft, ChevronDown, CreditCard, Clock } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import type { Subscription } from '@/lib/types';

interface SubscriptionDetailViewProps {
  subscription: Subscription;
  onBack?: () => void;
}

export function SubscriptionDetailView({ subscription, onBack }: SubscriptionDetailViewProps) {
  const renewalDate = useMemo(() => {
    if (!subscription.renewalDate) return null;
    return new Date(subscription.renewalDate);
  }, [subscription.renewalDate]);

  const daysLeft = useMemo(() => {
    if (typeof subscription.trialEndsIn === 'number') return subscription.trialEndsIn;
    if (!renewalDate) return null;
    return differenceInDays(renewalDate, new Date());
  }, [subscription.trialEndsIn, renewalDate]);

  const renewalLabel = renewalDate ? format(renewalDate, 'MMM d') : 'N/A';
  const avgDailyCost = (subscription.cost / 30).toFixed(2);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">Edit Details</h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-1">Monthly Cost</p>
            <p className="text-2xl font-bold">${subscription.cost.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-1">Renewal Date</p>
            <p className="text-2xl font-bold">{renewalLabel}</p>
            {daysLeft !== null && (
              <p className="text-[10px] text-emerald-500 font-bold mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {daysLeft} days left
              </p>
            )}
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-1">Avg. Daily Cost</p>
            <p className="text-2xl font-bold">${avgDailyCost}</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6 max-w-2xl">
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-sm font-medium">{subscription.category}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-sm font-medium capitalize">{subscription.status.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium">Visa ending in 4421</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes</label>
              <textarea
                className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                rows={3}
                placeholder="Add notes about this subscription..."
                defaultValue=""
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors">
              Save Changes
            </button>
            <button className="px-6 py-3 border border-slate-200 font-bold rounded-xl text-slate-500 hover:bg-slate-50 transition-all">
              Cancel Subscription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
