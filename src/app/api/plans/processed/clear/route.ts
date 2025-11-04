import { NextResponse } from 'next/server';
import { cacheKeys, cache } from '@/lib/cache';

export async function POST() {
  try {
    await cache.delete(cacheKeys.processedPlans());
    console.log('Cleared processed plans cache');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to clear processed plans cache:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}