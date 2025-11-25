import { getRedisClient, closeRedisConnection } from './redis';

/**
 * Redis 连接监控工具
 * 用于监控和管理 Redis 连接状态
 */
export class RedisMonitor {
  private static instance: RedisMonitor;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isChecking = false;

  private constructor() {}

  public static getInstance(): RedisMonitor {
    if (!RedisMonitor.instance) {
      RedisMonitor.instance = new RedisMonitor();
    }
    return RedisMonitor.instance;
  }

  /**
   * 开始监控 Redis 连接
   */
  public startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      console.log('Redis monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    console.log(`Starting Redis connection monitoring (interval: ${intervalMs}ms)`);

    this.monitoringInterval = setInterval(() => {
      if (this.isChecking) {
        return;
      }
      this.isChecking = true;
      this.checkConnection().finally(() => {
        this.isChecking = false;
      });
    }, intervalMs);
  }

  /**
   * 停止监控 Redis 连接
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.log('Redis monitoring is not running');
      return;
    }

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('Stopped Redis connection monitoring');
  }

  /**
   * 检查连接状态并获取信息
   */
  private async checkConnection(): Promise<void> {
    try {
      const client = await getRedisClient();

      // 检查连接状态
      const status = client.status;
      console.log(`Redis connection status: ${status}`);

      if (status === 'ready') {
        // 单次获取全部 Redis 信息，避免重复命令
        const info = await client.info();
        const memoryInfo = this.extractSection(info, 'memory');
        const serverInfo = this.extractSection(info, 'server');

        console.log('Redis connection is healthy');
        console.log('Memory usage:', this.parseMemoryInfo(memoryInfo));
        console.log('Server info:', this.parseServerInfo(serverInfo));
      } else {
        console.warn(`Redis connection is not ready: ${status}`);
      }

    } catch (error) {
      console.error('Redis monitoring error:', error);
    }
  }

  /**
   * 获取 Redis 连接信息
   */
  public async getConnectionInfo(): Promise<{
    status: string;
    memory?: string;
    clients?: number;
    uptime?: string;
  }> {
    try {
      const client = await getRedisClient();
      const status = client.status;

      if (status === 'ready') {
        const info = await client.info();
        return {
          status,
          memory: this.parseMemoryInfo(this.extractSection(info, 'memory')),
          clients: this.parseClientsInfo(info),
          uptime: this.parseUptimeInfo(info)
        };
      }

      return { status };

    } catch (error) {
      console.error('Failed to get Redis connection info:', error);
      return { status: 'error' };
    }
  }

  /**
   * 强制重置 Redis 连接
   */
  public async forceResetConnection(): Promise<void> {
    console.log('Force resetting Redis connection...');
    await closeRedisConnection();

    // 等待 2 秒后重新获取连接
    setTimeout(async () => {
      try {
        await getRedisClient();
      } catch (error) {
        console.error('Failed to re-establish Redis connection:', error);
      }
    }, 2000);
  }

  /**
   * 解析内存信息
   */
  private parseMemoryInfo(info: string): string {
    const match = info.match(/used_memory_human:(.+)/);
    return match ? match[1].trim() : 'unknown';
  }

  /**
   * 根据 section 提取信息
   */
  private extractSection(info: string, section: string): string {
    const sectionRegex = new RegExp(`# ${section}\\r?\\n([\\s\\S]*?)(?=#|$)`, 'i');
    const match = info.match(sectionRegex);
    return match ? match[1] : info;
  }

  /**
   * 解析客户端连接数信息
   */
  private parseClientsInfo(info: string): number {
    const match = info.match(/connected_clients:(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * 解析服务器信息
   */
  private parseServerInfo(info: string): string {
    const versionMatch = info.match(/redis_version:(.+)/);
    const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/);

    const version = versionMatch ? versionMatch[1].trim() : 'unknown';
    const uptime = uptimeMatch ? `${uptimeMatch[1]}s` : 'unknown';

    return `v${version}, uptime: ${uptime}`;
  }

  /**
   * 解析运行时间信息
   */
  private parseUptimeInfo(info: string): string {
    const match = info.match(/uptime_in_seconds:(\d+)/);
    if (!match) return 'unknown';

    const seconds = parseInt(match[1]);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${hours}h ${minutes}m`;
  }
}

// 导出单例实例
export const redisMonitor = RedisMonitor.getInstance();
