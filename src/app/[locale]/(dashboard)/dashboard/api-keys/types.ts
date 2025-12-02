export interface ApiKey {
  id: number;
  name: string;
  key: string;
  createdAt: string;
  lastUsedAt: string | null;
  quota: number | null;
  tokensUsed: number;
  remainingQuota: number | null;
  expiredAt: string | null;
}

export interface PlanInfo {
  membershipLevel: 'trial' | 'pro' | 'plus';
  name: string;
}

export interface PlanLimits {
  maxKeys: number;
}

export interface ExpirationStatus {
  isExpired: boolean;
  isExpiring: boolean;
  status: 'active' | 'expired' | 'expiring';
  text: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const EXPIRATION_PERIODS = {
  NO_EXPIRE: '',
  ONE_MONTH: '1m',
  THREE_MONTHS: '3m',
  SIX_MONTHS: '6m',
  ONE_YEAR: '1y',
  CUSTOM: 'custom'
} as const;

export type ExpirationPeriod = typeof EXPIRATION_PERIODS[keyof typeof EXPIRATION_PERIODS];

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  'trial': { maxKeys: 3 },
  'pro': { maxKeys: 50 },
  'plus': { maxKeys: 10 }
};

export const DEFAULT_QUOTA = 20;
export const MAX_QUOTA = 2000;
export const QUICK_QUOTA_OPTIONS = [10, 20, 50, 100] as const;
