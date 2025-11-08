import { db, DbClient } from "../index";
import { apiKeys, monthlyApiUsage } from "../schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { ApiKeyInsert, ApiKeySelect } from "@/types";
import { randomBytes } from 'crypto';
import type { ApiKeyWithUsage, ApiDetail } from "@/types/db";
// ========== Create Operations ==========

/**
 * Create a new API key for a user
 */
export async function createApiKey(data: Omit<ApiKeyInsert, 'id' | 'createdAt' | 'lastUsedAt'>) {
  const [apiKey] = await db().insert(apiKeys).values({
    ...data,
    createdAt: new Date(),
    lastUsedAt: null,
  }).returning();
  return apiKey;
}

/**
 * Generate and create a new API key with default quota and optional expiration
 */
export async function generateApiKey(userId: string, name: string, quota: string | null = "100000", expiredAt?: Date | null): Promise<ApiKeySelect> {
  const key = generateRandomApiKey();
  return await createApiKey({ userId, name, key, quota, expiredAt });
}

// ========== Read Operations ==========

/**
 * Get API key by ID
 */
export async function getApiKeyById(id: number): Promise<ApiKeySelect | null> {
  const [apiKey] = await db().select().from(apiKeys).where(eq(apiKeys.id, id)).limit(1);
  return apiKey || null;
}

/**
 * Get API key by key value
 */
export async function getApiKeyByKey(key: string): Promise<ApiKeySelect | null> {
  const [apiKey] = await db()
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.key, key))
    .limit(1);
  return apiKey || null;
}

/**
 * Get API keys by name for a user
 */
export async function getApiKeysByName(userId: string, name: string): Promise<ApiKeySelect[]> {
  return await db()
    .select()
    .from(apiKeys)
    .where(and(
      eq(apiKeys.userId, userId),
      eq(apiKeys.name, name)
    ))
    .orderBy(desc(apiKeys.createdAt));
}

/**
 * Search API keys by name pattern for a user
 */
export async function searchApiKeysByName(userId: string, namePattern: string): Promise<ApiKeySelect[]> {
  return await db()
    .select()
    .from(apiKeys)
    .where(and(
      eq(apiKeys.userId, userId),
      sql`${apiKeys.name} ILIKE ${`%${namePattern}%`}`
    ))
    .orderBy(desc(apiKeys.createdAt));
}

/**
 * Get all API keys for a user with current month usage
 */
export async function getApiKeysByUserId(userId: string, currentMonth?: string): Promise<ApiKeyWithUsage[]> {
  const month = currentMonth || new Date().toISOString().slice(0, 7); // YYYY-MM format

  return await db()
    .select({
      id: apiKeys.id,
      userId: apiKeys.userId,
      name: apiKeys.name,
      key: apiKeys.key,
      quota: apiKeys.quota,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
      expiredAt: apiKeys.expiredAt,
      // Add current month usage as a calculated field
      currentMonthUsage: sql<number>`COALESCE(${monthlyApiUsage.inputTokens} + ${monthlyApiUsage.cachedTokens} + ${monthlyApiUsage.outputTokens}, 0)`.mapWith(Number)
    })
    .from(apiKeys)
    .leftJoin(monthlyApiUsage, and(
      eq(apiKeys.key, monthlyApiUsage.apikey),
      eq(monthlyApiUsage.month, month)
    ))
    .where(eq(apiKeys.userId, userId))
    .orderBy(desc(apiKeys.createdAt));
}

/**
 * Get all API keys with pagination
 */
