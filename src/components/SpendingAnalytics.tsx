'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTamboStreamStatus } from '@tambo-ai/react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useSafeStreamStatus<T extends Record<string, any>>() {
 try {
 // eslint-disable-next-line react-hooks/rules-of-hooks
 return useTamboStreamStatus<T>();
 } catch {
 return { streamStatus: { isPending: false } };
 }
}

interface CategorySpend {
 category: string;
 amount: number;
 color: string;
 percentage: number;
}

interface MonthlyTrend {
 month: string;
 amount: number;
}

interface TopSubscription {
 name: string;
 cost: number;
 logo: string;
 percentage: number;
}

interface SpendingAnalyticsProps {
 categories?: CategorySpend[];
 monthlyTrends?: MonthlyTrend[];
 topSubscriptions?: TopSubscription[];
 totalMonthly?: number;
 monthOverMonthChange?: number;
}

function AnalyticsSkeleton() {
 return (
 <div className="space-y-4 animate-pulse">
 <div className="rounded-xl border border-slate-200 bg-white p-4">
 <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
 <div className="flex justify-center">
 <div className="w-40 h-40 rounded-full bg-slate-100" />
 </div>
 </div>
 <div className="rounded-xl border border-slate-200 bg-white p-4">
 <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
 <div className="flex gap-2 items-end justify-center h-32">
 {[60, 80, 50, 90, 70, 85].map((h, i) => (
 <div key={i} className="w-10 bg-slate-100 rounded-t" style={{ height: `${h}%` }} />
 ))}
 </div>
 </div>
 </div>
 );
}

export function SpendingAnalytics({
 categories,
 monthlyTrends,
 topSubscriptions,
 totalMonthly,
 monthOverMonthChange,
}: SpendingAnalyticsProps) {
 const { streamStatus } = useSafeStreamStatus<SpendingAnalyticsProps>();

 if (streamStatus.isPending || !categories) {
 return <AnalyticsSkeleton />;
 }

 return (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4 }}
 className="space-y-4"
 >
 {/* Donut Chart */}
 <div className="rounded-xl border border-slate-200 bg-white p-4">
 <h3 className="text-sm font-bold text-slate-800 mb-4">Spending by Category</h3>
 <div className="flex items-center gap-6">
 <div className="relative flex-shrink-0">
 <svg width="160" height="160" viewBox="0 0 160 160">
 {categories.map((cat, i) => {
 const total = categories.reduce((s, c) => s + c.percentage, 0) || 1;
 let offset = 0;
 for (let j = 0; j < i; j++) {
 offset += (categories[j].percentage / total) * 100;
 }
 const dashPct = (cat.percentage / total) * 100;
 const circumference = 2 * Math.PI * 60;
 const dashArray = `${(dashPct / 100) * circumference} ${circumference}`;
 const dashOffset = -((offset / 100) * circumference);

 return (
 <circle
 key={cat.category}
 cx="80"
 cy="80"
 r="60"
 fill="none"
 stroke={cat.color}
 strokeWidth="20"
 strokeDasharray={dashArray}
 strokeDashoffset={dashOffset}
 strokeLinecap="butt"
 transform="rotate(-90 80 80)"
 className="transition-all duration-500"
 />
 );
 })}
 <text x="80" y="74" textAnchor="middle" className="fill-slate-800 text-lg font-bold" fontSize="18">
 ${totalMonthly?.toFixed(0) ?? '0'}
 </text>
 <text x="80" y="92" textAnchor="middle" className="fill-slate-500" fontSize="10">
 per month
 </text>
 {monthOverMonthChange !== undefined && (
 <text
 x="80"
 y="106"
 textAnchor="middle"
 className={monthOverMonthChange < 0 ? 'fill-emerald-600' : 'fill-red-600'}
 fontSize="10"
 >
 {monthOverMonthChange > 0 ? '+' : ''}{monthOverMonthChange.toFixed(1)}%
 </text>
 )}
 </svg>
 </div>
 <div className="flex-1 space-y-1.5 min-w-0">
 {categories.map(cat => (
 <div key={cat.category} className="flex items-center gap-2">
 <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
 <span className="text-xs text-slate-600 flex-1 truncate">{cat.category}</span>
 <span className="text-xs font-medium text-slate-800">${cat.amount.toFixed(0)}</span>
 <span className="text-[10px] text-slate-400 w-8 text-right">{cat.percentage}%</span>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Bar Chart — 6-month trends */}
 {monthlyTrends && monthlyTrends.length > 0 && (
 <div className="rounded-xl border border-slate-200 bg-white p-4">
 <h3 className="text-sm font-bold text-slate-800 mb-4">Monthly Trends</h3>
 <div className="flex items-end gap-3 h-32">
 {(() => {
 const maxAmount = Math.max(...monthlyTrends.map(t => t.amount), 1);
 return monthlyTrends.map((trend, i) => {
 const heightPct = (trend.amount / maxAmount) * 100;
 const isLast = i === monthlyTrends.length - 1;
 return (
 <div key={trend.month} className="flex-1 flex flex-col items-center gap-1">
 <span className="text-[10px] font-medium text-slate-600">${trend.amount.toFixed(0)}</span>
 <motion.div
 initial={{ height: 0 }}
 animate={{ height: `${heightPct}%` }}
 transition={{ delay: i * 0.1, duration: 0.4 }}
 className={`w-full rounded-t-md ${isLast ? 'bg-emerald-500' : 'bg-slate-200'}`}
 style={{ minHeight: 4 }}
 />
 <span className="text-[10px] text-slate-400">{trend.month}</span>
 </div>
 );
 });
 })()}
 </div>
 </div>
 )}

 {/* Top 3 Subscriptions */}
 {topSubscriptions && topSubscriptions.length > 0 && (
 <div className="rounded-xl border border-slate-200 bg-white p-4">
 <h3 className="text-sm font-bold text-slate-800 mb-3">Top Subscriptions</h3>
 <div className="space-y-3">
 {topSubscriptions.map((sub, i) => (
 <div key={sub.name} className="flex items-center gap-3">
 <span className="text-sm font-bold text-slate-400 w-5">#{i + 1}</span>
 <span className="text-lg">{sub.logo}</span>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between mb-1">
 <span className="text-xs font-semibold text-slate-800 truncate">{sub.name}</span>
 <span className="text-xs font-bold text-slate-700">${sub.cost.toFixed(2)}/mo</span>
 </div>
 <div className="w-full bg-slate-100 rounded-full h-1.5">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${sub.percentage}%` }}
 transition={{ delay: i * 0.15, duration: 0.5 }}
 className="bg-emerald-500 h-1.5 rounded-full"
 />
 </div>
 </div>
 <span className="text-[10px] text-slate-400 w-8 text-right">{sub.percentage}%</span>
 </div>
 ))}
 </div>
 </div>
 )}
 </motion.div>
 );
}
