import { addMonths, addYears } from 'date-fns';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { EXPIRATION_PERIODS, ExpirationStatus, PlanLimits, PLAN_LIMITS } from './types';

export const getPlanLimits = (planName: string): PlanLimits => {
  return PLAN_LIMITS[planName as keyof typeof PLAN_LIMITS] || PLAN_LIMITS['trial'];
};

export const getQuotaColor = (remainingQuota: number | null, quotaLimit: number | null): string => {
  if (quotaLimit === null || quotaLimit === 0) {
    return 'bg-purple-100 text-purple-800';
  }
  if (remainingQuota === null || remainingQuota === undefined) {
    return 'bg-purple-100 text-purple-800';
  }
  const percentage = (remainingQuota / quotaLimit) * 100;
  if (percentage > 50) {
    return 'bg-green-100 text-green-800';
  } else if (percentage > 20) {
    return 'bg-yellow-100 text-yellow-800';
  } else {
    return 'bg-red-100 text-red-800';
  }
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDollars = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) {
    return '0';
  }
  return `$${amount}`;
};

export const isExpired = (expiredAt: string | null): boolean => {
  if (!expiredAt) return false;
  return new Date(expiredAt) < new Date();
};

export const getExpirationDateFromPeriod = (period: string, customDate?: string): string | null => {
  // If custom date is provided, use it
  if (period === EXPIRATION_PERIODS.CUSTOM && customDate) {
    const selectedDate = new Date(customDate);
    // Set time to 00:00:00
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate.toISOString();
  }

  if (!period) return null;

  const now = new Date();
  let expirationDate: Date;

  switch (period) {
    case EXPIRATION_PERIODS.ONE_MONTH:
      expirationDate = addMonths(now, 1);
      break;
    case EXPIRATION_PERIODS.THREE_MONTHS:
      expirationDate = addMonths(now, 3);
      break;
    case EXPIRATION_PERIODS.SIX_MONTHS:
      expirationDate = addMonths(now, 6);
      break;
    case EXPIRATION_PERIODS.ONE_YEAR:
      expirationDate = addYears(now, 1);
      break;
    default:
      return null;
  }

  return expirationDate.toISOString();
};

export const getExpirationStatus = (expiredAt: string | null, apiKeysT: any): ExpirationStatus => {
  if (!expiredAt) {
    return {
      isExpired: false,
      isExpiring: false,
      status: 'active',
      text: apiKeysT("active") || "Active",
      color: 'text-green-600 bg-green-50 border-green-200',
      icon: CheckCircle
    };
  }

  const now = new Date();
  const expiryDate = new Date(expiredAt);
  const isExpiredStatus = expiryDate < now;

  // Check if expiring within 5 days
  const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const isExpiring = !isExpiredStatus && expiryDate <= fiveDaysFromNow;

  if (isExpiredStatus) {
    return {
      isExpired: true,
      isExpiring: false,
      status: 'expired',
      text: apiKeysT("expired") || "Expired",
      color: 'text-red-600 bg-red-50 border-red-200',
      icon: AlertCircle
    };
  } else if (isExpiring) {
    return {
      isExpired: false,
      isExpiring: true,
      status: 'expiring',
      text: apiKeysT("expiring") || "Expiring Soon",
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      icon: Clock
    };
  } else {
    return {
      isExpired: false,
      isExpiring: false,
      status: 'active',
      text: apiKeysT("active") || "Active",
      color: 'text-green-600 bg-green-50 border-green-200',
      icon: CheckCircle
    };
  }
};

export const getDatePlaceholder = (locale: string): string => {
  const normalizedLocale = (locale || 'en').toLowerCase().split('-')[0];
  switch (normalizedLocale) {
    case 'zh':
    case 'ja':
      return '年/月/日';
    case 'ko':
      return '년/월/일';
    case 'fr':
      return 'jj/mm/aaaa';
    default:
      return 'mm/dd/yyyy';
  }
};

export const convertExpirationDateToPeriod = (expiredAt: string | null): { period: string; customDate: string } => {
  if (!expiredAt) {
    return { period: '', customDate: '' };
  }

  const expiryDate = new Date(expiredAt);
  const now = new Date();

  const monthsDiff = (expiryDate.getFullYear() - now.getFullYear()) * 12 +
    (expiryDate.getMonth() - now.getMonth());

  if (monthsDiff === 1) {
    return { period: EXPIRATION_PERIODS.ONE_MONTH, customDate: '' };
  } else if (monthsDiff === 3) {
    return { period: EXPIRATION_PERIODS.THREE_MONTHS, customDate: '' };
  } else if (monthsDiff === 6) {
    return { period: EXPIRATION_PERIODS.SIX_MONTHS, customDate: '' };
  } else if (monthsDiff === 12) {
    return { period: EXPIRATION_PERIODS.ONE_YEAR, customDate: '' };
  } else {
    // Custom date - format for input[type="date"]
    return {
      period: EXPIRATION_PERIODS.CUSTOM,
      customDate: expiryDate.toISOString().split('T')[0]
    };
  }
};
