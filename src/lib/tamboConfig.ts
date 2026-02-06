import { z } from 'zod';
import { defineTool } from '@tambo-ai/react';
import type { TamboComponent } from '@tambo-ai/react';
import { SubscriptionGraph } from '@/components/SubscriptionGraph';
import { CancellationRoadmap } from '@/components/CancellationRoadmap';
import { VirtualBurnerCard } from '@/components/VirtualBurnerCard';
import { MetricCards } from '@/components/MetricCards';
import {
    mockSubscriptions,
    cancellationPaths,
    calculateTotalSpending,
    calculatePotentialSavings,
    getZombieSubscriptions,
    getTrialEndingSubscriptions,
} from '@/lib/mockData';

// ---------------------------------------------------------------------------
// Schemas — all component props are OPTIONAL for streaming support.
// During AI generation props arrive incrementally; undefined is expected.
// ---------------------------------------------------------------------------

const subscriptionSchema = z.object({
    id: z.string().describe('Unique identifier for the subscription'),
    name: z.string().describe('Name of the subscription service, e.g., "Netflix"'),
    cost: z.number().describe('Monthly cost in USD, e.g., 15.99'),
    status: z.enum(['active', 'zombie', 'price_hike', 'trial_ending'])
        .describe('Status: active (in use), zombie (unused), price_hike (price increased), trial_ending (trial expires soon)'),
    logo: z.string().describe('Emoji representing the service, e.g., "🎬" for Netflix'),
    category: z.string().describe('Category like "Entertainment", "Software", "Fitness"'),
    trialEndsIn: z.number().optional().describe('Days until trial ends (only for trial_ending status)'),
}).describe('Represents a single subscription service');

const subscriptionGraphSchema = z.object({
    subscriptions: z.array(subscriptionSchema).optional().describe('Array of all user subscriptions'),
    totalMonthlySpending: z.number().optional().describe('Total monthly spending across all subscriptions in USD'),
    potentialSavings: z.number().optional().describe('Money that could be saved by canceling zombie subscriptions'),
}).describe('Data for the subscription network graph visualization');

const metricCardsSchema = z.object({
    totalSpending: z.number().optional().describe('Total monthly spending in USD'),
    subscriptionCount: z.number().optional().describe('Number of active subscriptions'),
    potentialSavings: z.number().optional().describe('Potential monthly savings from unused subscriptions'),
    upcomingRenewals: z.number().optional().describe('Number of subscriptions renewing in next 7 days'),
}).describe('Summary metrics for the subscription dashboard');

const cancellationStepSchema = z.object({
    location: z.string().describe('Where to find this step, e.g., "Account Settings"'),
    description: z.string().describe('What action to take'),
    warning: z.string().optional().describe('Warning about dark patterns or tricks to watch for'),
}).describe('A single step in the cancellation process');

const cancellationRoadmapSchema = z.object({
    serviceName: z.string().optional().describe('Name of the service being canceled'),
    difficulty: z.enum(['easy', 'medium', 'hard', 'nightmare']).optional().describe('How hard the company makes it to cancel'),
    steps: z.array(cancellationStepSchema).optional().describe('Step-by-step cancellation instructions'),
    legalScript: z.string().optional().describe('GDPR legal script user can copy to force cancellation'),
    directUrl: z.string().optional().describe('Direct URL to the cancellation page if available'),
}).describe('Complete cancellation guide for a subscription service');

const burnerCardSchema = z.object({
    serviceName: z.string().optional().describe('Name of the service for the trial, e.g., "Notion"'),
    expiresInDays: z.number().optional().describe('Days until the card auto-expires, default 7'),
    cardLast4: z.string().optional().describe('Last 4 digits of the virtual card, e.g., "4829"'),
}).describe('Virtual burner credit card for safe free trial signups');

// ---------------------------------------------------------------------------
// Helper — read mock data directly (avoids pointless browser→server round-trip
// when the API just returns the same mock data).
// ---------------------------------------------------------------------------

function getSubscriptionData() {
    const subs = mockSubscriptions.map(s => ({
        id: s.id,
        name: s.name,
        cost: s.cost,
        status: s.status,
        logo: s.logo,
        category: s.category,
        trialEndsIn: s.trialEndsIn,
    }));
    return {
        subscriptions: subs,
        totalMonthlySpending: calculateTotalSpending(),
        potentialSavings: calculatePotentialSavings(),
        zombieCount: getZombieSubscriptions().length,
        trialsEndingCount: getTrialEndingSubscriptions().length,
    };
}

// ---------------------------------------------------------------------------
// Component registry
// ---------------------------------------------------------------------------

