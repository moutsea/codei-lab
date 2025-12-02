import { Button } from "@/components/ui/button";
import { Plus, Edit, Save, X } from "lucide-react";
import { DEFAULT_QUOTA, EXPIRATION_PERIODS, QUICK_QUOTA_OPTIONS } from "@/app/[locale]/(dashboard)/dashboard/api-keys/types";
import { getDatePlaceholder } from "@/app/[locale]/(dashboard)/dashboard/api-keys/utils";

interface ApiKeyModalProps {
  mode: 'create' | 'edit';
  isOpen: boolean;
  keyName: string;
  requestLimit: number | null;
  expirationPeriod: string;
  customDate: string;
  locale: string;
  isSubmitting?: boolean;
  onKeyNameChange: (value: string) => void;
  onRequestLimitChange: (value: number | null) => void;
  onExpirationPeriodChange: (value: string) => void;
  onCustomDateChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  apiKeysT: (key: string, params?: any) => string;
}

export function ApiKeyModal({
  mode,
  isOpen,
  keyName,
  requestLimit,
  expirationPeriod,
  customDate,
  locale,
  isSubmitting = false,
  onKeyNameChange,
  onRequestLimitChange,
  onExpirationPeriodChange,
  onCustomDateChange,
  onSubmit,
  onCancel,
  apiKeysT
}: ApiKeyModalProps) {
  if (!isOpen) return null;

  const isCreateMode = mode === 'create';
  const Icon = isCreateMode ? Plus : Edit;
  const title = isCreateMode ? apiKeysT("createTitle") : apiKeysT("editTitle") || "Edit API Key";
  const description = isCreateMode ? apiKeysT("createDescription") : apiKeysT("editDescription") || "Update your API key settings";
  const submitText = isCreateMode ? apiKeysT("create") : (isSubmitting ? (apiKeysT("updating") || "Updating...") : (apiKeysT("save") || "Save Changes"));

  return (
    <>
      {/* Click outside to close */}
      <div
        className="fixed inset-0 z-40"
        onClick={onCancel}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-md border border-border animate-in zoom-in duration-200">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-lg">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              >
                <span className="sr-only">Close</span>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="space-y-4">
              {/* API Key Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {apiKeysT("nameLabel") || "API Key Name"}
                </label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => onKeyNameChange(e.target.value)}
                  placeholder={apiKeysT("namePlaceholder")}
                  className="w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-muted-foreground"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Choose a descriptive name to help you identify this API key
                </p>
              </div>

              {/* Monthly Request Limit */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {apiKeysT("monthlyRequestLimit")}
                </label>
                {requestLimit === null ? (
                  <div className="w-full border border-border rounded-lg px-4 py-3 bg-muted text-foreground font-medium">
                    {apiKeysT("noLimit")}
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      value={requestLimit}
                      onChange={(e) => onRequestLimitChange(Math.max(1, parseInt(e.target.value) || 0))}
                      min="1"
                      max="2000"
                      className="w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                      ${requestLimit}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {QUICK_QUOTA_OPTIONS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => onRequestLimitChange(amount)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        requestLimit === amount
                          ? isCreateMode ? "bg-blue-500 text-white" : "bg-purple-500 text-white"
                          : "bg-muted hover:bg-accent text-foreground"
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => onRequestLimitChange(null)}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      requestLimit === null
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

              {/* Expiration Date */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {apiKeysT("expirationDateOptional")}
                </label>
                <select
                  value={expirationPeriod}
                  onChange={(e) => {
                    onExpirationPeriodChange(e.target.value);
                    if (e.target.value !== EXPIRATION_PERIODS.CUSTOM) {
                      onCustomDateChange('');
                    }
                  }}
                  className="w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value={EXPIRATION_PERIODS.NO_EXPIRE}>{apiKeysT("noExpire") || "No Expiration"}</option>
                  <option value={EXPIRATION_PERIODS.ONE_MONTH}>{apiKeysT("oneMonth") || "1 Month"}</option>
                  <option value={EXPIRATION_PERIODS.THREE_MONTHS}>{apiKeysT("threeMonths") || "3 Months"}</option>
                  <option value={EXPIRATION_PERIODS.SIX_MONTHS}>{apiKeysT("sixMonths") || "6 Months"}</option>
                  <option value={EXPIRATION_PERIODS.ONE_YEAR}>{apiKeysT("oneYear") || "1 Year"}</option>
                  <option value={EXPIRATION_PERIODS.CUSTOM}>{apiKeysT("customDate") || "Custom Date"}</option>
                </select>

                {/* Show date picker when custom is selected */}
                {expirationPeriod === EXPIRATION_PERIODS.CUSTOM && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {apiKeysT("selectCustomDate") || "Select Custom Date"}
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => onCustomDateChange(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className={`custom-date-input w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${customDate ? 'has-value' : ''}`}
                        placeholder={getDatePlaceholder(locale)}
                      />
                      {!customDate && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden="true">
                          {getDatePlaceholder(locale)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  {apiKeysT("periodDescription") || "Choose when the API key should expire. Keys will expire at 00:00:00 on the selected date."}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-muted/50 rounded-b-2xl border-t border-border">
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={onCancel}
                className="hover:bg-gray-100 transition-colors"
              >
                {apiKeysT("cancel")}
              </Button>
              <Button
                onClick={onSubmit}
                disabled={!keyName.trim() || isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-300 dark:hover:to-blue-400 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting && !isCreateMode ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Icon className="h-4 w-4 mr-2" />
                )}
                {submitText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
