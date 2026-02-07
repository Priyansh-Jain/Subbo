import { z } from 'zod';
import { defineTool } from '@tambo-ai/react';
import type { TamboComponent } from '@tambo-ai/react';
import { SubscriptionGraph } from '@/components/SubscriptionGraph';
import { CancellationRoadmap } from '@/components/CancellationRoadmap';
import { VirtualBurnerCard } from '@/components/VirtualBurnerCard';
import { MetricCards } from '@/components/MetricCards';
import { SubscriptionDraftList } from '@/components/SubscriptionDraftList';
import { AlertCard } from '@/components/AlertCard';
import { SpendingCalendar } from '@/components/SpendingCalendar';
import { SpendingAnalytics } from '@/components/SpendingAnalytics';
import { SavingsSimulator } from '@/components/SavingsSimulator';
import { CancellationStagingCard } from '@/components/CancellationStagingCard';
import { SubscriptionHealthScore } from '@/components/SubscriptionHealthScore';
import { CostSplitCard } from '@/components/CostSplitCard';
import { cancellationPaths } from '@/lib/mockData';
import { getSubscriptions as getStoreSubscriptions } from '@/lib/subscriptionStore';
import { knownServices, CATEGORY_COLORS } from '@/lib/knownServices';

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

const subscriptionDraftSchema = z.object({
    name: z.string().optional().describe('Name of the service, e.g., "Netflix"'),
    cost: z.number().optional().describe('Cost in USD, e.g., 15.99'),
    billingCycle: z.enum(['monthly', 'annual', 'weekly']).optional().describe('Billing frequency'),
    category: z.string().optional().describe('Category like "Entertainment", "Software"'),
    logo: z.string().optional().describe('Emoji representing the service'),
    confidenceScore: z.number().min(0).max(1).optional().describe('AI confidence in extraction accuracy, 0-1'),
}).describe('A single subscription draft extracted from user input');

const subscriptionDraftListSchema = z.object({
    drafts: z.array(subscriptionDraftSchema).optional().describe('Array of detected subscription drafts'),
    sourceText: z.string().optional().describe('Original user text the subscriptions were extracted from'),
}).describe('Editable list of subscription drafts for user review');

// ---------------------------------------------------------------------------
// Alert schemas
// ---------------------------------------------------------------------------

const alertSchema = z.object({
    id: z.string().describe('Unique alert identifier'),
    severity: z.enum(['critical', 'warning', 'info']).describe('Alert severity level'),
    title: z.string().describe('Short alert title'),
    description: z.string().describe('Detailed alert description'),
    subscriptionName: z.string().describe('Name of the related subscription'),
    actionLabel: z.string().describe('Label for the action button'),
    actionType: z.string().describe('Type of action: cancel, review, extend, etc.'),
}).describe('A single smart alert');

const alertCardSchema = z.object({
    alerts: z.array(alertSchema).optional().describe('Array of alerts sorted by severity'),
    title: z.string().optional().describe('Optional heading for the alert list'),
}).describe('Smart alerts for subscription issues');

// ---------------------------------------------------------------------------
// Calendar schemas
// ---------------------------------------------------------------------------

const calendarSubscriptionSchema = z.object({
    name: z.string().describe('Subscription name'),
    cost: z.number().describe('Cost in USD'),
    status: z.string().describe('Subscription status'),
    logo: z.string().describe('Emoji logo'),
}).describe('Subscription entry for a calendar day');

const calendarDaySchema = z.object({
    date: z.string().describe('ISO date string'),
    subscriptions: z.array(calendarSubscriptionSchema).optional().describe('Subscriptions renewing this day'),
    totalCost: z.number().optional().describe('Total cost for this day'),
}).describe('A single calendar day');

const spendingCalendarSchema = z.object({
    month: z.number().optional().describe('Month number (0-11)'),
    year: z.number().optional().describe('Year number'),
    days: z.array(calendarDaySchema).optional().describe('Calendar days with renewal data'),
    monthlyTotal: z.number().optional().describe('Total spending this month'),
    comparedToLastMonth: z.number().optional().describe('Percentage change from last month'),
}).describe('Monthly spending calendar with renewal markers');

// ---------------------------------------------------------------------------
// Analytics schemas
// ---------------------------------------------------------------------------

