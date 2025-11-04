import { NextRequest, NextResponse } from 'next/server';
import { redisMonitor } from '@/lib/redis-monitor';
import { cache } from '@/lib/cache';

/**
 * 管理员工具：重置 Redis 连接
 * POST /api/admin/redis/reset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { force = false } = body;

    if (!force) {
      return NextResponse.json({
        error: 'Please set force=true to confirm Redis connection reset',
        message: 'This action will reset the Redis connection and clear all cache'
      }, { status: 400 });
    }

    console.log('🔄 Admin requested Redis connection reset...');

    // 获取当前连接信息
    const beforeInfo = await redisMonitor.getConnectionInfo();

    // 重置连接
    await redisMonitor.forceResetConnection();

    // 清理缓存状态
    await cache.reenableCache();

    // 等待连接恢复
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 获取重置后的连接信息
    const afterInfo = await redisMonitor.getConnectionInfo();

    return NextResponse.json({
      success: true,
      message: 'Redis connection reset successfully',
      before: beforeInfo,
      after: afterInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error resetting Redis connection:', error);
    return NextResponse.json({
      error: 'Failed to reset Redis connection',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * 获取 Redis 连接状态
 * GET /api/admin/redis/reset
 */
export async function GET() {
  try {
    const connectionInfo = await redisMonitor.getConnectionInfo();
    const cacheStats = await cache.getStats();

    return NextResponse.json({
      connection: connectionInfo,
      cache: cacheStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting Redis status:', error);
    return NextResponse.json({
      error: 'Failed to get Redis status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}