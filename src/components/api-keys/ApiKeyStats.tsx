import { Card, CardContent } from "@/components/ui/card";
import { Key, BarChart3, TrendingUp } from "lucide-react";
import { ApiKey, PlanInfo } from "@/app/[locale]/(dashboard)/dashboard/api-keys/types";
import { getPlanLimits } from "@/app/[locale]/(dashboard)/dashboard/api-keys/utils";

interface ApiKeyStatsProps {
  apiKeys: ApiKey[];
  planInfo: PlanInfo | null;
  quota: number | null;
  userQuotaUsed: number;
  apiKeysT: (key: string, params?: any) => string;
}

export function ApiKeyStats({
  apiKeys,
  planInfo,
  quota,
  userQuotaUsed,
  apiKeysT
}: ApiKeyStatsProps) {
  return (
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
                ${userQuotaUsed || 0}
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
  );
}
