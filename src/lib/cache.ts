import { redisMonitor } from './redis-monitor';
import Redis from 'ioredis';
import { getRedisClient, REDIS_KEYS, REDIS_TTL, checkRedisHealth } from './redis';

// Redis缓存实现
class RedisCache {
  private defaultTTL = 30 * 60; // 5分钟默认过期时间（秒）
  private isEnabled = true;

  constructor() {
    // 检查Redis连接状态
    this.checkConnection();

    // 在生产环境中启动 Redis 监控 (只有Redis可用时)
    if (process.env.NODE_ENV === 'production') {
      // 延迟启动监控，避免与初始化冲突
      setTimeout(() => {
        redisMonitor.startMonitoring(60000); // 每分钟检查一次
      }, 10000);
    }
  }

  private async checkConnection() {
    try {

      const isHealthy = await checkRedisHealth();
      this.isEnabled = isHealthy;
      if (!isHealthy) {
        console.warn('Redis is not available, falling back to no-cache mode');

        // 如果连接失败，延迟重试，使用指数退避
        const retryDelay = Math.min(30000, 5000 * Math.pow(2, this.retryCount));
        setTimeout(() => {
          this.retryCount++;
          this.checkConnection();
        }, retryDelay);
      } else {
        // 连接成功，重置重试计数
        this.retryCount = 0;
      }
    } catch (error) {
      console.error('Redis health check failed:', error);
      this.isEnabled = false;

      // 如果是连接数超限错误，等待更长时间再重试
      const isMaxClientsError = error instanceof Error &&
        (error.message.includes('max number of clients reached') ||
          error.message.includes('ECONNRESET'));

      const retryDelay = isMaxClientsError ? 30000 : Math.min(30000, 5000 * Math.pow(2, this.retryCount));

      setTimeout(() => {
        this.retryCount++;
        this.checkConnection();
      }, retryDelay);
    }
  }

  private retryCount = 0;

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    if (!this.isEnabled) return;

    let client: Redis | null = null;
    try {
      client = await getRedisClient();
      const serializedData = JSON.stringify(data);
      const expiry = ttl || this.defaultTTL;

      await client.setex(key, expiry, serializedData);
    } catch (error) {
      console.error('Cache SET error:', error);

      // 如果是连接数超限错误，暂时禁用缓存一段时间
      if (error instanceof Error &&
        (error.message.includes('max number of clients reached') ||
          error.message.includes('ECONNRESET'))) {
        console.log('Redis connection limit reached, temporarily disabling cache');
        this.isEnabled = false;

        // 30秒后重新尝试连接
        setTimeout(() => {
          this.retryCount = 0;
          this.checkConnection();
        }, 30000);
      } else {
        // 其他错误也暂时禁用缓存
        this.isEnabled = false;
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled) return null;

    let client: Redis | null = null;
    try {
      client = await getRedisClient();
      const data = await client.get(key);

      if (data) {
        return JSON.parse(data) as T;
      }

      return null;
    } catch (error) {
      console.error('Cache GET error:', error);

      // 如果是连接数超限错误，暂时禁用缓存一段时间
      if (error instanceof Error &&
        (error.message.includes('max number of clients reached') ||
          error.message.includes('ECONNRESET'))) {
        console.log('Redis connection limit reached, temporarily disabling cache');
        this.isEnabled = false;

        // 30秒后重新尝试连接
        setTimeout(() => {
          this.retryCount = 0;
          this.checkConnection();
        }, 30000);
      } else {
        // 其他错误也暂时禁用缓存
        this.isEnabled = false;
      }

      return null;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const client = await getRedisClient();
      const result = await client.del(key);
      if (result > 0) {
        console.log(`Cache DELETE: ${key}`);
      }
    } catch (error) {
      console.error('Cache DELETE error:', error);
    }
  }

