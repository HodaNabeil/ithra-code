export interface ContactRateLimiter {
  check(ip: string | null): Promise<void>;
}
