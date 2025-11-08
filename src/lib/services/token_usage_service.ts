import { cache, cacheTTL } from '@/lib/cache';
import {
    createDailyUserUsage,
    getDailyUserUsageById,
    getDailyUserUsageByUserAndDate,
    getDailyUserUsageByDateRange,
    updateDailyUserUsageById,
    addTokensToDailyUsage,
    deleteDailyUserUsageById,
    deleteDailyUserUsageByDateRange,
    deleteAllDailyUserUsageByUserId
} from '@/db/queries/daily-user-usage';
import {
    createMonthlyApiUsage,
    getMonthlyApiUsageById,
    getMonthlyApiUsageByKeyAndMonth,
    getApiKeysUsageByMonth,
    updateMonthlyApiUsageById,
    addTokensToMonthlyApiUsage,
    deleteMonthlyApiUsageById,
    deleteMonthlyApiUsageByMonthRange,
    deleteAllMonthlyApiUsageByApiKey,
    deleteAllMonthlyApiUsageByUserId
} from '@/db/queries/monthly-api-usage';
import type { MonthlyApiUsageWithName } from '@/types/db';
import {
    createMonthlyUserUsage,
    getMonthlyUserUsageByUserAndMonth,
    getMonthlyUserUsageByMonthRange,
    getRecentMonthlyUserUsage,
    getMonthlyUserUsageCount,
    getUsersUsageByMonth,
    addTokensToMonthlyUserUsage,
    deleteAllMonthlyUserUsageByUserId,
    upsertMonthlyUserUsage
} from '@/db/queries/monthly-user-usage';
import { getApiKeyByKey, updateApiKeyById, updateApiKeyByKey } from '@/db/queries/api-keys';
import type { DailyUserUsageSelect, DailyUserUsageInsert } from '@/types/schema';
import type { MonthlyApiUsageSelect, MonthlyApiUsageInsert } from '@/types/schema';
import type { MonthlyUserUsageSelect, MonthlyUserUsageInsert } from '@/types/schema';
import { currentMonth } from '@/lib/utils'
import { updateApiKey, updateApiKeyUsageCache } from './api_key_service';
import type { ApiDetail, UserDetail } from '@/types/db';
import { createOrUpdateUserDetailCache } from './user_service';
import { db } from '@/db';

// ========== API Key Usage Cache ==========
const API_USAGE_CACHE_KEYS = {
    apiKeyUsage: (apiKey: string) => `api_key:usage:${apiKey}`,
};

interface ApiKeyUsageCache {
    token_used: number;
    quota: number | null;
}

// ========== Daily User Usage Service ==========

/**
 * Create a new daily user usage record
 */
export const createDailyUserUsageService = async (
    data: Omit<DailyUserUsageInsert, 'id' | 'updatedAt'>
): Promise<DailyUserUsageSelect | null> => {
    try {
        const usage = await createDailyUserUsage(data);
        console.log(`✅ Created daily user usage for user ${data.userId}, date ${data.date}`);
        return usage || null;
    } catch (error) {
        console.error('Error creating daily user usage:', error);
        return null;
    }
};

/**
 * Get daily user usage by ID
 */
export const getDailyUserUsageByIdService = async (id: number): Promise<DailyUserUsageSelect | null> => {
    try {
        const usage = await getDailyUserUsageById(id);
        return usage;
    } catch (error) {
        console.error('Error getting daily user usage by ID:', error);
        return null;
    }
};

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
 * Update daily user usage by ID
 */
export const updateDailyUserUsageByIdService = async (
    id: number,
    data: Partial<Omit<DailyUserUsageInsert, 'id'>>
): Promise<DailyUserUsageSelect | null> => {
    try {
        const usage = await updateDailyUserUsageById(id, data);
        if (usage) {
            console.log(`✅ Updated daily user usage: ${id}`);
        }
        return usage;
    } catch (error) {
        console.error('Error updating daily user usage:', error);
        return null;
    }
};

/**
 * Add tokens to daily usage (create if doesn't exist)
 */
