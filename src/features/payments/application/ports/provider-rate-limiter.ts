export interface ProviderRateLimiter {
  acquire(provider: import('@/features/payments/domain').PaymentProvider): Promise<void>;
}
