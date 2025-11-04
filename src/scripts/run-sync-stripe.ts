#!/usr/bin/env ts-node

/**
 * Stripe 计划同步脚本执行器
 *
 * 使用方法:
 * npm run sync:stripe                    # 同步所有产品和价格
 * npm run sync:stripe <product_id>       # 同步特定产品
 *
 * 示例:
 * npm run sync:stripe
 * npm run sync:stripe prod_1234567890
 */

import { syncAllStripePlans, syncSingleProduct } from './sync-stripe-plans';

async function main() {
  const productId = process.argv[2];

  console.log('🚀 Starting Stripe plans synchronization...');
  console.log(`📋 Mode: ${productId ? 'Single Product' : 'All Products'}`);

  if (productId) {
    console.log(`🎯 Target Product ID: ${productId}`);
  }

  try {
    if (productId) {
      await syncSingleProduct(productId);
    } else {
      await syncAllStripePlans();
    }

    console.log('\n🎉 Synchronization completed successfully!');
    console.log('💡 Tip: Check your database to verify the plans were created/updated correctly.');

  } catch (error) {
    console.error('\n💥 Synchronization failed!');
    console.error('Please check:');
    console.error('1. Your STRIPE_SECRET_KEY environment variable');
    console.error('2. Your DATABASE_URL environment variable');
    console.error('3. Your Stripe products have the correct metadata');
    console.error('4. Your database connection is working');

    process.exit(1);
  }
}

main();