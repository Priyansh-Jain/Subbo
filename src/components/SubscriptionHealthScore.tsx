'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Skull, DollarSign, Clock, LayoutGrid, XCircle, ArrowDown, Eye, CheckCircle } from 'lucide-react';
import { useSafeStreamStatus } from '@/lib/tamboSafeHooks';

interface Recommendation {
 type?: 'cancel' | 'downgrade' | 'watch' | 'good';
 message?: string;
 subscriptionName?: string;
 potentialSavings?: number;
}

interface Metrics {
 zombieRatio?: number;
 costEfficiency?: number;
 trialRisk?: number;
 categoryDiversity?: number;
}

interface SubscriptionHealthScoreProps {
 overallScore?: number;
 grade?: 'A' | 'B' | 'C' | 'D' | 'F';
 metrics?: Metrics;
 recommendations?: Recommendation[];
 totalMonthly?: number;
 subscriptionCount?: number;
}

const GRADE_COLORS: Record<string, { stroke: string; text: string; bg: string }> = {
 A: { stroke: '#10b981', text: 'text-emerald-600', bg: 'bg-emerald-50' },
 B: { stroke: '#22c55e', text: 'text-green-600', bg: 'bg-green-50' },
 C: { stroke: '#eab308', text: 'text-yellow-600', bg: 'bg-yellow-50' },
 D: { stroke: '#f97316', text: 'text-orange-600', bg: 'bg-orange-50' },
 F: { stroke: '#ef4444', text: 'text-red-600', bg: 'bg-red-50' },
};

