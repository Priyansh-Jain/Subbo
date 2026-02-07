'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Copy, Check, Plus, X } from 'lucide-react';
import { useTamboStreamStatus } from '@tambo-ai/react';

interface Member {
  name: string;
  share: number;
  percentage: number;
  isPaid?: boolean;
}

interface CostSplitCardProps {
  subscriptionName?: string;
  totalCost?: number;
  members?: Member[];
  splitType?: 'equal' | 'custom';
  currency?: string;
}

const MEMBER_COLORS = [
  '#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899',
  '#06b6d4', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6',
];

function SplitSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 animate-pulse">
      <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
      <div className="h-4 w-full bg-slate-100 rounded-full mb-4" />
      <div className="space-y-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-200 rounded-full" />
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="flex-1" />
            <div className="h-4 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CostSplitCard({
  subscriptionName,
  totalCost,
  members: initialMembers,
  splitType: initialSplitType,
  currency = '$',
}: CostSplitCardProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { streamStatus } = useTamboStreamStatus<Record<string, any>>();
  const [localMembers, setLocalMembers] = useState<Member[] | null>(null);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>(initialSplitType || 'equal');
  const [newMemberName, setNewMemberName] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const members = localMembers ?? initialMembers ?? [];
  const cost = totalCost ?? 0;

  // Recalculate equal split when members change
  const displayMembers = useMemo(() => {
    if (splitType === 'equal' && members.length > 0) {
      const share = Math.round((cost / members.length) * 100) / 100;
      const pct = Math.round(100 / members.length);
      return members.map(m => ({ ...m, share, percentage: pct }));
    }
    return members;
  }, [members, splitType, cost]);

  const addMember = useCallback(() => {
    const name = newMemberName.trim();
    if (!name) return;
    const updated = [...members, { name, share: 0, percentage: 0, isPaid: false }];
    if (splitType === 'equal') {
      const share = Math.round((cost / updated.length) * 100) / 100;
      const pct = Math.round(100 / updated.length);
      setLocalMembers(updated.map(m => ({ ...m, share, percentage: pct })));
    } else {
      setLocalMembers(updated);
    }
    setNewMemberName('');
    setShowInput(false);
  }, [newMemberName, members, splitType, cost]);

  const removeMember = useCallback((index: number) => {
    const updated = members.filter((_, i) => i !== index);
    if (splitType === 'equal' && updated.length > 0) {
      const share = Math.round((cost / updated.length) * 100) / 100;
      const pct = Math.round(100 / updated.length);
      setLocalMembers(updated.map(m => ({ ...m, share, percentage: pct })));
    } else {
      setLocalMembers(updated);
    }
  }, [members, splitType, cost]);

  const handleCopyLink = useCallback(() => {
    const names = displayMembers.map(m => `${m.name}: ${currency}${m.share.toFixed(2)}`).join('\n');
    const text = `Split for ${subscriptionName ?? 'Subscription'} (${currency}${cost.toFixed(2)}/mo):\n${names}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [displayMembers, subscriptionName, cost, currency]);

  if (streamStatus.isPending || !initialMembers) {
    return <SplitSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-slate-200 bg-white overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Split: {subscriptionName || 'Subscription'}
            </h3>
            <p className="text-xs text-slate-500">
              {currency}{cost.toFixed(2)}/mo &middot; {displayMembers.length} member{displayMembers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Split type toggle */}
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setSplitType('equal')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${
              splitType === 'equal' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            Equal
          </button>
          <button
            onClick={() => setSplitType('custom')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${
              splitType === 'custom' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Split bar visualization */}
      {displayMembers.length > 0 && (
        <div className="px-4 pt-3">
          <div className="flex rounded-full overflow-hidden h-3">
            {displayMembers.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ width: 0 }}
                animate={{ width: `${member.percentage}%` }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease: 'easeOut' }}
                className="h-full"
                style={{ backgroundColor: MEMBER_COLORS[i % MEMBER_COLORS.length] }}
                title={`${member.name}: ${member.percentage}%`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Member list */}
      <div className="px-4 py-3 space-y-2">
        <AnimatePresence>
          {displayMembers.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: MEMBER_COLORS[i % MEMBER_COLORS.length] }}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{member.name}</p>
                <p className="text-[10px] text-slate-400">{member.percentage}%</p>
              </div>

              {/* Amount */}
              <p className="text-xs font-bold text-slate-700 flex-shrink-0">
                {currency}{member.share.toFixed(2)}
              </p>

              {/* Paid badge */}
              {member.isPaid != null && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  member.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {member.isPaid ? 'Paid' : 'Pending'}
                </span>
              )}

              {/* Remove button */}
              {members.length > 1 && (
                <button
                  onClick={() => removeMember(i)}
                  className="w-5 h-5 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add member */}
        {showInput ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMember()}
              placeholder="Name..."
              className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
              autoFocus
            />
            <button
              onClick={addMember}
              disabled={!newMemberName.trim()}
              className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg disabled:bg-slate-200 disabled:text-slate-400"
            >
              Add
            </button>
            <button
              onClick={() => { setShowInput(false); setNewMemberName(''); }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Add member
          </button>
        )}
      </div>

      {/* Footer with copy link */}
      <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
        <p className="text-[10px] text-slate-400">
          Each pays {currency}{displayMembers.length > 0 ? displayMembers[0].share.toFixed(2) : '0.00'}/mo
        </p>
        <button
          onClick={handleCopyLink}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            copied
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy split'}
        </button>
      </div>
    </motion.div>
  );
}