export async function getApiKeys(options: {
  page?: number;
  limit?: number;
  userId?: string;
  sortBy?: 'createdAt' | 'lastUsedAt';
  sortOrder?: 'asc' | 'desc';
  nameSearch?: string;
} = {}) {
  const {
    page = 1,
    limit = 20,
    userId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    nameSearch
  } = options;

  const offset = (page - 1) * limit;

  const whereConditions = [];

  // Add user filter
  if (userId !== undefined) {
    whereConditions.push(eq(apiKeys.userId, userId));
  }

  // Add name search filter
  if (nameSearch) {
    whereConditions.push(sql`${apiKeys.name} ILIKE ${`%${nameSearch}%`}`);
  }

  // Add sorting
  const sortColumn = sortBy === 'lastUsedAt' ? apiKeys.lastUsedAt : apiKeys.createdAt;
  const sortDirection = sortOrder === 'asc' ? sql`${sortColumn} ASC` : sql`${sortColumn} DESC`;

  // Build and execute query
  const baseQuery = db().select().from(apiKeys);
  const withFilters = whereConditions.length > 0
    ? baseQuery.where(and(...whereConditions))
    : baseQuery;

  return await withFilters
    .orderBy(sortDirection)
    .limit(limit)
    .offset(offset);
}

/**
 * Get recently used API keys
 */
export async function getRecentlyUsedApiKeys(limit: number = 10): Promise<ApiKeySelect[]> {
  return await db()
    .select()
    .from(apiKeys)
    .where(sql`${apiKeys.lastUsedAt} IS NOT NULL`)
    .orderBy(desc(apiKeys.lastUsedAt))
    .limit(limit);
}

/**
 * Get API keys count
 */
export async function getApiKeysCount(userId?: string): Promise<number> {
  const whereConditions = [];

  // Add user filter
  if (userId !== undefined) {
    whereConditions.push(eq(apiKeys.userId, userId));
  }

  const baseQuery = db().select({ count: sql<number>`count(*)` }).from(apiKeys);
  const finalQuery = whereConditions.length > 0
    ? baseQuery.where(and(...whereConditions))
    : baseQuery;

  const [result] = await finalQuery;
  return result.count;
}


// ========== Update Operations ==========

/**
 * Update API key by ID
 */
export async function updateApiKeyById(
  id: number,
  data: Partial<Omit<ApiKeyInsert, 'id' | 'createdAt'>>
): Promise<ApiKeySelect | null> {
  const [apiKey] = await db()
    .update(apiKeys)
    .set(data)
    .where(eq(apiKeys.id, id))
    .returning();
  return apiKey || null;
}

/**
 * Update API key by Key
 */
export async function updateApiKeyByKey(
  key: string,
  data: Partial<Omit<ApiKeyInsert, 'id' | 'createdAt'>>,
  dbInstance: DbClient = db()
): Promise<ApiKeySelect | null> {
  const [apiKey] = await dbInstance
    .update(apiKeys)
    .set(data)
    .where(eq(apiKeys.key, key))
    .returning();
  return apiKey || null;
}

/**
 * Update API key quota
 */
export async function updateApiKeyQuota(id: number, quota: string): Promise<ApiKeySelect | null> {
  const [apiKey] = await db()
    .update(apiKeys)
    .set({ quota })
    .where(eq(apiKeys.id, id))
    .returning();
  return apiKey || null;
}

/**
 * Update API key name
 */
export async function updateApiKeyName(id: number, name: string): Promise<ApiKeySelect | null> {
  const [apiKey] = await db()
    .update(apiKeys)
    .set({ name })
    .where(eq(apiKeys.id, id))
    .returning();
  return apiKey || null;
}

/**
 * Update last used timestamp
 */
export async function updateApiKeyLastUsed(id: number): Promise<ApiKeySelect | null> {
  const [apiKey] = await db()
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, id))
    .returning();
  return apiKey || null;
}

/**
 * Update last used timestamp by key value
 */
export async function updateApiKeyLastUsedByKey(key: string): Promise<ApiKeySelect | null> {
  const [apiKey] = await db()
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.key, key))
    .returning();
  return apiKey || null;
}

/**
 * Create API key with custom name, key, quota, and optional expiration
 */
export async function createApiKeyWithName(
  userId: string,
  name: string,
  key?: string,
  quota: string = "100000",
  expiredAt?: Date | null
): Promise<ApiKeySelect> {
  const finalKey = key || generateRandomApiKey();
  return await createApiKey({ userId, name, key: finalKey, quota, expiredAt });
}

// ========== Delete Operations ==========

/**
 * Delete API key by ID
 */
