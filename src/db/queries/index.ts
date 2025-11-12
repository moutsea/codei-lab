import { db } from '../index';
import { sql } from 'drizzle-orm';

// Export all query functions from individual files
export * from './users';
export * from './plans';
export * from './subscriptions';
export * from './api-keys';
export * from './daily-user-usage';
export * from './monthly-api-usage';
export * from './monthly-user-usage';
export * from './email-login-tokens';
export * from './topup-purchases';


// Database query utilities
export class DatabaseQueryError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'DatabaseQueryError';
  }
}

/**
 * Execute database query with error handling
 */
export async function executeQuery<T>(
  query: () => Promise<T>,
  errorMessage: string = 'Database query failed'
): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    throw new DatabaseQueryError(errorMessage, error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Execute multiple database queries in parallel
 */
export async function executeQueries<T>(
  queries: Array<{ query: () => Promise<T>; errorMessage?: string }>
): Promise<T[]> {
  try {
    const results = await Promise.all(
      queries.map(({ query }) => query())
    );
    return results;
  } catch (error) {
    console.error('Database queries failed:', error);
    throw new DatabaseQueryError('One or more database queries failed', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Paginated query result type
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Create paginated result
 */
export function createPaginatedResult<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Common date utilities for database queries
 */
export class DateUtils {
  /**
   * Get start of day
   */
  static startOfDay(date: Date = new Date()): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get end of day
   */
  static endOfDay(date: Date = new Date()): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Get start of month
   */
  static startOfMonth(date: Date = new Date()): Date {
    const result = new Date(date);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get end of month
   */
  static endOfMonth(date: Date = new Date()): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1, 0);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Get days ago
   */
  static daysAgo(days: number): Date {
    const result = new Date();
    result.setDate(result.getDate() - days);
    return result;
  }

  /**
   * Get months ago
   */
  static monthsAgo(months: number): Date {
    const result = new Date();
    result.setMonth(result.getMonth() - months);
    return result;
  }

  /**
   * Get years ago
   */
  static yearsAgo(years: number): Date {
    const result = new Date();
    result.setFullYear(result.getFullYear() - years);
    return result;
  }
}

/**
 * Common query builders
 */
export class QueryBuilder {
  /**
   * Build search condition for text fields
   */
  static buildSearchCondition(searchTerm: string, ...fields: string[]) {
    // This would use the appropriate Drizzle operators
    // Implementation depends on the specific ORM operators being used
    return searchTerm ? {
      [Symbol.for('drizzle:searchCondition')]: {
        term: searchTerm,
        fields
      }
    } : undefined;
  }

  /**
   * Build date range condition
   */
  static buildDateRangeCondition(startDate?: Date, endDate?: Date) {
    if (startDate && endDate) {
      return {
        [Symbol.for('drizzle:dateRange')]: { startDate, endDate }
      };
    }
    return undefined;
  }

  /**
   * Build pagination parameters
   */
  static buildPaginationParams(page: number = 1, limit: number = 20) {
    return {
      page: Math.max(1, page),
      limit: Math.min(Math.max(1, limit), 100), // Cap at 100
      offset: Math.max(0, (page - 1) * limit)
    };
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate UUID format
   */
  static isValidUuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate Auth0 user ID format
   */
  static isValidAuth0UserId(auth0Id: string): boolean {
    return auth0Id.startsWith('auth0|') && auth0Id.length > 10;
  }

  /**
   * Validate API key format
   */
  static isValidApiKey(key: string): boolean {
    return /^[A-Za-z0-9]{16,64}$/.test(key);
  }

  /**
   * Validate positive number
   */
  static isValidPositiveNumber(value: unknown): boolean {
    return typeof value === 'number' && !isNaN(value) && value > 0 && Number.isFinite(value);
  }

  /**
   * Validate token count
   */
  static isValidTokenCount(tokens: unknown): boolean {
    return this.isValidPositiveNumber(tokens) && Number.isInteger(tokens);
  }
}

/**
 * Database connection status checker
 */
export class DatabaseStatus {
  /**
   * Check if database is accessible
   */
  static async isHealthy(): Promise<boolean> {
    try {
      // Simple query to test connection
      await db().select({ count: sql<number>`1` }).from(sql`dual`);
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get database connection info
   */
  static async getConnectionInfo(): Promise<{
    healthy: boolean;
    timestamp: string;
    databaseUrl?: string;
  }> {
    const healthy = await this.isHealthy();
    return {
      healthy,
      timestamp: new Date().toISOString(),
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'not configured',
    };
  }
}
