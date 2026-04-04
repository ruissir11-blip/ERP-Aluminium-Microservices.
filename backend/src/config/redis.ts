import Redis from 'ioredis';
import { config } from 'dotenv';
import logger from './logger';

config();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

// Create Redis client for caching
export const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    // Stop retrying after 3 attempts to avoid spam errors
    if (times > 3) {
      logger.warn('Redis cache connection failed, running without cache');
      return null; // Stop retrying
    }
    return Math.min(times * 100, 500);
  },
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

// Create Redis client for pub/sub (separate connection)
export const redisPubSub = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    // Stop retrying after 3 attempts to avoid spam errors
    if (times > 3) {
      logger.warn('Redis pub/sub connection failed, running without pub/sub');
      return null; // Stop retrying
    }
    return Math.min(times * 100, 500);
  },
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

// Handle connection events
redis.on('connect', () => {
  logger.info('Redis cache connected');
});

redis.on('error', (err) => {
  logger.error('Redis cache error', { error: err.message });
});

redisPubSub.on('connect', () => {
  logger.info('Redis pub/sub connected');
});

redisPubSub.on('error', (err) => {
  logger.error('Redis pub/sub error', { error: err.message });
});

// Cache utilities
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Cache get error', { error: (error as Error).message });
    return null;
  }
};

export const cacheSet = async (key: string, value: unknown, ttl: number = CACHE_TTL.MEDIUM): Promise<void> => {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.error('Cache set error', { error: (error as Error).message });
  }
};

export const cacheDelete = async (key: string): Promise<void> => {
  try {
    await redis.del(key);
  } catch (error) {
    logger.error('Cache delete error', { error: (error as Error).message });
  }
};

export const cacheDeletePattern = async (pattern: string): Promise<void> => {
  try {
    // Use SCAN instead of KEYS to avoid blocking Redis in production
    const scanStream = redis.scanStream({ match: pattern, count: 100 });
    const keysToDelete: string[] = [];
    
    for await (const keys of scanStream) {
      keysToDelete.push(...keys);
    }
    
    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
    }
  } catch (error) {
    logger.error('Cache delete pattern error', { error: (error as Error).message });
  }
};

// Pub/Sub utilities for real-time alerts
export const ALERT_CHANNEL = 'stock:alerts';

export const publishAlert = async (alert: unknown): Promise<void> => {
  try {
    await redisPubSub.publish(ALERT_CHANNEL, JSON.stringify(alert));
  } catch (error) {
    logger.error('Publish alert error', { error: (error as Error).message });
  }
};

export const subscribeToAlerts = (callback: (alert: unknown) => void): void => {
  redisPubSub.subscribe(ALERT_CHANNEL, (err) => {
    if (err) {
      logger.error('Subscribe to alerts error', { error: err.message });
      return;
    }
    
    redisPubSub.on('message', (channel, message) => {
      if (channel === ALERT_CHANNEL) {
        try {
          callback(JSON.parse(message));
        } catch (error) {
          logger.error('Parse alert message error', { error: (error as Error).message });
        }
      }
    });
  });
};

export default redis;
