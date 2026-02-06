'use client';

import React, { useMemo, useState } from 'react';
import {
  Check,
  LayoutGrid,
  Moon,
  MonitorPlay,
  Music,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import { TamboChat } from '@/components/TamboChat';
import { TamboContextBridge } from '@/components/TamboContextBridge';
import { SubscriptionDetailView } from '@/components/SubscriptionDetailView';
import type { Subscription } from '@/lib/types';

type FilterType = 'all' | 'active' | 'zombie' | 'renewal' | 'trialing';

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'expenses', label: 'Expenses' },
] as const;

type TabId = (typeof tabs)[number]['id'];

const CATEGORY_DOT_COLORS: Record<string, string> = {
  Entertainment: 'bg-blue-400',
  Music: 'bg-green-400',
  Productivity: 'bg-purple-400',
  'AI Tools': 'bg-emerald-400',
  Software: 'bg-indigo-400',
  Fitness: 'bg-orange-400',
  Professional: 'bg-sky-400',
  Design: 'bg-pink-400',
  Cloud: 'bg-cyan-400',
  Storage: 'bg-slate-400',
  Health: 'bg-teal-400',
  Developer: 'bg-violet-400',
  Security: 'bg-amber-400',
  Education: 'bg-lime-400',
  Shopping: 'bg-rose-400',
};

export default function Home() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const hasTambo = Boolean(process.env.NEXT_PUBLIC_TAMBO_API_KEY);

  const addSubscription = (sub: Subscription) => {
    setSubscriptions(prev => {
      if (prev.some(s => s.name.toLowerCase() === sub.name.toLowerCase())) return prev;
      return [...prev, sub];
    });
  };

  const addMultipleSubscriptions = (subs: Subscription[]) => {
    setSubscriptions(prev => {
      const newSubs = subs.filter(sub => !prev.some(s => s.name.toLowerCase() === sub.name.toLowerCase()));
      return [...prev, ...newSubs];
    });
  };

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (activeFilter === 'all') return true;
      if (activeFilter === 'active') return sub.status === 'active';
      if (activeFilter === 'zombie') return sub.status === 'zombie';
      if (activeFilter === 'renewal')
        return sub.status === 'price_hike' || (sub.trialEndsIn !== undefined && sub.trialEndsIn < 7);
      if (activeFilter === 'trialing') return sub.status === 'trial_ending';
      return true;
    });
  }, [subscriptions, activeFilter, searchQuery]);

  const selectedSubscription = useMemo(() => {
    return subscriptions.find((s) => s.id === selectedSubscriptionId) || null;
  }, [subscriptions, selectedSubscriptionId]);

  const totalSpending = useMemo(
    () => subscriptions.reduce((total, sub) => total + sub.cost, 0),
    [subscriptions]
  );
  const potentialSavings = useMemo(
    () => subscriptions.filter((sub) => sub.status === 'zombie').reduce((total, sub) => total + sub.cost, 0),
    [subscriptions]
  );
  const trialsEndingCount = useMemo(
    () => subscriptions.filter((sub) => sub.status === 'trial_ending').length,
    [subscriptions]
  );

  // Sidebar computed values
  const activeCount = useMemo(() => subscriptions.filter(s => s.status === 'active').length, [subscriptions]);
  const renewalCount = useMemo(
    () => subscriptions.filter(s => s.status === 'price_hike' || (s.trialEndsIn !== undefined && s.trialEndsIn < 7)).length,
    [subscriptions]
  );
  const trialingCount = useMemo(() => subscriptions.filter(s => s.status === 'trial_ending').length, [subscriptions]);
  const uniqueCategories = useMemo(() => [...new Set(subscriptions.map(s => s.category))], [subscriptions]);

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="h-12 border-b border-slate-200 bg-white flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
          <h1 className="font-semibold text-base leading-tight">
            SubTrack <sup className="text-[10px] font-bold text-emerald-600 ml-0.5">AI</sup>
          </h1>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`px-3.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
            <Moon className="w-3.5 h-3.5" />
          </button>
          <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold">JD</div>
        </div>
      </header>

      {hasTambo && (
        <TamboContextBridge
          activeFilter={activeFilter}
          selectedSubscription={selectedSubscription}
          totalSpending={totalSpending}
          potentialSavings={potentialSavings}
          subscriptionCount={subscriptions.length}
          trialsEndingCount={trialsEndingCount}
        />
      )}

      {/* Main 3-panel layout */}
      <main className="flex-1 flex overflow-hidden h-[calc(100vh-48px)]">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-slate-200 flex flex-col bg-white flex-shrink-0">
          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border-0 rounded-lg text-xs placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500"
                placeholder="Search..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filters */}
          <div className="px-3 pb-3">
            <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status</p>
            <div className="space-y-0.5">
              <SidebarFilterButton label="Active" count={activeCount} isActive={activeFilter === 'active'} onClick={() => setActiveFilter(activeFilter === 'active' ? 'all' : 'active')} />
              <SidebarFilterButton label="Renewal Soon" count={renewalCount} isActive={activeFilter === 'renewal'} onClick={() => setActiveFilter(activeFilter === 'renewal' ? 'all' : 'renewal')} />
              <SidebarFilterButton label="Trialing" count={trialingCount} isActive={activeFilter === 'trialing'} onClick={() => setActiveFilter(activeFilter === 'trialing' ? 'all' : 'trialing')} />
            </div>
          </div>

          {/* Categories */}
          {uniqueCategories.length > 0 && (
            <div className="px-3 pb-3">
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Categories</p>
              <div className="space-y-0.5">
                {uniqueCategories.map(cat => (
                  <button key={cat} className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors">
                    <span className={`w-2 h-2 rounded-full ${CATEGORY_DOT_COLORS[cat] || 'bg-slate-300'}`} />
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subscription List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-3 space-y-0.5">
            {filteredSubscriptions.length === 0 && subscriptions.length === 0 && (
              <p className="text-xs text-slate-400 px-3 pt-2">No subscriptions yet.</p>
            )}
            {filteredSubscriptions.length === 0 && subscriptions.length > 0 && (
              <p className="text-xs text-slate-400 px-3 pt-2">No results match this filter.</p>
            )}
            {filteredSubscriptions.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                subscription={sub}
                isSelected={selectedSubscriptionId === sub.id}
                onSelect={() => setSelectedSubscriptionId(sub.id)}
              />
            ))}
          </div>
        </aside>

        {/* Center Panel */}
        <section className="flex-1 overflow-y-auto custom-scrollbar flex flex-col bg-slate-50">
          {selectedSubscription ? (
            <SubscriptionDetailView
              subscription={selectedSubscription}
              onBack={() => setSelectedSubscriptionId(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-16 h-16 mb-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center relative">
                <LayoutGrid className="w-7 h-7 text-slate-300" />
                <div className="absolute -right-1.5 -bottom-1.5 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Start your tracking journey</h2>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                Your subscription list is empty. Use the AI assistant on the right to add them — just describe what you have or paste a list.
              </p>
            </div>
          )}
        </section>

        {/* Chat Panel */}
        <TamboChat
          selectedSubscription={selectedSubscription}
          potentialSavings={potentialSavings}
          subscriptions={subscriptions}
          onAddSubscription={addSubscription}
          onAddMultipleSubscriptions={addMultipleSubscriptions}
        />
      </main>
    </div>
  );
}

/* ─── Sidebar Components ────────────────────────────────────────── */

function SidebarFilterButton({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
        isActive
          ? 'bg-emerald-50 text-emerald-700'
          : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <span>{label}</span>
      <span className={`text-[10px] ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>{count}</span>
    </button>
  );
}

