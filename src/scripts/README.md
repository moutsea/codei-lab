# Stripe 计划同步脚本

这个脚本用于将 Stripe 中的产品和价格同步到数据库的计划表中，支持多等级会员和不同订阅时长的管理。

## 功能特性

- ✅ 自动同步 Stripe 产品和价格到数据库
- ✅ 支持多个产品等级（基础版、专业版、团队版）
- ✅ 支持多种订阅周期（月付、季付、年付）
- ✅ 智能更新已有计划，避免重复创建
- ✅ 自动处理产品/价格的启用和停用状态
- ✅ 详细的日志输出和错误处理
- ✅ 支持单个产品同步或全量同步

## 使用前准备

### 1. 环境变量配置

确保 `.env` 文件包含以下配置：

```env
STRIPE_SECRET_KEY=sk_test_... # 或 sk_live_... 用于生产环境
DATABASE_URL=postgresql://...
```

### 2. Stripe 产品配置

在 Stripe Dashboard 中为每个产品添加元数据：

#### 必需的元数据
- `request_limit`: Token 限制数量 (例如: "10000000")
- `model_access`: 可访问模型列表 (JSON 格式，例如: `["claude-3-haiku", "claude-3-sonnet"]`)

#### 可选的元数据
- `name`: 自定义产品显示名称 (如果不提供，将使用 Stripe 产品名称)
- `description`: 自定义产品描述 (如果不提供，将自动生成)

#### 配置示例

```json
{
  "request_limit": "10000000",
  "model_access": "[\"claude-3-haiku\", \"claude-3-sonnet\"]"
}
```

**说明**:
- `request_limit`: 字符串格式的数字，表示每月的 token 限制
- `model_access`: JSON 字符串，包含可访问的模型名称数组
- 脚本会自动从 Stripe 产品的名称、价格等信息生成计划名称和描述

## 使用方法

### 同步所有产品

```bash
npm run sync:stripe
```

### 同步特定产品

```bash
npm run sync:stripe prod_1234567890
```

## 脚本工作流程

1. **获取产品**: 从 Stripe 获取所有活跃产品
2. **识别类型**: 根据产品元数据中的 `type` 字段确定产品类型
3. **获取价格**: 获取每个产品的所有活跃价格
4. **创建/更新计划**:
   - 为每个价格创建对应的数据库计划记录
   - 如果计划已存在，则更新信息
   - 生成智能的名称和描述
5. **清理旧计划**: 停用不再对应活跃价格的计划

## 数据库表结构

每个 Stripe 价格对应一条 `plans` 表记录：

```sql
-- 示例：基础版月付计划
{
  "name": "Basic Monthly",
  "description": "Basic plan: $9.99/month, 10,000,000 tokens/month. Access to 2 AI models.",
  "stripeProductId": "prod_1234567890",
  "stripePriceId": "price_1234567890",
  "amount": 999,           // 单位：分
  "interval": "month",
  "requestLimit": 10000000,
  "modelAccess": ["claude-3-haiku", "claude-3-sonnet"],
  "isActive": true
}
```

## 输出示例

```
🚀 Starting Stripe plans synchronization...
=====================================
✅ Environment variables configured
📦 Found 3 active products

🔄 Syncing product: Basic Plan (prod_1234567890)
📊 Found 3 active prices for this product
💰 Processing price: price_1234567890 (month - $9.99)
✏️  Updating existing plan: Basic Monthly
✅ Updated plan: Basic Monthly
💰 Processing price: price_2345678901 (quarter - $26.99)
➕ Creating new plan: Basic Quarterly
✅ Created plan: Basic Quarterly
...

=====================================
✅ Stripe plans synchronization completed successfully!
📈 Processed 3 products with approximately 9 price points
```

## 错误排查

### 常见错误

1. **环境变量未设置**
   ```
   ❌ Missing required environment variable: STRIPE_SECRET_KEY
   ```
   解决：确保 `.env` 文件包含所需的环境变量

2. **产品元数据缺失**
   ```
   ⚠️  Unknown product type: unknown, defaulting to 'basic'
   ```
   解决：在 Stripe Dashboard 中为产品添加 `type` 元数据

3. **数据库连接失败**
   ```
   ❌ Database connection failed
   ```
   解决：检查 `DATABASE_URL` 配置和数据库状态

### 调试技巧

- 使用单个产品 ID 进行测试：
  ```bash
  npm run sync:stripe prod_1234567890
  ```

- 检查 Stripe 配置：
  ```bash
  stripe products list --active
  ```

## 自动化建议

建议设置定时任务自动同步：

```bash
# 每小时同步一次
0 * * * * cd /path/to/project && npm run sync:stripe
```

## 注意事项

- 脚本会自动处理产品/价格的启用状态
- 已删除的价格对应的计划会被自动停用，但不会删除
- 确保产品元数据中的 `type` 字段正确设置
- 建议在测试环境先验证脚本功能