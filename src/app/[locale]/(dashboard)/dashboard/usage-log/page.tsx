"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Loader2, RefreshCcw } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";

interface UsageLogEntry {
  date: string;
  totalTokens: number;
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  quotaUsed: string;
  recordCount: number;
}

interface UsageLogStatistics {
  totalInputTokens: number;
  totalCachedTokens: number;
  totalOutputTokens: number;
  totalQuotaUsed: string;
  recordCount: number;
  totalTokens: number;
}

interface UsageLogResponse {
  statistics: UsageLogStatistics;
  pageData: UsageLogEntry[];
  hasMore: boolean;
  totalCount: number;
}

const PAGE_SIZE = 20;

function formatNumber(locale: string, value: number | string) {
  const numericValue = typeof value === "number" ? value : parseFloat(value || "0");
  if (Number.isNaN(numericValue)) return "0";
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(numericValue);
}

function formatDate(locale: string, value: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export default function UsageLogPage() {
  const t = useTranslations("sidebar.usageLog");
  const locale = useLocale();
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const [entries, setEntries] = useState<UsageLogEntry[]>([]);
  const [stats, setStats] = useState<UsageLogStatistics | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);

  const loadLogs = useCallback(async (opts: { reset?: boolean; signal?: AbortSignal } = {}) => {
    if (!userId) {
      window.location.assign(locale === 'en' ? '/' : `/${locale}`);
      return;
    }
    const { reset = false, signal } = opts;

    if (reset) {
      offsetRef.current = 0;
      setEntries([]);
      setError(null);
    }

    setLoading(true);

    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(reset ? 0 : offsetRef.current),
    });

    try {
      const res = await fetch(`/api/user/${userId}/usage/logs?${params.toString()}`, { signal });
      if (!res.ok) throw new Error("Failed to fetch usage log");

      const payload: { data?: UsageLogResponse } = await res.json();
      const pageData = payload.data?.pageData ?? [];
      const normalized = pageData.map((entry) => ({
        ...entry,
        totalTokens: Number(entry.totalTokens) || 0,
        inputTokens: Number(entry.inputTokens) || 0,
        cachedTokens: Number(entry.cachedTokens) || 0,
        outputTokens: Number(entry.outputTokens) || 0,
        recordCount: Number(entry.recordCount) || 0,
        quotaUsed: entry.quotaUsed ?? "0",
      }));

      setEntries((prev) => (reset ? normalized : [...prev, ...normalized]));
      setStats(payload.data?.statistics ?? null);
      setHasMore(Boolean(payload.data?.hasMore));
      offsetRef.current = (reset ? 0 : offsetRef.current) + normalized.length;
      setError(null);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error(err);
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }, [t, userId]);

  useEffect(() => {
    if (!userId) {
      setEntries([]);
      setStats(null);
      setHasMore(false);
      return;
    }
    const controller = new AbortController();
    loadLogs({ reset: true, signal: controller.signal });
    return () => controller.abort();
  }, [loadLogs, userId]);

  const handleLoadMore = () => {
    if (loading || !hasMore) return;
    loadLogs();
  };

  const initialLoading = loading && entries.length === 0;
  const loadingMore = loading && entries.length > 0;

  const headerTitle = useMemo(() => t("title"), [t]);
  const headerSubtitle = useMemo(() => t("subtitle"), [t]);

  return (
    <DashboardLayout
      pageTitle={headerTitle}
      pageSubtitle={headerSubtitle}
      hasActiveSubscription={true}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{headerTitle}</h1>
            <p className="text-muted-foreground mt-2">{headerSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => loadLogs({ reset: true })}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className="h-4 w-4" />
            {loading ? t("loading") : t("refresh")}
          </button>
        </div>

        {stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("totalTokensLabel")}</div>
              <div className="mt-1 text-xl font-semibold text-foreground">{formatNumber(locale, stats.totalTokens)}</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("inputTokens", { value: "" })}</div>
              <div className="mt-1 text-xl font-semibold text-foreground">{formatNumber(locale, stats.totalInputTokens)}</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("outputTokens", { value: "" })}</div>
              <div className="mt-1 text-xl font-semibold text-foreground">{formatNumber(locale, stats.totalOutputTokens)}</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("quotaUsed", { value: "" })}</div>
              <div className="mt-1 text-xl font-semibold text-foreground">{formatNumber(locale, stats.totalQuotaUsed)}</div>
            </div>
          </div>
        )}

        {initialLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("loading")}
          </div>
        )}

        {error && !initialLoading && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!error && !initialLoading && entries.length === 0 && (
          <div className="rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            {t("empty")}
          </div>
        )}

        {entries.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("date")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("totalTokensLabel")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("inputTokens", { value: "" })}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("outputTokens", { value: "" })}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("cachedTokens", { value: "" })}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("quotaUsed", { value: "" })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((entry, idx) => (
                  <tr key={`${entry.date}-${idx}`} className="hover:bg-muted/40">
                    <td className="px-4 py-3 text-sm text-foreground">{formatDate(locale, entry.date)}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{formatNumber(locale, entry.totalTokens)}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{formatNumber(locale, entry.inputTokens)}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{formatNumber(locale, entry.outputTokens)}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{formatNumber(locale, entry.cachedTokens)}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{formatNumber(locale, entry.quotaUsed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {hasMore && (
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-primary transition hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            {loadingMore ? t("loading") : t("loadMore")}
          </button>
        )}
      </div>
    </DashboardLayout>
  );
}
