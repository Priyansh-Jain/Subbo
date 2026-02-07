'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
 differenceInDays,
 format,
 startOfMonth,
 endOfMonth,
 eachDayOfInterval,
} from 'date-fns';
import {
 AlertTriangle,
 Check,
 Home as HomeIcon,
 LayoutGrid,
 List,
 MessageSquare,
 MonitorPlay,
 Music,
 Search,
 Sparkles,
 XCircle,
} from 'lucide-react';
import { TamboChat } from '@/components/TamboChat';
import { TamboContextBridge } from '@/components/TamboContextBridge';
import { SubscriptionDetailView } from '@/components/SubscriptionDetailView';
import { ReviewSubscriptionsView } from '@/components/ReviewSubscriptionsView';
import { SpendingCalendar } from '@/components/SpendingCalendar';
import { SpendingAnalytics } from '@/components/SpendingAnalytics';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SubscriptionActionsProvider } from '@/contexts/SubscriptionContext';
import type { Subscription } from '@/lib/types';
import { setSubscriptions as syncSubscriptionsToStore } from '@/lib/subscriptionStore';
import { CATEGORY_DOT_COLORS, CATEGORY_COLORS as ANALYTICS_CATEGORY_COLORS } from '@/lib/knownServices';

type FilterType = 'all' | 'active' | 'zombie' | 'renewal' | 'trialing';

const tabs = [
 { id: 'dashboard', label: 'Dashboard' },
 { id: 'schedule', label: 'Schedule' },
 { id: 'expenses', label: 'Expenses' },
] as const;

type TabId = (typeof tabs)[number]['id'];

// CATEGORY_DOT_COLORS imported from @/lib/knownServices (single source of truth)

type MobilePanel = 'sidebar' | 'main' | 'chat';

