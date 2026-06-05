import { Redis } from 'ioredis';

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

export const redis = new Redis(process.env.REDIS_URL!, redisOptions);
