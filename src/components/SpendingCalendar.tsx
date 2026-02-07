'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
 startOfMonth,
 endOfMonth,
 startOfWeek,
 endOfWeek,
 eachDayOfInterval,
 format,
 isSameMonth,
 isToday,
 addMonths,
 subMonths,
} from 'date-fns';
import { useSafeStreamStatus } from '@/lib/tamboSafeHooks';

interface CalendarSubscription {
 name: string;
 cost: number;
 status: string;
 logo: string;
}

interface CalendarDay {
 date: string;
 subscriptions?: CalendarSubscription[];
 totalCost?: number;
}

interface SpendingCalendarProps {
 month?: number;
 year?: number;
 days?: CalendarDay[];
 monthlyTotal?: number;
 comparedToLastMonth?: number;
}

const STATUS_DOT_COLORS: Record<string, string> = {
 active: 'bg-emerald-400',
 zombie: 'bg-red-400',
 price_hike: 'bg-yellow-400',
 trial_ending: 'bg-orange-400',
};

function CalendarSkeleton() {
 return (
 <div className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse">
 <div className="flex justify-between items-center mb-4">
 <div className="h-5 w-32 bg-slate-200 rounded" />
 <div className="flex gap-2">
 <div className="h-8 w-8 bg-slate-200 rounded" />
 <div className="h-8 w-8 bg-slate-200 rounded" />
 </div>
 </div>
 <div className="grid grid-cols-7 gap-1">
 {Array.from({ length: 35 }, (_, i) => (
 <div key={i} className="h-10 bg-slate-100 rounded" />
 ))}
 </div>
 </div>
 );
}

export function SpendingCalendar({
 month,
 year,
 days,
 monthlyTotal,
 comparedToLastMonth,
}: SpendingCalendarProps) {
 const { streamStatus } = useSafeStreamStatus<SpendingCalendarProps>();
 const now = new Date();
 const [currentMonth, setCurrentMonth] = useState(() => {
 const m = month ?? now.getMonth();
 const y = year ?? now.getFullYear();
 return new Date(y, m, 1);
 });
 const [selectedDate, setSelectedDate] = useState<string | null>(null);

 useEffect(() => {
  if (month != null || year != null) {
   const m = month ?? new Date().getMonth();
   const y = year ?? new Date().getFullYear();
   setCurrentMonth(new Date(y, m, 1));
  }
 }, [month, year]);

 const daysMap = useMemo(() => {
 const map: Record<string, CalendarDay> = {};
 if (days) {
 for (const day of days) {
 const key = day.date.split('T')[0];
 map[key] = day;
 }
 }
 return map;
 }, [days]);

 const calendarDays = useMemo(() => {
 const monthStart = startOfMonth(currentMonth);
 const monthEnd = endOfMonth(currentMonth);
 const calStart = startOfWeek(monthStart);
 const calEnd = endOfWeek(monthEnd);
 return eachDayOfInterval({ start: calStart, end: calEnd });
 }, [currentMonth]);

 const selectedDayData = useMemo(() => {
 if (!selectedDate) return null;
 return daysMap[selectedDate] || null;
 }, [selectedDate, daysMap]);

 if (streamStatus.isPending || !days) {
 return <CalendarSkeleton />;
 }

 return (
 <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
 {/* Header */}
 <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
 <div>
 <h3 className="text-sm font-bold text-slate-800">
 {format(currentMonth, 'MMMM yyyy')}
 </h3>
 {monthlyTotal !== undefined && (
 <p className="text-xs text-slate-500">
 Total: ${monthlyTotal.toFixed(2)}
 {comparedToLastMonth !== undefined && (
 <span className={comparedToLastMonth < 0 ? 'text-emerald-600 ml-1' : 'text-red-600 ml-1'}>
 {comparedToLastMonth > 0 ? '+' : ''}{comparedToLastMonth.toFixed(1)}%
 </span>
 )}
 </p>
 )}
 </div>
 <div className="flex gap-1">
 <button
 onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
 aria-label="Previous month"
 className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500"
 >
 <ChevronLeft className="w-4 h-4" />
 </button>
 <button
 onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
 aria-label="Next month"
 className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500"
 >
 <ChevronRight className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Weekday headers */}
 <div className="grid grid-cols-7 px-2 pt-2">
 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
 <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">
 {d}
 </div>
 ))}
 </div>

 {/* Calendar grid */}
 <div className="grid grid-cols-7 gap-px px-2 pb-2">
 {calendarDays.map(day => {
 const dateKey = format(day, 'yyyy-MM-dd');
 const inMonth = isSameMonth(day, currentMonth);
 const today = isToday(day);
 const dayData = daysMap[dateKey];
 const hasSubs = dayData && dayData.subscriptions && dayData.subscriptions.length > 0;
 const isSelected = selectedDate === dateKey;

 return (
 <button
 key={dateKey}
 onClick={() => { if (hasSubs) setSelectedDate(isSelected ? null : dateKey); }}
 aria-label={`${format(day, 'MMMM d')}${hasSubs ? `, ${dayData.subscriptions!.length} subscription${dayData.subscriptions!.length !== 1 ? 's' : ''}` : ''}`}
 className={`relative h-10 rounded-lg text-xs flex flex-col items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
 ${!inMonth ? 'text-slate-300' : 'text-slate-700'}
 ${today ? 'bg-emerald-50 font-bold text-emerald-700' : ''}
 ${isSelected ? 'bg-slate-100 ring-1 ring-emerald-400' : ''}
 ${hasSubs && !isSelected ? 'hover:bg-slate-50 cursor-pointer' : ''}
 ${!hasSubs ? 'cursor-default' : ''}
 `}
 >
 <span>{format(day, 'd')}</span>
 {hasSubs && (
 <div className="flex gap-0.5 mt-0.5">
 {dayData.subscriptions!.slice(0, 3).map((sub, i) => (
 <span
 key={i}
 className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_COLORS[sub.status] || 'bg-slate-400'}`}
 />
 ))}
 {dayData.subscriptions!.length > 3 && (
 <span className="text-[8px] text-slate-400">+{dayData.subscriptions!.length - 3}</span>
 )}
 </div>
 )}
 </button>
 );
 })}
 </div>

 {/* Detail panel */}
 <AnimatePresence>
 {selectedDayData && selectedDayData.subscriptions && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 transition={{ duration: 0.2 }}
 className="overflow-hidden border-t border-slate-100"
 >
 <div className="p-3 space-y-2">
 <div className="flex items-center justify-between">
 <p className="text-xs font-bold text-slate-800">
 {format(new Date(selectedDate! + 'T00:00:00'), 'MMMM d, yyyy')}
 </p>
 {selectedDayData.totalCost !== undefined && (
 <p className="text-xs font-bold text-emerald-600">
 ${selectedDayData.totalCost.toFixed(2)}
 </p>
 )}
 </div>
 {selectedDayData.subscriptions.map((sub, i) => (
 <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg">
 <span className="text-sm">{sub.logo}</span>
 <span className="text-xs font-medium text-slate-700 flex-1">{sub.name}</span>
 <span className="text-xs text-slate-500">${sub.cost.toFixed(2)}</span>
 </div>
 ))}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}
