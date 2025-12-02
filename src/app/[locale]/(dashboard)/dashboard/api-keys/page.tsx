"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Key } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useSession } from "next-auth/react";
import { useDashboardUser } from "@/components/dashboard-user-provider";

import { ApiKey, PlanInfo, DEFAULT_QUOTA } from "./types";
import { getPlanLimits, getExpirationDateFromPeriod, convertExpirationDateToPeriod } from "./utils";
import { ApiKeyStats } from "@/components/api-keys/ApiKeyStats";
import { ApiKeyCard } from "@/components/api-keys/ApiKeyCard";
import { ApiKeyModal } from "@/components/api-keys/ApiKeyModal";
import { DeleteConfirmModal } from "@/components/api-keys/DeleteConfirmModal";

export default function ApiKeysPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const { userDetail, isActive, loading, quota } = useDashboardUser();

  const t = useTranslations("sidebar");
  const dt = useTranslations("dashboard");
  const apiKeysT = useTranslations("dashboard.apiKeys");
  const locale = useLocale();

  // All state hooks
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingApiKeys, setLoadingApiKeys] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [loadingPlanInfo, setLoadingPlanInfo] = useState(false);
  const [creatingApiKey, setCreatingApiKey] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [deletingKeyId, setDeletingKeyId] = useState<number | null>(null);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRequestLimit, setNewKeyRequestLimit] = useState<number | null>(DEFAULT_QUOTA);
  const [newKeyExpirationPeriod, setNewKeyExpirationPeriod] = useState<string>("");
  const [newKeyCustomDate, setNewKeyCustomDate] = useState<string>("");

  // UI state
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Edit state
  const [editingKeyId, setEditingKeyId] = useState<number | null>(null);
  const [editKeyName, setEditKeyName] = useState("");
  const [editKeyRequestLimit, setEditKeyRequestLimit] = useState<number | null>(null);
  const [editKeyExpirationPeriod, setEditKeyExpirationPeriod] = useState<string>("");
  const [editKeyCustomDate, setEditKeyCustomDate] = useState<string>("");
  const [updatingKey, setUpdatingKey] = useState<number | null>(null);

  // Handle copied key timeout with cleanup
  useEffect(() => {
    if (copiedKey) {
      const timer = setTimeout(() => setCopiedKey(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedKey]);

  // Fetch user plan info
  const getUserPlanInfo = useCallback(async () => {
    if (!isActive || !userDetail?.planId) {
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
  }, [isActive, userDetail?.planId]);

  // Fetch API Keys
  const fetchApiKeys = useCallback(async () => {
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
        const quota = key.quota ? parseFloat(key.quota) : null;
        const quotaUsed = key.tokensUsed || 0;
        return {
          id: key.id,
          name: key.name,
          key: key.key,
          createdAt: key.createdAt,
          lastUsedAt: key.lastUsedAt,
          quota,
          tokensUsed: quotaUsed,
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
  }, [user?.id]);

  // Fetch plan info
  const fetchPlanInfo = useCallback(async () => {
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
  }, [user?.id, isActive, userDetail?.planId, getUserPlanInfo]);

  // Load data on mount
  useEffect(() => {
    if (user && !isLoading && !loading) {
      fetchApiKeys();
      fetchPlanInfo();
    }
  }, [user, isLoading, loading, fetchApiKeys, fetchPlanInfo]);

  const toggleKeyVisibility = useCallback((keyId: number) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  }, []);

  const copyToClipboard = useCallback((key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
  }, []);

  const createNewApiKey = useCallback(async () => {
    if (!user?.id || !newKeyName.trim() || !isActive) return;

    // Check plan limits
    if (planInfo) {
      const limits = getPlanLimits(planInfo.membershipLevel);
      if (apiKeys.length >= limits.maxKeys) {
        const basePlanName = planInfo.name.split('(')[0].trim();
        setError(`${basePlanName}会员最多可创建${limits.maxKeys}个API密钥`);
        return;
      }
    }

    // Save values and close modal
    const keyName = newKeyName.trim();
    const requestLimit = newKeyRequestLimit;
    const expiredAt = getExpirationDateFromPeriod(newKeyExpirationPeriod, newKeyCustomDate);

    setNewKeyName("");
    setNewKeyRequestLimit(DEFAULT_QUOTA);
    setNewKeyExpirationPeriod("");
    setNewKeyCustomDate("");
    setShowCreateModal(false);

    try {
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

      await fetchApiKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
      setError(apiKeysT("createError"));
      // Restore values on error
      setNewKeyName(keyName);
      setNewKeyRequestLimit(requestLimit);
      setNewKeyExpirationPeriod(newKeyExpirationPeriod);
      setNewKeyCustomDate(newKeyCustomDate);
      setShowCreateModal(true);
    } finally {
      setCreatingApiKey(false);
    }
  }, [user?.id, newKeyName, newKeyRequestLimit, newKeyExpirationPeriod, newKeyCustomDate, isActive, planInfo, apiKeys.length, apiKeysT, fetchApiKeys]);

  const confirmDeleteApiKey = useCallback((keyId: number, keyName: string) => {
    setDeleteConfirm({ id: keyId, name: keyName });
  }, []);

  const deleteApiKey = useCallback(async (keyId: number) => {
    if (!user?.id) return;

    setDeleteConfirm(null);
    setDeletingKeyId(keyId);

    try {
      const response = await fetch(`/api/user/${user.id}/api-keys?id=${keyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete API key');
      }

      await fetchApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      setError(apiKeysT("deleteError"));
    } finally {
      setDeletingKeyId(null);
    }
  }, [user?.id, apiKeysT, fetchApiKeys]);

  const startEditApiKey = useCallback((apiKey: ApiKey) => {
    setEditingKeyId(apiKey.id);
    setEditKeyName(apiKey.name);
    setEditKeyRequestLimit(apiKey.quota);

    const { period, customDate } = convertExpirationDateToPeriod(apiKey.expiredAt);
    setEditKeyExpirationPeriod(period);
    setEditKeyCustomDate(customDate);
  }, []);

  const cancelEditApiKey = useCallback(() => {
    setEditingKeyId(null);
    setEditKeyName("");
    setEditKeyRequestLimit(null);
    setEditKeyExpirationPeriod("");
    setEditKeyCustomDate("");
  }, []);

  const updateApiKey = useCallback(async (apiKeyId: number) => {
    if (!editKeyName.trim()) {
      setError(apiKeysT("nameRequired") || "API key name is required");
      return;
    }

    try {
      setError(null);
      setUpdatingKey(apiKeyId);

      const expiredAt = getExpirationDateFromPeriod(editKeyExpirationPeriod, editKeyCustomDate);

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

      cancelEditApiKey();

      fetchApiKeys().catch(error => {
        console.error('Error refreshing API keys after update:', error);
      });
    } catch (error) {
      console.error('Error updating API key:', error);
      setError(apiKeysT("updateError") || "Failed to update API key");
    } finally {
      setUpdatingKey(null);
    }
  }, [editKeyName, editKeyRequestLimit, editKeyExpirationPeriod, editKeyCustomDate, user?.id, apiKeysT, cancelEditApiKey, fetchApiKeys]);

  // Show loading while checking authentication
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

  // Redirect if not active
  if (!isActive) {
    redirect(locale === 'en' ? '/dashboard' : `/${locale}/dashboard`);
  }

  return (
    <>
      <style jsx global>{`
        .custom-date-input:not(.has-value) {
          color: transparent;
          caret-color: var(--foreground, currentColor);
        }
        .dark .custom-date-input:not(.has-value) {
          caret-color: var(--foreground, #f8fafc);
        }
        .custom-date-input:not(.has-value)::-webkit-datetime-edit,
        .custom-date-input:not(.has-value)::-webkit-datetime-edit-text,
        .custom-date-input:not(.has-value)::-webkit-datetime-edit-year-field,
        .custom-date-input:not(.has-value)::-webkit-datetime-edit-month-field,
        .custom-date-input:not(.has-value)::-webkit-datetime-edit-day-field,
        .custom-date-input:not(.has-value)::-webkit-datetime-edit-fields-wrapper {
          color: transparent;
        }
        .custom-date-input:not(.has-value)::placeholder {
          color: transparent;
        }
      `}</style>
      <DashboardLayout
        pageTitle={t("apiKeys")}
        pageSubtitle="Manage your API keys for accessing Code I Lab"
        hasActiveSubscription={isActive}
      >
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Overview Cards */}
          <ApiKeyStats
            apiKeys={apiKeys}
            planInfo={planInfo}
            quota={quota}
            userQuotaUsed={parseFloat(userDetail?.quotaMonthlyUsed || "0")}
            apiKeysT={apiKeysT}
          />

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
                  {creatingApiKey && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <div className="text-blue-700 font-medium">{apiKeysT("creating")}...</div>
                      </div>
                    </div>
                  )}

                  {apiKeys.map((apiKey) => (
                    <ApiKeyCard
                      key={apiKey.id}
                      apiKey={apiKey}
                      isVisible={visibleKeys.has(apiKey.id)}
                      isCopied={copiedKey === apiKey.key}
                      isDeleting={deletingKeyId === apiKey.id}
                      isUpdating={updatingKey === apiKey.id}
                      onToggleVisibility={() => toggleKeyVisibility(apiKey.id)}
                      onCopy={() => copyToClipboard(apiKey.key)}
                      onEdit={() => startEditApiKey(apiKey)}
                      onDelete={() => confirmDeleteApiKey(apiKey.id, apiKey.name)}
                      apiKeysT={apiKeysT}
                    />
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

        {/* Create/Edit API Key Modal */}
        <ApiKeyModal
          mode="create"
          isOpen={showCreateModal}
          keyName={newKeyName}
          requestLimit={newKeyRequestLimit}
          expirationPeriod={newKeyExpirationPeriod}
          customDate={newKeyCustomDate}
          locale={locale}
          onKeyNameChange={setNewKeyName}
          onRequestLimitChange={setNewKeyRequestLimit}
          onExpirationPeriodChange={setNewKeyExpirationPeriod}
          onCustomDateChange={setNewKeyCustomDate}
          onSubmit={createNewApiKey}
          onCancel={() => setShowCreateModal(false)}
          apiKeysT={apiKeysT}
        />

        <ApiKeyModal
          mode="edit"
          isOpen={editingKeyId !== null}
          keyName={editKeyName}
          requestLimit={editKeyRequestLimit}
          expirationPeriod={editKeyExpirationPeriod}
          customDate={editKeyCustomDate}
          locale={locale}
          isSubmitting={updatingKey !== null}
          onKeyNameChange={setEditKeyName}
          onRequestLimitChange={setEditKeyRequestLimit}
          onExpirationPeriodChange={setEditKeyExpirationPeriod}
          onCustomDateChange={setEditKeyCustomDate}
          onSubmit={() => editingKeyId && updateApiKey(editingKeyId)}
          onCancel={cancelEditApiKey}
          apiKeysT={apiKeysT}
        />

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <DeleteConfirmModal
            keyName={deleteConfirm.name}
            onConfirm={() => deleteApiKey(deleteConfirm.id)}
            onCancel={() => setDeleteConfirm(null)}
            apiKeysT={apiKeysT}
          />
        )}
      </DashboardLayout>
    </>
  );
}
