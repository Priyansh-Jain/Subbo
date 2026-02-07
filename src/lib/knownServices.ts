// ---------------------------------------------------------------------------
// Consolidated known services database & category color maps.
// Single source of truth — imported by TamboChat.tsx, tamboConfig.ts, and
// dashboard/page.tsx.
// ---------------------------------------------------------------------------

/** Service info used for enrichment when a subscription name is recognized. */
export interface KnownServiceInfo {
    cost: number;
    category: string;
    logo: string;
}

/**
 * Canonical record of known subscription services.
 * Keys are lower-case service names. Where a service has multiple aliases
 * (e.g. "disney" and "disney+") both keys point to the same data.
 */
export const knownServices: Record<string, KnownServiceInfo> = {
    'netflix': { cost: 15.99, category: 'Entertainment', logo: '\u{1F3AC}' },
    'spotify': { cost: 10.99, category: 'Music', logo: '\u{1F3B5}' },
    'adobe': { cost: 59.99, category: 'Productivity', logo: '\u{1F3A8}' },
    'adobe creative cloud': { cost: 59.99, category: 'Productivity', logo: '\u{1F3A8}' },
    'chatgpt': { cost: 20.00, category: 'AI Tools', logo: '\u{1F916}' },
    'openai': { cost: 20.00, category: 'AI Tools', logo: '\u{1F916}' },
    'claude': { cost: 20.00, category: 'AI Tools', logo: '\u{1F916}' },
    'anthropic': { cost: 20.00, category: 'AI Tools', logo: '\u{1F916}' },
    'cursor': { cost: 20.00, category: 'Developer', logo: '\u{1F4BB}' },
    'perplexity': { cost: 20.00, category: 'AI Tools', logo: '\u{1F50D}' },
    'midjourney': { cost: 10.00, category: 'AI Tools', logo: '\u{1F3A8}' },
    'copilot': { cost: 10.00, category: 'Developer', logo: '\u{1F4BB}' },
    'disney': { cost: 13.99, category: 'Entertainment', logo: '\u{1F3F0}' },
    'disney+': { cost: 13.99, category: 'Entertainment', logo: '\u{1F3F0}' },
    'hbo': { cost: 15.99, category: 'Entertainment', logo: '\u{1F4FA}' },
    'hbo max': { cost: 15.99, category: 'Entertainment', logo: '\u{1F4FA}' },
    'youtube': { cost: 13.99, category: 'Entertainment', logo: '\u25B6\uFE0F' },
    'youtube premium': { cost: 13.99, category: 'Entertainment', logo: '\u25B6\uFE0F' },
    'amazon prime': { cost: 14.99, category: 'Shopping', logo: '\u{1F4E6}' },
    'prime': { cost: 14.99, category: 'Shopping', logo: '\u{1F4E6}' },
    'apple music': { cost: 10.99, category: 'Music', logo: '\u{1F34E}' },
    'apple tv': { cost: 9.99, category: 'Entertainment', logo: '\u{1F34E}' },
    'icloud': { cost: 2.99, category: 'Storage', logo: '\u2601\uFE0F' },
    'dropbox': { cost: 11.99, category: 'Storage', logo: '\u{1F4C1}' },
    'google one': { cost: 2.99, category: 'Storage', logo: '\u2601\uFE0F' },
    'notion': { cost: 10.00, category: 'Productivity', logo: '\u{1F4DD}' },
    'figma': { cost: 15.00, category: 'Design', logo: '\u270F\uFE0F' },
    'canva': { cost: 12.99, category: 'Design', logo: '\u{1F5BC}\uFE0F' },
    'grammarly': { cost: 12.00, category: 'Productivity', logo: '\u{1F4D6}' },
    'linkedin': { cost: 29.99, category: 'Professional', logo: '\u{1F4BC}' },
    'linkedin premium': { cost: 29.99, category: 'Professional', logo: '\u{1F4BC}' },
    'headspace': { cost: 12.99, category: 'Health', logo: '\u{1F9D8}' },
    'calm': { cost: 14.99, category: 'Health', logo: '\u{1F30A}' },
    'github': { cost: 4.00, category: 'Developer', logo: '\u{1F4BB}' },
    'github copilot': { cost: 10.00, category: 'Developer', logo: '\u{1F4BB}' },
    'aws': { cost: 45.00, category: 'Cloud', logo: '\u2601\uFE0F' },
    'gym': { cost: 24.99, category: 'Fitness', logo: '\u{1F3CB}\uFE0F' },
    'planet fitness': { cost: 24.99, category: 'Fitness', logo: '\u{1F3CB}\uFE0F' },
    'hulu': { cost: 17.99, category: 'Entertainment', logo: '\u{1F4FA}' },
    'twitch': { cost: 9.99, category: 'Entertainment', logo: '\u{1F3AE}' },
    'slack': { cost: 8.75, category: 'Productivity', logo: '\u{1F4AC}' },
    'zoom': { cost: 13.33, category: 'Productivity', logo: '\u{1F4F9}' },
    'microsoft 365': { cost: 9.99, category: 'Productivity', logo: '\u{1F4CA}' },
    'office 365': { cost: 9.99, category: 'Productivity', logo: '\u{1F4CA}' },
    'duolingo': { cost: 6.99, category: 'Education', logo: '\u{1F989}' },
    'crunchyroll': { cost: 7.99, category: 'Entertainment', logo: '\u{1F38C}' },
    'paramount': { cost: 11.99, category: 'Entertainment', logo: '\u{1F4FA}' },
    'paramount+': { cost: 11.99, category: 'Entertainment', logo: '\u{1F4FA}' },
    'peacock': { cost: 7.99, category: 'Entertainment', logo: '\u{1F4FA}' },
    'nordvpn': { cost: 12.99, category: 'Security', logo: '\u{1F512}' },
    'expressvpn': { cost: 12.95, category: 'Security', logo: '\u{1F512}' },
    '1password': { cost: 2.99, category: 'Security', logo: '\u{1F511}' },
    'lastpass': { cost: 3.00, category: 'Security', logo: '\u{1F511}' },
    'vercel': { cost: 20.00, category: 'Developer', logo: '\u25B2' },
    'heroku': { cost: 7.00, category: 'Cloud', logo: '\u2601\uFE0F' },
    'digital ocean': { cost: 12.00, category: 'Cloud', logo: '\u2601\uFE0F' },
    'supabase': { cost: 25.00, category: 'Developer', logo: '\u{1F4BB}' },
    'linear': { cost: 8.00, category: 'Productivity', logo: '\u{1F4CB}' },
    'obsidian': { cost: 8.00, category: 'Productivity', logo: '\u{1F4DD}' },
    'todoist': { cost: 4.00, category: 'Productivity', logo: '\u2705' },
};

