'use client';

import { cn } from '@/lib/utils';
import type { BillingInterval } from '@/hooks/usePlans';

interface BillingIntervalSelectorProps {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  className?: string;
}

const intervals = [
  {
    value: 'month' as BillingInterval,
    label: 'Monthly',
    shortLabel: 'Monthly',
  },
  {
    value: 'quarter' as BillingInterval,
    label: 'Quarterly',
    shortLabel: 'Quarterly',
    discount: '15% OFF',
  },
  {
    value: 'year' as BillingInterval,
    label: 'Yearly',
    shortLabel: 'Yearly',
    discount: '30% OFF',
  },
];

export default function BillingIntervalSelector({
  value,
  onChange,
  className
}: BillingIntervalSelectorProps) {
  return (
    <div className={cn('flex items-center justify-center space-x-2', className)}>
      {intervals.map((interval) => {
        const isSelected = value === interval.value;
        const hasDiscount = interval.discount !== undefined;

        return (
          <button
            key={interval.value}
            onClick={() => onChange(interval.value)}
            className={cn(
              'relative px-4 py-2 rounded-lg font-medium transition-all duration-200',
              isSelected
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <span>{interval.shortLabel}</span>

            {/* 促销标签 */}
            {hasDiscount && (
              <span className={cn(
                'absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold rounded-full',
                isSelected
                  ? 'bg-primary-foreground text-primary'
                  : 'bg-destructive text-destructive-foreground'
              )}>
                {interval.discount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// 用于i18n的版本
export function I18nBillingIntervalSelector({
  value,
  onChange,
  t,
  className
}: BillingIntervalSelectorProps & {
  t: (key: string) => string;
}) {
  const intervals = [
    {
      value: 'month' as BillingInterval,
      labelKey: 'billing.monthly',
      shortLabelKey: 'billing.monthly',
    },
    {
      value: 'quarter' as BillingInterval,
      labelKey: 'billing.quarterly',
      shortLabelKey: 'billing.quarterly',
      discountKey: 'billing.quarterlyDiscount',
    },
  ];

  return (
    <div className={cn('flex items-center justify-center space-x-2', className)}>
      {intervals.map((interval) => {
        const isSelected = value === interval.value;
        const hasDiscount = interval.discountKey !== undefined;

        return (
          <button
            key={interval.value}
            onClick={() => onChange(interval.value)}
            className={cn(
              'relative px-4 py-2 rounded-lg font-medium transition-all duration-200',
              isSelected
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <span>{t(interval.shortLabelKey)}</span>

            {/* 促销标签 */}
            {hasDiscount && (
              <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold rounded-full bg-slate-900 text-white">
                {t(interval.discountKey)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}