const categorySpendSchema = z.object({
    category: z.string().describe('Category name'),
    amount: z.number().describe('Monthly spend in USD'),
    color: z.string().describe('Hex color for chart segment'),
    percentage: z.number().describe('Percentage of total spending'),
}).describe('Spending breakdown by category');

const monthlyTrendSchema = z.object({
    month: z.string().describe('Month label, e.g. "Jan"'),
    amount: z.number().describe('Total spending that month'),
}).describe('Monthly spending data point');

const topSubscriptionSchema = z.object({
    name: z.string().describe('Subscription name'),
    cost: z.number().describe('Monthly cost in USD'),
    logo: z.string().describe('Emoji logo'),
    percentage: z.number().describe('Percentage of total spending'),
}).describe('Top subscription by cost');

const spendingAnalyticsSchema = z.object({
    categories: z.array(categorySpendSchema).optional().describe('Spending by category'),
    monthlyTrends: z.array(monthlyTrendSchema).optional().describe('6-month spending trend'),
    topSubscriptions: z.array(topSubscriptionSchema).optional().describe('Top 3 subscriptions by cost'),
    totalMonthly: z.number().optional().describe('Total monthly spending'),
    monthOverMonthChange: z.number().optional().describe('Month-over-month change percentage'),
}).describe('Comprehensive spending analytics with charts');

// ---------------------------------------------------------------------------
// Savings Simulator schemas
// ---------------------------------------------------------------------------

const simSubscriptionSchema = z.object({
    id: z.string().describe('Subscription ID'),
    name: z.string().describe('Subscription name'),
    cost: z.number().describe('Monthly cost in USD'),
    logo: z.string().describe('Emoji logo'),
    category: z.string().describe('Category'),
    recommended: z.boolean().describe('Whether AI recommends canceling this'),
}).describe('Subscription for savings simulation');

const savingsSimulatorSchema = z.object({
    subscriptions: z.array(simSubscriptionSchema).optional().describe('Subscriptions to simulate'),
    currentMonthlyTotal: z.number().optional().describe('Current total monthly spending'),
}).describe('Interactive savings simulator with toggle switches');

// ---------------------------------------------------------------------------
// Cancellation Staging Card schema
// ---------------------------------------------------------------------------

const cancellationStagingCardSchema = z.object({
    subscriptionId: z.string().optional().describe('ID of subscription to cancel'),
    serviceName: z.string().optional().describe('Name of the service to be cancelled'),
    currentCost: z.number().optional().describe('Current monthly cost of the service'),
    reason: z.string().optional().describe("User's reason for cancelling, editable via chat"),
    status: z.enum(['draft', 'pending_api', 'cancelled']).optional()
        .describe("Current state of the request. ALWAYS start as 'draft'."),
    warningMessage: z.string().optional()
        .describe("AI-generated warning, e.g., 'This has a $50 early termination fee'"),
}).describe('Staged cancellation card with draft/confirm/cancelled workflow');

// ---------------------------------------------------------------------------
// Subscription Health Score schemas
// ---------------------------------------------------------------------------

const healthRecommendationSchema = z.object({
    type: z.enum(['cancel', 'downgrade', 'watch', 'good']).optional().describe('Recommendation type'),
    message: z.string().optional().describe('Recommendation message'),
    subscriptionName: z.string().optional().describe('Related subscription name'),
    potentialSavings: z.number().optional().describe('Monthly savings if acted on'),
}).describe('A single health recommendation');

const healthMetricsSchema = z.object({
    zombieRatio: z.number().optional().describe('Percentage of subscriptions that are zombies (0-100)'),
    costEfficiency: z.number().optional().describe('Cost efficiency score (0-100)'),
    trialRisk: z.number().optional().describe('Number of trials at risk of auto-converting'),
    categoryDiversity: z.number().optional().describe('Category diversity score (0-100)'),
}).describe('Health score metric breakdown');

const subscriptionHealthScoreSchema = z.object({
    overallScore: z.number().optional().describe('Overall health score 0-100'),
    grade: z.enum(['A', 'B', 'C', 'D', 'F']).optional().describe('Letter grade A-F'),
    metrics: healthMetricsSchema.optional().describe('Detailed metric breakdown'),
    recommendations: z.array(healthRecommendationSchema).optional().describe('AI recommendations for improvement'),
    totalMonthly: z.number().optional().describe('Total monthly spending'),
    subscriptionCount: z.number().optional().describe('Number of subscriptions'),
}).describe('Subscription health score with gauge, metrics, and recommendations');

