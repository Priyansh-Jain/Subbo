'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTamboStreamStatus } from '@tambo-ai/react';

interface SimSubscription {
 id: string;
 name: string;
 cost: number;
 logo: string;
 category: string;
 recommended: boolean;
}

interface SavingsSimulatorProps {
 subscriptions?: SimSubscription[];
 currentMonthlyTotal?: number;
}

function SimulatorSkeleton() {
 return (
 <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden animate-pulse">
 <div className="p-4 border-b border-slate-100">
 <div className="h-5 w-40 bg-slate-200 rounded" />
 </div>
 <div className="p-4 space-y-3">
 {[0, 1, 2, 3].map(i => (
 <div key={i} className="flex items-center gap-3">
 <div className="w-10 h-6 bg-slate-200 rounded-full" />
 <div className="h-4 w-24 bg-slate-200 rounded" />
 <div className="flex-1" />
 <div className="h-4 w-16 bg-slate-200 rounded" />
 </div>
 ))}
 </div>
 </div>
 );
}

const FUN_COMPARISONS = [
 { threshold: 5, emoji: '☕', label: 'coffees', unitCost: 5 },
 { threshold: 15, emoji: '🍕', label: 'pizzas', unitCost: 15 },
 { threshold: 50, emoji: '🎮', label: 'video games', unitCost: 60 },
 { threshold: 100, emoji: '🎧', label: 'AirPods', unitCost: 130 },
 { threshold: 300, emoji: '✈️', label: 'flights', unitCost: 350 },
 { threshold: 500, emoji: '📱', label: 'iPads', unitCost: 450 },
];

export function SavingsSimulator({
 subscriptions,
 currentMonthlyTotal,
}: SavingsSimulatorProps) {
 const { streamStatus } = useTamboStreamStatus<SavingsSimulatorProps>();

 // Track user's manual overrides as a map of id -> on/off.
 // AI-recommended cancellations come from the `recommended` prop.
 // Derived state avoids useEffect + setState entirely.
 const [userOverrides, setUserOverrides] = useState<Record<string, boolean>>({});

 const toggledOff = useMemo(() => {
 if (!subscriptions) return new Set<string>();
 const set = new Set<string>();
 for (const sub of subscriptions) {
 const override = userOverrides[sub.id];
 if (override !== undefined) {
 if (override) set.add(sub.id);
 } else if (sub.recommended) {
 set.add(sub.id);
 }
 }
 return set;
 }, [subscriptions, userOverrides]);

 const savings = useMemo(() => {
 if (!subscriptions) return { monthly: 0, yearly: 0, fiveYear: 0 };
 const monthly = subscriptions
 .filter(s => toggledOff.has(s.id))
 .reduce((sum, s) => sum + s.cost, 0);
 return {
 monthly: Math.round(monthly * 100) / 100,
 yearly: Math.round(monthly * 12 * 100) / 100,
 fiveYear: Math.round(monthly * 60 * 100) / 100,
 };
 }, [subscriptions, toggledOff]);

 const funComparison = useMemo(() => {
 if (savings.yearly <= 0) return null;
 const match = [...FUN_COMPARISONS].reverse().find(c => savings.yearly >= c.threshold);
 if (!match) return null;
 const count = Math.floor(savings.yearly / match.unitCost);
 if (count < 1) return null;
 return { ...match, count };
 }, [savings.yearly]);

 if (streamStatus.isPending || !subscriptions) {
 return <SimulatorSkeleton />;
 }

 const handleToggle = (id: string) => {
 const currentlyOff = toggledOff.has(id);
 setUserOverrides(prev => ({ ...prev, [id]: !currentlyOff }));
 };

 return (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4 }}
 className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
 >
 {/* Header */}
 <div className="px-4 py-3 border-b border-slate-100">
 <h3 className="text-sm font-bold text-slate-800">Savings Simulator</h3>
 <p className="text-xs text-slate-500">
 {currentMonthlyTotal !== undefined
 ? `Current total: $${currentMonthlyTotal.toFixed(2)}/mo — toggle off to save`
 : 'Toggle off subscriptions to see potential savings'}
 </p>
 </div>

 {/* Subscription toggles */}
 <div className="divide-y divide-slate-50">
 {subscriptions.map(sub => {
 const isOff = toggledOff.has(sub.id);
 return (
 <div
 key={sub.id}
 className={`px-4 py-3 flex items-center gap-3 transition-colors ${isOff ? 'bg-red-50/50' : ''}`}
 >
 {/* Toggle switch */}
 <button
 onClick={() => handleToggle(sub.id)}
 role="switch"
 aria-checked={!isOff}
 aria-label={`Toggle ${sub.name} subscription`}
 className={`relative w-10 h-6 rounded-full flex-shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 ${
 isOff ? 'bg-red-400' : 'bg-emerald-400'
 }`}
 >
 <motion.div
 animate={{ x: isOff ? 2 : 18 }}
 transition={{ type: 'spring', stiffness: 500, damping: 30 }}
 className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
 />
 </button>

 {/* Info */}
 <span className="text-sm flex-shrink-0">{sub.logo}</span>
 <div className="flex-1 min-w-0">
 <p className={`text-xs font-semibold truncate ${isOff ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
 {sub.name}
 </p>
 <p className="text-[10px] text-slate-400">{sub.category}</p>
 </div>
 <p className={`text-xs font-bold flex-shrink-0 ${isOff ? 'text-red-500 line-through' : 'text-slate-700'}`}>
 ${sub.cost.toFixed(2)}/mo
 </p>
 </div>
 );
 })}
 </div>

 {/* Savings summary */}
 {savings.monthly > 0 && (
 <div className="p-4 bg-emerald-50 border-t border-emerald-100">
 <div className="grid grid-cols-3 gap-3 text-center">
 <div>
 <p className="text-[10px] font-bold text-emerald-600 uppercase">Monthly</p>
 <p className="text-lg font-bold text-emerald-700">${savings.monthly.toFixed(0)}</p>
 </div>
 <div>
 <p className="text-[10px] font-bold text-emerald-600 uppercase">Yearly</p>
 <p className="text-lg font-bold text-emerald-700">${savings.yearly.toFixed(0)}</p>
 </div>
 <div>
 <p className="text-[10px] font-bold text-emerald-600 uppercase">5 Years</p>
 <p className="text-lg font-bold text-emerald-700">${savings.fiveYear.toFixed(0)}</p>
 </div>
 </div>

 {funComparison && (
 <div className="mt-3 text-center text-xs text-emerald-700 bg-emerald-100 rounded-lg py-2 px-3">
 <span className="text-base">{funComparison.emoji}</span>{' '}
 That&apos;s <strong>{funComparison.count} {funComparison.label}</strong> per year!
 </div>
 )}
 </div>
 )}

 {savings.monthly === 0 && (
 <div className="p-4 text-center text-xs text-slate-500 border-t border-slate-100">
 Toggle off subscriptions to see how much you could save
 </div>
 )}
 </motion.div>
 );
}
