import { Button } from "@/components/ui/button";
import { Key, Eye, EyeOff, Copy, Edit, Trash2, BarChart3, Clock, AlertCircle } from "lucide-react";
import { useMemo } from "react";
import { ApiKey } from "@/app/[locale]/(dashboard)/dashboard/api-keys/types";
import { formatDate, getQuotaColor, getExpirationStatus, isExpired } from "@/app/[locale]/(dashboard)/dashboard/api-keys/utils";

interface ApiKeyCardProps {
  apiKey: ApiKey;
  isVisible: boolean;
  isCopied: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  onToggleVisibility: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  apiKeysT: (key: string, params?: any) => string;
}

export function ApiKeyCard({
  apiKey,
  isVisible,
  isCopied,
  isDeleting,
  isUpdating,
  onToggleVisibility,
  onCopy,
  onEdit,
  onDelete,
  apiKeysT
}: ApiKeyCardProps) {
  const expirationStatus = useMemo(
    () => getExpirationStatus(apiKey.expiredAt, apiKeysT),
    [apiKey.expiredAt, apiKeysT]
  );

  const quotaColor = useMemo(
    () => getQuotaColor(apiKey.remainingQuota, apiKey.quota),
    [apiKey.remainingQuota, apiKey.quota]
  );

  const isExpiredKey = useMemo(
    () => isExpired(apiKey.expiredAt),
    [apiKey.expiredAt]
  );

  const usagePercentage = useMemo(() => {
    if (apiKey.quota === null || apiKey.quota === 0) return 0;
    return Math.min((apiKey.tokensUsed / apiKey.quota) * 100, 100);
  }, [apiKey.tokensUsed, apiKey.quota]);

  const getUsageColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div
      className={`bg-card dark:bg-secondary/20 rounded-xl p-6 border ${
        isDeleting
          ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20'
          : 'border-border'
      } ${isDeleting ? '' : 'hover:shadow-md'} transition-all duration-200`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-1.5 bg-card dark:bg-accent/50 rounded-lg shadow-sm border border-border">
              <Key className="h-4 w-4 text-foreground" />
            </div>
            <h3 className="font-semibold text-foreground text-lg">{apiKey.name}</h3>
            <div className={`px-2 py-1 text-xs font-medium rounded-full ${quotaColor}`}>
              {apiKey.quota === null || apiKey.quota === 0
                ? apiKeysT("noLimit")
                : `${Math.round((apiKey.remainingQuota! / apiKey.quota) * 100)}% quota left`}
            </div>
            <div className={`px-2 py-1 text-xs font-medium rounded-full border ${expirationStatus.color}`}>
              <expirationStatus.icon className="h-3 w-3 inline mr-1" />
              {expirationStatus.text}
            </div>
            {isDeleting && (
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
            <div
              className={`flex items-center space-x-1 ${
                isExpiredKey ? 'text-red-500' : apiKey.expiredAt ? 'text-orange-500' : 'text-green-500'
              }`}
            >
              <AlertCircle className="h-3 w-3" />
              <span>
                {apiKey.expiredAt
                  ? `Expires: ${formatDate(apiKey.expiredAt)}`
                  : apiKeysT("noExpire") || "No Expiration"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleVisibility}
            className="hover:bg-gray-100 transition-colors"
            disabled={isDeleting}
            aria-label={isVisible ? "Hide API key" : "Show API key"}
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCopy}
            className="hover:bg-gray-100 transition-colors"
            disabled={isDeleting}
            aria-label="Copy API key"
          >
            {isCopied ? (
              <span className="text-sm text-green-600 font-medium">{apiKeysT("copied")}</span>
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-200"
            disabled={isDeleting || isUpdating}
            aria-label="Edit API key"
          >
            {isUpdating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : (
              <Edit className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200 ${
              isDeleting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={onDelete}
            disabled={isDeleting || isUpdating}
            aria-label="Delete API key"
          >
            {isDeleting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        {/* Quota Progress Bar */}
        <div
          className={`bg-card dark:bg-secondary/20 rounded-lg p-4 border border-border ${
            isExpiredKey ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Monthly Quota Usage</span>
            <span className="text-xs text-muted-foreground">
              {apiKey.quota === null
                ? `$${apiKey.tokensUsed} / ${apiKeysT("noLimit")}`
                : `$${apiKey.tokensUsed} / $${apiKey.quota}`}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            {apiKey.quota === null ? (
              <div className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 w-full"></div>
            ) : (
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(usagePercentage)}`}
                style={{ width: `${usagePercentage}%` }}
              ></div>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span
              className={`text-xs font-medium ${
                apiKey.quota === null || apiKey.quota === 0
                  ? 'text-purple-600 dark:text-purple-400'
                  : apiKey.tokensUsed >= apiKey.quota
                  ? 'text-red-600 dark:text-red-400'
                  : apiKey.tokensUsed >= apiKey.quota * 0.8
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-green-600 dark:text-green-400'
              }`}
            >
              {apiKey.quota === null || apiKey.quota === 0
                ? apiKeysT("unlimitedQuota")
                : `$${apiKey.remainingQuota}`}
              {apiKey.quota !== null && apiKey.quota > 0 && ' remaining'}
            </span>
            <span
              className={`text-xs font-medium ${
                apiKey.quota === null || apiKey.quota === 0
                  ? 'text-purple-600 dark:text-purple-400'
                  : apiKey.tokensUsed >= apiKey.quota
                  ? 'text-red-600 dark:text-red-400'
                  : apiKey.tokensUsed >= apiKey.quota * 0.8
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-green-600 dark:text-green-400'
              }`}
            >
              {apiKey.quota === null || apiKey.quota === 0
                ? `${apiKeysT("unlimitedAccess")}`
                : `${Math.round(usagePercentage)}% used`}
            </span>
          </div>
        </div>
        {/* API Key Display */}
        <div className="bg-card dark:bg-secondary/20 rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between">
            <div className="font-mono text-sm text-foreground">
              {isVisible ? (
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
  );
}
