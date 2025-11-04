import Stripe from 'stripe';
import { createPlan, getPlanByStripePriceId, updatePlanById } from '../db/queries';
import type { PlanInsert } from '../db/schema';

// Stripe 实例将在函数内部初始化
let stripe: Stripe | null = null;

/**
 * 获取 Stripe 实例
 */
function getStripe(): Stripe {
  if (!stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
    if (!apiKey) {
      throw new Error('Stripe API key not found. Please set STRIPE_SECRET_KEY or STRIPE_API_KEY environment variable.');
    }
    stripe = new Stripe(apiKey, {
      typescript: true
    });
  }
  return stripe;
}

/**
 * 转换 Stripe 价格到计划数据
 * 直接使用 Stripe 产品和价格的真实数据，无需硬编码配置
 */
function stripePriceToPlanData(
  product: Stripe.Product,
  price: Stripe.Price
): Omit<PlanInsert, 'createdAt'> {
  const amount = price.unit_amount || 0;
  const currency = price.currency || 'usd';
  const isRecurring = !!price.recurring;

  // 从产品元数据中获取配置信息
  const metadata = product.metadata || {};
  const priceMetadata = price.metadata || {};

  // 从 Stripe 产品中获取 token 限制和模型访问权限
  const requestLimit = parseInt(metadata.request_limit || '10000000');
  const modelAccess = metadata.model_access
    ? JSON.parse(metadata.model_access)
    : ['claude-sonnet-4.5'];

  // 从产品元数据或价格元数据中获取会员等级
  const membershipLevel = metadata.membership_level || priceMetadata.membership_level || 'lite';

  let actualInterval: string;
  let intervalDisplayName: string;
  let planDescription: string;
  let planName: string;

  const productName = product.name || 'Plan';

  if (isRecurring) {
    // 处理订阅计划
    const interval = price.recurring!.interval || 'month';
    const intervalCount = price.recurring!.interval_count || 1;

    // 根据 interval_count 确定实际的周期显示名称
    if (interval === 'month' && intervalCount === 3) {
      actualInterval = 'quarter';
      intervalDisplayName = 'Quarterly';
    } else if (interval === 'month' && intervalCount === 1) {
      actualInterval = 'month';
      intervalDisplayName = 'Monthly';
    } else if (interval === 'year' && intervalCount === 1) {
      actualInterval = 'year';
      intervalDisplayName = 'Yearly';
    } else {
      actualInterval = interval;
      intervalDisplayName = interval.charAt(0).toUpperCase() + interval.slice(1);
    }

    // 生成计划名称 - 使用产品名称 + 订阅周期
    planName = `${productName} (${intervalDisplayName})`;

    // 生成计划描述
    const currencySymbol = currency.toUpperCase() === 'USD' ? '$' : `${currency.toUpperCase()} `;
    const priceDisplay = (amount / 100).toFixed(2);
    planDescription = `${productName} - ${priceDisplay}${currencySymbol}/${intervalDisplayName.toLowerCase()}. ${requestLimit.toLocaleString()} tokens/month. Access to ${modelAccess.length} AI models.`;

  } else {
    // 处理非订阅计划（一次性付费）
    // 从元数据中获取月份信息来确定等效的interval
    const months = parseInt(priceMetadata.month || metadata.month || '1');

    if (months === 1) {
      actualInterval = 'month';
      intervalDisplayName = 'One-time Monthly';
    } else if (months === 3) {
      actualInterval = 'quarter';
      intervalDisplayName = 'One-time Quarterly';
    } else if (months === 12) {
      actualInterval = 'year';
      intervalDisplayName = 'One-time Yearly';
    } else {
      actualInterval = 'month';
      intervalDisplayName = `One-time ${months} months`;
    }

    // 生成计划名称 - 使用产品名称 + 一次性标识
    planName = `${productName} (${intervalDisplayName})`;

    // 生成计划描述
    const currencySymbol = currency.toUpperCase() === 'USD' ? '$' : `${currency.toUpperCase()} `;
    const priceDisplay = (amount / 100).toFixed(2);
    planDescription = `${productName} - One-time payment of ${priceDisplay}${currencySymbol}. ${requestLimit.toLocaleString()} tokens. Access to ${modelAccess.length} AI models.`;
  }

  return {
    id: price.id, // 使用 Stripe price ID 作为主键
    membershipLevel,
    name: planName,
    description: planDescription,
    stripeProductId: product.id,
    stripePriceId: price.id,
    amount,
    currency: currency.toUpperCase(),
    isRecurring,
    interval: actualInterval,
    requestLimit,
    modelAccess,
    isActive: product.active && price.active,
  };
}

/**
 * 同步单个产品和其价格
 */
