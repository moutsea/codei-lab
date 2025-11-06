import { cache, cacheTTL } from '@/lib/cache';
import {
    createApiKey as createApiKeyDB,
    generateApiKey as generateApiKeyDB,
    getApiKeyById,
    getApiKeyByKey,
    getApiKeysByName,
    searchApiKeysByName,
    getApiKeysByUserId,
    getApiKeys,
    getRecentlyUsedApiKeys,
    getApiKeysCount,
    updateApiKeyById,
    updateApiKeyRequestLimit,
    updateApiKeyName,
    updateApiKeyLastUsed,
    updateApiKeyLastUsedByKey,
    createApiKeyWithName,
    deleteApiKeyById,
    deleteApiKeyByKey,
    apiKeyExists,
    isApiKeyValid,
    getApiKeyUsageByApiKey,
    ApiKeyWithUsage,
} from '@/db/queries/api-keys';
import type { ApiKeySelect } from '@/db/schema';
import { currentMonth } from '../utils';

// ========== API Key Cache Keys ==========
const API_KEY_CACHE_KEYS = {
    apiKeyUsage: (apiKey: string) => `apikey:usage:${apiKey}`,
};

export interface ApiDetail {
    userId: string | null;
    apiMonthlyUsed: number;
    requestLimit: number | null;
    expiredAt: Date | null;
}

// ========== API Key Creation ==========

/**
 * Create a new API key for a user
 */
export const createApiKey = async (
    data: Omit<Parameters<typeof createApiKeyDB>[0], 'createdAt' | 'lastUsedAt'>
): Promise<ApiKeySelect | null> => {
    try {
        const apiKey = await createApiKeyDB(data);

        if (!apiKey) {
            console.error('Failed to create API key in database');
            return null;
        }

        console.log(`✅ Created API key: ${apiKey.id} for user ${data.userId}`);
        return apiKey;

    } catch (error) {
        console.error('Error creating API key:', error);
        return null;
    }
};

/**
 * Generate and create a new API key with default request limit
 */
export const generateApiKey = async (
    userId: string,
    name: string,
    requestLimit: number | null = 100000,
    expiredAt: Date | null
): Promise<ApiKeySelect | null> => {
    try {
        const apiKey = await generateApiKeyDB(userId, name, requestLimit, expiredAt);

        console.log(`✅ Generated API key: ${apiKey?.id} for user ${userId}`);
        return apiKey;

    } catch (error) {
        console.error('Error generating API key:', error);
        return null;
    }
};

/**
 * Create API key with custom name, key, and request limit
 */
export const createApiKeyWithCustomName = async (
    userId: string,
    name: string,
    key?: string,
    requestLimit: number = 100000
): Promise<ApiKeySelect | null> => {
    try {
        const apiKey = await createApiKeyWithName(userId, name, key, requestLimit);

        console.log(`✅ Created API key with custom name: ${apiKey?.id} for user ${userId}`);
        return apiKey;

    } catch (error) {
        console.error('Error creating API key with custom name:', error);
        return null;
    }
};

// ========== API Key Retrieval ==========

/**
 * Get API key by ID
 */
export const getApiKey = async (id: number): Promise<ApiKeySelect | null> => {
    try {
        return await getApiKeyById(id);
    } catch (error) {
        console.error(`Error getting API key ${id}:`, error);
        return null;
    }
};

/**
 * Get API key by key value
 */
export const getApiKeyByValue = async (key: string): Promise<ApiKeySelect | null> => {
    try {
        return await getApiKeyByKey(key);
    } catch (error) {
        console.error(`Error getting API key by value:`, error);
        return null;
    }
};

/**
 * Get all API keys for a user
 */
export const getUserApiKeys = async (userId: string, month: string): Promise<ApiKeyWithUsage[]> => {
    try {
        return await getApiKeysByUserId(userId, month);
    } catch (error) {
        console.error(`Error getting API keys for user ${userId}:`, error);
        return [];
    }
};

/**
 * Get API keys by name for a user
 */
export const getUserApiKeysByName = async (userId: string, name: string): Promise<ApiKeySelect[]> => {
    try {
        return await getApiKeysByName(userId, name);
    } catch (error) {
        console.error(`Error getting API keys by name for user ${userId}:`, error);
        return [];
    }
};

/**
 * Search API keys by name pattern for a user
 */
export const searchUserApiKeysByName = async (userId: string, namePattern: string): Promise<ApiKeySelect[]> => {
    try {
        return await searchApiKeysByName(userId, namePattern);
    } catch (error) {
        console.error(`Error searching API keys for user ${userId}:`, error);
        return [];
    }
};

