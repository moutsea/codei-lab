import { preloadAllPlans } from '@/lib/services/plan_service'
import { cache } from '@/lib/cache'

/**
 * 应用启动时的缓存初始化
 * 预加载常用数据到缓存中，提升应用性能
 */
export async function initializeCache() {
  console.log('🔧 Initializing application cache...');

  // 预加载所有 plans 数据
  await preloadAllPlans();

  console.log('✅ Cache initialization completed');
}

/**
 * 生产环境缓存初始化（带防止重复初始化的逻辑）
 * 用于在生产环境下按需初始化缓存
 */
export async function initializeProductionCache(forceRefresh: boolean = false): Promise<boolean> {
  const initCacheKey = 'cache-initialized';

  try {
    // 如果不是强制刷新，先检查是否已经初始化过
    if (!forceRefresh) {
      const isInitialized = await cache.get(initCacheKey);
      if (isInitialized) {
        console.log('ℹ️ Production cache already initialized');
        return true;
      }
    }

    console.log('🚀 Production: Initializing cache...');

    // 初始化缓存
    await initializeCache();

    // 设置初始化标记（24小时）
    await cache.set(initCacheKey, true, 24 * 60 * 60);

    console.log('✅ Production cache initialization completed');
    return true;

  } catch (error) {
    console.error('❌ Production cache initialization failed:', error);
    return false;
  }
}

/**
 * 手动缓存初始化函数，用于管理员工具
 */
export async function manualCacheInit() {
  try {
    console.log('🔧 Manual cache initialization started...');

    const success = await initializeProductionCache(true); // 强制刷新
    if (success) {
      // 重置开发环境的初始化标记（仅在浏览器环境中）
      const isBrowser = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
      if (process.env.NODE_ENV === 'development' && isBrowser) {
        sessionStorage.setItem('cache-initialized', 'true');
      }
      console.log('🎉 Manual cache initialization completed successfully');
    } else {
      console.error('❌ Manual cache initialization failed');
    }
  } catch (error) {
    console.error('❌ Manual cache initialization failed:', error);
  }
}

// 开发环境下自动初始化缓存
if (process.env.NODE_ENV === 'development') {
  // 延迟执行，避免影响应用启动
  setTimeout(async () => {
    try {
      // 检查是否在浏览器环境中以及缓存是否已经初始化过
      const isBrowser = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
      const isInitialized = isBrowser ? sessionStorage.getItem('cache-initialized') : null;

      if (!isInitialized) {
        console.log('🚀 Development environment: Auto-initializing cache...');
        await initializeCache();

        if (isBrowser) {
          sessionStorage.setItem('cache-initialized', 'true');
          console.log('✅ Cache initialization marked as completed');
        }
      } else {
        console.log('ℹ️ Development cache already initialized, skipping auto-initialization');
      }
    } catch (error) {
      console.error('❌ Auto cache initialization failed:', error);
    }
  }, 3000); // 3秒延迟
}