import { cache } from '@/lib/cache';
import {
    getDailyUserUsageByUserAndDate,
    getDailyUserUsageByDateRange,
    addTokensToDailyUsage,
} from '@/db/queries/daily-user-usage';
import {
    addTokensToMonthlyApiUsage,
} from '@/db/queries/monthly-api-usage';
import {
    getDailyApiUsageStatsByUserIdPaginated,
} from '@/db/queries/daily-api-usage';
import {
    getRecentMonthlyUserUsage,
    addTokensToMonthlyUserUsage,
    getLastMonthUserUsage,
} from '@/db/queries/monthly-user-usage';
import { updateApiKeyByKey } from '@/db/queries/api-keys';
import type { DailyUserUsageSelect } from '@/types/schema';
import type { MonthlyUserUsageSelect } from '@/types/schema';
import { updateApiKeyUsageCache } from './api_key_service';
import type { ApiDetail, UserDetail } from '@/types/db';
import { createOrUpdateUserDetailCache } from './user_service';
import { db } from '@/db';
import { addTokensToDailyApiUsage } from '@/db/queries/daily-api-usage';
import { currentSubscription } from '../utils';

// ========== API Key Usage Cache ==========
const API_USAGE_CACHE_KEYS = {
    apiKeyUsage: (apiKey: string) => `codei:api_key:usage:${apiKey}`,
};

interface ApiKeyUsageCache {
    token_used: number;
    quota: number | null;
}

// ========== Daily User Usage Service ==========


/**
 * Get daily user usage by user ID and date
 */
export const getDailyUserUsageByUserAndDateService = async (
    userId: string,
    date: string
): Promise<DailyUserUsageSelect | null> => {
    try {
        const usage = await getDailyUserUsageByUserAndDate(userId, date);
        return usage;
    } catch (error) {
        console.error('Error getting daily user usage by user and date:', error);
        return null;
    }
};

/**
 * Get daily user usage for a date range
 */
export const getDailyUserUsageByDateRangeService = async (
    startDate: string,
    endDate: string,
    userId?: string
): Promise<DailyUserUsageSelect[]> => {
    try {
        const usage = await getDailyUserUsageByDateRange(startDate, endDate, userId);
        return usage;
    } catch (error) {
        console.error('Error getting daily user usage by date range:', error);
        return [];
    }
};

/**
 * Upsert daily user usage (create or update)
 */
export const upsertDailyUserUsageService = async (
    userId: string,
    date: string,
    inputTokens: number,
    cachedTokens: number,
    outputTokens: number,
    quota: number
): Promise<DailyUserUsageSelect | null> => {
    try {
        const usage = await addTokensToDailyUsage(userId, date, inputTokens, cachedTokens, outputTokens, quota);
        console.log(`✅ Upserted daily user usage for user ${userId}, date ${date}, quota ${quota}`);
        return usage;
    } catch (error) {
        console.error('Error upserting daily user usage:', error);
        return null;
    }
};

/**
 * Get recent monthly user usage records
 */
export const getRecentMonthlyUserUsageService = async (
    userId?: string,
    limit: number = 12
): Promise<MonthlyUserUsageSelect[]> => {
    try {
        const usage = await getRecentMonthlyUserUsage(userId, limit);
        return usage;
    } catch (error) {
        console.error('Error getting recent monthly user usage:', error);
        return [];
    }
};


/**
 * 一个原子性的服务，用于为用户添加 token 使用量。
 * 它在一个事务中同时更新每日和每月的使用记录。
 * 只有在数据库事务成功后，才会更新用户详情的缓存。
 *
 * @param userId - 用户 ID
 * @param date - 当前日期字符串 (e.g., 'YYYY-MM-DD')
 * @param month - 当前月份字符串 (e.g., 'YYYY-MM')
 * @param userData - 要更新的用户详情缓存对象
 * @param tokens - 要添加的 token 数量
 * @returns 成功则返回更新后的每月使用记录，失败则返回 null。
 */
