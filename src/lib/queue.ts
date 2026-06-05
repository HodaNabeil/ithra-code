import { Queue } from 'bullmq';

import { redis } from './redis';

export const paymentQueue = new Queue('payment', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3, // 🔥 retry logic
    backoff: {
      type: 'exponential', // 2s → 4s → 8s...
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

import '@/server/workers/payment.worker';
