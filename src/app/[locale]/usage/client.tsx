'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle, XCircle, AlertCircle, Search, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTokens, formatDate } from '@/lib/utils';

interface ApiKeyInfo {
  id: number;
  name: string;
  key: string;
  createdAt: string;
  lastUsedAt: string | null;
  requestLimit: number | null;
  tokensUsed: number;
  remainingQuota: number | null;
  expiredAt: string | null;
}

export function UsagePageClient() {
  const t = useTranslations('usage');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyInfo, setApiKeyInfo] = useState<ApiKeyInfo | null>(null);
  const [copied, setCopied] = useState(false);

  const getExpirationStatus = (expiredAt: string | null) => {
    if (!expiredAt) {
      return {
        isExpired: false,
        isExpiring: false,
        status: 'active',
        text: t('apiKeyInfo.active'),
        color: 'text-green-700 bg-green-100 border-green-300 dark:text-green-300 dark:bg-green-900/30 dark:border-green-700',
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
        text: t('apiKeyInfo.expired'),
        color: 'text-red-700 bg-red-100 border-red-300 dark:text-red-300 dark:bg-red-900/30 dark:border-red-700',
        icon: XCircle
      };
    }

    if (isExpiring) {
      return {
        isExpired: false,
        isExpiring: true,
        status: 'expiring',
        text: t('apiKeyInfo.expiring'),
        color: 'text-orange-700 bg-orange-100 border-orange-300 dark:text-orange-300 dark:bg-orange-900/30 dark:border-orange-700',
        icon: AlertCircle
      };
    }

    return {
      isExpired: false,
      isExpiring: false,
      status: 'active',
      text: t('apiKeyInfo.active'),
      color: 'text-green-700 bg-green-100 border-green-300 dark:text-green-300 dark:bg-green-900/30 dark:border-green-700',
      icon: CheckCircle
    };
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const checkUsage = async () => {
    if (!apiKey.trim()) {
      setError(t('apiKeyRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/usage/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError(t('invalidApiKey'));
        } else {
          throw new Error('Failed to check API key');
        }
        return;
      }

      const data = await response.json();
      setApiKeyInfo(data);
    } catch (error) {
      console.error('Error checking API key:', error);
      setError(t('checkError'));
    } finally {
      setLoading(false);
    }
  };

  
  const getQuotaUsagePercentage = () => {
    if (!apiKeyInfo?.requestLimit) return 100;
    return Math.min((apiKeyInfo.tokensUsed / apiKeyInfo.requestLimit) * 100, 100);
  };

  const getQuotaColor = () => {
    const percentage = getQuotaUsagePercentage();
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= 80) return 'bg-orange-600';
    return 'bg-green-600';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">{t('title')}</h1>
          <p className="text-lg text-muted-foreground">{t('description')}</p>
        </div>

        {/* API Key Input Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">{t('apiKeyLabel')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder={t('apiKeyPlaceholder')}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                  onKeyPress={(e) => e.key === 'Enter' && checkUsage()}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                onClick={checkUsage}
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{t('checking')}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4" />
                    <span>{t('checkUsage')}</span>
                  </div>
                )}
              </Button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Key Information Display */}
        {apiKeyInfo && (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center space-x-2">
                  <span>{t('apiKeyInfo.title')}</span>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getExpirationStatus(apiKeyInfo.expiredAt).color}`}>
                    {getExpirationStatus(apiKeyInfo.expiredAt).text}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('apiKeyInfo.name')}</label>
                      <p className="text-lg font-semibold text-foreground">{apiKeyInfo.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('apiKeyLabel')}</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="font-mono text-sm bg-muted px-3 py-1 rounded">
                          {showApiKey ? apiKeyInfo.key : `${apiKeyInfo.key.slice(0, 8)}${'*'.repeat(24)}`}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(apiKeyInfo.key)}
                        >
                          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('apiKeyInfo.createdAt')}</label>
                      <p className="text-foreground">{formatDate(apiKeyInfo.createdAt)}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('apiKeyInfo.requestLimit')}</label>
                      <p className="text-foreground">
                        {apiKeyInfo.requestLimit === null ? t('apiKeyInfo.unlimited') : formatTokens(apiKeyInfo.requestLimit)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('apiKeyInfo.tokensUsed')}</label>
                      <p className="text-foreground">{formatTokens(apiKeyInfo.tokensUsed)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('apiKeyInfo.remainingQuota')}</label>
                      <p className="text-foreground">
                        {apiKeyInfo.remainingQuota === null ? t('apiKeyInfo.unlimited') : formatTokens(apiKeyInfo.remainingQuota)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('apiKeyInfo.lastUsedAt')}</label>
                      <p className="text-foreground">
                        {apiKeyInfo.lastUsedAt ? formatDate(apiKeyInfo.lastUsedAt) : t('apiKeyInfo.neverUsed')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('apiKeyInfo.expiredAt')}</label>
                      <p className="text-foreground">
                        {apiKeyInfo.expiredAt ? formatDate(apiKeyInfo.expiredAt) : t('apiKeyInfo.noExpiration')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{t('usageDetails.title')}</CardTitle>
                <CardDescription>{t('usageDetails.currentMonth')}</CardDescription>
              </CardHeader>
              <CardContent>
                {apiKeyInfo.requestLimit ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">{t('usageDetails.quotaUsage')}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatTokens(apiKeyInfo.tokensUsed)} / {formatTokens(apiKeyInfo.requestLimit)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${getQuotaColor()}`}
                        style={{ width: `${getQuotaUsagePercentage()}%` }}
                      ></div>
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      {Math.round(getQuotaUsagePercentage())}% {t('usageDetails.quotaUsage')}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>{t('apiKeyInfo.unlimited')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}