export default function Home() {
 const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
 if (typeof window === 'undefined') return [];
 try {
 const stored = localStorage.getItem('subtrack-subscriptions');
 return stored ? JSON.parse(stored) : [];
 } catch { return []; }
 });
 const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
 const [activeFilter, setActiveFilter] = useState<FilterType>('all');
 const [searchQuery, setSearchQuery] = useState('');
 const [activeTab, setActiveTab] = useState<TabId>('dashboard');
 const [pendingReviewSubs, setPendingReviewSubs] = useState<Subscription[]>([]);
 const [pendingCancellationSub, setPendingCancellationSub] = useState<Subscription | null>(null);
 const [mobilePanel, setMobilePanel] = useState<MobilePanel>('main');
 const hasTambo = Boolean(process.env.NEXT_PUBLIC_TAMBO_API_KEY);

 // Persist to localStorage on change (with error handling)
 useEffect(() => {
 try {
 localStorage.setItem('subtrack-subscriptions', JSON.stringify(subscriptions));
 } catch (e) {
 console.warn('Failed to save subscriptions to localStorage:', e);
 }
 }, [subscriptions]);

 // Sync subscriptions to the module-level store so Tambo tools can read real data
 useEffect(() => {
 syncSubscriptionsToStore(subscriptions);
 }, [subscriptions]);

 const handleDetectedSubscriptions = (subs: Subscription[]) => {
 setPendingReviewSubs(prev => {
 const existingIds = new Set(prev.map(s => s.id));
 const newSubs = subs.filter(s => !existingIds.has(s.id));
 return [...prev, ...newSubs];
 });
 };

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

 const removeSubscription = (id: string) => {
 setSubscriptions(prev => prev.filter(s => s.id !== id));
 };

 const updateSubscription = (id: string, updates: Partial<Subscription>) => {
 setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
 };

 const requestCancellation = (sub: Subscription) => {
 setPendingCancellationSub(sub);
 };

 const clearPendingCancellation = () => {
 setPendingCancellationSub(null);
 };

 const confirmCancellation = () => {
 if (pendingCancellationSub) {
 removeSubscription(pendingCancellationSub.id);
 setPendingCancellationSub(null);
 }
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
 <h1 className="font-semibold text-base leading-tight text-slate-900">
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
 subscriptions={subscriptions}
 />
 )}

 {/* Main 3-panel layout */}
 <SubscriptionActionsProvider actions={{ addSubscription, addMultipleSubscriptions, removeSubscription, updateSubscription, requestCancellation, clearPendingCancellation }} subscriptions={subscriptions} pendingCancellation={pendingCancellationSub}>
 <main className="flex-1 flex overflow-hidden h-[calc(100vh-48px)] lg:h-[calc(100vh-48px)] pb-14 lg:pb-0">
 {/* Left Sidebar */}
 <aside className={`w-full lg:w-64 border-r border-slate-200 flex-col bg-white flex-shrink-0 ${mobilePanel === 'sidebar' ? 'flex' : 'hidden lg:flex'}`}>
 {/* Search */}
 <div className="p-3">
 <div className="relative">
 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
 <input
 aria-label="Search subscriptions"
 className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border-0 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500"
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
 <button key={cat} aria-label={`Filter by ${cat}`} className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors">
 <span className={`w-2 h-2 rounded-full ${CATEGORY_DOT_COLORS[cat] || 'bg-slate-300'}`} />
 <span>{cat}</span>
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Activity */}
 {pendingReviewSubs.length > 0 && (
 <div className="px-3 pb-3">
 <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Activity</p>
 <div className="space-y-0.5">
 <button className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
 <span>Reviewing</span>
 <span className="text-[10px] text-white bg-emerald-600 rounded-full px-1.5 py-0.5 font-bold">{pendingReviewSubs.length}</span>
 </button>
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
 <section className={`flex-1 overflow-hidden flex-col bg-slate-50 ${mobilePanel === 'main' ? 'flex' : 'hidden lg:flex'}`}>
 <ErrorBoundary>
 {pendingCancellationSub ? (
 <CancellationApprovalView
 subscription={pendingCancellationSub}
 onConfirm={confirmCancellation}
 onDismiss={clearPendingCancellation}
 />
 ) : pendingReviewSubs.length > 0 ? (
 <ReviewSubscriptionsView
 subscriptions={pendingReviewSubs}
 onConfirm={(approved) => {
 addMultipleSubscriptions(approved);
 setPendingReviewSubs([]);
 }}
 onBack={() => setPendingReviewSubs([])}
 />
 ) : activeTab === 'schedule' ? (
 <ScheduleTabView subscriptions={subscriptions} />
 ) : activeTab === 'expenses' ? (
 <ExpensesTabView subscriptions={subscriptions} />
 ) : selectedSubscription ? (
 <SubscriptionDetailView
 key={selectedSubscription.id}
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
 </ErrorBoundary>
 </section>

 {/* Chat Panel */}
 <div className={`w-full lg:w-[360px] flex-shrink-0 h-full ${mobilePanel === 'chat' ? 'block' : 'hidden lg:block'}`}>
 <ErrorBoundary>
 <TamboChat
 selectedSubscription={selectedSubscription}
 potentialSavings={potentialSavings}
 subscriptions={subscriptions}
 onAddSubscription={addSubscription}
 onAddMultipleSubscriptions={addMultipleSubscriptions}
 onDetectedSubscriptions={handleDetectedSubscriptions}
 />
 </ErrorBoundary>
 </div>
 </main>

 {/* Mobile Bottom Nav */}
 <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-slate-200 flex items-center justify-around z-50" aria-label="Mobile navigation">
 <button
 onClick={() => setMobilePanel('sidebar')}
 aria-label="Subscriptions list"
 className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${mobilePanel === 'sidebar' ? 'text-emerald-600' : 'text-slate-400'}`}
 >
 <List className="w-5 h-5" />
 <span className="text-[10px] font-medium">Subs</span>
 </button>
 <button
 onClick={() => setMobilePanel('main')}
 aria-label="Dashboard"
 className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${mobilePanel === 'main' ? 'text-emerald-600' : 'text-slate-400'}`}
 >
 <HomeIcon className="w-5 h-5" />
 <span className="text-[10px] font-medium">Home</span>
 </button>
 <button
 onClick={() => setMobilePanel('chat')}
 aria-label="AI Chat assistant"
 className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${mobilePanel === 'chat' ? 'text-emerald-600' : 'text-slate-400'}`}
 >
 <MessageSquare className="w-5 h-5" />
 <span className="text-[10px] font-medium">AI Chat</span>
 </button>
 </nav>

 </SubscriptionActionsProvider>
 </div>
 );
}

/* ─── Tab Views ─────────────────────────────────────────────────── */

// ANALYTICS_CATEGORY_COLORS imported from @/lib/knownServices as CATEGORY_COLORS (single source of truth)

function ScheduleTabView({ subscriptions }: { subscriptions: Subscription[] }) {
 const calendarData = useMemo(() => {
 const now = new Date();
 const monthStart = startOfMonth(now);
 const monthEnd = endOfMonth(now);
 const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

 const daysMap: Record<string, { subscriptions: Array<{ name: string; cost: number; status: string; logo: string }>; totalCost: number }> = {};

 for (const sub of subscriptions) {
 if (!sub.renewalDate) continue;
 const renewal = new Date(sub.renewalDate);
 if (renewal.getMonth() === now.getMonth() && renewal.getFullYear() === now.getFullYear()) {
 const dateKey = format(renewal, 'yyyy-MM-dd');
 if (!daysMap[dateKey]) {
 daysMap[dateKey] = { subscriptions: [], totalCost: 0 };
 }
 daysMap[dateKey].subscriptions.push({
 name: sub.name,
 cost: sub.cost,
 status: sub.status,
 logo: sub.logo,
 });
 daysMap[dateKey].totalCost += sub.cost;
 }
 }

 // Also distribute subs without renewal dates across the month
 const noDateSubs = subscriptions.filter(s => !s.renewalDate);
 if (noDateSubs.length > 0 && allDays.length > 0) {
 for (let i = 0; i < noDateSubs.length; i++) {
 const sub = noDateSubs[i];
 const day = allDays[Math.floor((i / noDateSubs.length) * allDays.length)];
 const dateKey = format(day, 'yyyy-MM-dd');
 if (!daysMap[dateKey]) {
 daysMap[dateKey] = { subscriptions: [], totalCost: 0 };
 }
 daysMap[dateKey].subscriptions.push({
 name: sub.name,
 cost: sub.cost,
 status: sub.status,
 logo: sub.logo,
 });
 daysMap[dateKey].totalCost += sub.cost;
 }
 }

 const days = Object.entries(daysMap).map(([date, data]) => ({
 date,
 subscriptions: data.subscriptions,
 totalCost: Math.round(data.totalCost * 100) / 100,
 }));

 const monthlyTotal = subscriptions.reduce((sum, s) => sum + s.cost, 0);

 return {
 month: now.getMonth(),
 year: now.getFullYear(),
 days,
 monthlyTotal: Math.round(monthlyTotal * 100) / 100,
 comparedToLastMonth: -3.2,
 };
 }, [subscriptions]);

 if (subscriptions.length === 0) {
 return (
 <div className="flex flex-col items-center justify-center h-full text-center px-8">
 <h2 className="text-lg font-semibold text-slate-800 mb-2">No subscriptions to show</h2>
 <p className="text-sm text-slate-500">Add subscriptions to see your renewal calendar.</p>
 </div>
 );
 }

 return (
 <div className="flex-1 overflow-y-auto p-6">
 <div className="max-w-2xl mx-auto">
 <SpendingCalendar
 month={calendarData.month}
 year={calendarData.year}
 days={calendarData.days}
 monthlyTotal={calendarData.monthlyTotal}
 comparedToLastMonth={calendarData.comparedToLastMonth}
 />
 </div>
 </div>
 );
}

function ExpensesTabView({ subscriptions }: { subscriptions: Subscription[] }) {
 const analyticsData = useMemo(() => {
 const totalMonthly = subscriptions.reduce((sum, s) => sum + s.cost, 0);

 const categoryMap: Record<string, number> = {};
 for (const sub of subscriptions) {
 categoryMap[sub.category] = (categoryMap[sub.category] || 0) + sub.cost;
 }
 const categories = Object.entries(categoryMap)
 .map(([category, amount]) => ({
 category,
 amount: Math.round(amount * 100) / 100,
 color: ANALYTICS_CATEGORY_COLORS[category] || '#94a3b8',
 percentage: totalMonthly > 0 ? Math.round((amount / totalMonthly) * 100) : 0,
 }))
 .sort((a, b) => b.amount - a.amount);

 const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
 const now = new Date();
 const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
 const monthIndex = (now.getMonth() - 5 + i + 12) % 12;
 const variance = (Math.sin(i * 1.5) * 20) + (i * 3);
 return {
 month: monthNames[monthIndex],
 amount: Math.round((totalMonthly + variance) * 100) / 100,
 };
 });

 const topSubscriptions = [...subscriptions]
 .sort((a, b) => b.cost - a.cost)
 .slice(0, 3)
 .map(s => ({
 name: s.name,
 cost: s.cost,
 logo: s.logo,
 percentage: totalMonthly > 0 ? Math.round((s.cost / totalMonthly) * 100) : 0,
 }));

 return {
 categories,
 monthlyTrends,
 topSubscriptions,
 totalMonthly: Math.round(totalMonthly * 100) / 100,
 monthOverMonthChange: -3.2,
 };
 }, [subscriptions]);

 if (subscriptions.length === 0) {
 return (
 <div className="flex flex-col items-center justify-center h-full text-center px-8">
 <h2 className="text-lg font-semibold text-slate-800 mb-2">No expenses to analyze</h2>
 <p className="text-sm text-slate-500">Add subscriptions to see your spending analytics.</p>
 </div>
 );
 }

 return (
 <div className="flex-1 overflow-y-auto p-6">
 <div className="max-w-2xl mx-auto">
 <SpendingAnalytics
 categories={analyticsData.categories}
 monthlyTrends={analyticsData.monthlyTrends}
 topSubscriptions={analyticsData.topSubscriptions}
 totalMonthly={analyticsData.totalMonthly}
 monthOverMonthChange={analyticsData.monthOverMonthChange}
 />
 </div>
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
 <div className="flex items-center gap-1.5">
 <p className="text-[10px] text-slate-500">${subscription.cost.toFixed(2)}/mo</p>
 <RenewalBadge subscription={subscription} />
 </div>
 </div>
 {isSelected && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
 </button>
 );
}

/* ─── Renewal Badge ────────────────────────────────────────────── */

function RenewalBadge({ subscription }: { subscription: Subscription }) {
 if (subscription.status === 'zombie') {
 return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">Zombie</span>;
 }
 if (subscription.status === 'price_hike' && subscription.priceChange) {
 const increase = subscription.priceChange.to - subscription.priceChange.from;
 return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">↑ ${increase.toFixed(0)}</span>;
 }
 if (subscription.status === 'trial_ending' && subscription.trialEndsIn !== undefined) {
 return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">Trial {subscription.trialEndsIn}d</span>;
 }
 if (subscription.renewalDate) {
 const daysUntil = differenceInDays(new Date(subscription.renewalDate), new Date());
 if (daysUntil >= 0 && daysUntil <= 7) {
 return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{daysUntil}d</span>;
 }
 }
 return null;
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

/* ─── Cancellation Approval View (Center Panel) ──────────────── */

function CancellationApprovalView({
 subscription,
 onConfirm,
 onDismiss,
}: {
 subscription: Subscription;
 onConfirm: () => void;
 onDismiss: () => void;
}) {
 const { icon, bg } = getSubscriptionIcon(subscription.name);

 return (
 <div className="flex flex-col items-center justify-center h-full px-8">
 <div className="w-full max-w-md">
 {/* Header */}
 <div className="text-center mb-6">
 <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
 <AlertTriangle className="w-8 h-8 text-amber-500" />
 </div>
 <h2 className="text-lg font-bold text-slate-900">Cancel Subscription?</h2>
 <p className="text-sm text-slate-500 mt-1">Review before confirming</p>
 </div>

 {/* Subscription card */}
 <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
 <div className="flex items-center gap-3 mb-4">
 <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center text-white`}>
 {icon}
 </div>
 <div>
 <h3 className="font-bold text-slate-900">{subscription.name}</h3>
 <p className="text-sm text-slate-500">{subscription.category}</p>
 </div>
 </div>
 <div className="border-t border-slate-100 pt-3 space-y-2">
 <div className="flex justify-between text-sm">
 <span className="text-slate-500">Monthly cost</span>
 <span className="font-bold text-slate-900">${subscription.cost.toFixed(2)}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-slate-500">Yearly savings</span>
 <span className="font-bold text-emerald-600">${(subscription.cost * 12).toFixed(2)}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-slate-500">Status</span>
 <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase">
 Pending Cancellation
 </span>
 </div>
 </div>
 </div>

 {/* Actions */}
 <div className="flex gap-3">
 <button
 onClick={onDismiss}
 className="flex-1 py-3 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
 >
 Keep Subscription
 </button>
 <button
 onClick={onConfirm}
 className="flex-1 py-3 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/20 transition-colors flex items-center justify-center gap-2"
 >
 <XCircle className="w-4 h-4" />
 Confirm Cancel
 </button>
 </div>
 </div>
 </div>
 );
}

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
