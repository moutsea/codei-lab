import { db } from "../index";
import { users, payments, monthlyApiUsage, subscriptions } from "../schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import type { MonthlyMetricsData } from "@/types/db";

/**
 * Get monthly metrics for the past N months
 */
const formatMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export async function getMonthlyMetrics(months: number = 12): Promise<MonthlyMetricsData[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (months - 1));
    startDate.setDate(1); // Start from first day of the first month

    // Set endDate to the end of the current month
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0); // This goes to the last day of the current month


    // Get monthly user counts
    const userQuery = db()
      .select({
        month: sql<string>`TO_CHAR(${users.createdAt}, 'YYYY-MM')`,
        count: sql<number>`COUNT(*)`
      })
      .from(users)
      .where(gte(users.createdAt, startDate))
      .groupBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`);

    // Get monthly revenue (total and by currency)
    const revenueQuery = db()
      .select({
        month: sql<string>`TO_CHAR(${payments.createdAt}, 'YYYY-MM')`,
        total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS NUMERIC)), 0)`,
        currency: payments.currency,
        currencyTotal: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS NUMERIC)), 0)`
      })
      .from(payments)
      .where(and(
        gte(payments.createdAt, startDate),
        eq(payments.status, 'paid')
      ))
      .groupBy(sql`TO_CHAR(${payments.createdAt}, 'YYYY-MM')`, payments.currency);

    // Get monthly token usage
    const firstDayOfMonth = `${formatMonth(startDate)}-01`;

    const tokensQuery = db()
      .select({
        month: sql<string>`SUBSTRING(${monthlyApiUsage.month}, 1, 7)`.as('month'),
        inputTokens: sql<number>`COALESCE(SUM(${monthlyApiUsage.inputTokens}), 0)`,
        cachedTokens: sql<number>`COALESCE(SUM(${monthlyApiUsage.cachedTokens}), 0)`,
        outputTokens: sql<number>`COALESCE(SUM(${monthlyApiUsage.outputTokens}), 0)`
      })
      .from(monthlyApiUsage)
      .where(gte(monthlyApiUsage.month, firstDayOfMonth))
      .groupBy(monthlyApiUsage.month);

    // Get monthly subscription counts
    const subscriptionsQuery = db()
      .select({
        month: sql<string>`TO_CHAR(${subscriptions.createdAt}, 'YYYY-MM')`,
        count: sql<number>`COUNT(*)`
      })
      .from(subscriptions)
      .where(gte(subscriptions.createdAt, startDate))
      .groupBy(sql`TO_CHAR(${subscriptions.createdAt}, 'YYYY-MM')`);

    // Execute all queries in parallel
    const [usersResult, revenueResult, tokensResult, subscriptionsResult] = await Promise.all([
      userQuery,
      revenueQuery,
      tokensQuery,
      subscriptionsQuery
    ]);

    // Helper function to convert month string to Date for sorting
    const monthToDate = (monthStr: string) => new Date(monthStr + '-01');

    // Convert results to Maps for easier lookup
    const usersMap = new Map(usersResult.map(row => [row.month, row.count]));

    // Process revenue results to handle multiple currencies
    const revenueMap = new Map();
    const revenueByCurrencyMap = new Map();

    revenueResult.forEach(row => {
      // Set total revenue for the month
      if (!revenueMap.has(row.month)) {
        revenueMap.set(row.month, 0);
      }

      // Group revenue by currency for each month
      if (!revenueByCurrencyMap.has(row.month)) {
        revenueByCurrencyMap.set(row.month, {});
      }

      const monthCurrencies = revenueByCurrencyMap.get(row.month);
      monthCurrencies[row.currency?.toUpperCase() || 'USD'] = {
        amount: Number(row.currencyTotal),
        currency: row.currency?.toUpperCase() || 'USD'
      };

      // Also update the total (note: this approach assumes the total is calculated per currency)
      // We need to sum up all currencies for the total
      const currentTotal = revenueMap.get(row.month) || 0;
      revenueMap.set(row.month, currentTotal + Number(row.currencyTotal));
    });

    const tokensMap = new Map(tokensResult.map(row => [
      row.month,
      {
        inputTokens: row.inputTokens,
        cachedTokens: row.cachedTokens,
        outputTokens: row.outputTokens,
        totalTokens: row.inputTokens + row.cachedTokens + row.outputTokens
      }
    ]));
    const subscriptionsMap = new Map(subscriptionsResult.map(row => [row.month, row.count]));

    // Generate all months in the range
    const result: MonthlyMetricsData[] = [];
    const currentMonth = new Date(startDate);
    // currentMonth.setMonth(currentMonth.getMonth() + 1);

    // Generate exactly 'months' number of months starting from startDate
    for (let i = 0; i < months; i++) {
      const monthStr = formatMonth(currentMonth); // YYYY-MM format

      const tokenData = tokensMap.get(monthStr) || {
        inputTokens: 0,
        cachedTokens: 0,
        outputTokens: 0,
        totalTokens: 0
      };

      result.push({
        month: monthStr,
        users: usersMap.get(monthStr) || 0,
        revenue: Number(revenueMap.get(monthStr) || 0),
        revenueByCurrency: revenueByCurrencyMap.get(monthStr) || {},
        inputTokens: tokenData.inputTokens,
        cachedTokens: tokenData.cachedTokens,
        outputTokens: tokenData.outputTokens,
        totalTokens: tokenData.totalTokens,
        subscriptions: subscriptionsMap.get(monthStr) || 0,
      });

      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    // Sort by month and return
    const sortedResult = result.sort((a, b) => monthToDate(a.month).getTime() - monthToDate(b.month).getTime());

    return sortedResult;
  } catch (error) {
    console.error('Error fetching monthly metrics:', error);
    return [];
  }
}

/**
 * Get monthly metrics for a specific year
 */
export async function getMonthlyMetricsForYear(year: number): Promise<MonthlyMetricsData[]> {
  try {
    const startDate = new Date(year, 0, 1); // January 1st of the year
    const endDate = new Date(year, 11, 31); // December 31st of the year

    // Get monthly user counts for the year
    const userQuery = db()
      .select({
        month: sql<string>`TO_CHAR(${users.createdAt}, 'YYYY-MM')`,
        count: sql<number>`COUNT(*)`
      })
      .from(users)
      .where(and(
        gte(users.createdAt, startDate),
        lte(users.createdAt, endDate)
      ))
      .groupBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`);

    // Get monthly revenue for the year (total and by currency)
    const revenueQuery = db()
      .select({
        month: sql<string>`TO_CHAR(${payments.createdAt}, 'YYYY-MM')`,
        total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS NUMERIC)), 0)`,
        currency: payments.currency,
        currencyTotal: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS NUMERIC)), 0)`
      })
      .from(payments)
      .where(and(
        gte(payments.createdAt, startDate),
        lte(payments.createdAt, endDate),
        eq(payments.status, 'paid')
      ))
      .groupBy(sql`TO_CHAR(${payments.createdAt}, 'YYYY-MM')`, payments.currency);

    // Get monthly token usage for the year
    const tokensQuery = db()
      .select({
        month: monthlyApiUsage.month,
        inputTokens: sql<number>`COALESCE(SUM(${monthlyApiUsage.inputTokens}), 0)`,
        cachedTokens: sql<number>`COALESCE(SUM(${monthlyApiUsage.cachedTokens}), 0)`,
        outputTokens: sql<number>`COALESCE(SUM(${monthlyApiUsage.outputTokens}), 0)`
      })
      .from(monthlyApiUsage)
      .where(sql`${monthlyApiUsage.month} LIKE ${year + '-'}`)
      .groupBy(monthlyApiUsage.month);

    // Get monthly subscription counts for the year
    const subscriptionsQuery = db()
      .select({
        month: sql<string>`TO_CHAR(${subscriptions.createdAt}, 'YYYY-MM')`,
        count: sql<number>`COUNT(*)`
      })
      .from(subscriptions)
      .where(and(
        gte(subscriptions.createdAt, startDate),
        lte(subscriptions.createdAt, endDate)
      ))
      .groupBy(sql`TO_CHAR(${subscriptions.createdAt}, 'YYYY-MM')`);

    // Execute all queries in parallel
    const [usersResult, revenueResult, tokensResult, subscriptionsResult] = await Promise.all([
      userQuery,
      revenueQuery,
      tokensQuery,
      subscriptionsQuery
    ]);

    // Convert results to Maps for easier lookup
    const usersMap = new Map(usersResult.map(row => [row.month, row.count]));

    // Process revenue results to handle multiple currencies
    const revenueMap = new Map();
    const revenueByCurrencyMap = new Map();

    revenueResult.forEach(row => {
      // Set total revenue for the month
      if (!revenueMap.has(row.month)) {
        revenueMap.set(row.month, 0);
      }

      // Group revenue by currency for each month
      if (!revenueByCurrencyMap.has(row.month)) {
        revenueByCurrencyMap.set(row.month, {});
      }

      const monthCurrencies = revenueByCurrencyMap.get(row.month);
      monthCurrencies[row.currency?.toUpperCase() || 'USD'] = {
        amount: Number(row.currencyTotal),
        currency: row.currency?.toUpperCase() || 'USD'
      };

      // Also update the total
      const currentTotal = revenueMap.get(row.month) || 0;
      revenueMap.set(row.month, currentTotal + Number(row.currencyTotal));
    });

    const tokensMap = new Map(tokensResult.map(row => [
      row.month,
      {
        inputTokens: row.inputTokens,
        cachedTokens: row.cachedTokens,
        outputTokens: row.outputTokens,
        totalTokens: row.inputTokens + row.cachedTokens + row.outputTokens
      }
    ]));
    const subscriptionsMap = new Map(subscriptionsResult.map(row => [row.month, row.count]));

    // Generate all 12 months for the year
    const result: MonthlyMetricsData[] = [];
    for (let month = 0; month < 12; month++) {
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

      const tokenData = tokensMap.get(monthStr) || {
        inputTokens: 0,
        cachedTokens: 0,
        outputTokens: 0,
        totalTokens: 0
      };

      result.push({
        month: monthStr,
        users: usersMap.get(monthStr) || 0,
        revenue: Number(revenueMap.get(monthStr) || 0),
        revenueByCurrency: revenueByCurrencyMap.get(monthStr) || {},
        inputTokens: tokenData.inputTokens,
        cachedTokens: tokenData.cachedTokens,
        outputTokens: tokenData.outputTokens,
        totalTokens: tokenData.totalTokens,
        subscriptions: subscriptionsMap.get(monthStr) || 0,
      });
    }

    return result;
  } catch (error) {
    console.error('Error fetching monthly metrics for year:', error);
    return [];
  }
}
