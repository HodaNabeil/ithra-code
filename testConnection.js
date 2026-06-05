/* eslint-disable no-console */
import Redis from 'ioredis';
import 'dotenv/config';

console.log('🚀 Script started...');

async function testConnection() {
  const redis = new Redis(process.env.REDIS_URL);

  try {
    const pong = await redis.ping();
    console.log('✅ Redis Connection Successful:', pong);

    await redis.set('ithracode_test', 'working');
    const val = await redis.get('ithracode_test');
    console.log('✅ Data Write/Read Test:', val);
    await redis.lpush('queue', JSON.stringify({ type: 'test', data: 123 }));
    const job = await redis.rpop('queue');
    console.log('JOB:', JSON.parse(job));
  } catch (error) {
    console.error('❌ Redis Connection Failed:', error);
  }
}

testConnection();
