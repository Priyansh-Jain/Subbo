'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ArrowLeft, Clock, Check, Trash2 } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { useSubscriptionActions } from '@/contexts/SubscriptionContext';
import type { Subscription, SubscriptionStatus } from '@/lib/types';

interface SubscriptionDetailViewProps {
 subscription: Subscription;
 onBack?: () => void;
}

const STATUS_OPTIONS: { value: SubscriptionStatus; label: string }[] = [
 { value: 'active', label: 'Active' },
 { value: 'zombie', label: 'Zombie' },
 { value: 'trial_ending', label: 'Trial Ending' },
 { value: 'price_hike', label: 'Price Hike' },
];

const CATEGORY_OPTIONS = [
 'Entertainment', 'Music', 'Productivity', 'AI Tools', 'Software',
 'Fitness', 'Professional', 'Design', 'Cloud', 'Storage',
 'Health', 'Developer', 'Security', 'Education', 'Shopping', 'Other',
];

const BILLING_OPTIONS: { value: string; label: string }[] = [
 { value: 'monthly', label: 'Monthly' },
 { value: 'annual', label: 'Annual' },
 { value: 'weekly', label: 'Weekly' },
];

export function SubscriptionDetailView({ subscription, onBack }: SubscriptionDetailViewProps) {
 const actions = useSubscriptionActions();

 const [cost, setCost] = useState(subscription.cost.toString());
 const [category, setCategory] = useState(subscription.category);
 const [status, setStatus] = useState<SubscriptionStatus>(subscription.status);
 const [billing, setBilling] = useState<'monthly' | 'annual' | 'weekly'>(subscription.billingCycle ?? 'monthly');
 const [saved, setSaved] = useState(false);
 const [confirmCancel, setConfirmCancel] = useState(false);
 const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

 useEffect(() => {
 return () => {
 if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
 };
 }, []);

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
 const costNum = parseFloat(cost) || 0;
 const avgDailyCost = (costNum / 30).toFixed(2);

 const hasChanges =
 costNum !== subscription.cost ||
 category !== subscription.category ||
 status !== subscription.status ||
 billing !== (subscription.billingCycle ?? 'monthly');

 const handleSave = () => {
 if (!actions || !hasChanges) return;
 actions.updateSubscription(subscription.id, {
 cost: costNum,
 category,
 status,
 billingCycle: billing as Subscription['billingCycle'],
 });
 setSaved(true);
 savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
 };

 const handleCancelSubscription = () => {
 if (!confirmCancel) {
 setConfirmCancel(true);
 return;
 }
 if (actions) {
 actions.removeSubscription(subscription.id);
 }
 onBack?.();
 };

 return (
 <div className="flex flex-col h-full bg-white">
 {/* Header */}
 <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-4">
 <button
 onClick={onBack}
 aria-label="Go back"
 className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
 >
 <ArrowLeft className="w-4 h-4" />
 </button>
 <div className="flex-1">
 <h2 className="text-lg font-bold text-slate-900">{subscription.name}</h2>
 <p className="text-xs text-slate-500">Edit subscription details</p>
 </div>
 <span className="text-2xl">{subscription.logo}</span>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
 {/* Metrics Grid */}
 <div className="grid grid-cols-3 gap-3">
 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
 <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-1">Monthly Cost</p>
 <p className="text-2xl font-bold text-slate-900">${costNum.toFixed(2)}</p>
 </div>
 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
 <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-1">Next Renewal</p>
 <p className="text-2xl font-bold text-slate-900">{renewalLabel}</p>
 {daysLeft !== null && (
 <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
 <Clock className="w-3 h-3" /> {daysLeft}d left
 </p>
 )}
 </div>
 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
 <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-1">Daily Avg</p>
 <p className="text-2xl font-bold text-slate-900">${avgDailyCost}</p>
 </div>
 </div>

 {/* Form Fields */}
 <div className="space-y-4">
 {/* Cost */}
 <div className="flex flex-col gap-1.5">
 <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Monthly Cost ($)</label>
 <input
 type="number"
 step="0.01"
 min="0"
 value={cost}
 onChange={(e) => setCost(e.target.value)}
 className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
 />
 </div>

 {/* Category & Billing side-by-side */}
 <div className="grid grid-cols-2 gap-3">
 <div className="flex flex-col gap-1.5">
 <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
 <select
 value={category}
 onChange={(e) => setCategory(e.target.value)}
 className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
 >
 {CATEGORY_OPTIONS.map(c => (
 <option key={c} value={c}>{c}</option>
 ))}
 {!CATEGORY_OPTIONS.includes(category) && (
 <option value={category}>{category}</option>
 )}
 </select>
 </div>

 <div className="flex flex-col gap-1.5">
 <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Billing Cycle</label>
 <select
 value={billing}
 onChange={(e) => setBilling(e.target.value as 'monthly' | 'annual' | 'weekly')}
 className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
 >
 {BILLING_OPTIONS.map(b => (
 <option key={b.value} value={b.value}>{b.label}</option>
 ))}
 </select>
 </div>
 </div>

 {/* Status */}
 <div className="flex flex-col gap-1.5">
 <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
 <select
 value={status}
 onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
 className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
 >
 {STATUS_OPTIONS.map(s => (
 <option key={s.value} value={s.value}>{s.label}</option>
 ))}
 </select>
 </div>
 </div>

 {/* Action Buttons */}
 <div className="space-y-3 pt-2">
 <button
 onClick={handleSave}
 disabled={!hasChanges || !actions}
 className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
 saved
 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
 : hasChanges
 ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20'
 : 'bg-slate-100 text-slate-400 cursor-not-allowed'
 }`}
 >
 <Check className="w-4 h-4" />
 {saved ? 'Saved!' : 'Save Changes'}
 </button>

 <button
 onClick={handleCancelSubscription}
 onMouseLeave={() => setConfirmCancel(false)}
 className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
 confirmCancel
 ? 'bg-red-600 text-white hover:bg-red-700'
 : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
 }`}
 >
 <Trash2 className="w-4 h-4" />
 {confirmCancel ? 'Confirm Removal' : 'Remove Subscription'}
 </button>
 </div>
 </div>
 </div>
 );
}