/**
 * Get paginated API keys with filters
 */
export const getApiKeyList = async (options: {
    page?: number;
    limit?: number;
    userId?: string;
    sortBy?: 'createdAt' | 'lastUsedAt';
    sortOrder?: 'asc' | 'desc';
    nameSearch?: string;
} = {}): Promise<{
    apiKeys: ApiKeySelect[];
    totalCount: number;
}> => {
    try {
        const [apiKeys, totalCount] = await Promise.all([
            getApiKeys(options),
            getApiKeysCount(options.userId)
        ]);

        return { apiKeys, totalCount };
    } catch (error) {
        console.error('Error getting API key list:', error);
        return { apiKeys: [], totalCount: 0 };
    }
};

/**
 * Get recently used API keys
 */
export const getRecentlyUsedApiKeysList = async (limit: number = 10): Promise<ApiKeySelect[]> => {
    try {
        return await getRecentlyUsedApiKeys(limit);
    } catch (error) {
        console.error('Error getting recently used API keys:', error);
        return [];
    }
};

/**
 * Get most recent API key for a user
 */
export const getMostRecentApiKey = async (userId: string): Promise<ApiKeySelect | null> => {
    try {
        const userApiKeys = await getApiKeysByUserId(userId);
        return userApiKeys[0] || null;
    } catch (error) {
        console.error(`Error getting most recent API key for user ${userId}:`, error);
        return null;
    }
};

// ========== API Key Updates ==========

/**
 * Update API key by ID
 */
export const updateApiKey = async (
    id: number,
    data: Partial<Omit<Parameters<typeof updateApiKeyById>[1], never>>
): Promise<ApiKeySelect | null> => {
    try {
        const apiKey = await updateApiKeyById(id, data);

        if (apiKey) {
            console.log(`✅ Updated API key: ${id}`);
            await deleteApiKeyUsageCache(apiKey.key);
        }

        return apiKey;

    } catch (error) {
        console.error(`Error updating API key ${id}:`, error);
        return null;
    }
};

/**
 * Update API key request limit
 */
export const updateApiKeyRequest = async (id: number, requestLimit: number): Promise<ApiKeySelect | null> => {
    try {
        const apiKey = await updateApiKeyRequestLimit(id, requestLimit);

        if (apiKey) {
            console.log(`✅ Updated API key ${id} request limit`);

            // Invalidate cached usage data for this API key to ensure updated requestLimit is reflected
            if (cache.isCacheEnabled()) {
                try {
                    const cacheKey = API_KEY_CACHE_KEYS.apiKeyUsage(apiKey.key);
                    await cache.delete(cacheKey);
                    console.log(`🗑️ Invalidated cache for API key: ${apiKey.key.substring(0, 10)}...`);
                } catch (error) {
                    console.error('Cache DELETE API key usage error:', error);
                }
            }
        }

        return apiKey;

    } catch (error) {
        console.error(`Error updating API key ${id} request limit:`, error);
        return null;
    }
};

/**
 * Update API key name
 */
export const updateApiKeyNameById = async (id: number, name: string): Promise<ApiKeySelect | null> => {
    try {
        const apiKey = await updateApiKeyName(id, name);

        if (apiKey) {
            console.log(`✅ Updated API key ${id} name`);

            // Invalidate cached usage data when name changes (in case other cached data depends on it)
            if (cache.isCacheEnabled()) {
                try {
                    const cacheKey = API_KEY_CACHE_KEYS.apiKeyUsage(apiKey.key);
                    await cache.delete(cacheKey);
                    console.log(`🗑️ Invalidated cache for renamed API key: ${apiKey.key.substring(0, 10)}...`);
                } catch (error) {
                    console.error('Cache DELETE API key usage error:', error);
                }
            }
        }

        return apiKey;

    } catch (error) {
        console.error(`Error updating API key ${id} name:`, error);
        return null;
    }
};

/**
 * Update last used timestamp
 */
export const updateApiKeyLastUsedById = async (id: number): Promise<ApiKeySelect | null> => {
    try {
        const apiKey = await updateApiKeyLastUsed(id);

        if (apiKey) {
            console.log(`✅ Updated API key ${id} last used timestamp`);
        }

        return apiKey;

    } catch (error) {
        console.error(`Error updating API key ${id} last used timestamp:`, error);
        return null;
    }
};

/**
 * Update last used timestamp by key value
 */
