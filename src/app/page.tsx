'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Shield,
  Zap,
  TrendingDown,
  CreditCard,
  Eye,
  Sparkles,
  CheckCircle2,
  LineChart,
} from 'lucide-react';

/* ─── Animation Variants ──────────────────────────────────────── */

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const } },
};

/* ─── Bento Card with Mouse-Follow Effect ─────────────────────── */

function BentoCard({
  children,
  className = '',
  span = '',
}: {
  children: React.ReactNode;
  className?: string;
  span?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <motion.div
      ref={cardRef}
      variants={fadeInUp}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden bg-white border border-zinc-200 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${span} ${className}`}
    >
      {/* Mouse-follow radial gradient */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0,0,0,0.03), transparent 40%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/* ─── Mini Chart (SVG) ─────────────────────────────────────────── */

function MiniChart() {
  return (
    <svg viewBox="0 0 240 80" className="w-full h-20 mt-4" fill="none">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[20, 40, 60].map(y => (
        <line key={y} x1="0" y1={y} x2="240" y2={y} stroke="#e4e4e7" strokeWidth="0.5" strokeDasharray="4 4" />
      ))}
      {/* Area fill */}
      <motion.path
        d="M0,65 C20,60 40,55 60,48 C80,41 100,50 120,38 C140,26 160,30 180,22 C200,14 220,18 240,8 L240,80 L0,80 Z"
        fill="url(#chartFill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      />
      {/* Line */}
      <motion.path
        d="M0,65 C20,60 40,55 60,48 C80,41 100,50 120,38 C140,26 160,30 180,22 C200,14 220,18 240,8"
        stroke="rgb(99,102,241)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3, duration: 1.2, ease: 'easeOut' }}
      />
      {/* Dot at end */}
      <motion.circle
        cx="240"
        cy="8"
        r="3"
        fill="rgb(99,102,241)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.4, duration: 0.3 }}
      />
    </svg>
  );
}

/* ─── Subscription Stack Icons ────────────────────────────────── */

const SERVICES = [
  { name: 'Netflix', color: '#E50914', letter: 'N', cost: '$15.99' },
  { name: 'Spotify', color: '#1DB954', letter: 'S', cost: '$10.99' },
  { name: 'Adobe CC', color: '#FF0000', letter: 'A', cost: '$59.99' },
  { name: 'ChatGPT', color: '#10B981', letter: 'G', cost: '$20.00' },
  { name: 'Figma', color: '#A259FF', letter: 'F', cost: '$15.00' },
  { name: 'Notion', color: '#000000', letter: 'N', cost: '$10.00' },
];

function SubscriptionStack() {
  return (
    <div className="space-y-2.5 mt-4">
      {SERVICES.map((svc, i) => (
        <motion.div
          key={svc.name}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 transition-colors"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm"
            style={{ backgroundColor: svc.color }}
          >
            {svc.letter}
          </div>
          <span className="text-sm font-medium text-zinc-700 flex-1">{svc.name}</span>
          <span className="text-xs text-zinc-400">{svc.cost}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Floating App Mockup (Hero) ──────────────────────────────── */

function FloatingMockup() {
  return (
    <motion.div
      variants={scaleIn}
      className="relative w-full max-w-4xl mx-auto mt-16"
    >
      {/* Heavy soft shadow */}
      <div className="absolute inset-0 bg-black/5 rounded-3xl blur-3xl translate-y-8 scale-[0.95]" />

      {/* Window */}
      <div className="relative bg-white border border-zinc-200 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-[11px] text-zinc-400 font-medium">SubTrack AI — Dashboard</span>
          </div>
          <div className="w-12" />
        </div>

        {/* App content mockup */}
        <div className="flex h-[340px]">
          {/* Sidebar */}
          <div className="w-48 border-r border-zinc-100 p-3 space-y-1.5 hidden sm:block">
            <div className="px-2 py-1">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Subscriptions</p>
            </div>
            {[
              { name: 'Netflix', cost: '$15.99', color: '#E50914' },
              { name: 'Spotify', cost: '$10.99', color: '#1DB954' },
              { name: 'ChatGPT', cost: '$20.00', color: '#10B981' },
              { name: 'Adobe CC', cost: '$59.99', color: '#FF0000' },
              { name: 'Notion', cost: '$10.00', color: '#000' },
            ].map((s, i) => (
              <div key={s.name} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${i === 0 ? 'bg-emerald-50 border border-emerald-200' : ''}`}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: s.color }}>
                  {s.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-zinc-800 truncate">{s.name}</p>
                  <p className="text-[9px] text-zinc-400">{s.cost}/mo</p>
                </div>
              </div>
            ))}
          </div>

          {/* Center */}
          <div className="flex-1 p-4 bg-zinc-50/30">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Monthly', value: '$116.97', delta: '-3.2%' },
                { label: 'Active', value: '5', delta: '' },
                { label: 'Savings', value: '$59.99', delta: 'possible' },
              ].map(m => (
                <div key={m.label} className="bg-white rounded-xl border border-zinc-100 p-2.5">
                  <p className="text-[8px] text-zinc-400 font-medium uppercase">{m.label}</p>
                  <p className="text-base font-bold text-zinc-900 mt-0.5">{m.value}</p>
                  {m.delta && <p className="text-[8px] text-emerald-600 font-medium">{m.delta}</p>}
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-zinc-100 p-3 h-32">
              <p className="text-[9px] font-bold text-zinc-400 uppercase mb-1">Spending Trend</p>
              <svg viewBox="0 0 300 60" className="w-full h-16" fill="none">
                <path d="M0,50 C40,45 60,35 100,30 C140,25 180,40 220,20 C260,5 280,15 300,10" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M0,50 C40,45 60,35 100,30 C140,25 180,40 220,20 C260,5 280,15 300,10 L300,60 L0,60Z" fill="url(#mockGrad)" />
                <defs>
                  <linearGradient id="mockGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Chat panel (light theme) */}
          <div className="w-56 bg-white border-l border-zinc-100 flex flex-col hidden md:flex">
            <div className="px-3 py-2.5 border-b border-zinc-100 flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center">
                <Bot className="w-3 h-3 text-emerald-600" />
              </div>
              <span className="text-[10px] font-semibold text-zinc-700">Tambo AI</span>
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 p-3 space-y-2 overflow-hidden">
              <div className="bg-zinc-100 rounded-lg rounded-tl-none px-2.5 py-1.5 max-w-[90%]">
                <p className="text-[10px] text-zinc-600 leading-relaxed">I found <strong className="text-zinc-900">3 zombie subscriptions</strong> draining $84.97/mo.</p>
              </div>
              <div className="bg-zinc-100 rounded-lg rounded-tl-none px-2.5 py-1.5 max-w-[90%]">
                <p className="text-[10px] text-zinc-600 leading-relaxed">Adobe CC hasn&apos;t been opened in <strong className="text-amber-600">4 months</strong>.</p>
              </div>
              <div className="ml-auto bg-emerald-600 rounded-lg rounded-tr-none px-2.5 py-1.5 max-w-[80%]">
                <p className="text-[10px] text-white">Cancel Adobe for me</p>
              </div>
              <div className="bg-zinc-100 rounded-lg rounded-tl-none px-2.5 py-1.5 max-w-[90%]">
                <p className="text-[10px] text-zinc-600 leading-relaxed">Cancellation staged. Confirm to save <strong className="text-emerald-600">$59.99/mo</strong>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── How It Works Step ───────────────────────────────────────── */

function TimelineStep({
  step,
  title,
  description,
  icon: Icon,
  isLast = false,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ElementType;
  isLast?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      className="flex gap-6"
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeInUp}
    >
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-colors duration-500 ${isInView ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-zinc-300 text-zinc-400'}`}>
          <Icon className="w-4 h-4" />
        </div>
        {!isLast && (
          <div className={`w-px flex-1 mt-2 border-l-2 border-dashed transition-colors duration-700 ${isInView ? 'border-indigo-300' : 'border-zinc-200'}`} />
        )}
      </div>

      {/* Content */}
      <div className="pb-12">
        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Step {step}</p>
        <h3 className="text-lg font-semibold text-zinc-900 tracking-tight">{title}</h3>
        <p className="text-sm text-zinc-500 mt-1 leading-relaxed max-w-md">{description}</p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const bentoRef = useRef<HTMLDivElement>(null);
  const bentoInView = useInView(bentoRef, { once: true, margin: '-60px' });
  const { scrollYProgress } = useScroll();
  const navBg = useTransform(scrollYProgress, [0, 0.05], [0, 1]);
  const [navOpacity, setNavOpacity] = useState(0);

  useEffect(() => {
    const unsub = navBg.on('change', (v) => setNavOpacity(v));
    return unsub;
  }, [navBg]);

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Navbar ────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: `rgba(255,255,255,${navOpacity * 0.7})`,
          backdropFilter: navOpacity > 0.1 ? 'blur(16px) saturate(180%)' : 'none',
          borderBottom: navOpacity > 0.3 ? '1px solid rgba(228,228,231,0.6)' : '1px solid transparent',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
            <span className="font-semibold text-zinc-900 text-base tracking-tight">
              SubTrack <sup className="text-[9px] font-bold text-indigo-600 ml-0.5">AI</sup>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">How it Works</a>
          </div>

          <Link
            href="/dashboard"
            className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors shadow-sm"
          >
            Launch App
          </Link>
        </div>
      </nav>

      {/* ─── Hero ──────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative pt-32 pb-8 overflow-hidden">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-rose-100/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-40 bg-gradient-to-t from-white to-transparent" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="text-center max-w-3xl mx-auto"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-8">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-medium text-zinc-600">Powered by Tambo AI</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-zinc-900 leading-[1.08] tracking-[-0.02em]"
            >
              The First Autonomous Agent for your{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Finances</span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              variants={fadeInUp}
              className="mt-6 text-lg text-zinc-500 leading-relaxed max-w-xl mx-auto"
            >
              SubTrack finds hidden subscriptions, kills zombie services, and navigates cancellation dark patterns — so you don&apos;t have to.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeInUp} className="mt-8 flex items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-zinc-600 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                See Features
              </a>
            </motion.div>
          </motion.div>

          {/* Floating App Mockup */}
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <FloatingMockup />
          </motion.div>
        </div>
      </section>

      {/* ─── Stats Bar ─────────────────────────────────────────── */}
      <section className="py-12 border-y border-zinc-100 bg-zinc-50/50">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { value: '$2.4M+', label: 'Saved by users' },
              { value: '10K+', label: 'Zombies killed' },
              { value: '340+', label: 'Services tracked' },
              { value: '<2min', label: 'Avg. cancel time' },
            ].map(stat => (
              <motion.div key={stat.label} variants={fadeInUp}>
                <p className="text-2xl font-bold text-zinc-900 tracking-tight">{stat.value}</p>
                <p className="text-xs text-zinc-500 mt-1 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Bento Grid ────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeInUp} className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Features</motion.p>
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-[-0.02em]">
              Everything you need to take control
            </motion.h2>
            <motion.p variants={fadeInUp} className="mt-4 text-zinc-500 max-w-lg mx-auto">
              An AI-powered command center for every subscription in your life.
            </motion.p>
          </motion.div>

          <motion.div
            ref={bentoRef}
            initial="hidden"
            animate={bentoInView ? 'visible' : 'hidden'}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {/* Tile 1: Spend Tracker (spans 2 cols) */}
            <BentoCard span="lg:col-span-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3">
                    <LineChart className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-zinc-900 tracking-tight">Spending Analytics</h3>
                  <p className="text-sm text-zinc-500 mt-1">Real-time tracking with trend analysis and category breakdowns.</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-zinc-900">$116.97</p>
                  <p className="text-xs text-emerald-600 font-medium">-3.2% vs last month</p>
                </div>
              </div>
              <MiniChart />
            </BentoCard>

            {/* Tile 2: Zombie Detection */}
            <BentoCard>
              <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mb-3">
                <Eye className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="font-semibold text-zinc-900 tracking-tight">Zombie Detection</h3>
              <p className="text-sm text-zinc-500 mt-1">AI identifies services you&apos;ve stopped using but keep paying for.</p>
              <div className="mt-4 space-y-2">
                {['Adobe CC — 4mo unused', 'Headspace — 5mo unused'].map(z => (
                  <div key={z} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-xs text-red-700 font-medium">{z}</span>
                  </div>
                ))}
              </div>
            </BentoCard>

            {/* Tile 3: Subscription Stack */}
            <BentoCard>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-zinc-900 tracking-tight">All Subscriptions</h3>
              <p className="text-sm text-zinc-500 mt-1">Every recurring charge, auto-detected and categorized.</p>
              <SubscriptionStack />
            </BentoCard>

            {/* Tile 4: AI Chat Agent */}
            <BentoCard>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
                <Bot className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-zinc-900 tracking-tight">AI Agent</h3>
              <p className="text-sm text-zinc-500 mt-1">Conversational AI that takes action — cancels, negotiates, and alerts.</p>
              <div className="mt-4 space-y-2">
                <div className="bg-zinc-50 rounded-lg px-3 py-2 border border-zinc-100">
                  <p className="text-xs text-zinc-600"><span className="text-emerald-600 font-mono">{'>'}</span> Cancel my Adobe subscription</p>
                </div>
                <div className="bg-zinc-50 rounded-lg px-3 py-2 border border-zinc-100">
                  <p className="text-xs text-zinc-500">Cancellation staged for <span className="text-zinc-900 font-medium">Adobe CC</span>. You&apos;ll save <span className="text-emerald-600 font-bold">$59.99/mo</span>.</p>
                </div>
              </div>
            </BentoCard>

            {/* Tile 5: Health Score */}
            <BentoCard>
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-3">
                <Shield className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="font-semibold text-zinc-900 tracking-tight">Health Score</h3>
              <p className="text-sm text-zinc-500 mt-1">Get an A-F grade for your subscription portfolio with actionable recommendations.</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e4e4e7" strokeWidth="2.5" />
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="75 100" strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-zinc-900">B+</span>
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">Zombie Ratio</span>
                    <span className="font-bold text-zinc-700">12%</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">Efficiency</span>
                    <span className="font-bold text-zinc-700">84/100</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">Trial Risk</span>
                    <span className="font-bold text-amber-600">2 active</span>
                  </div>
                </div>
              </div>
            </BentoCard>
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works ──────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-zinc-50/50 border-t border-zinc-100">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeInUp} className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">How it Works</motion.p>
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-[-0.02em]">
              Three steps to financial clarity
            </motion.h2>
          </motion.div>

          <div className="max-w-xl mx-auto">
            <TimelineStep
              step={1}
              title="Tell the AI about your subscriptions"
              description='Simply type "I have Netflix, Spotify, and Adobe" or paste a billing email. The AI instantly detects every service, cost, and renewal date.'
              icon={Zap}
            />
            <TimelineStep
              step={2}
              title="Get a full financial health scan"
              description="The agent analyzes usage patterns, identifies zombie subscriptions, flags upcoming price hikes, and calculates your total potential savings."
              icon={TrendingDown}
            />
            <TimelineStep
              step={3}
              title="Take action with one click"
              description="Cancel services through guided flows, split costs with friends, or set up trial shields — all from the AI chat interface."
              icon={CheckCircle2}
              isLast
            />
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="relative rounded-3xl bg-zinc-900 overflow-hidden px-8 py-16 sm:px-16 sm:py-20 text-center"
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <motion.h2
                variants={fadeInUp}
                className="text-3xl sm:text-4xl font-bold text-white tracking-[-0.02em]"
              >
                Stop paying for things you don&apos;t use.
              </motion.h2>
              <motion.p variants={fadeInUp} className="mt-4 text-zinc-400 max-w-md mx-auto">
                The average person wastes $133/month on forgotten subscriptions. Let AI find yours.
              </motion.p>
              <motion.div variants={fadeInUp} className="mt-8">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-zinc-900 text-sm font-semibold rounded-xl hover:bg-zinc-100 transition-colors shadow-lg"
                >
                  Launch SubTrack
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────── */}
      <footer className="py-8 border-t border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-zinc-900 rounded-md flex items-center justify-center text-white text-[9px] font-bold">S</div>
            <span className="text-sm text-zinc-500">SubTrack AI</span>
          </div>
          <p className="text-xs text-zinc-400">
            Built with <span className="font-medium text-zinc-500">Tambo AI</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
