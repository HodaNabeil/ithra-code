import { Redis } from 'ioredis';

import { env } from '@/config/env';

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

export const redis = new Redis(env.REDIS_URL, redisOptions);
