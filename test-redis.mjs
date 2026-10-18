import 'dotenv/config';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL, {
  lazyConnect: true,
  connectTimeout: 10000,
  maxRetriesPerRequest: 1,
});

try {
  await redis.connect();

  console.log('1. PING:', await redis.ping());

  const key = 'ithracode:redis-test';
  await redis.set(key, 'ok', 'EX', 30);

  console.log('2. SET: Success');
  console.log('3. GET:', await redis.get(key));
} catch (error) {
  console.error('Redis test failed:', error.message);
} finally {
  redis.disconnect();
}
