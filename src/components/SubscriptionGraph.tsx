'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import type { NodeObject, LinkObject } from 'react-force-graph-2d';
import type { Subscription } from '@/lib/types';
import { useTamboStreamStatus } from '@tambo-ai/react';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] flex items-center justify-center">
      <div className="text-slate-400">Loading graph...</div>
    </div>
  ),
});

interface SubscriptionGraphProps {
  subscriptions?: Subscription[];
  totalMonthlySpending?: number;
  potentialSavings?: number;
  onNodeClick?: (subscription: Subscription) => void;
}

interface GraphNode extends NodeObject {
  id: string;
  name: string;
  cost?: number;
  status?: string;
  logo?: string;
  isUser?: boolean;
  category?: string;
  trialEndsIn?: number;
}

interface GraphLink extends LinkObject {
  source: string;
  target: string;
  value: number;
}

const statusColors: Record<string, string> = {
  active: '#22c55e',
  zombie: '#ef4444',
  price_hike: '#eab308',
  trial_ending: '#f97316',
};

function GraphSkeleton() {
  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between">
        <div className="bg-white rounded-lg px-4 py-2.5 border border-slate-200 shadow-sm animate-pulse">
          <div className="h-3 w-24 bg-slate-200 rounded mb-1" />
          <div className="h-6 w-20 bg-slate-200 rounded" />
        </div>
        <div className="bg-white rounded-lg px-4 py-2.5 border border-slate-200 shadow-sm animate-pulse">
          <div className="h-3 w-24 bg-slate-200 rounded mb-1" />
          <div className="h-6 w-20 bg-slate-200 rounded" />
        </div>
      </div>
      <div className="w-full h-[450px] flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading subscriptions...</div>
      </div>
    </div>
  );
}

export function SubscriptionGraph({
  subscriptions,
  totalMonthlySpending,
  potentialSavings,
  onNodeClick
}: SubscriptionGraphProps) {
  const { streamStatus } = useTamboStreamStatus<SubscriptionGraphProps>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });
  const pulsePhaseRef = useRef(0);

  const subs = subscriptions ?? [];
  const hasTrialEnding = subs.some(s => s.status === 'trial_ending');

  useEffect(() => {
    if (!hasTrialEnding) return;
    const interval = setInterval(() => {
      pulsePhaseRef.current = (pulsePhaseRef.current + 1) % 60;
    }, 200);
    return () => clearInterval(interval);
  }, [hasTrialEnding]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const { offsetWidth, offsetHeight } = container;
      setDimensions({ width: offsetWidth, height: Math.max(offsetHeight, 500) });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const graphData = React.useMemo(() => {
    const nodes: GraphNode[] = [
      { id: 'user', name: 'You', isUser: true, x: 0, y: 0 },
      ...subs.map(sub => ({
        id: sub.id,
        name: sub.name,
        cost: sub.cost,
        status: sub.status,
        logo: sub.logo,
        category: sub.category,
        trialEndsIn: sub.trialEndsIn,
      })),
    ];

    const links: GraphLink[] = subs.map(sub => ({
      source: 'user',
      target: sub.id,
      value: sub.cost,
    }));

    return { nodes, links };
  }, [subs]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeClick = useCallback((node: any) => {
    if (node.isUser) return;
    const subscription = subs.find(s => s.id === node.id);
    if (subscription && onNodeClick) {
      onNodeClick(subscription);
    }
  }, [subs, onNodeClick]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
    const x = node.x || 0;
    const y = node.y || 0;

    if (node.isUser) {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 25);
      gradient.addColorStop(0, '#22c55e');
      gradient.addColorStop(1, '#16a34a');

      ctx.beginPath();
      ctx.arc(x, y, 25, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u{1F464}', x, y);

      ctx.font = 'bold 10px Inter, Arial';
      ctx.fillStyle = '#374151';
      ctx.fillText('YOU', x, y + 35);
    } else {
      const baseRadius = Math.min(40, 15 + (node.cost || 10) / 5);
      const color = statusColors[node.status || 'active'];

      let radius = baseRadius;
      if (node.status === 'trial_ending') {
        const pulse = Math.sin(pulsePhaseRef.current * 0.1) * 0.2 + 1;
        radius = baseRadius * pulse;

        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 15;
      }

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color + '33';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.font = `${Math.max(12, radius * 0.8)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.logo || '\u{1F4E6}', x, y);

      ctx.font = 'bold 9px Inter, Arial';
      ctx.fillStyle = '#1f2937';
      ctx.fillText(node.name || '', x, y + radius + 12);

      ctx.font = '8px Inter, Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`$${(node.cost || 0).toFixed(2)}/mo`, x, y + radius + 22);

      if (node.trialEndsIn !== undefined) {
        ctx.fillStyle = '#f97316';
        ctx.font = 'bold 8px Arial';
        ctx.fillText(`\u26A0\uFE0F ${node.trialEndsIn}d left`, x, y - radius - 10);
      }
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const source = link.source as GraphNode;
    const target = link.target as GraphNode;

    if (source.x == null || source.y == null || target.x == null || target.y == null) return;

    const lineWidth = Math.max(1, (link as GraphLink).value / 15);
    const targetStatus = (target as GraphNode).status || 'active';
    const color = statusColors[targetStatus];

    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = color + '66';
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }, []);

  if (streamStatus.isPending || !subscriptions) {
    return <GraphSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative w-full rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200"
    >
      {/* Stats Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between">
        <div className="bg-white rounded-lg px-4 py-2.5 border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">Monthly Spending</div>
          <div className="text-xl font-bold text-slate-900">
            ${(totalMonthlySpending ?? 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-red-50 rounded-lg px-4 py-2.5 border border-red-100 shadow-sm">
          <div className="text-xs text-red-500">Potential Savings</div>
          <div className="text-xl font-bold text-red-600">
            ${(potentialSavings ?? 0).toFixed(2)}/mo
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg p-2.5 border border-slate-200 shadow-sm">
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-slate-600">Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-slate-600">Zombie</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="text-slate-600">Price Hike</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-slate-600">Trial Ending</span>
          </div>
        </div>
      </div>

      {/* Graph */}
      <div ref={containerRef} className="w-full h-[450px]">
        <ForceGraph2D
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          nodeCanvasObject={nodeCanvasObject}
          linkCanvasObject={linkCanvasObject}
          onNodeClick={handleNodeClick}
          nodeRelSize={6}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={2}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          cooldownTicks={100}
          backgroundColor="transparent"
        />
      </div>

      {/* Click hint */}
      <div className="absolute bottom-4 right-4 z-10 text-xs text-slate-400 bg-white/80 backdrop-blur-sm px-2 py-1 rounded">
        Click a subscription to cancel
      </div>
    </motion.div>
  );
}