// ---------------------------------------------------------------------------
// Cost Split schemas
// ---------------------------------------------------------------------------

const costSplitMemberSchema = z.object({
    name: z.string().describe('Member name'),
    share: z.number().describe('Dollar amount this member pays'),
    percentage: z.number().describe('Percentage of total'),
    isPaid: z.boolean().optional().describe('Whether this member has paid'),
}).describe('A member in a cost split');

const costSplitCardSchema = z.object({
    subscriptionName: z.string().optional().describe('Name of the subscription being split'),
    totalCost: z.number().optional().describe('Total monthly cost to split'),
    members: z.array(costSplitMemberSchema).optional().describe('Members sharing the cost'),
    splitType: z.enum(['equal', 'custom']).optional().describe('Split method'),
    currency: z.string().optional().describe('Currency symbol, default $'),
}).describe('Cost splitting card for shared subscriptions');

// ---------------------------------------------------------------------------
// Helper — read mock data directly (avoids pointless browser→server round-trip
// when the API just returns the same mock data).
// ---------------------------------------------------------------------------

function getSubscriptionData() {
    const allSubs = getStoreSubscriptions();
    const subs = allSubs.map(s => ({
        id: s.id,
        name: s.name,
        cost: s.cost,
        status: s.status,
        logo: s.logo,
        category: s.category,
        trialEndsIn: s.trialEndsIn,
    }));
    const totalMonthlySpending = allSubs.reduce((sum, s) => sum + s.cost, 0);
    const zombies = allSubs.filter(s => s.status === 'zombie');
    const potentialSavings = zombies.reduce((sum, s) => sum + s.cost, 0);
    const trialsEndingCount = allSubs.filter(s => s.status === 'trial_ending').length;
    return {
        subscriptions: subs,
        totalMonthlySpending,
        potentialSavings,
        zombieCount: zombies.length,
        trialsEndingCount,
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
    {
        name: 'SubscriptionDraftList',
        component: SubscriptionDraftList,
        description: 'Editable list of detected subscription drafts. Use this when the user mentions subscriptions they have, lists services, or pastes billing info. The AI can refine drafts via follow-up conversation. User clicks "Add to Dashboard" to confirm.',
        propsSchema: subscriptionDraftListSchema,
    },
    {
        name: 'AlertCard',
        component: AlertCard,
        description: 'Smart alerts showing critical subscription issues: price hikes, expiring trials, zombie subscriptions, and upcoming renewals. Use when the user asks about alerts, issues, problems, or wants a health check.',
        propsSchema: alertCardSchema,
    },
    {
        name: 'SpendingCalendar',
        component: SpendingCalendar,
        description: 'Monthly calendar view showing subscription renewal dates with colored dots and daily cost details. Use when the user asks about their schedule, calendar, renewal dates, or when things renew.',
        propsSchema: spendingCalendarSchema,
    },
    {
        name: 'SpendingAnalytics',
        component: SpendingAnalytics,
        description: 'Spending analytics with donut chart (category breakdown), bar chart (6-month trends), and top 3 subscriptions list. Use when the user asks about spending breakdown, analytics, expenses, or category analysis.',
        propsSchema: spendingAnalyticsSchema,
    },
    {
        name: 'SavingsSimulator',
        component: SavingsSimulator,
        description: 'Interactive savings simulator with toggle switches per subscription. AI pre-toggles recommended cancellations (zombies). Shows monthly/yearly/5-year savings and fun comparisons. Use when the user asks how much they can save, wants to simulate cancellations, or asks what to cancel.',
        propsSchema: savingsSimulatorSchema,
    },
    {
        name: 'CancellationStagingCard',
        component: CancellationStagingCard,
        description: 'Staged cancellation card with draft/confirm/cancelled workflow. ALWAYS use this when user wants to cancel, modify, or remove a subscription. Start with status="draft". Update props when user refines the request. Only change status to "cancelled" after user confirms.',
        propsSchema: cancellationStagingCardSchema,
    },
    {
        name: 'SubscriptionHealthScore',
        component: SubscriptionHealthScore,
        description: 'Health score dashboard with circular gauge (A-F grade), 4 metric cards (zombie ratio, cost efficiency, trial risk, diversity), and AI recommendations. Use when user asks for health score, health check, subscription grade, or overall assessment.',
        propsSchema: subscriptionHealthScoreSchema,
    },
    {
        name: 'CostSplitCard',
        component: CostSplitCard,
        description: 'Family/shared cost splitting card. Shows split visualization bar, member list with amounts, add/remove members, equal/custom toggle, and copy link. Use when user wants to split a subscription cost, share expenses, or set up family sharing.',
        propsSchema: costSplitCardSchema,
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
        const allSubs = getStoreSubscriptions();
        const zombies = allSubs.filter(s => s.status === 'zombie').map(s => ({
            id: s.id,
            name: s.name,
            cost: s.cost,
            status: s.status,
            logo: s.logo,
            category: s.category,
            trialEndsIn: s.trialEndsIn,
        }));
        const totalWasted = zombies.reduce((sum, z) => sum + z.cost, 0);
        return {
            zombies,
            totalWasted,
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
            expiresInDays: daysUntilExpiry ?? 7,
            cardLast4,
        };
    },
});