  async clear(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const client = await getRedisClient();
      await client.flushdb();
      console.log('Cache CLEAR: all keys');
    } catch (error) {
      console.error('Cache CLEAR error:', error);
    }
  }

  async clearPattern(pattern: string): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const client = await getRedisClient();
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
        console.log(`Cache CLEAR_PATTERN: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      console.error('Cache CLEAR_PATTERN error:', error);
    }
  }

  // 获取缓存统计信息
  async getStats(): Promise<{
    isEnabled: boolean;
    keyCount: number;
    memoryUsage?: string;
    info?: string;
  }> {
    if (!this.isEnabled) {
      return { isEnabled: false, keyCount: 0 };
    }

    try {
      const client = await getRedisClient();
      const info = await client.info('memory');
      const keyCount = await client.dbsize();

      return {
        isEnabled: true,
        keyCount,
        memoryUsage: this.parseMemoryUsage(info),
        info
      };
    } catch (error) {
      console.error('Cache STATS error:', error);
      return { isEnabled: false, keyCount: 0 };
    }
  }

  private parseMemoryUsage(info: string): string {
    const match = info.match(/used_memory_human:(.+)/);
    return match ? match[1].trim() : 'unknown';
  }

  // 检查缓存是否可用
  isCacheEnabled(): boolean {
    return this.isEnabled;
  }

  // 重新启用缓存（在恢复连接后）
  async reenableCache(): Promise<void> {
    await this.checkConnection();
  }

}

// 创建全局缓存实例
export const cache = new RedisCache();

// 缓存键生成器
export const cacheKeys = {
  userData: (auth0Id: string) => `${REDIS_KEYS.USER_DATA}${auth0Id}`,
  userSubscriptions: (auth0Id: string) => `${REDIS_KEYS.USER_SUBSCRIPTIONS}${auth0Id}`,
  userUsage: (auth0Id: string, period?: string) => `${REDIS_KEYS.USER_USAGE}${auth0Id}:${period || 'current'}`,
  activeSubscription: (auth0Id: string) => `${REDIS_KEYS.ACTIVE_SUBSCRIPTION}${auth0Id}`,
  processedPlans: () => `${REDIS_KEYS.API_RESPONSE}processed_plans`,
  activeNonRecurringPlans: () => `${REDIS_KEYS.API_RESPONSE}active_non_recurring_plans`,
  allActivePlans: () => `${REDIS_KEYS.API_RESPONSE}all_active_plans`,
  customerId: (auth0Id: string) => `${REDIS_KEYS.USER_DATA}customer_id:${auth0Id}`,
  userApiKeys: (auth0Id: string) => `${REDIS_KEYS.USER_DATA}api_keys:${auth0Id}`,
  plan: (planId: string) => `${REDIS_KEYS.USER_DATA}plan:${planId}`,
  userCache: (auth0Id: string) => `${REDIS_KEYS.USER_CACHE}${auth0Id}`, // 用户缓存键
  apiKeyCache: (apiKey: string) => `${REDIS_KEYS.API_KEY_CACHE}${apiKey}`, // API Key缓存键
};

// 缓存TTL常量（秒）
export const cacheTTL = {
  USER_DATA: REDIS_TTL.USER_DATA,
  SUBSCRIPTIONS: REDIS_TTL.SUBSCRIPTIONS,
  USAGE_DATA: REDIS_TTL.USAGE_DATA,
  ACTIVE_SUBSCRIPTION: REDIS_TTL.ACTIVE_SUBSCRIPTION,
  API_RESPONSE: REDIS_TTL.API_RESPONSE,
  CUSTOMER_ID: REDIS_TTL.CUSTOMER_ID,
  PLAN: 24 * 60 * 60,  // 1天 (24小时)
  USER_CACHE: REDIS_TTL.USER_CACHE, // 用户缓存TTL: 15分钟
  API_KEY_CACHE: REDIS_TTL.API_KEY_CACHE // API Key缓存TTL: 15分钟
};