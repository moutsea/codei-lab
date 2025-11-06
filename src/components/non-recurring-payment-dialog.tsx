"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import type { PlanWithPricing } from '@/hooks/usePlans';

// Use PlanWithPricing type from usePlans hook
type Plan = PlanWithPricing;


// Helper functions for plan display
const getIntervalDisplay = (interval: string): string => {
  switch (interval) {
    case 'month':
      return '单月';
    case 'quarter':
      return '季度 (15% OFF)';
    default:
      return interval;
  }
};

const formatTokens = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
};


interface NonRecurringPaymentDialogProps {
  children?: React.ReactNode;
  triggerClassName?: string;
  triggerVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  triggerSize?: 'default' | 'sm' | 'lg' | 'icon';
  triggerText?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  plans?: Plan[];
  loading?: boolean;
  hideTrigger?: boolean;
}


export function NonRecurringPaymentDialog({
  children,
  triggerClassName = "",
  triggerVariant = "link",
  triggerSize = "sm",
  triggerText = "点此付款",
  open,
  onOpenChange,
  defaultOpen = false,
  plans: externalPlans = [],
  loading: externalLoading = false,
  hideTrigger = false,
}: NonRecurringPaymentDialogProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  // Use controlled mode if open prop is provided, otherwise use internal state
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : internalOpen;
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Auto-select the first plan when plans are available
  useEffect(() => {
    if (externalPlans && externalPlans.length > 0 && !selectedPlan) {
      setSelectedPlan(externalPlans[0].id);
    }
  }, [externalPlans, selectedPlan]);

  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      // In controlled mode, just call the onOpenChange callback
      onOpenChange?.(newOpen);
    } else {
      // In uncontrolled mode, update internal state
      setInternalOpen(newOpen);
      onOpenChange?.(newOpen);
    }
  };

  const handlePurchase = async () => {
    try {
      if (!user?.id) {
        window.location.assign("/login");
        return;
      }

      setIsPurchasing(true);

      const selectedPlanData = externalPlans.find(p => p.id === selectedPlan);
      if (!selectedPlanData) {
        alert('请选择一个套餐');
        setIsPurchasing(false);
        return;
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlanData.id,
          priceId: selectedPlanData.stripePriceId,
          requestLimit: selectedPlanData.requestLimit,
          interval: selectedPlanData.interval,
          membershipLevel: selectedPlanData.membershipLevel,
          auth0Id: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle specific error types
        if (errorData.type === 'currency_conflict') {
          // Show user-friendly error for currency conflict
          alert(`${errorData.message}\n\n详细说明: ${errorData.details}`);
          setIsPurchasing(false);
          return;
        }

        if (errorData.type === 'payment_error') {
          // Show user-friendly error for payment-related issues
          alert(`${errorData.message}\n\n建议: ${errorData.suggestions?.join(', ') || '请稍后重试或联系客服获取帮助。'}`);
          setIsPurchasing(false);
          return;
        }

        // Handle other error types
        const errorMessage = errorData.message || 'Failed to create checkout session';
        throw new Error(errorMessage);
      }

      const { url } = await response.json();
      handleOpenChange(false);
      window.open(url);

    } catch (error) {
      console.error('Checkout error:', error);
      // Handle unexpected errors
      if (error instanceof Error) {
        alert(`创建支付会话时发生错误: ${error.message}\n\n请稍后重试或联系客服获取帮助。`);
      } else {
        alert(`创建支付会话时发生未知错误\n\n请稍后重试或联系客服获取帮助。`);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const defaultTrigger = (
    <Button
      variant={triggerVariant}
      size={triggerSize}
      className={`text-sm h-auto font-normal -ml-3 cursor-pointer ${triggerClassName}`}
    >
      {triggerText}
    </Button>
  );

  return (
    <Dialog open={currentOpen} onOpenChange={handleOpenChange}>
      {hideTrigger ? null : <DialogTrigger asChild>{children || defaultTrigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>选择套餐</DialogTitle>
          <DialogDescription>
            选择适合您需求的一次性套餐，支持支付宝和微信支付
          </DialogDescription>
        </DialogHeader>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <div className="space-y-2">
            <p className="text-xs text-amber-800 leading-relaxed">
              <span className="inline-flex items-center gap-1">
                <Image src="/alipay.png" alt="支付宝" width={16} height={16} className="h-4 w-auto align-middle" />
              </span>
              {"支付宝或 "}
              <span className="inline-flex items-center gap-1">
                <Image src="/wxpay.png" alt="微信支付" width={16} height={16} className="h-4 w-auto align-middle" />
              </span>
              {" 微信支付只能用于一次性购买，无法进行连续订阅。"}
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              如果打开的购买页面中未出现支付宝或微信支付的选项，可能是由于你的 IP 地址不在允许的国家或地区范围内。
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
            {externalLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : externalPlans.length > 0 ? (
              <div className="space-y-3">
                {externalPlans.map((plan) => (
                  <div key={plan.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={plan.id} id={plan.id} />
                    <div className="flex-1">
                      <label htmlFor={plan.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        {plan.membershipLevel} - {getIntervalDisplay(plan.interval)} - {formatTokens(plan.requestLimit)} token/月 (¥ {(plan.amount / 100).toFixed(2)} 元)
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">数据异常，请刷新页面</p>
              </div>
            )}
          </RadioGroup>
          <div className="flex justify-end space-x-2 pt-4">
            <Button className='cursor-pointer' variant="outline" onClick={() => handleOpenChange(false)}>
              取消
            </Button>
            <Button
              className='cursor-pointer'
              onClick={handlePurchase}
              disabled={!selectedPlan || externalLoading || isPurchasing}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : (
                '继续'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}