const REC_CONFIG = {
 cancel: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700' },
 downgrade: { icon: ArrowDown, color: 'text-amber-500', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
 watch: { icon: Eye, color: 'text-blue-500', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
 good: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700' },
};

function HealthSkeleton() {
 return (
 <div className="rounded-xl border border-slate-200 bg-white p-6 animate-pulse">
 <div className="flex justify-center mb-6">
 <div className="w-32 h-32 rounded-full bg-slate-200" />
 </div>
 <div className="grid grid-cols-2 gap-3 mb-4">
 {[0, 1, 2, 3].map(i => (
 <div key={i} className="h-16 bg-slate-100 rounded-xl" />
 ))}
 </div>
 <div className="space-y-2">
 {[0, 1].map(i => (
 <div key={i} className="h-10 bg-slate-100 rounded-lg" />
 ))}
 </div>
 </div>
 );
}

function CircularGauge({ score, grade }: { score: number; grade: string }) {
 const radius = 54;
 const circumference = 2 * Math.PI * radius;
 const progress = (Math.max(0, Math.min(100, score)) / 100) * circumference;
 const colors = GRADE_COLORS[grade] || GRADE_COLORS.C;

 return (
 <div className="relative w-36 h-36 mx-auto">
 <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
 {/* Background track */}
 <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
 {/* Score arc */}
 <motion.circle
 cx="60"
 cy="60"
 r={radius}
 fill="none"
 stroke={colors.stroke}
 strokeWidth="8"
 strokeLinecap="round"
 strokeDasharray={circumference}
 initial={{ strokeDashoffset: circumference }}
 animate={{ strokeDashoffset: circumference - progress }}
 transition={{ duration: 1.2, ease: 'easeOut' }}
 />
 </svg>
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <motion.span
 className="text-3xl font-bold text-slate-800"
 initial={{ opacity: 0, scale: 0.5 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: 0.5, duration: 0.4 }}
 >
 {score}
 </motion.span>
 <span className={`text-sm font-bold ${colors.text}`}>Grade {grade}</span>
 </div>
 </div>
 );
}

export function SubscriptionHealthScore({
 overallScore,
 grade,
 metrics,
 recommendations,
 totalMonthly,
 subscriptionCount,
}: SubscriptionHealthScoreProps) {
 const { streamStatus } = useSafeStreamStatus();

 const metricCards = useMemo(() => {
 if (!metrics) return [];
 return [
 {
 label: 'Zombie Ratio',
 value: metrics.zombieRatio != null ? `${metrics.zombieRatio}%` : '—',
 icon: Skull,
 color: (metrics.zombieRatio ?? 0) > 30 ? 'text-red-500' : 'text-emerald-500',
 bg: (metrics.zombieRatio ?? 0) > 30 ? 'bg-red-50' : 'bg-emerald-50',
 },
 {
 label: 'Cost Efficiency',
 value: metrics.costEfficiency != null ? `${metrics.costEfficiency}/100` : '—',
 icon: DollarSign,
 color: (metrics.costEfficiency ?? 0) > 60 ? 'text-emerald-500' : 'text-amber-500',
 bg: (metrics.costEfficiency ?? 0) > 60 ? 'bg-emerald-50' : 'bg-amber-50',
 },
 {
 label: 'Trial Risk',
 value: metrics.trialRisk != null ? `${metrics.trialRisk} trial${metrics.trialRisk !== 1 ? 's' : ''}` : '—',
 icon: Clock,
 color: (metrics.trialRisk ?? 0) > 0 ? 'text-red-500' : 'text-emerald-500',
 bg: (metrics.trialRisk ?? 0) > 0 ? 'bg-red-50' : 'bg-emerald-50',
 },
 {
 label: 'Diversity',
 value: metrics.categoryDiversity != null ? `${metrics.categoryDiversity}/100` : '—',
 icon: LayoutGrid,
 color: (metrics.categoryDiversity ?? 0) > 50 ? 'text-emerald-500' : 'text-amber-500',
 bg: (metrics.categoryDiversity ?? 0) > 50 ? 'bg-emerald-50' : 'bg-amber-50',
 },
 ];
 }, [metrics]);

 if (streamStatus.isPending || overallScore == null || !grade) {
 return <HealthSkeleton />;
 }

 const gradeColors = GRADE_COLORS[grade] || GRADE_COLORS.C;

 return (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4 }}
 className="rounded-xl border border-slate-200 bg-white overflow-hidden"
 >
 {/* Header */}
 <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
 <div>
 <h3 className="text-sm font-bold text-slate-800">Subscription Health Score</h3>
 {subscriptionCount != null && totalMonthly != null && (
 <p className="text-xs text-slate-500">{subscriptionCount} subs &middot; ${totalMonthly.toFixed(2)}/mo</p>
 )}
 </div>
 <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${gradeColors.bg} ${gradeColors.text}`}>
 {grade}
 </div>
 </div>

 {/* Gauge */}
 <div className="py-5">
 <CircularGauge score={overallScore} grade={grade} />
 </div>

 {/* Metric cards */}
 {metricCards.length > 0 && (
 <div className="px-4 pb-4 grid grid-cols-2 gap-2">
 {metricCards.map((card, i) => {
 const Icon = card.icon;
 return (
 <motion.div
 key={card.label}
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
 className={`rounded-xl ${card.bg} p-3`}
 >
 <div className="flex items-center gap-2 mb-1">
 <Icon className={`w-3.5 h-3.5 ${card.color}`} />
 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{card.label}</span>
 </div>
 <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
 </motion.div>
 );
 })}
 </div>
 )}

 {/* Recommendations */}
 {recommendations && recommendations.length > 0 && (
 <div className="border-t border-slate-100 px-4 py-3 space-y-2">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommendations</p>
 {recommendations.map((rec, i) => {
 const config = REC_CONFIG[rec.type || 'watch'];
 const Icon = config.icon;
 return (
 <motion.div
 key={i}
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
 className={`flex items-start gap-2.5 p-2.5 rounded-lg ${config.bg}`}
 >
 <Icon className={`w-4 h-4 ${config.color} flex-shrink-0 mt-0.5`} />
 <div className="flex-1 min-w-0">
 <p className="text-xs text-slate-700">{rec.message}</p>
 {rec.subscriptionName && (
 <p className="text-[10px] text-slate-500 mt-0.5">{rec.subscriptionName}</p>
 )}
 </div>
 {rec.potentialSavings != null && rec.potentialSavings > 0 && (
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${config.badge}`}>
 -${rec.potentialSavings.toFixed(0)}/mo
 </span>
 )}
 </motion.div>
 );
 })}
 </div>
 )}
 </motion.div>
 );
}
