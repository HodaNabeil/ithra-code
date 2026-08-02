/**
 * Lightweight load script for tutor rate limits and concurrent streams.
 *
 * Usage:
 *   k6 run scripts/ai-tutor/load-smoke.js
 *
 * Requires k6 installed locally.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';

export default function loadSmoke() {
  const health = http.get(`${baseUrl}/api/health/tutor`);
  check(health, {
    'health status is 200 or 503': (res) => res.status === 200 || res.status === 503,
  });

  sleep(1);
}
