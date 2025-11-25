#!/usr/bin/env node

// Script to clear active non-recurring plans cache
// Usage: node scripts/clear-cache.js
const planCacheKeys = {
  plansByType: (type) => `codei:plans:by_type:${type}`,
  frontpagePlans: () => 'codei:plans:frontpage',
};

async function clearActivePlansCache() {
  if (!cache.isCacheEnabled()) {
    console.log('Cache is not enabled');
    return;
  }

  try {

    await Promise.all([
      cache.delete(planCacheKeys.frontpagePlans()),
      cache.delete(planCacheKeys.plansByType("extra")),
      cache.delete(planCacheKeys.plansByType("pay")),
      cache.delete(planCacheKeys.plansByType("renew"))]
    )

    console.log('✅ Successfully cleared active non-recurring plans cache');
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
}

// Import required modules and run
import { cache, cacheKeys } from '../src/lib/cache.js';

clearActivePlansCache();