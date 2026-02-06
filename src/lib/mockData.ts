import type { Subscription } from './types';

// Re-export for backwards compat with existing imports
export type { SubscriptionStatus } from './types';

// Mock subscription data representing discovered subscriptions
export const mockSubscriptions: Subscription[] = [
  {
    id: '1',
    name: 'Netflix',
    cost: 15.99,
    status: 'active',
    lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    logo: '🎬',
    category: 'Entertainment',
    renewalDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    name: 'Adobe Creative Cloud',
    cost: 59.99,
    status: 'zombie',
    lastActivity: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 4 months ago
    logo: '🎨',
    category: 'Software',
    renewalDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    name: 'Spotify',
    cost: 10.99,
    status: 'active',
    lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    logo: '🎵',
    category: 'Entertainment',
    renewalDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    name: 'Planet Fitness',
    cost: 24.99,
    status: 'zombie',
    lastActivity: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
    logo: '💪',
    category: 'Fitness',
    renewalDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
  },
  {
    id: '5',
    name: 'Disney+',
    cost: 13.99,
    status: 'price_hike',
    lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    logo: '✨',
    category: 'Entertainment',
    renewalDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    priceChange: { from: 10.99, to: 13.99 },
  },
  {
    id: '6',
    name: 'ChatGPT Plus',
    cost: 20.00,
    status: 'active',
    lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    logo: '🤖',
    category: 'AI Tools',
    renewalDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
  },
  {
    id: '7',
    name: 'LinkedIn Premium',
    cost: 29.99,
    status: 'zombie',
    lastActivity: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
    logo: '💼',
    category: 'Professional',
    renewalDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '8',
    name: 'Notion',
    cost: 8.00,
    status: 'trial_ending',
    lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    logo: '📝',
    category: 'Productivity',
    trialEndsIn: 3,
    renewalDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '9',
    name: 'Grammarly',
    cost: 12.00,
    status: 'active',
    lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    logo: '✍️',
    category: 'Productivity',
    renewalDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
  },
  {
    id: '10',
    name: 'Canva Pro',
    cost: 12.99,
    status: 'trial_ending',
    lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    logo: '🖼️',
    category: 'Design',
    trialEndsIn: 5,
    renewalDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: '11',
    name: 'AWS',
    cost: 45.00,
    status: 'active',
    lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    logo: '☁️',
    category: 'Cloud',
    renewalDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
  },
  {
    id: '12',
    name: 'Headspace',
    cost: 12.99,
    status: 'zombie',
    lastActivity: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000), // 5 months ago
    logo: '🧘',
    category: 'Health',
    renewalDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  },
];

// Cancellation dark patterns for major services
export const cancellationPaths: Record<string, {
  steps: Array<{ location: string; description: string; warning?: string }>;
  legalScript: string;
  directUrl?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'nightmare';
}> = {
  'Adobe Creative Cloud': {
    difficulty: 'nightmare',
    steps: [
      { location: 'Account Settings', description: 'Click "Manage Plan" in the top right' },
      { location: 'Plans & Payment', description: 'Scroll past the upsell banners' },
      { location: 'View All Plans', description: 'Find the tiny "Cancel Plan" link at the bottom' },
      { location: 'Cancel Confirmation', description: 'Click through 3 "Are you sure?" screens', warning: 'They will offer 2 months free - decline it!' },
      { location: 'Final Cancellation', description: 'Look for the small grey "Continue to cancel" text', warning: 'Hidden in fine print!' },
    ],
    legalScript: 'I am invoking my right to cancel my subscription under GDPR Article 17 (Right to Erasure) and consumer protection laws. Please confirm immediate cancellation without any retention offers. I do not wish to hear about discounts, pauses, or alternative plans. Please process my cancellation and send written confirmation within 24 hours.',
    directUrl: 'https://account.adobe.com/plans',
  },
  'Planet Fitness': {
    difficulty: 'nightmare',
    steps: [
      { location: 'Visit Your Local Gym', description: 'Online cancellation is not available', warning: 'Must cancel in person or via certified mail!' },
      { location: 'Front Desk', description: 'Ask to speak with a manager about cancellation' },
      { location: 'Cancellation Form', description: 'Fill out the physical cancellation form' },
      { location: 'Certified Mail Alternative', description: 'Send certified letter to your home club address', warning: 'Keep the receipt as proof!' },
    ],
    legalScript: 'I hereby request immediate cancellation of my Planet Fitness membership effective immediately. Per the membership agreement, I am providing written notice. Please confirm cancellation in writing within 5 business days. I do not authorize any further charges to my payment method.',
  },
  'LinkedIn Premium': {
    difficulty: 'medium',
    steps: [
      { location: 'Settings & Privacy', description: 'Click your profile picture → Settings' },
      { location: 'Account Preferences', description: 'Select "Account" from left sidebar' },
      { location: 'Subscriptions', description: 'Click "Manage Premium subscription"' },
      { location: 'Cancel Subscription', description: 'Click "Cancel subscription" at bottom', warning: 'They will show a "Pause instead?" option' },
    ],
    legalScript: 'Please cancel my LinkedIn Premium subscription immediately. I do not wish to pause or downgrade. Confirm cancellation via email.',
    directUrl: 'https://www.linkedin.com/psettings/account',
  },
  'Disney+': {
    difficulty: 'easy',
    steps: [
      { location: 'Profile Menu', description: 'Click your profile icon' },
      { location: 'Account', description: 'Select "Account" from dropdown' },
      { location: 'Subscription', description: 'Find "Disney+ Monthly" under subscription' },
      { location: 'Cancel', description: 'Click "Cancel Subscription" button' },
    ],
    legalScript: 'Please cancel my Disney+ subscription effective at the end of my current billing period.',
    directUrl: 'https://www.disneyplus.com/account',
  },
  'Headspace': {
    difficulty: 'medium',
    steps: [
      { location: 'Settings', description: 'Open app → Profile → Settings' },
      { location: 'Manage Subscription', description: 'Tap "Manage Subscription"' },
      { location: 'App Store/Play Store', description: 'You will be redirected to your device store', warning: 'Must cancel through Apple/Google, not the app!' },
      { location: 'Cancel in Store', description: 'Find Headspace in subscriptions and cancel' },
    ],
    legalScript: 'I request cancellation of my Headspace subscription. Please confirm the cancellation and ensure no further billing.',
  },
};

// Helper functions
export function calculateTotalSpending(): number {
  return mockSubscriptions.reduce((total, sub) => total + sub.cost, 0);
}

export function calculatePotentialSavings(): number {
  return mockSubscriptions
    .filter(sub => sub.status === 'zombie')
    .reduce((total, sub) => total + sub.cost, 0);
}

export function getZombieSubscriptions() {
  return mockSubscriptions.filter(sub => sub.status === 'zombie');
}

export function getTrialEndingSubscriptions() {
  return mockSubscriptions.filter(sub => sub.status === 'trial_ending');
}