/**
 * Look up known service info by name. Tries exact match first, then partial
 * match (longest key first so "amazon prime" beats "prime").
 */
export function lookupKnownService(
    name: string,
): { key: string; info: KnownServiceInfo } | null {
    const lower = name.toLowerCase();

    // Exact match first
    if (knownServices[lower]) {
        return { key: lower, info: knownServices[lower] };
    }

    // Partial match — check if the name contains a known key or vice versa
    // Sort longest-first to prefer "amazon prime" over "prime"
    const sorted = Object.entries(knownServices).sort(
        ([a], [b]) => b.length - a.length,
    );
    for (const [key, info] of sorted) {
        if (lower.includes(key) || key.includes(lower)) {
            return { key, info };
        }
    }

    return null;
}

// ---------------------------------------------------------------------------
// Category color maps
// ---------------------------------------------------------------------------

/**
 * Hex colors per category — used for chart segments and analytics.
 * Superset of categories from tamboConfig.ts and dashboard/page.tsx.
 */
export const CATEGORY_COLORS: Record<string, string> = {
    Entertainment: '#3b82f6',
    Music: '#22c55e',
    Productivity: '#a855f7',
    'AI Tools': '#10b981',
    Software: '#6366f1',
    Fitness: '#f97316',
    Professional: '#0ea5e9',
    Design: '#ec4899',
    Cloud: '#06b6d4',
    Health: '#14b8a6',
    Storage: '#94a3b8',
    Developer: '#8b5cf6',
    Security: '#f59e0b',
    Education: '#84cc16',
    Shopping: '#f43f5e',
};

/**
 * Tailwind dot-color classes per category — used for sidebar category dots.
 */
export const CATEGORY_DOT_COLORS: Record<string, string> = {
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