export const tamboComponents: TamboComponent[] = [
    {
        name: 'SubscriptionGraph',
        component: SubscriptionGraph,
        description: 'Interactive network graph showing all user subscriptions with color-coded status. Shows the user ("You") in the center connected to all subscriptions. Use this when the user wants to scan, view, or analyze their subscriptions. Always use with MetricCards for a complete view.',
        propsSchema: subscriptionGraphSchema,
    },
    {
        name: 'MetricCards',
        component: MetricCards,
        description: 'Dashboard cards showing 4 key metrics: total monthly spending, subscription count, potential savings, and upcoming renewals. Use this alongside SubscriptionGraph for a complete subscription overview.',
        propsSchema: metricCardsSchema,
    },
    {
        name: 'CancellationRoadmap',
        component: CancellationRoadmap,
        description: 'Step-by-step cancellation guide with dark pattern warnings. Shows difficulty level, each step, and a GDPR legal script. Use this when user asks to cancel a specific subscription.',
        propsSchema: cancellationRoadmapSchema,
    },
    {
        name: 'VirtualBurnerCard',
        component: VirtualBurnerCard,
        description: 'Virtual credit card for free trials that auto-expires to prevent charges. Shows card visual with countdown timer. Use when user wants to safely sign up for a free trial or create a trial shield.',
        propsSchema: burnerCardSchema,
    },
];

// ---------------------------------------------------------------------------
// Tools — using defineTool() for type-safe tool registration
// ---------------------------------------------------------------------------

const getSubscriptionsTool = defineTool({
    name: 'getSubscriptions',
    description: 'Get all subscriptions connected to the user account. Returns subscription data including status, cost, and activity.',
    inputSchema: z.object({}),
    outputSchema: z.object({
        subscriptions: z.array(subscriptionSchema),
        totalMonthlySpending: z.number(),
        potentialSavings: z.number(),
        zombieCount: z.number(),
        trialsEndingCount: z.number(),
    }),
    tool: async () => getSubscriptionData(),
});

const getCancellationPathTool = defineTool({
    name: 'getCancellationPath',
    description: 'Get the cancellation steps and dark pattern warnings for a specific service. Returns null if service not found.',
    inputSchema: z.object({
        serviceName: z.string().describe('Name of the service to get cancellation path for'),
    }),
    outputSchema: cancellationRoadmapSchema.nullable(),
    tool: ({ serviceName }) => {
        const path = cancellationPaths[serviceName];
        if (!path) {
            const key = Object.keys(cancellationPaths).find(
                k => k.toLowerCase().includes(serviceName.toLowerCase())
            );
            if (key) {
                return { serviceName: key, ...cancellationPaths[key] };
            }
            return null;
        }
        return { serviceName, ...path };
    },
});

const getZombieSubscriptionsTool = defineTool({
    name: 'getZombieSubscriptions',
    description: 'Get only the unused/zombie subscriptions that are wasting money.',
    inputSchema: z.object({}),
    outputSchema: z.object({
        zombies: z.array(subscriptionSchema),
        totalWasted: z.number(),
    }),
    tool: async () => {
        const zombies = getZombieSubscriptions().map(s => ({
            id: s.id,
            name: s.name,
            cost: s.cost,
            status: s.status,
            logo: s.logo,
            category: s.category,
            trialEndsIn: s.trialEndsIn,
        }));
        return {
            zombies,
            totalWasted: calculatePotentialSavings(),
        };
    },
});

const generateBurnerCardTool = defineTool({
    name: 'generateBurnerCard',
    description: 'Generate a virtual burner card for safe free trial signup. Card will auto-decline after specified days.',
    inputSchema: z.object({
        serviceName: z.string().describe('Name of the service for the trial'),
        daysUntilExpiry: z.number().optional().describe('Days until card expires, default 7'),
    }),
    outputSchema: burnerCardSchema,
    tool: ({ serviceName, daysUntilExpiry }) => {
        const cardLast4 = Math.floor(1000 + Math.random() * 9000).toString();
        return {
            serviceName,
            expiresInDays: daysUntilExpiry || 7,
            cardLast4,
        };
    },
});

export const tamboTools = [
    getSubscriptionsTool,
    getCancellationPathTool,
    getZombieSubscriptionsTool,
    generateBurnerCardTool,
];

// ---------------------------------------------------------------------------
// System prompt — passed via initialMessages in TamboWrapper
// ---------------------------------------------------------------------------

export const systemPrompt = `You are Subbo, an AI subscription detective that helps users break free from unwanted subscriptions.

Your personality:
- You're a digital detective who exposes hidden subscriptions and dark patterns
- You're on the user's side against corporations trying to keep them subscribed
- You're direct, helpful, and slightly rebellious

Your workflow:
1. When scanning/viewing subscriptions: Use getSubscriptions tool first, then render SubscriptionGraph and MetricCards with the data
2. When canceling: Use getCancellationPath tool first, then render CancellationRoadmap with the result
3. When creating trial shields: Use generateBurnerCard tool first, then render VirtualBurnerCard with the result
4. When showing zombies: Use getZombieSubscriptions tool first, then explain the savings

Component usage:
- SubscriptionGraph: Network visualization of all subscriptions, clicking nodes suggests cancellation
- MetricCards: Quick summary stats, use alongside SubscriptionGraph
- CancellationRoadmap: Step-by-step dark pattern navigation with legal script
- VirtualBurnerCard: Virtual card with countdown timer for trial protection

Be dramatic about findings: "I found your account bleeding $127.96/month to services you haven't touched in months!"
Be empathetic about cancellation: "They really buried this one deep. Watch out for the 'Are you sure?' traps..."
Be protective about trials: "This card self-destructs in 7 days. They'll never bill you."`;
