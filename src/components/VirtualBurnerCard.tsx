'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock } from 'lucide-react';
import { useTamboStreamStatus, useTamboComponentState } from '@tambo-ai/react';

interface VirtualBurnerCardProps {
 serviceName?: string;
 expiresInDays?: number;
 cardLast4?: string;
}

function Skeleton() {
 return (
 <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mt-3 animate-pulse">
 <div className="p-4">
 <div className="w-full aspect-[1.7/1] rounded-xl bg-slate-200" />
 </div>
 <div className="px-4 pb-4">
 <div className="h-16 rounded-xl bg-slate-100" />
 </div>
 </div>
 );
}

export function VirtualBurnerCard({
 serviceName,
 expiresInDays,
 cardLast4,
}: VirtualBurnerCardProps) {
 const { streamStatus } = useTamboStreamStatus<VirtualBurnerCardProps>();

 // Use useTamboComponentState so the AI can observe slider changes.
 // Third arg (setFromProp) syncs streamed prop values during streaming.
 const [killDays, setKillDays] = useTamboComponentState(
 'killDays',
 expiresInDays ?? 7,
 expiresInDays,
 );

 const effectiveKillDays = killDays ?? 7;

 const createdAtRef = useRef(new Date());
 const [timeLeft, setTimeLeft] = useState({
 days: effectiveKillDays,
 hours: 0,
 minutes: 0,
 seconds: 0,
 });

 useEffect(() => {
 const createdAt = createdAtRef.current;
 const targetDate = new Date(createdAt.getTime() + effectiveKillDays * 24 * 60 * 60 * 1000);

 const tick = () => {
 const now = new Date();
 const diff = targetDate.getTime() - now.getTime();

 if (diff <= 0) {
 setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
 return;
 }

 const days = Math.floor(diff / (1000 * 60 * 60 * 24));
 const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
 const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
 const seconds = Math.floor((diff % (1000 * 60)) / 1000);

 setTimeLeft({ days, hours, minutes, seconds });
 };

 tick();
 const interval = setInterval(tick, 1000);
 return () => clearInterval(interval);
 }, [effectiveKillDays]);

 if (streamStatus.isPending) {
 return <Skeleton />;
 }

 const displayName = serviceName || 'Trial Service';
 const displayLast4 = cardLast4 || '····';

 const formatDate = () => {
 const createdAt = createdAtRef.current;
 const date = new Date(createdAt.getTime() + effectiveKillDays * 24 * 60 * 60 * 1000);
 return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
 };

 return (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-white border border-slate-200 rounded-2xl overflow-hidden mt-3"
 >
 {/* Card Visual */}
 <div className="p-4">
 <div className="relative w-full aspect-[1.7/1] rounded-xl p-5 overflow-hidden bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 shadow-lg">
 <div className="absolute top-5 left-5">
 <div className="w-10 h-7 rounded bg-yellow-400/90 shadow-sm" />
 </div>

 <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
 <Shield className="w-3.5 h-3.5 text-white" />
 <span className="text-white text-xs font-medium">Protected</span>
 </div>

 <div className="absolute bottom-16 left-5 right-5">
 <div className="flex items-center gap-3 text-white/90 text-base font-mono tracking-widest">
 <span>****</span>
 <span>****</span>
 <span>****</span>
 <span className="text-white font-semibold">{displayLast4}</span>
 </div>
 </div>

 <div className="absolute bottom-4 left-5 right-5 flex justify-between items-end">
 <div>
 <p className="text-white/70 text-[10px] uppercase tracking-wide">FOR</p>
 <p className="text-white font-medium text-sm">{displayName}</p>
 </div>
 <div className="text-right">
 <p className="text-white/70 text-[10px] uppercase tracking-wide">AUTO-KILL</p>
 <p className="text-white font-semibold text-sm">{formatDate()}</p>
 </div>
 </div>
 </div>
 </div>

 {/* Countdown */}
 <div className="px-4 pb-4">
 <div className="flex items-center justify-center gap-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
 <div className="text-center">
 <span className="text-2xl font-bold text-slate-900">{String(timeLeft.days).padStart(2, '0')}</span>
 <p className="text-[10px] text-slate-500 uppercase">Days</p>
 </div>
 <span className="text-slate-300 text-xl">:</span>
 <div className="text-center">
 <span className="text-2xl font-bold text-slate-900">{String(timeLeft.hours).padStart(2, '0')}</span>
 <p className="text-[10px] text-slate-500 uppercase">Hrs</p>
 </div>
 <span className="text-slate-300 text-xl">:</span>
 <div className="text-center">
 <span className="text-2xl font-bold text-slate-900">{String(timeLeft.minutes).padStart(2, '0')}</span>
 <p className="text-[10px] text-slate-500 uppercase">Min</p>
 </div>
 <span className="text-slate-300 text-xl">:</span>
 <div className="text-center">
 <span className="text-2xl font-bold text-slate-900">{String(timeLeft.seconds).padStart(2, '0')}</span>
 <p className="text-[10px] text-slate-500 uppercase">Sec</p>
 </div>
 </div>
 </div>

 {/* Kill Date Slider */}
 <div className="px-4 pb-4">
 <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
 <div className="flex items-center gap-2">
 <Clock className="w-4 h-4" />
 <span>Kill card after:</span>
 </div>
 <span className="font-semibold text-slate-900">{effectiveKillDays} days</span>
 </div>
 <input
 type="range"
 min="1"
 max="30"
 value={effectiveKillDays}
 onChange={(e) => setKillDays(Number(e.target.value))}
 disabled={streamStatus.isStreaming}
 className="w-full"
 />
 <div className="flex justify-between text-xs text-slate-400 mt-1">
 <span>1 day</span>
 <span>30 days</span>
 </div>
 </div>

 {/* Info footer */}
 <div className="px-4 py-3 bg-emerald-50 border-t border-emerald-100">
 <p className="text-xs text-emerald-700 flex items-center gap-2">
 <Shield className="w-3.5 h-3.5" />
 This virtual card will automatically decline all charges after the trial period ends.
 </p>
 </div>
 </motion.div>
 );
}
