import Redis from 'ioredis';

// Redis客户端配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  connectTimeout: 5000,
  commandTimeout: 3000,
  enableReadyCheck: true,
  family: 4,
  keepAlive: 30000,
  dropBufferSupport: false,
  retryDelayOnClusterDown: 300,
  // ✅ 补丁 1: 限制重连次数
  retryStrategy: (times: number) => {
    if (times > 5) {
      console.error('❌ Redis retry limit reached');
      return null; // 停止重连
    }
    return Math.min(times * 50, 2000);
  },
  ...(process.env.NODE_ENV === 'development' && {
    connectTimeout: 5000,
    commandTimeout: 3000,
  })
};

// ✅ 补丁 2: 使用全局变量防止热重载泄漏（仅开发环境）
declare global {
  var __redisClient: Redis | undefined;
  var __redisPromise: Promise<Redis> | undefined;
}

// 开发环境用全局变量，生产环境用模块变量
let redis: Redis | null = (process.env.NODE_ENV === 'development' ? global.__redisClient : null) || null;
let connectionPromise: Promise<Redis> | null = (process.env.NODE_ENV === 'development' ? global.__redisPromise : null) || null;

export async function getRedisClient(): Promise<Redis> {
  // 如果已经有实例，直接返回
  if (redis && redis.status === 'ready') {
    return redis;
  }

  // ✅ 补丁 3: 清理异常状态的连接
  if (redis && (redis.status === 'end' || redis.status === 'close')) {
    console.log('⚠️ Cleaning up dead Redis connection');
    redis = null;
    connectionPromise = null;
    if (process.env.NODE_ENV === 'development') {
      global.__redisClient = undefined;
      global.__redisPromise = undefined;
    }
  }

  // 如果正在连接中，等待连接完成
  if (connectionPromise) {
    return connectionPromise;
  }

  // 创建新连接
  connectionPromise = createRedisConnection();

  // ✅ 补丁 4: 开发环境保存到全局
  if (process.env.NODE_ENV === 'development') {
    global.__redisPromise = connectionPromise;
  }

  try {
    redis = await connectionPromise;

    // ✅ 补丁 5: 开发环境保存到全局
    if (process.env.NODE_ENV === 'development') {
      global.__redisClient = redis;
    }

    return redis;
  } catch (error) {
    connectionPromise = null;
    redis = null;
    if (process.env.NODE_ENV === 'development') {
      global.__redisPromise = undefined;
      global.__redisClient = undefined;
    }
    throw error;
  }
}

async function createRedisConnection(): Promise<Redis> {
  const client = new Redis(redisConfig);

  client.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  client.on('error', (err) => {
    console.error('❌ Redis error:', err.message);

    // ✅ 补丁 6: 连接数超限时停止重连
    if (err.message?.includes('max number of clients reached')) {
      console.log('⚠️ Redis max clients reached, disconnecting...');
      client.disconnect(false); // 立即断开，不重连
    }
  });

  client.on('close', () => {
    console.log('🔌 Redis connection closed');
    // ✅ 补丁 7: 关闭时清理引用
    if (redis === client) {
      redis = null;
      connectionPromise = null;
      if (process.env.NODE_ENV === 'development') {
        global.__redisClient = undefined;
        global.__redisPromise = undefined;
      }
    }
  });

  client.on('reconnecting', (delay: number) => {
    console.log(`🔄 Redis reconnecting in ${delay}ms...`);
  });

  try {
    await client.connect();
    return client;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    // ✅ 补丁 8: 失败时清理
    try {
      await client.quit();
    } catch {
      client.disconnect(false);
    }
    throw error;
  }
}

// ✅ 补丁 9: 改进关闭逻辑
export async function closeRedisConnection(): Promise<void> {
  const clientToClose = redis;

  // 先清空引用
  redis = null;
  connectionPromise = null;
  if (process.env.NODE_ENV === 'development') {
    global.__redisClient = undefined;
    global.__redisPromise = undefined;
  }

  if (clientToClose) {
    try {
      await clientToClose.quit();
    } catch (error) {
      console.error('Error closing Redis:', error);
      clientToClose.disconnect(false);
    }
  }
}

export async function checkRedisHealth(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('❌ Redis health check failed:', error);
    return false;
  }
}

// 缓存的键前缀
export const REDIS_KEYS = {
  USER_DATA: 'codei:user:data:',
  USER_SUBSCRIPTIONS: 'codei:user:subscriptions:',
  USER_USAGE: 'codei:user:usage:',
  ACTIVE_SUBSCRIPTION: 'codei:user:active_subscription:',
  API_RESPONSE: 'codei:api:response:',
  SESSION: 'codei:session:',
  USER_CACHE: 'codei:user:cache:', // 用户缓存键
  API_KEY_CACHE: 'codei:apikey:cache:', // API Key缓存键
};

// 缓存TTL常量（秒）
export const REDIS_TTL = {
  USER_DATA: 30 * 60,
  SUBSCRIPTIONS: 30 * 60,
  USAGE_DATA: 2 * 60,
  ACTIVE_SUBSCRIPTION: 3 * 60,
  API_RESPONSE: 3600 * 24,
  SESSION: 24 * 60 * 60,
  CUSTOMER_ID: 7 * 24 * 60 * 60,
  USER_CACHE: 15 * 60, // 用户缓存TTL: 15分钟
  API_KEY_CACHE: 15 * 60, // API Key缓存TTL: 15分钟
};
