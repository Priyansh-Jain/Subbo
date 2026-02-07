'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useTamboStreamStatus, useTamboThreadInput } from '@tambo-ai/react';

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  subscriptionName: string;
  actionLabel: string;
  actionType: string;
}

interface AlertCardProps {
  alerts?: Alert[];
  title?: string;
  onAction?: (alert: Alert) => void;
}

/** Safely access useTamboThreadInput — returns null when outside Tambo context */
function useSafeThreadInput() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useTamboThreadInput();
  } catch {
    return null;
  }
}

const severityConfig = {
  critical: {
    border: 'border-red-300',
    bg: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
    descColor: 'text-red-600',
    btnBg: 'bg-red-600 hover:bg-red-700',
    Icon: AlertTriangle,
  },
  warning: {
    border: 'border-amber-300',
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-800',
    descColor: 'text-amber-600',
    btnBg: 'bg-amber-600 hover:bg-amber-700',
    Icon: AlertCircle,
  },
  info: {
    border: 'border-blue-300',
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-800',
    descColor: 'text-blue-600',
    btnBg: 'bg-blue-600 hover:bg-blue-700',
    Icon: Info,
  },
};

function AlertSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-3 w-48 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AlertCard({ alerts, title, onAction }: AlertCardProps) {
  const { streamStatus } = useTamboStreamStatus<AlertCardProps>();
  const threadInput = useSafeThreadInput();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleAction = (alert: Alert) => {
    if (onAction) {
      onAction(alert);
      return;
    }
    // In Tambo context: send a follow-up message to trigger AI response
    if (threadInput) {
      const actionMessage =
        alert.actionType === 'cancel'
          ? `Cancel ${alert.subscriptionName}`
          : `Review ${alert.subscriptionName}`;
      threadInput.setValue(actionMessage);
      // Submit after a tick so setValue propagates
      timerRef.current = setTimeout(() => threadInput.submit(), 50);
    }
  };

  if (streamStatus.isPending || !alerts) {
    return <AlertSkeleton />;
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
        <p className="text-sm font-medium text-emerald-700">All clear! No alerts right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-bold text-slate-800">{title}</h3>}
      {alerts.map((alert, index) => {
        const config = severityConfig[alert.severity] || severityConfig.info;
        const { Icon } = config;
        return (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className={`rounded-xl border ${config.border} ${config.bg} p-4`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${config.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${config.titleColor}`}>{alert.title}</p>
                <p className={`text-xs ${config.descColor} mt-0.5`}>{alert.description}</p>
                <p className="text-[10px] text-slate-500 mt-1">{alert.subscriptionName}</p>
              </div>
              <button
                onClick={() => handleAction(alert)}
                className={`px-3 py-1 ${config.btnBg} text-white text-[11px] font-bold rounded-lg flex-shrink-0 transition-colors`}
              >
                {alert.actionLabel}
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
