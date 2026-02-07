'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useTamboStreamStatus, useTamboComponentState } from '@tambo-ai/react';
import { useSubscriptionActions, useSubscriptionList } from '@/contexts/SubscriptionContext';

interface CancellationStagingCardProps {
 subscriptionId?: string;
 serviceName?: string;
 currentCost?: number;
 reason?: string;
 status?: 'draft' | 'pending_api' | 'cancelled';
 warningMessage?: string;
}

function CancellationSkeleton() {
 return (
 <div className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse mt-3">
 <div className="flex items-start gap-3">
 <div className="w-8 h-8 rounded-lg bg-slate-200" />
 <div className="flex-1 space-y-2">
 <div className="h-4 w-40 bg-slate-200 rounded" />
 <div className="h-3 w-56 bg-slate-100 rounded" />
 <div className="h-3 w-32 bg-slate-100 rounded" />
 </div>
 </div>
 <div className="mt-4 h-9 w-full bg-slate-200 rounded-xl" />
 </div>
 );
}

export function CancellationStagingCard({
 subscriptionId,
 serviceName,
 currentCost,
 reason,
 status,
 warningMessage,
}: CancellationStagingCardProps) {
 const { streamStatus } = useTamboStreamStatus<CancellationStagingCardProps>();
 const [currentStatus, setCurrentStatus] = useTamboComponentState(
 'status',
 status ?? 'draft',
 status,
 );
 const actions = useSubscriptionActions();
 const allSubscriptions = useSubscriptionList();
 const [confirming, setConfirming] = useState(false);
 const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const hasSentCancellationRef = useRef(false);

 // Cleanup timeout on unmount
 useEffect(() => {
 return () => {
 if (timerRef.current) clearTimeout(timerRef.current);
 };
 }, []);

 const effectiveStatus = currentStatus ?? 'draft';

 // When card renders in draft state and streaming is done, signal the center panel
 useEffect(() => {
 if (streamStatus.isPending || effectiveStatus !== 'draft' || hasSentCancellationRef.current) return;
 if (!actions || !serviceName) return;

 const byId = subscriptionId && allSubscriptions.find(s => s.id === subscriptionId);
 const match = byId || allSubscriptions.find(
 s => s.name.toLowerCase() === serviceName.toLowerCase()
 );

 if (match) {
 hasSentCancellationRef.current = true;
 actions.requestCancellation(match);
 }
 }, [streamStatus.isPending, effectiveStatus, actions, serviceName, subscriptionId, allSubscriptions]);

 const handleConfirm = useCallback(() => {
 if (confirming) return;
 setConfirming(true);
 setCurrentStatus('pending_api');

 timerRef.current = setTimeout(() => {
 if (actions) {
 const byId = subscriptionId && allSubscriptions.find(s => s.id === subscriptionId);
 const match = byId || (serviceName && allSubscriptions.find(
 s => s.name.toLowerCase() === serviceName.toLowerCase()
 ));
 if (match) {
 actions.removeSubscription(match.id);
 actions.clearPendingCancellation();
 }
 }
 setCurrentStatus('cancelled');
 setConfirming(false);
 }, 1500);
 }, [confirming, actions, subscriptionId, serviceName, allSubscriptions, setCurrentStatus]);

 if (streamStatus.isPending || (!serviceName && !subscriptionId)) {
 return <CancellationSkeleton />;
 }

 return (
 <AnimatePresence mode="wait">
 {effectiveStatus === 'draft' && (
 <motion.div
 key="draft"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 transition={{ duration: 0.3 }}
 className="rounded-2xl border-2 border-amber-300 bg-amber-50 overflow-hidden mt-3 shadow-sm"
 >
 {/* Header */}
 <div className="px-4 py-3 border-b border-amber-200 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
 <AlertTriangle className="w-4 h-4 text-amber-600" />
 </div>
 <div>
 <h3 className="font-semibold text-amber-900 text-sm">Cancel Subscription</h3>
 <p className="text-[10px] text-amber-600 font-medium">Draft — Waiting for approval</p>
 </div>
 </div>
 <span className="text-[10px] font-bold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-full uppercase tracking-wide">
 Draft
 </span>
 </div>

 {/* Body */}
 <div className="p-4 space-y-3">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm font-bold text-amber-900">{serviceName ?? 'Unknown Service'}</p>
 {currentCost !== undefined && (
 <p className="text-xs text-amber-700 mt-0.5">${currentCost.toFixed(2)}/mo</p>
 )}
 </div>
 <XCircle className="w-5 h-5 text-amber-400" />
 </div>

 {reason && (
 <div className="bg-amber-100/60 rounded-lg px-3 py-2">
 <p className="text-[10px] font-medium text-amber-600 uppercase tracking-wide mb-0.5">Reason</p>
 <p className="text-xs text-amber-800">{reason}</p>
 </div>
 )}

 {warningMessage && (
 <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start gap-2">
 <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
 <p className="text-xs text-red-700">{warningMessage}</p>
 </div>
 )}

 <button
 onClick={handleConfirm}
 className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2"
 >
 <XCircle className="w-4 h-4" />
 Confirm Cancellation
 </button>
 </div>
 </motion.div>
 )}

 {effectiveStatus === 'pending_api' && (
 <motion.div
 key="pending"
 initial={{ opacity: 0, scale: 0.98 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.98 }}
 transition={{ duration: 0.3 }}
 className="rounded-2xl border-2 border-slate-300 bg-slate-50 overflow-hidden mt-3 shadow-sm"
 >
 <div className="p-6 flex flex-col items-center justify-center gap-3">
 <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
 <div className="text-center">
 <p className="text-sm font-semibold text-slate-700">Cancelling {serviceName}...</p>
 <p className="text-xs text-slate-500 mt-1">Processing your request</p>
 </div>
 </div>
 </motion.div>
 )}

 {effectiveStatus === 'cancelled' && (
 <motion.div
 key="cancelled"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 transition={{ duration: 0.3 }}
 className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 overflow-hidden mt-3 shadow-sm"
 >
 {/* Header */}
 <div className="px-4 py-3 border-b border-emerald-200 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
 <CheckCircle className="w-4 h-4 text-emerald-600" />
 </div>
 <div>
 <h3 className="font-semibold text-emerald-900 text-sm">Subscription Cancelled</h3>
 <p className="text-[10px] text-emerald-600 font-medium">Successfully processed</p>
 </div>
 </div>
 <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded-full uppercase tracking-wide">
 Cancelled
 </span>
 </div>

 {/* Body */}
 <div className="p-4">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm font-bold text-emerald-900 line-through">{serviceName ?? 'Unknown Service'}</p>
 {currentCost !== undefined && (
 <p className="text-xs text-emerald-700 line-through mt-0.5">${currentCost.toFixed(2)}/mo</p>
 )}
 </div>
 <CheckCircle className="w-5 h-5 text-emerald-500" />
 </div>
 {currentCost !== undefined && currentCost > 0 && (
 <div className="mt-3 bg-emerald-100/60 rounded-lg px-3 py-2">
 <p className="text-xs text-emerald-800 font-medium">
 You&apos;ll save <span className="font-bold">${currentCost.toFixed(2)}/mo</span> ({`$${(currentCost * 12).toFixed(2)}/yr`})
 </p>
 </div>
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 );
}