export const addTokensToDailyUsageService = async (
    userId: string,
    date: string,
    tokens: number
): Promise<DailyUserUsageSelect | null> => {
    try {
        const usage = await addTokensToDailyUsage(userId, date, tokens, 0, 0);
        if (usage) {
            console.log(`✅ Added ${tokens} tokens to daily usage for user ${userId}, date ${date}`);
        }
        return usage;
    } catch (error) {
        console.error('Error adding tokens to daily usage:', error);
        return null;
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
 * Delete daily user usage by ID
 */
export const deleteDailyUserUsageByIdService = async (id: number): Promise<DailyUserUsageSelect | null> => {
    try {
        const usage = await deleteDailyUserUsageById(id);
        if (usage) {
            console.log(`✅ Deleted daily user usage: ${id}`);
        }
        return usage;
    } catch (error) {
        console.error('Error deleting daily user usage:', error);
        return null;
    }
};

/**
 * Delete daily user usage for a date range
 */
export const deleteDailyUserUsageByDateRangeService = async (
    userId: string,
    startDate: string,
    endDate: string
): Promise<DailyUserUsageSelect[]> => {
    try {
        const usage = await deleteDailyUserUsageByDateRange(userId, startDate, endDate);
        console.log(`✅ Deleted ${usage.length} daily user usage records for user ${userId}`);
        return usage;
    } catch (error) {
        console.error('Error deleting daily user usage by date range:', error);
        return [];
    }
};

/**
 * Delete all daily usage records for a user
 */
export const deleteAllDailyUserUsageByUserIdService = async (userId: string): Promise<DailyUserUsageSelect[]> => {
    try {
        const usage = await deleteAllDailyUserUsageByUserId(userId);
        console.log(`✅ Deleted ${usage.length} daily user usage records for user ${userId}`);
        return usage;
    } catch (error) {
        console.error('Error deleting all daily user usage:', error);
        return [];
    }
};

// ========== Monthly API Usage Service ==========

/**
 * Create a new monthly API usage record
 */
export const createMonthlyApiUsageService = async (
    data: Omit<MonthlyApiUsageInsert, 'id' | 'updatedAt'>
): Promise<MonthlyApiUsageSelect | null> => {
    try {
        const usage = await createMonthlyApiUsage(data);
        console.log(`✅ Created monthly API usage for API key ${data.apikey}, month ${data.month}`);
        return usage || null;
    } catch (error) {
        console.error('Error creating monthly API usage:', error);
        return null;
    }
};

/**
 * Get monthly API usage by ID
 */
export const getMonthlyApiUsageByIdService = async (id: number): Promise<MonthlyApiUsageSelect | null> => {
    try {
        const usage = await getMonthlyApiUsageById(id);
        return usage;
    } catch (error) {
        console.error('Error getting monthly API usage by ID:', error);
        return null;
    }
};

/**
 * Get monthly API usage by API key and month
 */
export const getMonthlyApiUsageByKeyAndMonthService = async (
    apiKey: string,
    month: string
): Promise<MonthlyApiUsageSelect | null> => {
    try {
        const usage = await getMonthlyApiUsageByKeyAndMonth(apiKey, month);
        return usage;
    } catch (error) {
        console.error('Error getting monthly API usage by key and month:', error);
        return null;
    }
};

/**
 * Get all API keys usage for a specific month
 */
export const getApiKeysUsageByMonthService = async (
    month: string,
    userId?: string
): Promise<MonthlyApiUsageWithName[]> => {
    try {
        const usage = await getApiKeysUsageByMonth(month, userId);
        return usage;
    } catch (error) {
        console.error('Error getting API keys usage by month:', error);
        return [];
    }
};

/**
 * Update monthly API usage by ID
 */
export const updateMonthlyApiUsageByIdService = async (
    id: number,
    data: Partial<Omit<MonthlyApiUsageInsert, 'id'>>
): Promise<MonthlyApiUsageSelect | null> => {
    try {
        const usage = await updateMonthlyApiUsageById(id, data);
        if (usage) {
            console.log(`✅ Updated monthly API usage: ${id}`);
        }
        return usage;
    } catch (error) {
        console.error('Error updating monthly API usage:', error);
        return null;
    }
};

/**
 * Add tokens to monthly API usage (create if doesn't exist)
 */
export const addTokensToMonthlyApiUsageService = async (
    apiKey: string,
    month: string,
    tokens: number
): Promise<MonthlyApiUsageSelect | null> => {
    try {
        const usage = await addTokensToMonthlyApiUsage(apiKey, month, tokens, 0, 0);
        if (usage) {
            console.log(`✅ Added ${tokens} tokens to monthly API usage for key ${apiKey}, month ${month}`);
        }
        return usage;
    } catch (error) {
        console.error('Error adding tokens to monthly API usage:', error);
        return null;
    }
};

/**
 * Delete monthly API usage by ID
 */
export const deleteMonthlyApiUsageByIdService = async (id: number): Promise<MonthlyApiUsageSelect | null> => {
    try {
        const usage = await deleteMonthlyApiUsageById(id);
        if (usage) {
            console.log(`✅ Deleted monthly API usage: ${id}`);
        }
        return usage;
    } catch (error) {
        console.error('Error deleting monthly API usage:', error);
        return null;
    }
};

/**
 * Delete monthly API usage for a month range
 */
export const deleteMonthlyApiUsageByMonthRangeService = async (
    apiKey: string,
    startMonth: string,
    endMonth: string
): Promise<MonthlyApiUsageSelect[]> => {
    try {
        const usage = await deleteMonthlyApiUsageByMonthRange(apiKey, startMonth, endMonth);
        console.log(`✅ Deleted ${usage.length} monthly API usage records for key ${apiKey}`);
        return usage;
    } catch (error) {
        console.error('Error deleting monthly API usage by month range:', error);
        return [];
    }
};

/**
 * Delete all monthly usage records for an API key
 */
export const deleteAllMonthlyApiUsageByApiKeyService = async (apiKey: string): Promise<MonthlyApiUsageSelect[]> => {
    try {
        const usage = await deleteAllMonthlyApiUsageByApiKey(apiKey);
        console.log(`✅ Deleted ${usage.length} monthly API usage records for key ${apiKey}`);
        return usage;
    } catch (error) {
        console.error('Error deleting all monthly API usage by API key:', error);
        return [];
    }
};

/**
 * Delete all monthly usage records for a user
 */
export const deleteAllMonthlyApiUsageByUserIdService = async (userId: string): Promise<MonthlyApiUsageSelect[]> => {
    try {
        const usage = await deleteAllMonthlyApiUsageByUserId(userId);
        console.log(`✅ Deleted ${usage.length} monthly API usage records for user ${userId}`);
        return usage;
    } catch (error) {
        console.error('Error deleting all monthly API usage by user ID:', error);
        return [];
    }
};

// ========== Monthly User Usage Service ==========

/**
 * Create a new monthly user usage record
 */
export const createMonthlyUserUsageService = async (
    data: Omit<MonthlyUserUsageInsert, 'id' | 'updatedAt'>
): Promise<MonthlyUserUsageSelect | null> => {
    try {
        const usage = await createMonthlyUserUsage(data);
        console.log(`✅ Created monthly user usage for user ${data.userId}, month ${data.month}`);
        return usage || null;
    } catch (error) {
        console.error('Error creating monthly user usage:', error);
        return null;
    }
};

/**
 * Get monthly user usage by user ID and month
 */
export const getMonthlyUserUsageByUserAndMonthService = async (
    userId: string,
    month: string
): Promise<MonthlyUserUsageSelect | null> => {
    try {
        const usage = await getMonthlyUserUsageByUserAndMonth(userId, month);
        return usage;
    } catch (error) {
        console.error('Error getting monthly user usage by user and month:', error);
        return null;
    }
};

/**
 * Get monthly user usage for a month range
 */
export const getMonthlyUserUsageByMonthRangeService = async (
    startMonth: string,
    endMonth: string,
    userId?: string
): Promise<MonthlyUserUsageSelect[]> => {
    try {
        const usage = await getMonthlyUserUsageByMonthRange(startMonth, endMonth, userId);
        return usage;
    } catch (error) {
        console.error('Error getting monthly user usage by month range:', error);
        return [];
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
 * Get all users usage for a specific month
 */
export const getUsersUsageByMonthService = async (month: string): Promise<MonthlyUserUsageSelect[]> => {
    try {
        const usage = await getUsersUsageByMonth(month);
        return usage;
    } catch (error) {
        console.error('Error getting users usage by month:', error);
        return [];
    }
};

/**
 * Get monthly usage count for a user
 */
export const getMonthlyUserUsageCountService = async (
    userId: string,
    startMonth?: string,
    endMonth?: string
): Promise<number> => {
    try {
        const count = await getMonthlyUserUsageCount(userId, startMonth, endMonth);
        return count;
    } catch (error) {
        console.error('Error getting monthly user usage count:', error);
        return 0;
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

/**
 * Upsert monthly user usage (create or update)
 */
export const upsertMonthlyUserUsageService = async (
    userId: string,
    month: string,
    tokens: number
): Promise<MonthlyUserUsageSelect | null> => {
    try {
        const usage = await upsertMonthlyUserUsage(userId, month, tokens, 0, 0);
        console.log(`✅ Upserted monthly user usage for user ${userId}, month ${month}, tokens ${tokens}`);
        return usage;
    } catch (error) {
        console.error('Error upserting monthly user usage:', error);
        return null;
    }
};

/**
 * Delete all monthly usage records for a user
 */
export const deleteAllMonthlyUserUsageByUserIdService = async (userId: string): Promise<MonthlyUserUsageSelect[]> => {
    try {
        const usage = await deleteAllMonthlyUserUsageByUserId(userId);
        console.log(`✅ Deleted ${usage.length} monthly user usage records for user ${userId}`);
        return usage;
    } catch (error) {
        console.error('Error deleting all monthly user usage:', error);
        return [];
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
 * Set API key usage cache
 */
export const setApiKeyUsageCache = async (apiKey: string, usageData: ApiKeyUsageCache): Promise<void> => {
    if (!cache.isCacheEnabled()) return;

    try {
        const cacheKey = API_USAGE_CACHE_KEYS.apiKeyUsage(apiKey);
        await cache.set(cacheKey, usageData, cacheTTL.USER_DATA);
        console.log(`✅ Cached API key usage for: ${apiKey}`);
    } catch (error) {
        console.error('Cache SET API key usage error:', error);
    }
};

/**
 * Delete API key usage cache
 */
export const deleteApiKeyUsageCache = async (apiKey: string): Promise<void> => {
    if (!cache.isCacheEnabled()) return;

    try {
        const cacheKey = API_USAGE_CACHE_KEYS.apiKeyUsage(apiKey);
        await cache.delete(cacheKey);
        console.log(`✅ Deleted API key usage cache for: ${apiKey}`);
    } catch (error) {
        console.error('Cache DELETE API key usage error:', error);
    }
};

/**
 * Get current month token usage for an API key from database
 */
export const getCurrentMonthTokenUsage = async (apiKey: string): Promise<number> => {
    try {
        // Get current month in YYYY-MM format
        const usage = await getMonthlyApiUsageByKeyAndMonth(apiKey, currentMonth());
        return usage ? (usage.inputTokens + usage.cachedTokens + usage.outputTokens) : 0;
    } catch (error) {
        console.error('Error getting current month token usage:', error);
        return 0;
    }
};

/**
 * Get API key usage with cache-first approach
 * Returns { token_used: number, quota: number | null }
 */
export const getApiKeyUsage = async (apiKey: string): Promise<ApiKeyUsageCache> => {
    // Check cache first
    const cachedUsage = await getApiKeyUsageCache(apiKey);
    if (cachedUsage) {
        console.log(`✅ Cache HIT for API key usage: ${apiKey}`);
        return cachedUsage;
    }

    // Cache miss - get from database
    try {
        const tokenUsed = await getCurrentMonthTokenUsage(apiKey);

        // Get API key to fetch quota
        const apiKeyData = await getApiKeyByKey(apiKey);
        const quota = apiKeyData?.quota ? parseInt(apiKeyData.quota) : null;

        const usageData: ApiKeyUsageCache = {
            token_used: tokenUsed,
            quota: quota
        };

        // Cache the result
        await setApiKeyUsageCache(apiKey, usageData);

        console.log(`✅ Cached API key usage for ${apiKey}: ${tokenUsed} tokens used, quota: ${quota || 'unlimited'}`);
        return usageData;

    } catch (error) {
        console.error('Error getting API key usage:', error);
        // Return default values on error
        const errorUsage: ApiKeyUsageCache = {
            token_used: 0,
            quota: null
        };
        return errorUsage;
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

/**
 * Check if API key has exceeded quota
 * Returns true if exceeded, false if not exceeded or no quota set
 */
export const isApiKeyQuotaExceeded = async (apiKey: string): Promise<boolean> => {
    const usage = await getApiKeyUsage(apiKey);

    if (!usage.quota) {
        // No quota set
        return false;
    }

    return usage.token_used >= usage.quota;
};
