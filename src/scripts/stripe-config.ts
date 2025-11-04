/**
 * Stripe 产品配置
 *
 * 这个文件定义了如何将 Stripe 产品映射到数据库计划
 *
 * 在 Stripe Dashboard 中，确保你的产品包含以下元数据：
 * - type: "basic" | "pro" | "team" (必需)
 * - name: 产品显示名称 (可选，会自动生成)
 * - description: 产品描述 (可选，会自动生成)
 */

export interface ProductConfig {
  requestLimit: number;        // Token 限制数量
  modelAccess: string[];       // 可访问的模型列表
  displayName?: string;        // 显示名称 (可选)
  description?: string;        // 描述 (可选)
}

export const PRODUCT_CONFIGS: Record<string, ProductConfig> = {
  // 基础版 - 适合个人用户和轻度使用
  basic: {
    requestLimit: 10000000,    // 1000万 tokens
    modelAccess: ['claude-3-haiku', 'claude-3-sonnet'],
    displayName: 'Basic',
    description: 'Perfect for individuals and light usage',
  },

  // 专业版 - 适合专业开发者和重度使用
  pro: {
    requestLimit: 50000000,    // 5000万 tokens
    modelAccess: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus'],
    displayName: 'Pro',
    description: 'Ideal for professional developers and heavy usage',
  },

  // 团队版 - 适合团队和企业用户
  team: {
    requestLimit: 200000000,   // 2亿 tokens
    modelAccess: [
      'claude-3-haiku',
      'claude-3-sonnet',
      'claude-3-opus',
      'claude-3.5-sonnet'
    ],
    displayName: 'Team',
    description: 'Best for teams and enterprise usage',
  },
};

// 产品类型显示名称映射
export const PRODUCT_NAMES: Record<keyof typeof PRODUCT_CONFIGS, string> = {
  basic: 'Basic',
  pro: 'Pro',
  team: 'Team',
};

// 订阅周期显示名称
export const INTERVAL_NAMES: Record<string, string> = {
  month: 'Monthly',
  quarter: 'Quarterly',
  year: 'Yearly',
  week: 'Weekly',
  day: 'Daily',
};

// 获取产品类型
export function getProductType(productType: string): keyof typeof PRODUCT_CONFIGS {
  const validTypes = Object.keys(PRODUCT_CONFIGS) as Array<keyof typeof PRODUCT_CONFIGS>;

  if (validTypes.includes(productType as keyof typeof PRODUCT_CONFIGS)) {
    return productType as keyof typeof PRODUCT_CONFIGS;
  }

  // 默认返回基础版
  console.warn(`Unknown product type: ${productType}, defaulting to 'basic'`);
  return 'basic';
}

// 生成计划名称
export function generatePlanName(
  productType: keyof typeof PRODUCT_CONFIGS,
  interval: string
): string {
  const config = PRODUCT_CONFIGS[productType];
  const productName = config.displayName || PRODUCT_NAMES[productType];
  const intervalName = INTERVAL_NAMES[interval] || interval;

  return `${productName} ${intervalName}`;
}

// 生成计划描述
export function generatePlanDescription(
  productType: keyof typeof PRODUCT_CONFIGS,
  interval: string,
  amount: number,
  currency: string = 'usd'
): string {
  const config = PRODUCT_CONFIGS[productType];
  const productName = config.displayName || PRODUCT_NAMES[productType];
  const intervalName = INTERVAL_NAMES[interval] || interval;
  const currencySymbol = currency.toUpperCase() === 'USD' ? '$' : `${currency.toUpperCase()} `;
  const price = (amount / 100).toFixed(2);

  return `${productName} plan: ${price}${currencySymbol}/${intervalName}, ${config.requestLimit.toLocaleString()} tokens/month. Access to ${config.modelAccess.length} AI models.`;
}

// 验证配置
export function validateConfig(): void {
  // 检查数据库连接
  if (!process.env.DATABASE_URL) {
    throw new Error('Missing required environment variable: DATABASE_URL');
  }

  // 检查 Stripe API Key (支持两种命名)
  const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
  if (!stripeKey) {
    throw new Error('Missing required environment variable: STRIPE_SECRET_KEY or STRIPE_API_KEY');
  }

  console.log('✅ Configuration validated');
}

export default {
  PRODUCT_CONFIGS,
  PRODUCT_NAMES,
  INTERVAL_NAMES,
  getProductType,
  generatePlanName,
  generatePlanDescription,
  validateConfig,
};