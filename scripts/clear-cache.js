#!/usr/bin/env node

// Script to clear active non-recurring plans cache
// Usage: node scripts/clear-cache.js

async function clearActivePlansCache() {
  if (!cache.isCacheEnabled()) {
    console.log('Cache is not enabled');
    return;
  }

  try {

    await Promise.all([
      cache.delete(cacheKeys.allActivePlans()),
      cache.delete(cacheKeys.activeNonRecurringPlans()),
      cache.delete(cacheKeys.processedPlans())]
    )

    console.log('✅ Successfully cleared active non-recurring plans cache');
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
}

// Import required modules and run
import { cache, cacheKeys } from '../src/lib/cache.js';

clearActivePlansCache();