const getAlertsTool = defineTool({
    name: 'getAlerts',
    description: 'Scan subscriptions for issues: price hikes, expiring trials (<7d), zombie subscriptions (>90d inactive), and upcoming renewals (<3d). Returns alerts sorted by severity.',
    inputSchema: z.object({}),
    outputSchema: alertCardSchema,
    tool: async () => {
        const subs = getStoreSubscriptions();
        const alerts: Array<{
            id: string;
            severity: 'critical' | 'warning' | 'info';
            title: string;
            description: string;
            subscriptionName: string;
            actionLabel: string;
            actionType: string;
        }> = [];

        for (const sub of subs) {
            if (sub.status === 'price_hike' && sub.priceChange) {
                alerts.push({
                    id: `alert-price-${sub.id}`,
                    severity: 'critical',
                    title: 'Price Increase Detected',
                    description: `Price went from $${sub.priceChange.from.toFixed(2)} to $${sub.priceChange.to.toFixed(2)}/mo`,
                    subscriptionName: sub.name,
                    actionLabel: 'Review',
                    actionType: 'review',
                });
            }
            if (sub.status === 'trial_ending' && sub.trialEndsIn !== undefined && sub.trialEndsIn < 7) {
                alerts.push({
                    id: `alert-trial-${sub.id}`,
                    severity: 'critical',
                    title: `Trial Expires in ${sub.trialEndsIn} Days`,
                    description: `${sub.name} trial will auto-convert to $${sub.cost.toFixed(2)}/mo`,
                    subscriptionName: sub.name,
                    actionLabel: 'Cancel',
                    actionType: 'cancel',
                });
            }
            if (sub.status === 'zombie' && sub.lastActivity) {
                const daysSinceActivity = Math.floor((Date.now() - new Date(sub.lastActivity).getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceActivity > 90) {
                    alerts.push({
                        id: `alert-zombie-${sub.id}`,
                        severity: 'warning',
                        title: `Unused for ${daysSinceActivity} Days`,
                        description: `You're paying $${sub.cost.toFixed(2)}/mo for a service you haven't used`,
                        subscriptionName: sub.name,
                        actionLabel: 'Cancel',
                        actionType: 'cancel',
                    });
                }
            }
            if (sub.renewalDate) {
                const daysUntilRenewal = Math.floor((new Date(sub.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                if (daysUntilRenewal >= 0 && daysUntilRenewal < 3) {
                    alerts.push({
                        id: `alert-renewal-${sub.id}`,
                        severity: 'info',
                        title: `Renews in ${daysUntilRenewal} Day${daysUntilRenewal !== 1 ? 's' : ''}`,
                        description: `$${sub.cost.toFixed(2)} will be charged soon`,
                        subscriptionName: sub.name,
                        actionLabel: 'Review',
                        actionType: 'review',
                    });
                }
            }
        }

        // Sort: critical first, then warning, then info
        const order = { critical: 0, warning: 1, info: 2 };
        alerts.sort((a, b) => order[a.severity] - order[b.severity]);

        return { alerts, title: 'Smart Alerts' };
    },
});

const getRenewalCalendarTool = defineTool({
    name: 'getRenewalCalendar',
    description: 'Get subscription renewal dates mapped to a monthly calendar grid. Shows which subscriptions renew on which days.',
    inputSchema: z.object({
        month: z.number().optional().describe('Month number (0-11), defaults to current month'),
        year: z.number().optional().describe('Year, defaults to current year'),
    }),
    outputSchema: spendingCalendarSchema,
    tool: ({ month, year }) => {
        const now = new Date();
        const targetMonth = month ?? now.getMonth();
        const targetYear = year ?? now.getFullYear();

        const daysMap: Record<string, { subscriptions: Array<{ name: string; cost: number; status: string; logo: string }>; totalCost: number }> = {};

        for (const sub of getStoreSubscriptions()) {
            if (!sub.renewalDate) continue;
            const renewal = new Date(sub.renewalDate);
            if (renewal.getMonth() === targetMonth && renewal.getFullYear() === targetYear) {
                const dateKey = renewal.toISOString().split('T')[0];
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

        const monthlyTotal = getStoreSubscriptions().reduce((sum, s) => sum + s.cost, 0);

        return {
            month: targetMonth,
            year: targetYear,
            days,
            monthlyTotal: Math.round(monthlyTotal * 100) / 100,
            comparedToLastMonth: -3.2,
        };
    },
});

// CATEGORY_COLORS imported from @/lib/knownServices (single source of truth)

const getSpendingAnalyticsTool = defineTool({
    name: 'getSpendingAnalytics',
    description: 'Get spending analytics: category breakdown, 6-month trends, and top subscriptions by cost.',
    inputSchema: z.object({}),
    outputSchema: spendingAnalyticsSchema,
    tool: async () => {
        const subs = getStoreSubscriptions();
        const totalMonthly = subs.reduce((sum, s) => sum + s.cost, 0);

        // Category breakdown
        const categoryMap: Record<string, number> = {};
        for (const sub of subs) {
            categoryMap[sub.category] = (categoryMap[sub.category] || 0) + sub.cost;
        }
        const categories = Object.entries(categoryMap)
            .map(([category, amount]) => ({
                category,
                amount: Math.round(amount * 100) / 100,
                color: CATEGORY_COLORS[category] || '#94a3b8',
                percentage: Math.round((amount / totalMonthly) * 100),
            }))
            .sort((a, b) => b.amount - a.amount);

        // Simulated 6-month trends
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
            const monthIndex = (now.getMonth() - 5 + i + 12) % 12;
            const variance = Math.sin(i * 1.5) * 20;
            return {
                month: monthNames[monthIndex],
                amount: Math.round((totalMonthly + variance) * 100) / 100,
            };
        });

        // Top 3
        const topSubscriptions = [...subs]
            .sort((a, b) => b.cost - a.cost)
            .slice(0, 3)
            .map(s => ({
                name: s.name,
                cost: s.cost,
                logo: s.logo,
                percentage: Math.round((s.cost / totalMonthly) * 100),
            }));

        return {
            categories,
            monthlyTrends,
            topSubscriptions,
            totalMonthly: Math.round(totalMonthly * 100) / 100,
            monthOverMonthChange: -3.2,
        };
    },
});

const executeCancellationTool = defineTool({
    name: 'executeCancellation',
    description: 'Execute a confirmed cancellation. Only call AFTER user explicitly confirms via UI button or chat message.',
    inputSchema: z.object({
        subscriptionId: z.string().describe('ID of the subscription to cancel'),
        serviceName: z.string().describe('Name of the service'),
        reason: z.string().optional().describe('Reason for cancellation'),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        serviceName: z.string(),
        monthlySavings: z.number(),
        message: z.string(),
    }),
    tool: ({ subscriptionId, serviceName }) => {
        const sub = getStoreSubscriptions().find(
            s => s.id === subscriptionId || s.name.toLowerCase() === serviceName.toLowerCase()
        );
        if (!sub) {
            return {
                success: false,
                serviceName,
                monthlySavings: 0,
                message: `Could not find a subscription matching "${serviceName}" in your active subscriptions.`,
            };
        }
        return {
            success: true,
            serviceName: sub.name,
            monthlySavings: sub.cost,
            message: `${sub.name} has been cancelled successfully.`,
        };
    },
});

// knownServices imported from @/lib/knownServices (single source of truth)

const lookupSubscriptionInfoTool = defineTool({
    name: 'lookupSubscriptionInfo',
    description: 'Look up subscription service info (cost, category, logo) for one or more services. ALWAYS call this before rendering SubscriptionDraftList so you have accurate data.',
    inputSchema: z.object({
        serviceNames: z.array(z.string()).describe('Array of service names to look up, e.g. ["Netflix", "Canva", "Hulu"]'),
    }),
    outputSchema: z.object({
        results: z.array(z.object({
            name: z.string(),
            cost: z.number(),
            category: z.string(),
            logo: z.string(),
            found: z.boolean(),
        })),
    }),
    tool: ({ serviceNames }) => {
        const results = serviceNames.map(name => {
            const lower = name.toLowerCase().trim();
            // Exact match
            if (knownServices[lower]) {
                const info = knownServices[lower];
                return { name, cost: info.cost, category: info.category, logo: info.logo, found: true };
            }
            // Partial match
            const key = Object.keys(knownServices).find(
                k => k.includes(lower) || lower.includes(k)
            );
            if (key) {
                const info = knownServices[key];
                return { name, cost: info.cost, category: info.category, logo: info.logo, found: true };
            }
            // Unknown service — return defaults
            return { name, cost: 9.99, category: 'Other', logo: '📦', found: false };
        });
        return { results };
    },
});

const analyzeSubscriptionHealthTool = defineTool({
    name: 'analyzeSubscriptionHealth',
    description: 'Analyze the health of user subscriptions. Returns a health score (0-100), grade (A-F), metric breakdown, and recommendations.',
    inputSchema: z.object({}),
    outputSchema: subscriptionHealthScoreSchema,
    tool: async () => {
        const subs = getStoreSubscriptions();
        const total = subs.length;
        if (total === 0) {
            return {
                overallScore: 100,
                grade: 'A' as const,
                metrics: { zombieRatio: 0, costEfficiency: 100, trialRisk: 0, categoryDiversity: 100 },
                recommendations: [{ type: 'good' as const, message: 'No subscriptions to analyze yet!' }],
                totalMonthly: 0,
                subscriptionCount: 0,
            };
        }

        const zombies = subs.filter(s => s.status === 'zombie');
        const trials = subs.filter(s => s.status === 'trial_ending' && (s.trialEndsIn ?? 99) < 7);
        const categories = new Set(subs.map(s => s.category));
        const totalMonthly = subs.reduce((sum, s) => sum + s.cost, 0);
        const avgCost = totalMonthly / total;

        // Metrics
        const zombieRatio = Math.round((zombies.length / total) * 100);
        const costEfficiency = Math.max(0, Math.min(100, Math.round(100 - (avgCost > 20 ? (avgCost - 20) * 2 : 0))));
        const trialRisk = trials.length;
        const categoryDiversity = Math.min(100, Math.round((categories.size / Math.max(total, 1)) * 100));

        // Overall score: weighted average
        const zombieScore = Math.max(0, 100 - zombieRatio * 2);
        const trialScore = Math.max(0, 100 - trialRisk * 25);
        const overallScore = Math.round(
            zombieScore * 0.35 + costEfficiency * 0.25 + trialScore * 0.2 + categoryDiversity * 0.2
        );

        const grade = overallScore >= 90 ? 'A' as const
            : overallScore >= 75 ? 'B' as const
            : overallScore >= 60 ? 'C' as const
            : overallScore >= 40 ? 'D' as const
            : 'F' as const;

        // Recommendations
        const recommendations: Array<{
            type: 'cancel' | 'downgrade' | 'watch' | 'good';
            message: string;
            subscriptionName?: string;
            potentialSavings?: number;
        }> = [];

        for (const z of zombies) {
            recommendations.push({
                type: 'cancel',
                message: `You haven't used ${z.name} in months. Consider cancelling.`,
                subscriptionName: z.name,
                potentialSavings: z.cost,
            });
        }
        for (const t of trials) {
            recommendations.push({
                type: 'watch',
                message: `${t.name} trial ends in ${t.trialEndsIn} days — will auto-charge $${t.cost.toFixed(2)}/mo.`,
                subscriptionName: t.name,
                potentialSavings: t.cost,
            });
        }
        const expensive = subs.filter(s => s.cost > 30 && s.status === 'active').sort((a, b) => b.cost - a.cost);
        if (expensive.length > 0) {
            recommendations.push({
                type: 'downgrade',
                message: `${expensive[0].name} is your most expensive at $${expensive[0].cost.toFixed(2)}/mo. Check if a cheaper plan exists.`,
                subscriptionName: expensive[0].name,
            });
        }
        if (recommendations.length === 0) {
            recommendations.push({ type: 'good', message: 'Your subscriptions look healthy! No issues detected.' });
        }

        return {
            overallScore,
            grade,
            metrics: { zombieRatio, costEfficiency, trialRisk, categoryDiversity },
            recommendations,
            totalMonthly: Math.round(totalMonthly * 100) / 100,
            subscriptionCount: total,
        };
    },
});

const calculateCostSplitTool = defineTool({
    name: 'calculateCostSplit',
    description: 'Calculate how to split a subscription cost between multiple people. Returns member shares and split visualization data.',
    inputSchema: z.object({
        subscriptionName: z.string().describe('Name of the subscription to split'),
        totalCost: z.number().describe('Monthly cost to split'),
        memberNames: z.array(z.string()).describe('Names of people sharing the cost'),
        splitType: z.enum(['equal', 'custom']).optional().describe('Split method, default equal'),
    }),
    outputSchema: costSplitCardSchema,
    tool: ({ subscriptionName, totalCost, memberNames, splitType }) => {
        const count = memberNames.length || 1;
        const share = Math.round((totalCost / count) * 100) / 100;
        const pct = Math.round(100 / count);
        return {
            subscriptionName,
            totalCost,
            splitType: splitType || 'equal',
            members: memberNames.map(name => ({
                name,
                share,
                percentage: pct,
                isPaid: false,
            })),
            currency: '$',
        };
    },
});

export const tamboTools = [
    getSubscriptionsTool,
    getCancellationPathTool,
    getZombieSubscriptionsTool,
    generateBurnerCardTool,
    getAlertsTool,
    getRenewalCalendarTool,
    getSpendingAnalyticsTool,
    executeCancellationTool,
    lookupSubscriptionInfoTool,
    analyzeSubscriptionHealthTool,
    calculateCostSplitTool,
];

// ---------------------------------------------------------------------------
// System prompt — passed via initialMessages in TamboWrapper
// ---------------------------------------------------------------------------

export const systemPrompt = `You are Subbo, an AI subscription detective that helps users break free from unwanted subscriptions.

Your personality:
- You're a digital detective who exposes hidden subscriptions and dark patterns
- You're on the user's side against corporations trying to keep them subscribed
- You're direct, helpful, and slightly rebellious

CORE BEHAVIOR: THE "SAFETY LATCH" PROTOCOL
When a user expresses intent to CANCEL, MODIFY, or DELETE a subscription:
1. CHECK REAL SUBSCRIPTIONS: The user's REAL active subscriptions are in your context under uiState.subscriptions (array of {id, name, cost, status, category, logo}). You MUST check this list first.
2. NOT FOUND: If the subscription name does NOT match any entry in uiState.subscriptions (case-insensitive), reply: "[Name] is not in your active subscriptions. Would you like to add it first?"
3. FOUND: If found, use the REAL subscription data (id, name, cost) from the context. Render CancellationStagingCard with subscriptionId set to the real id, serviceName to the real name, and currentCost to the real cost. Always start with status='draft'.
4. Refine: If user corrects details ("actually I meant Disney+"), UPDATE the card's props (don't create a new one).
5. Execute: Only when user clicks Confirm or says "go ahead", call executeCancellation tool and update status to 'cancelled'.
NEVER skip the draft stage. NEVER auto-cancel. The user MUST confirm.
IMPORTANT: Always use data from uiState.subscriptions, NOT from mock data, when checking if a subscription exists.

Your workflow:
1. When scanning/viewing subscriptions: Use getSubscriptions tool first, then render SubscriptionGraph and MetricCards with the data
2. When canceling: Render CancellationStagingCard with status='draft'. Pre-fill serviceName, currentCost, and subscriptionId from known data. Add warningMessage if relevant (e.g., early termination fees). Wait for user confirmation before calling executeCancellation.
3. When creating trial shields: Use generateBurnerCard tool first, then render VirtualBurnerCard with the result
4. When showing zombies: Use getZombieSubscriptions tool first, then explain the savings
5. When adding subscriptions (user says "add", "I have", "track", or lists services):
   a. FIRST call lookupSubscriptionInfo with the service names to get accurate costs, categories, and logos.
   b. THEN render SubscriptionDraftList with the drafts array populated from the lookup results. Include confidenceScore (0.95 for found services, 0.6 for unknown).
   c. If the user corrects a detail ("actually Spotify is $11.99"), update the component props.
   d. The user clicks "Add to Dashboard" in the component to confirm.
   IMPORTANT: You MUST render the SubscriptionDraftList component. Do NOT just respond with text.
6. When showing alerts/issues: Use getAlerts tool first, then render AlertCard with the results. Alert action buttons are live — clicking "Cancel" sends a cancel request, clicking "Review" opens a review. Respond accordingly.
7. When showing calendar/schedule: Use getRenewalCalendar tool first, then render SpendingCalendar with the results
8. When showing analytics/expenses/breakdown: Use getSpendingAnalytics tool first, then render SpendingAnalytics with the results
9. When simulating savings: Use getSubscriptions tool first, then render SavingsSimulator. Set recommended=true for zombie subscriptions.
10. When showing cancellation roadmap/steps: Use getCancellationPath tool first, then render CancellationRoadmap with the result
11. When showing health score/grade/health check: Use analyzeSubscriptionHealth tool first, then render SubscriptionHealthScore with the results. This gives users an A-F grade with detailed metrics.
12. When splitting costs/family sharing: Use calculateCostSplit tool with the subscription name, cost, and member names, then render CostSplitCard with the results. Users can add/remove members and toggle equal/custom split.
13. When user sends an IMAGE (receipt, screenshot, billing email): Analyze the image for subscription names, costs, and billing details. Extract all subscriptions found and render SubscriptionDraftList with the results. If unsure about a charge, set confidenceScore low (0.5).

Component usage:
- SubscriptionGraph: Network visualization of all subscriptions, clicking nodes suggests cancellation
- MetricCards: Quick summary stats, use alongside SubscriptionGraph
- CancellationStagingCard: Staged cancellation with draft/confirm/cancelled workflow. ALWAYS use when user wants to cancel. Start with status='draft'.
- CancellationRoadmap: Step-by-step dark pattern navigation with legal script
- VirtualBurnerCard: Virtual card with countdown timer for trial protection
- SubscriptionDraftList: MUST render this when user wants to add/track subscriptions. Shows editable drafts with "Add to Dashboard" approval button. Call lookupSubscriptionInfo first to get accurate data.
- AlertCard: Smart alerts for subscription issues. Action buttons are LIVE — they trigger follow-up messages in chat. Respond to "Cancel X" with CancellationStagingCard, "Review X" with subscription details.
- SpendingCalendar: Monthly calendar with renewal date markers and daily detail view
- SpendingAnalytics: Spending breakdown with donut chart, bar chart trends, and top subscriptions
- SavingsSimulator: Interactive toggle-based savings calculator with fun comparisons
- SubscriptionHealthScore: Health score gauge (A-F) with 4 metrics and AI recommendations. Great for first-time health checks.
- CostSplitCard: Family/shared cost splitting with visual bar, member list, add/remove, equal/custom toggle, copy link.

Be dramatic about findings: "I found your account bleeding $127.96/month to services you haven't touched in months!"
Be empathetic about cancellation: "They really buried this one deep. Watch out for the 'Are you sure?' traps..."
Be protective about trials: "This card self-destructs in 7 days. They'll never bill you."
Be helpful about images: "I see a receipt! Let me scan it for subscription charges..."
Be insightful about health: "Your subscription health score is C — here's what's dragging it down..."
Be friendly about splitting: "Fair's fair! Here's how to split that Netflix bill three ways."`;