export const updateApiKeyLastUsedByValue = async (key: string): Promise<ApiKeySelect | null> => {
    try {
        const apiKey = await updateApiKeyLastUsedByKey(key);

        if (apiKey) {
            console.log(`✅ Updated API key last used timestamp by key`);
        }

        return apiKey;

    } catch (error) {
        console.error('Error updating API key last used timestamp by key:', error);
        return null;
    }
};


// ========== API Key Deletion ==========

/**
 * Delete API key by ID
 */
export const deleteApiKey = async (id: number): Promise<ApiKeySelect | null> => {
    try {
        const apiKey = await deleteApiKeyById(id);

        if (apiKey) {
            console.log(`✅ Deleted API key: ${id}`);
            deleteApiKeyUsageCache(apiKey.key);
        }

        return apiKey;

    } catch (error) {
        console.error(`Error deleting API key ${id}:`, error);
        return null;
    }
};

/**
 * Delete API key by key value
 */
export const deleteApiKeyByValue = async (key: string): Promise<ApiKeySelect | null> => {
    try {
        const apiKey = await deleteApiKeyByKey(key);

        if (apiKey) {
            console.log(`✅ Deleted API key by value`);
        }

        return apiKey;

    } catch (error) {
        console.error('Error deleting API key by value:', error);
        return null;
    }
};

// ========== API Key Utilities ==========

/**
 * Check if API key exists
 */
export const checkApiKeyExists = async (key: string): Promise<boolean> => {
    try {
        return await apiKeyExists(key);
    } catch (error) {
        console.error('Error checking API key existence:', error);
        return false;
    }
};

/**
 * Check if API key exists and is valid
 */
export const validateApiKey = async (key: string): Promise<boolean> => {
    try {
        return await isApiKeyValid(key);
    } catch (error) {
        console.error('Error validating API key:', error);
        return false;
    }
};

// ========== API Key Usage Functions with Cache ==========

/**
 * Get API key usage by api-key with cache-first approach
 */
export const getApiKeyUsageByApiKeyWithCache = async (apiKey: string): Promise<ApiDetail | null> => {
    const data = await getApiKeyUsageFromCache(apiKey);
    if (data) return data;

    // Fallback to database
    try {
        const usage = await getApiKeyUsageByApiKey(apiKey);

        if (usage) {
            // Cache the usage data
            if (cache.isCacheEnabled()) {
                try {
                    const cacheKey = API_KEY_CACHE_KEYS.apiKeyUsage(apiKey);
                    await cache.set(cacheKey, usage, cacheTTL.USER_DATA);
                    console.log(`✅ Cached API key usage: ${apiKey.substring(0, 10)}...`);
                } catch (error) {
                    console.error('Cache SET API key usage error:', error);
                }
            }
        }

        return usage || null;

    } catch (error) {
        console.error('Database GET API key usage error:', error);
        return null;
    }
};

// ========== Cache Helper Functions ==========

/**
 * Delete API key usage cache
 */
export const deleteApiKeyUsageCache = async (apiKey: string): Promise<void> => {
    if (!cache.isCacheEnabled()) return;

    try {
        await cache.delete(API_KEY_CACHE_KEYS.apiKeyUsage(apiKey));
        console.log(`✅ Deleted API key usage cache: ${apiKey.substring(0, 10)}...`);
    } catch (error) {
        console.error('Cache DELETE API key usage error:', error);
    }
};

/**
 * Get API key usage from cache only (skip database)
 */
export const getApiKeyUsageFromCache = async (apiKey: string): Promise<{
    userId: string | null;
    apiMonthlyUsed: number;
    requestLimit: number | null;
    expiredAt: Date | null;
} | null> => {
    if (!cache.isCacheEnabled()) {
        return null;
    }

    try {
        const cacheKey = API_KEY_CACHE_KEYS.apiKeyUsage(apiKey);
        const cachedUsage = await cache.get(cacheKey) as {
            userId: string | null;
            apiMonthlyUsed: number;
            requestLimit: number | null;
            expiredAt: Date | null;
        } | null;
        return cachedUsage;
    } catch (error) {
        console.error('Cache GET API key usage error:', error);
        return null;
    }
};


/**
 * Update API key usage cache (useful when usage data changes)
 */
export const updateApiKeyUsageCache = async (apiKey: string, usage: ApiDetail): Promise<void> => {
    if (!cache.isCacheEnabled()) return;

    try {
        await cache.set(API_KEY_CACHE_KEYS.apiKeyUsage(apiKey), usage, cacheTTL.USER_DATA);
        console.log(`✅ Updated API key usage cache: ${apiKey.substring(0, 10)}...`);
    } catch (error) {
        console.error('Cache UPDATE API key usage error:', error);
    }
};
