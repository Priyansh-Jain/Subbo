'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, TrendingDown, AlertTriangle } from 'lucide-react';
import { useTamboStreamStatus } from '@tambo-ai/react';

interface MetricCardsProps {
  totalSpending?: number;
  subscriptionCount?: number;
  potentialSavings?: number;
  upcomingRenewals?: number;
}

function SkeletonCard() {
  return (
    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 rounded bg-slate-200" />
        <div className="h-3 w-20 rounded bg-slate-200" />
      </div>
      <div className="h-8 w-24 rounded bg-slate-200" />
    </div>
  );
}

export function MetricCards({
  totalSpending,
  subscriptionCount,
  potentialSavings,
  upcomingRenewals,
}: MetricCardsProps) {
  const { streamStatus } = useTamboStreamStatus<MetricCardsProps>();

  if (streamStatus.isPending) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const cards = [
    {
      label: 'Monthly Spending',
      value: totalSpending != null ? `$${totalSpending.toFixed(2)}` : '—',
      icon: CreditCard,
      color: 'text-slate-600',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
    },
    {
      label: 'Active Subscriptions',
      value: subscriptionCount != null ? subscriptionCount.toString() : '—',
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Potential Savings',
      value: potentialSavings != null ? `$${potentialSavings.toFixed(2)}` : '—',
      icon: TrendingDown,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-100',
      highlight: (potentialSavings ?? 0) > 0,
    },
    {
      label: 'Renewals (7 days)',
      value: upcomingRenewals != null ? upcomingRenewals.toString() : '—',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      highlight: (upcomingRenewals ?? 0) > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`p-4 rounded-2xl border ${card.border} ${card.bg} transition-all hover:shadow-sm`}
        >
          <div className="flex items-center gap-2 mb-2">
            <card.icon className={`w-4 h-4 ${card.color}`} />
            <span className="text-xs font-medium text-slate-500">{card.label}</span>
          </div>
          <div className={`text-2xl font-bold ${card.highlight ? card.color : 'text-slate-900'}`}>
            {card.value}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
