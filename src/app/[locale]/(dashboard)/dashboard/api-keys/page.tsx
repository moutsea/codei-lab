"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Key, Copy, Eye, EyeOff, Trash2, Clock, AlertCircle, CheckCircle, BarChart3, TrendingUp, Edit, Save, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useSession } from "next-auth/react";
import { useDashboardUser } from "@/components/dashboard-user-provider";

interface ApiKey {
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

export default function ApiKeysPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const {
    userDetail,
    isActive,
    loading,
    quota
  } = useDashboardUser();

  const t = useTranslations("sidebar");
  const dt = useTranslations("dashboard");
  const apiKeysT = useTranslations("dashboard.apiKeys");
  const locale = useLocale(); // 获取当前语言环境

  // All state hooks must be declared before any conditional returns
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingApiKeys, setLoadingApiKeys] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planInfo, setPlanInfo] = useState<any>(null);
  const [loadingPlanInfo, setLoadingPlanInfo] = useState(false);
  const [creatingApiKey, setCreatingApiKey] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [deletingKeyId, setDeletingKeyId] = useState<number | null>(null);

  // 获取用户订阅的计划信息
  const getUserPlanInfo = async () => {
    if (!isActive || !userDetail?.planId) {
      window.location.assign(locale === 'en' ? '/' : `/${locale}`);
      return null;
    }

    try {
      const response = await fetch(`/api/plan/${userDetail.planId}`);
      if (response.ok) {
        const planData = await response.json();
        return planData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching plan info:', error);
      return null;
    }
  };

  const getPlanLimits = (planName: string) => {
    const limits = {
      'trial': { maxKeys: 3 },
      'pro': { maxKeys: 50 },
      'plus': { maxKeys: 10 }
    };

    // const basePlanName = planName.split('(')[0].trim();
    return limits[planName as keyof typeof limits] || limits['trial'];
  };

  // 获取 API Keys 数据
  const fetchApiKeys = async () => {
    if (!user?.id) return;

    try {
      setLoadingApiKeys(true);
      setError(null);

      const response = await fetch(`/api/user/${user.id}/api-keys`);

      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }

      const data = await response.json();
      const normalizedKeys: ApiKey[] = (data.apiKeys || []).map((key: any) => {
        // Work with dollar amounts directly
        const quota = key.quota ? parseFloat(key.quota) : null;
        const quotaUsed = key.quotaUsed || 0;
        return {
          id: key.id,
          name: key.name,
          key: key.key,
          createdAt: key.createdAt,
          lastUsedAt: key.lastUsedAt,
          quota,
          tokensUsed: quotaUsed, // Reuse the field but store quota used instead
          remainingQuota: quota !== null ? Math.max(0, quota - quotaUsed) : null,
          expiredAt: key.expiredAt
        };
      });
      setApiKeys(normalizedKeys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      setError('Failed to load API keys');
    } finally {
      setLoadingApiKeys(false);
    }
  };

  // 获取计划信息
  const fetchPlanInfo = async () => {
    if (!user?.id || !isActive || !userDetail?.planId) {
      setPlanInfo(null);
      return;
    }

    try {
      setLoadingPlanInfo(true);
      const planData = await getUserPlanInfo();
      setPlanInfo(planData);
    } catch (error) {
      console.error('Error fetching plan info:', error);
      setPlanInfo(null);
    } finally {
      setLoadingPlanInfo(false);
    }
  };

  // 当用户加载完成时获取 API Keys 和计划信息
  useEffect(() => {
    if (user && !isLoading && !loading) {
      fetchApiKeys();
      fetchPlanInfo();
    }
  }, [user, isLoading, loading, isActive, userDetail]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRequestLimit, setNewKeyRequestLimit] = useState<number | null>(20); // Default $20
  const [newKeyExpirationPeriod, setNewKeyExpirationPeriod] = useState<string>(""); // "" = no expire
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Edit state
  const [editingKeyId, setEditingKeyId] = useState<number | null>(null);
  const [editKeyName, setEditKeyName] = useState("");
  const [editKeyRequestLimit, setEditKeyRequestLimit] = useState<number | null>(null);
  const [editKeyExpirationPeriod, setEditKeyExpirationPeriod] = useState<string>("");
  const [updatingKey, setUpdatingKey] = useState<number | null>(null);

  const toggleKeyVisibility = (keyId: number) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const createNewApiKey = async () => {
    if (!user?.id || !newKeyName.trim() || !isActive) return;

    // 检查计划限制
    if (planInfo) {
      const limits = getPlanLimits(planInfo.membershipLevel);
      if (apiKeys.length >= limits.maxKeys) {
        // 使用多语言支持的错误消息
        const basePlanName = planInfo.name.split('(')[0].trim();
        setError(`${basePlanName}会员最多可创建${limits.maxKeys}个API密钥`);
        return;
      }
    }

    // 立即关闭弹窗并保存名称和quota
    const keyName = newKeyName.trim();
    const requestLimit = newKeyRequestLimit; // Already in dollars
    const expiredAt = getExpirationDateFromPeriod(newKeyExpirationPeriod);
    setNewKeyName("");
    setNewKeyRequestLimit(20); // Reset to default $20
    setNewKeyExpirationPeriod(""); // Reset to empty
    setShowCreateModal(false);

    try {
      // 设置创建中的加载状态
      setError(null);
      setCreatingApiKey(true);

      const response = await fetch(`/api/user/${user.id}/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: keyName, quota: requestLimit, expiredAt }),
      });

      if (!response.ok) {
        throw new Error('Failed to create API key');
      }

      // 重新获取数据以确保缓存一致性
      await fetchApiKeys();
      // console.log('Created new API key');
    } catch (error) {
      console.error('Error creating API key:', error);
      setError(apiKeysT("createError"));
      // 如果创建失败，可以重新显示弹窗并恢复名称和quota
      setNewKeyName(keyName);
      setNewKeyRequestLimit(requestLimit);
      setNewKeyExpirationPeriod(newKeyExpirationPeriod);
      setShowCreateModal(true);
    } finally {
      // 无论成功还是失败，都重置创建状态
      setCreatingApiKey(false);
    }
  };

  const confirmDeleteApiKey = (keyId: number, keyName: string) => {
    setDeleteConfirm({ id: keyId, name: keyName });
  };

  const deleteApiKey = async (keyId: number) => {
    if (!user?.id) return;

    // 立即关闭弹窗并设置删除状态
    setDeleteConfirm(null);
    setDeletingKeyId(keyId);

    try {
      const response = await fetch(`/api/user/${user.id}/api-keys?id=${keyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete API key');
      }

      // 重新获取数据以确保缓存一致性
      await fetchApiKeys();
      // console.log('Deleted API key:', keyId);
    } catch (error) {
      console.error('Error deleting API key:', error);
      setError(apiKeysT("deleteError"));
    } finally {
      // 无论成功还是失败，都重置删除状态
      setDeletingKeyId(null);
    }
  };

  const getQuotaColor = (remainingQuota: number | null, quotaLimit: number | null) => {
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDollars = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) {
      return '0';
    }
    return `$${amount}`;
  };

  // Helper function to check if API key is expired
  const isExpired = (expiredAt: string | null): boolean => {
    if (!expiredAt) return false;
    return new Date(expiredAt) < new Date();
  };

  // Helper function to calculate expiration date from period
  const getExpirationDateFromPeriod = (period: string): string | null => {
    if (!period) return null;

    const now = new Date();
    let expirationDate: Date;

    switch (period) {
      case '1m':
        expirationDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        break;
      case '3m':
        expirationDate = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
        break;
      case '6m':
        expirationDate = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
        break;
      case '1y':
        expirationDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        break;
      default:
        return null;
    }

    return expirationDate.toISOString();
  };

  // Helper function to get expiration status info
  const getExpirationStatus = (expiredAt: string | null) => {
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

  // Edit helper functions
  const startEditApiKey = (apiKey: ApiKey) => {
    setEditingKeyId(apiKey.id);
    setEditKeyName(apiKey.name);
    setEditKeyRequestLimit(apiKey.quota);

    // Convert expiration date back to period
    if (apiKey.expiredAt) {
      const expiryDate = new Date(apiKey.expiredAt);
      const now = new Date();

      const monthsDiff = (expiryDate.getFullYear() - now.getFullYear()) * 12 +
        (expiryDate.getMonth() - now.getMonth());

      if (monthsDiff === 1) {
        setEditKeyExpirationPeriod('1m');
      } else if (monthsDiff === 3) {
        setEditKeyExpirationPeriod('3m');
      } else if (monthsDiff === 6) {
        setEditKeyExpirationPeriod('6m');
      } else if (monthsDiff === 12) {
        setEditKeyExpirationPeriod('1y');
      } else {
        setEditKeyExpirationPeriod('');
      }
    } else {
      setEditKeyExpirationPeriod('');
    }
  };

  const cancelEditApiKey = () => {
    setEditingKeyId(null);
    setEditKeyName("");
    setEditKeyRequestLimit(null);
    setEditKeyExpirationPeriod("");
  };

  const updateApiKey = async (apiKeyId: number) => {
    if (!editKeyName.trim()) {
      setError(apiKeysT("nameRequired") || "API key name is required");
      return;
    }

    try {
      setError(null);
      setUpdatingKey(apiKeyId);

      const expiredAt = getExpirationDateFromPeriod(editKeyExpirationPeriod);

      const response = await fetch(`/api/user/${user?.id}/api-keys?id=${apiKeyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editKeyName.trim(),
          quota: editKeyRequestLimit,
          expiredAt: expiredAt
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update API key');
      }

      // Close modal instantly after successful API call
      cancelEditApiKey();
      // console.log('Updated API key:', apiKeyId);

      // Refresh data in background
      fetchApiKeys().catch(error => {
        console.error('Error refreshing API keys after update:', error);
      });
    } catch (error) {
      console.error('Error updating API key:', error);
      setError(apiKeysT("updateError") || "Failed to update API key");
    } finally {
      setUpdatingKey(null);
    }
  };

  // Show loading while checking authentication or subscription status
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // console.log(userDetail);
  // console.log(isActive);
  // Redirect to login if not authenticated
  if (!isActive) {
    window.location.assign(locale === 'en' ? '/dashboard' : `/${locale}/dashboard`);
    return null;
  }

  return (
    <DashboardLayout
      pageTitle={t("apiKeys")}
      pageSubtitle="Manage your API keys for accessing Code I Lab"
      hasActiveSubscription={isActive}
    >
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total API Keys Card */}
          <Card className="border-0 shadow-lg bg-card text-card-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{apiKeysT("totalApiKeys")}</p>
                  <p className="text-2xl font-bold text-foreground">{apiKeys.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {planInfo
                      ? `${apiKeysT("ofPlanLimitPrefix")}${getPlanLimits(planInfo.membershipLevel).maxKeys}${apiKeysT("ofPlanLimitSuffix")}`
                      : apiKeysT("noPlanLimit")
                    }
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Key className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total API Keys Quota Used Card */}
          <Card className="border-0 shadow-lg bg-card text-card-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{apiKeysT("apiKeysQuotaUsed")}</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${userDetail?.quotaMonthlyUsed || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {apiKeys.length > 0
                      ? `${apiKeysT("ofTotalPrefix")}$${apiKeys.reduce((sum, key) => sum + (key.quota || 0), 0)}${apiKeysT("ofTotalSuffix")}`
                      : apiKeysT("noKeysCreated")
                    }
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Monthly Quota Card */}
          <Card className="border-0 shadow-lg bg-card text-card-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{apiKeysT("yourMonthlyQuota")}</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${quota || 30}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {apiKeysT("basedOnSubscription")}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Keys List */}
        <Card className="border-0 shadow-lg bg-card text-card-foreground">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-lg">
                  <Key className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">{apiKeysT("title")}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <CardDescription className="text-muted-foreground">{apiKeysT("description")}</CardDescription>
                    {loadingPlanInfo ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-pulse px-2 py-1 bg-gray-200 text-gray-200 text-xs font-medium rounded-full">
                          Loading plan...
                        </div>
                      </div>
                    ) : planInfo ? (
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 text-white text-xs font-medium rounded-full">
                          {planInfo.membershipLevel} plan
                        </div>
                        <span className="text-xs text-gray-500">
                          ({apiKeys.length}/{getPlanLimits(planInfo.membershipLevel).maxKeys} keys)
                        </span>
                      </div>
                    ) : isActive ? (
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          Plan info unavailable
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                disabled={planInfo ? apiKeys.length >= getPlanLimits(planInfo.membershipLevel).maxKeys : false}
                className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-300 dark:hover:to-blue-400 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4 mr-2" />
                {apiKeysT("create")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingApiKeys ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <div className="text-gray-600">Loading API keys...</div>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-red-600 mb-4">Error: {error}</div>
                  <Button onClick={fetchApiKeys} variant="outline">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 创建中的加载指示器 */}
                {creatingApiKey && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <div className="text-blue-700 font-medium">{apiKeysT("creating")}...</div>
                    </div>
                  </div>
                )}

                {apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className={`bg-card dark:bg-secondary/20 rounded-xl p-6 border ${deletingKeyId === apiKey.id ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20' : 'border-border'} ${deletingKeyId === apiKey.id ? '' : 'hover:shadow-md'} transition-all duration-200`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="p-1.5 bg-card dark:bg-accent/50 rounded-lg shadow-sm border border-border">
                            <Key className="h-4 w-4 text-foreground" />
                          </div>
                          <h3 className="font-semibold text-foreground text-lg">{apiKey.name}</h3>
                          <div className={`px-2 py-1 text-xs font-medium rounded-full ${getQuotaColor(apiKey.remainingQuota, apiKey.quota)}`}>
                            {apiKey.quota === null || apiKey.quota === 0
                              ? apiKeysT("noLimit")
                              : `${Math.round((apiKey.remainingQuota! / apiKey.quota) * 100)}% quota left`
                            }
                          </div>
                          <div className={`px-2 py-1 text-xs font-medium rounded-full border ${getExpirationStatus(apiKey.expiredAt).color}`}>
                            {(() => {
                              const status = getExpirationStatus(apiKey.expiredAt);
                              return (
                                <>
                                  <status.icon className="h-3 w-3 inline mr-1" />
                                  {status.text}
                                </>
                              );
                            })()}
                          </div>
                          {deletingKeyId === apiKey.id && (
                            <div className="flex items-center space-x-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-orange-600"></div>
                              <span>{apiKeysT("deleting")}...</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span>{apiKeysT("created")}: {formatDate(apiKey.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BarChart3 className="h-3 w-3" />
                            <span>Quota used: ${apiKey.tokensUsed}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>Last used: {formatDate(apiKey.lastUsedAt)}</span>
                          </div>
                          <div className={`flex items-center space-x-1 ${isExpired(apiKey.expiredAt) ? 'text-red-500' : apiKey.expiredAt ? 'text-orange-500' : 'text-green-500'}`}>
                            <AlertCircle className="h-3 w-3" />
                            <span>
                              {apiKey.expiredAt
                                ? `Expires: ${formatDate(apiKey.expiredAt)}`
                                : apiKeysT("noExpire") || "No Expiration"
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                          className="hover:bg-gray-100 transition-colors"
                          disabled={deletingKeyId === apiKey.id}
                        >
                          {visibleKeys.has(apiKey.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(apiKey.key)}
                          className="hover:bg-gray-100 transition-colors"
                          disabled={deletingKeyId === apiKey.id}
                        >
                          {copiedKey === apiKey.key ? (
                            <span className="text-sm text-green-600 font-medium">{apiKeysT("copied")}</span>
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditApiKey(apiKey)}
                          className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-200"
                          disabled={deletingKeyId === apiKey.id || updatingKey === apiKey.id}
                        >
                          {updatingKey === apiKey.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          ) : (
                            <Edit className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200 ${deletingKeyId === apiKey.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => confirmDeleteApiKey(apiKey.id, apiKey.name)}
                          disabled={deletingKeyId === apiKey.id || updatingKey === apiKey.id}
                        >
                          {deletingKeyId === apiKey.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {/* Quota Progress Bar */}
                      <div className={`bg-card dark:bg-secondary/20 rounded-lg p-4 border border-border ${isExpired(apiKey.expiredAt) ? 'opacity-50' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">Monthly Quota Usage</span>
                          <span className="text-xs text-muted-foreground">
                            {apiKey.quota === null
                              ? `$${apiKey.tokensUsed} / ${apiKeysT("noLimit")}`
                              : `$${apiKey.tokensUsed} / $${apiKey.quota}`
                            }
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          {apiKey.quota === null ? (
                            <div className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 w-full"></div>
                          ) : (
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${apiKey.quota && apiKey.tokensUsed >= apiKey.quota
                                ? 'bg-red-500'
                                : apiKey.quota && apiKey.tokensUsed >= apiKey.quota * 0.8
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                                }`}
                              style={{ width: `${apiKey.quota && apiKey.quota > 0 ? Math.min((apiKey.tokensUsed / apiKey.quota) * 100, 100) : 0}%` }}
                            ></div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs font-medium ${apiKey.quota === null || apiKey.quota === 0
                            ? 'text-purple-600 dark:text-purple-400'
                            : apiKey.tokensUsed >= apiKey.quota
                              ? 'text-red-600 dark:text-red-400'
                              : apiKey.tokensUsed >= apiKey.quota * 0.8
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                            {apiKey.quota === null || apiKey.quota === 0
                              ? apiKeysT("unlimitedQuota")
                              : `$${apiKey.remainingQuota}`
                            } {apiKey.quota !== null && apiKey.quota > 0 && ' remaining'}
                          </span>
                          <span className={`text-xs font-medium ${apiKey.quota === null || apiKey.quota === 0
                            ? 'text-purple-600 dark:text-purple-400'
                            : apiKey.tokensUsed >= apiKey.quota
                              ? 'text-red-600 dark:text-red-400'
                              : apiKey.tokensUsed >= apiKey.quota * 0.8
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                            {apiKey.quota === null || apiKey.quota === 0
                              ? `${apiKeysT("unlimitedAccess")}`
                              : `${Math.round((apiKey.tokensUsed / apiKey.quota) * 100)}% used`
                            }
                          </span>
                        </div>
                      </div>
                      {/* API Key Display */}
                      <div className="bg-card dark:bg-secondary/20 rounded-lg p-4 border border-border">
                        <div className="flex items-center justify-between">
                          <div className="font-mono text-sm text-foreground">
                            {visibleKeys.has(apiKey.id) ? (
                              <div className="flex items-center space-x-2">
                                <span>{apiKey.key}</span>
                                <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded">
                                  Visible
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="text-muted-foreground">sk-proj-xxxxxxxxxxxxxxxxxxxx</span>
                                <div className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded">
                                  Hidden
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {apiKeys.length === 0 && (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Key className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">{apiKeysT("noApiKeys")}</h3>
                    <p className="text-muted-foreground">{apiKeysT("noApiKeysDescription")}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <>
          {/* Click outside to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-md border border-border animate-in zoom-in duration-200">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-lg">
                      <Plus className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">{apiKeysT("createTitle")}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{apiKeysT("createDescription")}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateModal(false)}
                    className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      API Key Name
                    </label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder={apiKeysT("namePlaceholder")}
                      className="w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-muted-foreground"
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Choose a descriptive name to help you identify this API key
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {apiKeysT("monthlyRequestLimit")}
                    </label>
                    {newKeyRequestLimit === null ? (
                      <div className="w-full border border-border rounded-lg px-4 py-3 bg-muted text-foreground font-medium">
                        {apiKeysT("noLimit")}
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="number"
                          value={newKeyRequestLimit}
                          onChange={(e) => setNewKeyRequestLimit(Math.max(1, parseInt(e.target.value) || 0))}
                          min="1"
                          max="2000" // $2000
                          className="w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                          ${newKeyRequestLimit}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setNewKeyRequestLimit(10)} // $10
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${newKeyRequestLimit === 10
                          ? "bg-blue-500 text-white"
                          : "bg-muted hover:bg-accent text-foreground"
                          }`}
                      >
                        $10
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewKeyRequestLimit(20)} // $20
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${newKeyRequestLimit === 20
                          ? "bg-blue-500 text-white"
                          : "bg-muted hover:bg-accent text-foreground"
                          }`}
                      >
                        $20
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewKeyRequestLimit(50)} // $50
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${newKeyRequestLimit === 50
                          ? "bg-blue-500 text-white"
                          : "bg-muted hover:bg-accent text-foreground"
                          }`}
                      >
                        $50
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewKeyRequestLimit(100)} // $100
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${newKeyRequestLimit === 100
                          ? "bg-blue-500 text-white"
                          : "bg-muted hover:bg-accent text-foreground"
                          }`}
                      >
                        $100
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewKeyRequestLimit(null)}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${newKeyRequestLimit === null
                          ? "bg-purple-500 text-white"
                          : "bg-muted hover:bg-accent text-foreground"
                          }`}
                      >
                        {apiKeysT("noLimit")}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {apiKeysT("quotaDescription")}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {apiKeysT("expirationDateOptional")}
                    </label>
                    <select
                      value={newKeyExpirationPeriod}
                      onChange={(e) => setNewKeyExpirationPeriod(e.target.value)}
                      className="w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">{apiKeysT("noExpire") || "No Expiration"}</option>
                      <option value="1m">{apiKeysT("oneMonth") || "1 Month"}</option>
                      <option value="3m">{apiKeysT("threeMonths") || "3 Months"}</option>
                      <option value="6m">{apiKeysT("sixMonths") || "6 Months"}</option>
                      <option value="1y">{apiKeysT("oneYear") || "1 Year"}</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-2">
                      {apiKeysT("periodDescription") || "Choose when the API key should expire. Keys will expire at 00:00:00 on the selected date."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-muted/50 rounded-b-2xl border-t border-border">
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="hover:bg-gray-100 transition-colors"
                  >
                    {apiKeysT("cancel")}
                  </Button>
                  <Button
                    onClick={createNewApiKey}
                    disabled={!newKeyName.trim()}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-300 dark:hover:to-blue-400 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {apiKeysT("create")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit API Key Modal */}
      {editingKeyId && (
        <>
          {/* Click outside to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={cancelEditApiKey}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-md border border-border animate-in zoom-in duration-200">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-lg">
                      <Edit className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">{apiKeysT("editTitle") || "Edit API Key"}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{apiKeysT("editDescription") || "Update your API key settings"}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditApiKey}
                    className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {apiKeysT("nameLabel") || "API Key Name"}
                    </label>
                    <input
                      type="text"
                      value={editKeyName}
                      onChange={(e) => setEditKeyName(e.target.value)}
                      placeholder={apiKeysT("namePlaceholder") || "Enter a descriptive name for this key"}
                      className="w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-muted-foreground"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {apiKeysT("monthlyRequestLimit") || "Monthly Request Limit ($)"}
                    </label>
                    {editKeyRequestLimit === null ? (
                      <div className="w-full border border-border rounded-lg px-4 py-3 bg-muted text-foreground font-medium">
                        {apiKeysT("noLimit")}
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="number"
                          value={editKeyRequestLimit}
                          onChange={(e) => setEditKeyRequestLimit(Math.max(1, parseInt(e.target.value) || 0))}
                          min="1"
                          max="2000" // $2000
                          className="w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                          ${editKeyRequestLimit}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setEditKeyRequestLimit(10)} // $10
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${editKeyRequestLimit === 10
                          ? "bg-purple-500 text-white"
                          : "bg-muted hover:bg-accent text-foreground"
                          }`}
                      >
                        $10
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditKeyRequestLimit(20)} // $20
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${editKeyRequestLimit === 20
                          ? "bg-purple-500 text-white"
                          : "bg-muted hover:bg-accent text-foreground"
                          }`}
                      >
                        $20
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditKeyRequestLimit(50)} // $50
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${editKeyRequestLimit === 50
                          ? "bg-purple-500 text-white"
                          : "bg-muted hover:bg-accent text-foreground"
                          }`}
                      >
                        $50
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditKeyRequestLimit(100)} // $100
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${editKeyRequestLimit === 100
                          ? "bg-purple-500 text-white"
                          : "bg-muted hover:bg-accent text-foreground"
                          }`}
                      >
                        $100
                      </button>
                      <button
                        onClick={() => setEditKeyRequestLimit(null)}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${editKeyRequestLimit === null
                          ? "bg-purple-500 text-white"
                          : "bg-muted hover:bg-accent text-foreground"
                          }`}
                      >
                        {apiKeysT("noLimit")}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {apiKeysT("quotaDescription") || "Set the monthly quota limit for this API key"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {apiKeysT("expirationDateOptional") || "Expiration Date (Optional)"}
                    </label>
                    <select
                      value={editKeyExpirationPeriod}
                      onChange={(e) => setEditKeyExpirationPeriod(e.target.value)}
                      className="w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">{apiKeysT("noExpire") || "No Expiration"}</option>
                      <option value="1m">{apiKeysT("oneMonth") || "1 Month"}</option>
                      <option value="3m">{apiKeysT("threeMonths") || "3 Months"}</option>
                      <option value="6m">{apiKeysT("sixMonths") || "6 Months"}</option>
                      <option value="1y">{apiKeysT("oneYear") || "1 Year"}</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-2">
                      {apiKeysT("periodDescription") || "Choose when the API key should expire. Keys will expire at 00:00:00 on the selected date."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-muted/50 rounded-b-2xl border-t border-border">
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={cancelEditApiKey}
                    className="hover:bg-gray-100 transition-colors"
                  >
                    {apiKeysT("cancel")}
                  </Button>
                  <Button
                    onClick={() => updateApiKey(editingKeyId)}
                    disabled={!editKeyName.trim() || updatingKey !== null}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-300 dark:hover:to-blue-400 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingKey === editingKeyId ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {updatingKey === editingKeyId ? (apiKeysT("updating") || "Updating...") : (apiKeysT("save") || "Save Changes")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirm && (
        <>
          {/* Click outside to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-md border border-border animate-in zoom-in duration-200">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {apiKeysT("deleteConfirmTitle")}
                      </h3>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirm(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </Button>
                </div>
              </div>

              <div className="p-6">
                <p className="text-muted-foreground mb-4">
                  {apiKeysT("deleteConfirmMessage", { name: deleteConfirm.name })}
                </p>

                <p className="text-sm text-red-600 dark:text-red-400 mb-6 font-medium">
                  {apiKeysT("deleteConfirmWarning")}
                </p>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirm(null)}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {apiKeysT("cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteApiKey(deleteConfirm.id)}
                    className="bg-red-600 hover:bg-red-700 text-white transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {apiKeysT("delete")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