/* ─── Subscription Card ─────────────────────────────────────────── */

function SubscriptionCard({
  subscription,
  isSelected,
  onSelect,
}: {
  subscription: Subscription;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { icon, bg } = getSubscriptionIcon(subscription.name);

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
        isSelected
          ? 'bg-emerald-50 border border-emerald-200'
          : 'hover:bg-slate-50 border border-transparent'
      }`}
    >
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center text-white flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-900 truncate">{subscription.name}</p>
        <p className="text-[10px] text-slate-500">${subscription.cost.toFixed(2)}/mo</p>
      </div>
      {isSelected && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
    </button>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────── */

const ICON_COLORS: Record<string, string> = {
  netflix: 'bg-slate-900',
  chatgpt: 'bg-emerald-500',
  openai: 'bg-emerald-500',
  claude: 'bg-amber-600',
  spotify: 'bg-green-500',
  adobe: 'bg-red-500',
  disney: 'bg-blue-600',
  youtube: 'bg-red-600',
  notion: 'bg-slate-800',
  figma: 'bg-purple-500',
  github: 'bg-slate-900',
  aws: 'bg-orange-500',
  linkedin: 'bg-blue-700',
  grammarly: 'bg-green-600',
  headspace: 'bg-orange-400',
  canva: 'bg-blue-500',
  cursor: 'bg-slate-800',
  perplexity: 'bg-teal-600',
};

function getSubscriptionIcon(name: string) {
  const lower = name.toLowerCase();

  if (lower.includes('netflix')) {
    return { icon: <MonitorPlay className="w-4 h-4" />, bg: 'bg-slate-900' };
  }
  if (lower.includes('chatgpt') || lower.includes('openai')) {
    return { icon: <Sparkles className="w-4 h-4" />, bg: 'bg-emerald-500' };
  }
  if (lower.includes('spotify')) {
    return { icon: <Music className="w-4 h-4" />, bg: 'bg-green-500' };
  }

  // Check known icon colors for the background
  for (const [key, color] of Object.entries(ICON_COLORS)) {
    if (lower.includes(key)) {
      return { icon: <span className="text-sm font-bold">{name.charAt(0)}</span>, bg: color };
    }
  }

  // Default: first letter with a neutral background
  return { icon: <span className="text-sm font-bold">{name.charAt(0)}</span>, bg: 'bg-slate-400' };
}
