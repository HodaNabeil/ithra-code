import { Redis } from 'ioredis';

import { env } from '@/config/env';

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times: number) => {
    // Stop retrying after 3 attempts
    if (times > 3) {
      console.error(
        '❌ Redis connection failed after 3 attempts. Check REDIS_URL in .env',
      );
      return null; // Stop retrying
    }
    // Wait 2 seconds between retries
    return 2000;
  },
  lazyConnect: true, // Don't connect immediately on instantiation
};

export const redis = new Redis(env.REDIS_URL, redisOptions);

// Handle connection errors gracefully
redis.on('error', (err: Error) => {
  // Only log once, not on every retry
  if (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED')) {
    console.error('❌ Redis connection error:', err.message);
    console.error(
      '💡 Check your REDIS_URL in .env or ensure Redis is running',
    );
  }
});

// Attempt to connect (will use lazy connect + retry strategy)
redis.connect().catch(() => {
  // Silently fail - error handler above will log
});
