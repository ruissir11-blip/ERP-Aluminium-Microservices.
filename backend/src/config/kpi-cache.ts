import { redis, cacheGet, cacheSet, cacheDelete, cacheDeletePattern, CACHE_TTL } from './redis';
import logger from './logger';

const KPI_CACHE_PREFIX = 'kpi:';
const DASHBOARD_CACHE_PREFIX = 'dashboard:';

// KPI-specific TTL values
export const KPI_CACHE_TTL = {
  DAILY: CACHE_TTL.MEDIUM, // 5 minutes - recalculate frequently
  WEEKLY: CACHE_TTL.LONG, // 1 hour
  MONTHLY: CACHE_TTL.DAY, // 24 hours
};

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

/**
 * KPI Cache Manager
 * Provides specialized caching for financial KPIs and dashboard data
 */
export class KPICache {
  /**
   * Get a KPI from cache
   */
  async getKPI<T>(key: string): Promise<T | null> {
    const fullKey = `${KPI_CACHE_PREFIX}${key}`;
    return cacheGet<T>(fullKey);
  }

  /**
   * Set a KPI in cache
   */
  async setKPI<T>(key: string, value: T, ttl: number = KPI_CACHE_TTL.DAILY): Promise<void> {
    const fullKey = `${KPI_CACHE_PREFIX}${key}`;
    await cacheSet(fullKey, value, ttl);
  }

  /**
   * Get or compute KPI (cache-aside pattern)
   */
  async getOrSetKPI<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = KPI_CACHE_TTL.DAILY
  ): Promise<T> {
    const cached = await this.getKPI<T>(key);
    if (cached !== null) {
      logger.debug(`KPI cache hit: ${key}`);
      return cached;
    }

    logger.debug(`KPI cache miss: ${key}`);
    const value = await factory();
    await this.setKPI(key, value, ttl);
    return value;
  }

  /**
   * Get dashboard data from cache
   */
  async getDashboard<T>(key: string): Promise<T | null> {
    const fullKey = `${DASHBOARD_CACHE_PREFIX}${key}`;
    return cacheGet<T>(fullKey);
  }

  /**
   * Set dashboard data in cache
   */
  async setDashboard<T>(key: string, value: T, ttl: number = CACHE_TTL.SHORT): Promise<void> {
    const fullKey = `${DASHBOARD_CACHE_PREFIX}${key}`;
    await cacheSet(fullKey, value, ttl);
  }

  /**
   * Get or compute dashboard data
   */
  async getOrSetDashboard<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = CACHE_TTL.SHORT
  ): Promise<T> {
    const cached = await this.getDashboard<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.setDashboard(key, value, ttl);
    return value;
  }

  /**
   * Invalidate all KPI caches
   */
  async invalidateKPIs(): Promise<void> {
    await cacheDeletePattern(`${KPI_CACHE_PREFIX}*`);
    logger.info('All KPI caches invalidated');
  }

  /**
   * Invalidate specific KPI
   */
  async invalidateKPI(key: string): Promise<void> {
    const fullKey = `${KPI_CACHE_PREFIX}${key}`;
    await cacheDelete(fullKey);
  }

  /**
   * Invalidate all dashboard caches
   */
  async invalidateDashboards(): Promise<void> {
    await cacheDeletePattern(`${DASHBOARD_CACHE_PREFIX}*`);
    logger.info('All dashboard caches invalidated');
  }

  /**
   * Invalidate caches related to a specific entity
   */
  async invalidateEntity(entityType: string, entityId: string): Promise<void> {
    // Invalidate all KPIs and dashboards when an entity changes
    await this.invalidateKPIs();
    await this.invalidateDashboards();
    logger.info(`Invalidated caches for ${entityType}:${entityId}`);
  }

  /**
   * Warm up cache with common KPIs
   * Called on application startup
   */
  async warmup(_factories: Map<string, () => Promise<unknown>>): Promise<void> {
    logger.info('Starting KPI cache warmup...');
    // Cache warming can be implemented here
    // Example: pre-compute and cache frequently accessed KPIs
    logger.info('KPI cache warmup complete');
  }
}

// Singleton instance
export const kpiCache = new KPICache();

export default kpiCache;