export const addTokensToUsageService = async (
    apiKey: string,
    apiData: ApiDetail,
    userId: string,
    date: string,
    month: string,
    userData: UserDetail,
    inputTokens: number,
    cachedTokens: number,
    outputTokens: number,
    quotaUsed: number
): Promise<MonthlyUserUsageSelect | null> => {
    try {
        // 步骤 1: 执行数据库事务
        // 使用 db() 获取数据库实例，然后调用 .transaction()
        // 事务会返回其内部回调函数返回的值
        const { committedMonthlyUsage, committedApiUsage } = await db().transaction(async (tx) => {
            // 在事务内部，所有数据库操作都使用 `tx` 对象
            // 并将其传递给我们的底层服务函数

            const [
                , // addTokensToDailyUsage 的返回值我们不关心，用逗号占位
                monthlyUsage,
                apiUsage,
                // updateApiKeyByKey 的返回值我们也不关心
            ] = await Promise.all([
                addTokensToDailyUsage(userId, date, inputTokens, cachedTokens, outputTokens, quotaUsed, tx),
                addTokensToMonthlyUserUsage(userId, month, inputTokens, cachedTokens, outputTokens, quotaUsed, tx),
                addTokensToMonthlyApiUsage(apiKey, month, inputTokens, cachedTokens, outputTokens, quotaUsed, tx),
                addTokensToDailyApiUsage(apiKey, date, inputTokens, cachedTokens, outputTokens, quotaUsed),
                updateApiKeyByKey(apiKey, { lastUsedAt: new Date() })
            ]);

            console.log(`(Tx) All staged updates completed.`);
            return {
                committedMonthlyUsage: monthlyUsage,
                committedApiUsage: apiUsage!
            };
        });

        // 步骤 2: 事务成功后，处理副作用（如更新缓存）
        // 这段代码只有在上面的事务被成功 COMMIT 后才会执行
        console.log(`✅ Transaction committed for user ${userId}.`);

        // 更新缓存对象
        userData.quotaMonthlyUsed = committedMonthlyUsage.quotaUsed?.toString() || "0";
        apiData.apiMonthlyUsed = committedApiUsage.inputTokens + committedApiUsage.cachedTokens + committedApiUsage.outputTokens;

        await createOrUpdateUserDetailCache(userId, userData);
        console.log(`✅ Cache updated for user ${userId}.`, userData.quotaMonthlyUsed);

        await updateApiKeyUsageCache(apiKey, apiData);
        console.log(`✅ Cache updated for apiKey ${apiKey}.`, apiData.apiMonthlyUsed);

        // 返回事务的结果
        return committedMonthlyUsage;

    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('duplicate key')) {
                // Handle specific constraint violations
            } else if (error.message.includes('connection')) {
                // Handle connection issues differently
            }
        }
        // Consider adding error monitoring/logging service
        return null;
    }
};


// ========== API Key Usage Cache Functions ==========

/**
 * Get API key usage from cache
 */
export const getApiKeyUsageCache = async (apiKey: string): Promise<ApiKeyUsageCache | null> => {
    if (!cache.isCacheEnabled()) {
        return null;
    }

    try {
        const cacheKey = API_USAGE_CACHE_KEYS.apiKeyUsage(apiKey);
        const cachedUsage = await cache.get(cacheKey) as ApiKeyUsageCache | null;
        return cachedUsage;
    } catch (error) {
        console.error('Cache GET API key usage error:', error);
        return null;
    }
};


/**
 * Update API key token usage and cache
 * This should be called after processing API requests to update the usage count
 */
export const updateApiKeyTokenUsage = async (apiKey: string, month: string, apiData: ApiDetail, tokensUsed: number) => {
    try {
        await updateApiKeyByKey(apiKey, { lastUsedAt: new Date() });
        const usage = await addTokensToMonthlyApiUsage(apiKey, month, tokensUsed, 0, 0);
        if (usage) {
            apiData.apiMonthlyUsed = usage.inputTokens + usage.cachedTokens + usage.outputTokens;
            await updateApiKeyUsageCache(apiKey, apiData);
        }
    } catch (error) {
        console.error('Error updating API key token usage:', error);
        // return null;
    }
};

export const getTrialUserLastMonthUsage = async (userId: string, startDate: Date) => {
    const cycle = currentSubscription(startDate);
    const usage = await getLastMonthUserUsage(userId, cycle);
    if (!usage) {
        return 0;
    }
    return parseFloat(usage.quotaUsed);
}

export const getDailyApiUsageStatsByUserIdPaginatedService = async (
    userId: string,
    startDate?: string,
    endDate?: string,
    limit: number = 30,
    offset: number = 0
) => {
    try {
        return await getDailyApiUsageStatsByUserIdPaginated(userId, startDate, endDate, limit, offset);
    } catch (error) {
        console.error('Error getting paginated daily API usage stats:', error);
        return {
            statistics: {
                totalInputTokens: 0,
                totalCachedTokens: 0,
                totalOutputTokens: 0,
                totalQuotaUsed: '0',
                recordCount: 0,
                totalTokens: 0,
            },
            pageData: [],
            hasMore: false,
            totalCount: 0,
        };
    }
}
