import { NextRequest, NextResponse } from 'next/server';
import { manualCacheInit } from '@/lib/cache-initializer';

/**
 * 管理员工具：手动初始化缓存
 * POST /api/admin/cache/init
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { force = false } = body;

    if (!force) {
      return NextResponse.json({
        error: 'Please set force=true to confirm cache initialization',
        message: 'This action will preload all plans data into cache',
        cacheTypes: [
          'Plans (24h TTL) - All subscription plans with their pricing and limits'
        ]
      }, { status: 400 });
    }

    console.log('🔧 Admin requested cache initialization...');

    // 手动初始化缓存
    await manualCacheInit();

    return NextResponse.json({
      success: true,
      message: 'Cache initialization completed successfully',
      timestamp: new Date().toISOString(),
      details: {
        preloaded: ['plans'],
        ttl: {
          plans: '24 hours'
        }
      }
    });

  } catch (error) {
    console.error('Error in cache initialization:', error);
    return NextResponse.json({
      error: 'Failed to initialize cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * 获取缓存状态信息
 * GET /api/admin/cache/init
 */
export async function GET() {
  try {
    return NextResponse.json({
      message: 'Cache initialization API',
      usage: {
        method: 'POST',
        body: {
          force: 'boolean'
        }
      },
      description: 'Manually initialize application cache with preloaded data',
      preloadedData: {
        plans: {
          description: 'All subscription plans with pricing and limits',
          ttl: '24 hours',
          cached: false // Will be updated after initialization
        }
      }
    });

  } catch (error) {
    console.error('Error getting cache info:', error);
    return NextResponse.json({
      error: 'Failed to get cache information',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}