export async function deleteApiKeyById(id: number): Promise<ApiKeySelect | null> {
  const [apiKey] = await db()
    .delete(apiKeys)
    .where(eq(apiKeys.id, id))
    .returning();
  return apiKey || null;
}

/**
 * Delete API key by key value
 */
export async function deleteApiKeyByKey(key: string): Promise<ApiKeySelect | null> {
  const [apiKey] = await db()
    .delete(apiKeys)
    .where(eq(apiKeys.key, key))
    .returning();
  return apiKey || null;
}


// ========== Utility Functions ==========

/**
 * Check if API key exists
 */
export async function apiKeyExists(key: string): Promise<boolean> {
  const [result] = await db()
    .select({ exists: sql<boolean>`true` })
    .from(apiKeys)
    .where(eq(apiKeys.key, key))
    .limit(1);

  return !!result;
}

/**
 * Check if API key exists and is not expired
 */
export async function isApiKeyValid(key: string): Promise<boolean> {
  const now = new Date();
  const [apiKey] = await db()
    .select({
      expiredAt: apiKeys.expiredAt
    })
    .from(apiKeys)
    .where(eq(apiKeys.key, key))
    .limit(1);

  // Check if the key is expired
  if (!apiKey || (apiKey.expiredAt && apiKey.expiredAt < now)) {
    return false;
  }

  return true;
}

/**
 * Check if an API key is expired
 */
export async function isApiKeyExpired(key: string): Promise<boolean> {
  const now = new Date();
  const [apiKey] = await db()
    .select({ expiredAt: apiKeys.expiredAt })
    .from(apiKeys)
    .where(eq(apiKeys.key, key))
    .limit(1);

  if (!apiKey) {
    return true; // Non-existent keys are considered expired
  }

  return apiKey.expiredAt ? apiKey.expiredAt < now : false;
}

/**
 * Generate a random API key
 */
function generateRandomApiKey(length: number = 32): string {
  const buffer = randomBytes(length);
  const result = buffer.toString('base64').slice(0, length); // 通过 base64 编码获得随机字符
  return `sk-proj-${result}`;
}

// ========== API Key Usage and Limit Functions ==========

/**
 * Get API key usage and limit details by api-key
 * Returns userId, apiMonthlyUsed, quota, and quotaUsed for a given api-key
 */
export async function getApiKeyUsageByApiKey(apiKey: string): Promise<ApiDetail | null> {
  try {

    const apiLastUsage = db()
      .select({
        apiKey: monthlyApiUsage.apikey,
        month: monthlyApiUsage.month,
        inputTokens: monthlyApiUsage.inputTokens,
        cachedTokens: monthlyApiUsage.cachedTokens,
        outputTokens: monthlyApiUsage.outputTokens,
        quotaUsed: monthlyApiUsage.quotaUsed,
      })
      .from(monthlyApiUsage)
      .where(eq(monthlyApiUsage.apikey, apiKey))
      .orderBy(desc(monthlyApiUsage.month))
      .limit(1)
      .as("apiLastUsage");

    const result = await db()
      .select({
        userId: apiKeys.userId,
        quota: apiKeys.quota,
        apiMonthlyUsed: sql<number>`COALESCE(${apiLastUsage.inputTokens}, 0) + COALESCE(${apiLastUsage.cachedTokens}, 0) + COALESCE(${apiLastUsage.outputTokens}, 0)`,
        quotaUsed: sql<string>`COALESCE(${apiLastUsage.quotaUsed}, '0')`,
        month: apiLastUsage.month,
        expiredAt: apiKeys.expiredAt
      })
      .from(apiKeys)
      .leftJoin(apiLastUsage,
        eq(apiKeys.key, apiLastUsage.apiKey)
      )
      .where(eq(apiKeys.key, apiKey))
      .limit(1);

    const row = result[0];
    if (!row) {
      return null;
    }

    return {
      userId: row.userId || null,
      apiMonthlyUsed: row.apiMonthlyUsed || 0,
      quota: row.quota || null,
      quotaUsed: row.quotaUsed,
      month: row.month || null,
      expiredAt: row.expiredAt || null
    };

  } catch (error) {
    console.error('Error getting API key usage:', error);
    return null;
  }
}