async function syncProductAndPrices(product: Stripe.Product): Promise<void> {
  console.log(`\n🔄 Syncing product: ${product.name} (${product.id})`);

  // 显示产品元数据信息
  const metadata = product.metadata || {};
  console.log(`📋 Product metadata: request_limit=${metadata.request_limit}, model_access=${metadata.model_access}, membership_level=${metadata.membership_level || 'not set'}`);

  try {
    // 获取产品的所有活跃价格
    const prices = await getStripe().prices.list({
      product: product.id,
      active: true,
      expand: ['data.currency_options'],
    });

    console.log(`📊 Found ${prices.data.length} active prices for this product`);

    for (const price of prices.data) {
      if (!price.active) {
        console.log(`⏭️  Skipping inactive price: ${price.id}`);
        continue;
      }

      // Process both recurring and non-recurring plans
      const isRecurring = !!price.recurring;
      console.log(`💰 Processing ${isRecurring ? 'recurring' : 'non-recurring'} price: ${price.id}`);

      const amount = (price.unit_amount || 0) / 100;
      const recurring = price.recurring;
      const transformUsage = (price as any).transform_usage;
      const priceMetadata = price.metadata || {};

      console.log(`💰 Processing price: ${price.id}`);
      console.log(`   Type: ${recurring ? 'Recurring' : 'One-time payment'}`);

      if (recurring) {
        console.log(`   Interval: ${recurring.interval} (count: ${recurring.interval_count || 1})`);
      } else {
        const months = parseInt(priceMetadata.month || '1');
        console.log(`   Duration: ${months} month(s) (from metadata)`);
      }

      console.log(`   Amount: ${price.currency.toUpperCase()} ${amount}`);
      console.log(`   Transform Usage: ${transformUsage ? `${transformUsage.divide_by} ${transformUsage.round}` : 'none'}`);
      console.log(`   ID: ${price.id.slice(-8)}`);
      console.log(`   Price metadata: membership_level=${priceMetadata.membership_level || 'not set'}`);

      const planData = stripePriceToPlanData(product, price);

      console.log(`📋 Plan data: membership_level=${planData.membershipLevel}, name=${planData.name}`);
      console.log(`💰 Plan ID: ${planData.id} (using Stripe price ID)`);
      console.log(`💎 Active: ${planData.isActive}, Recurring: ${planData.isRecurring}`);
      console.log(`💱 Currency: ${planData.currency}, Interval: ${planData.interval}`);

      // 检查是否已存在该计划（通过 stripePriceId，现在就是 plan.id）
      const existingPlan = await getPlanByStripePriceId(price.id);

      if (existingPlan) {
        console.log(`✏️  Updating existing plan: ${existingPlan.name}`);
        // 需要通过 ID 更新，包含所有新字段
        const updateData = {
          membershipLevel: planData.membershipLevel,
          name: planData.name,
          description: planData.description,
          stripeProductId: planData.stripeProductId,
          stripePriceId: planData.stripePriceId,
          amount: planData.amount,
          currency: planData.currency,
          isRecurring: planData.isRecurring,
          interval: planData.interval,
          requestLimit: planData.requestLimit,
          modelAccess: planData.modelAccess,
          isActive: planData.isActive,
        };

        // 使用 updatePlanById
        await updatePlanById(planData.id, updateData);
        console.log(`✅ Updated plan: ${planData.name} (ID: ${planData.id})`);
      } else {
        console.log(`➕ Creating new plan: ${planData.name} (ID: ${planData.id})`);
        await createPlan(planData);
        console.log(`✅ Created plan: ${planData.name} (ID: ${planData.id})`);
      }
    }

    // 由于我们移除了 stripeProductId 的唯一约束，这里暂时跳过清理逻辑
    // TODO: 添加一个新函数来根据 stripeProductId 查找所有计划
    console.log(`📝 Skipped cleanup logic (requires getPlansByStripeProductId function)`);

  } catch (error) {
    console.error(`❌ Error syncing product ${product.id}:`, error);
    throw error;
  }
}

/**
 * 同步所有 Stripe 产品和价格
 */
async function syncAllStripePlans(): Promise<void> {
  console.log('🚀 Starting Stripe plans synchronization...');
  console.log('=====================================');

  try {
    // 获取所有活跃产品
    const products = await getStripe().products.list({
      active: true,
      limit: 100,
    });

    console.log(`📦 Found ${products.data.length} active products`);

    if (products.data.length === 0) {
      console.log('⚠️  No active products found in Stripe');
      return;
    }

    // 同步每个产品
    for (const product of products.data) {
      await syncProductAndPrices(product);
    }

    console.log('\n=====================================');
    console.log('✅ Stripe plans synchronization completed successfully!');

    // 输出统计信息
    const totalPlans = products.data.reduce((acc: number, product) => {
      return acc + (parseInt(product.metadata?.priceCount || '0') || 0); // 如果你在产品元数据中存储了价格数量
    }, 0);

    console.log(`📈 Processed ${products.data.length} products with approximately ${totalPlans} price points`);
    console.log('🏆 Using Stripe price IDs as primary keys');
    console.log('📋 Membership levels extracted from product or price metadata');

    // Explicitly exit the process after successful completion
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Stripe plans synchronization failed:', error);
    process.exit(1);
  }
}

/**
 * 同步单个产品（用于测试或特定产品更新）
 */
async function syncSingleProduct(productId: string): Promise<void> {
  console.log(`🚀 Starting synchronization for product: ${productId}`);

  try {
    const product = await getStripe().products.retrieve(productId);
    await syncProductAndPrices(product);
    console.log('✅ Single product synchronization completed!');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error syncing product ${productId}:`, error);
    process.exit(1);
  }
}

/**
 * 检查 Stripe 配置
 */
function checkStripeConfig(): void {
  // 检查数据库连接
  if (!process.env.DATABASE_URL) {
    throw new Error('Missing required environment variable: DATABASE_URL');
  }

  // 检查 Stripe API Key (支持两种命名)
  const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
  if (!stripeKey) {
    throw new Error('Missing required environment variable: STRIPE_SECRET_KEY or STRIPE_API_KEY');
  }

  console.log('✅ Environment variables configured');
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  console.log('🔍 Stripe Plans Synchronization Script');
  console.log('=====================================');

  // 检查配置
  checkStripeConfig();

  // 获取命令行参数
  const args = process.argv.slice(2);
  const productId = args[0];

  try {
    if (productId) {
      // 同步单个产品
      await syncSingleProduct(productId);
    } else {
      // 同步所有产品
      await syncAllStripePlans();
    }
  } catch (error) {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

export {
  syncAllStripePlans,
  syncSingleProduct,
  syncProductAndPrices,
  stripePriceToPlanData,
};