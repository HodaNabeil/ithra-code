import { env } from '@/config';
import { prismaPaymentRepository } from '@/features/payments/infrastructure/prisma/repositories/prisma-payment.repository';
import { prismaOrderRepository } from '@/features/payments/infrastructure/prisma/repositories/prisma-order.repository';
import { prismaUnitOfWork } from '@/features/payments/infrastructure/prisma/prisma-unit-of-work';
import { redisCheckoutLock } from '@/features/payments/infrastructure/redis/redis-checkout-lock';
import { bullmqOrderCompletedPublisher } from '@/features/payments/infrastructure/queue/order-completed.publisher';
import { bullmqReconcilePaymentsPublisher } from '@/features/payments/infrastructure/queue/reconcile-payments.publisher';
import { FulfillOrderService } from '@/features/payments/application/services/fulfill-order.service';
import { ReconciliationPolicy } from '@/features/payments/application/services/reconciliation-policy.service';
import { ReconciliationCoordinator } from '@/features/payments/application/services/reconciliation-coordinator.service';
import { ReconcilePaymentsUseCase } from '@/features/payments/application/use-cases/reconcile-payments.use-case';
import { ProcessWebhookUseCase } from '@/features/payments/application/use-cases/process-webhook.use-case';
import { CreateCheckoutUseCase } from '@/features/payments/application/use-cases/create-checkout.use-case';
import { FakePaymentGateway } from '../gateways/fake-payment.gateway';
import { readPaymobConfig } from '../gateways/paymob/paymob.config';
import { PaymobGateway } from '../gateways/paymob/paymob.gateway';
import { redisMetricsRecorder } from '../observability/redis-metrics.recorder';
import { RedisProviderRateLimiter } from '../redis/redis-provider-rate-limiter';
import { prismaCartRepository } from '@/features/cart/infrastructure/prisma/repositories/prisma-cart.repository';
import {
  PaymentProvider,
  SUPPORTED_PAYMENT_PROVIDERS,
} from '@/features/payments/domain';
import type { PaymentProviderRegistry } from '@/features/payments/application';
import type { PaymentInquiryRegistry } from '@/features/payments/application/ports/payment-inquiry.port';

/**
 * Composition root for the payments module.
 *
 * This is the ONLY place allowed to know concrete infrastructure classes.
 * Use cases receive their dependencies (repositories, Unit of Work, provider
 * gateways) already wired here.
 */

function buildProviderRegistry(): PaymentProviderRegistry {
  const registry: PaymentProviderRegistry = {};
  const isProduction = env.NODE_ENV === 'production';

  if (!isProduction) {
    for (const provider of SUPPORTED_PAYMENT_PROVIDERS) {
      registry[provider] = new FakePaymentGateway(provider);
    }
  }

  const paymobConfig = readPaymobConfig();
  if (paymobConfig) {
    registry[PaymentProvider.PAYMOB] = new PaymobGateway(paymobConfig);
  }

  return registry;
}

function buildInquiryRegistry(): PaymentInquiryRegistry {
  const registry: PaymentInquiryRegistry = {};
  const isProduction = env.NODE_ENV === 'production';

  if (!isProduction) {
    for (const provider of SUPPORTED_PAYMENT_PROVIDERS) {
      const gateway = new FakePaymentGateway(provider);
      registry[provider] = gateway;
    }
  }

  const paymobConfig = readPaymobConfig();
  if (paymobConfig) {
    registry[PaymentProvider.PAYMOB] = new PaymobGateway(paymobConfig);
  }

  return registry;
}

let providerRegistry: PaymentProviderRegistry | null = null;
let inquiryRegistry: PaymentInquiryRegistry | null = null;

function getProviderRegistry(): PaymentProviderRegistry {
  providerRegistry ??= buildProviderRegistry();
  return providerRegistry;
}

function getInquiryRegistry(): PaymentInquiryRegistry {
  inquiryRegistry ??= buildInquiryRegistry();
  return inquiryRegistry;
}

function createFulfillOrderService(): FulfillOrderService {
  return new FulfillOrderService(prismaUnitOfWork);
}

function createReconciliationPolicy(): ReconciliationPolicy {
  return new ReconciliationPolicy({
    maxAttempts: env.PAYMENT_RECONCILE_MAX_ATTEMPTS,
    maxWindowMs: env.PAYMENT_RECONCILE_MAX_WINDOW_HOURS * 60 * 60 * 1000,
    backoffBaseMs: env.PAYMENT_RECONCILE_BACKOFF_BASE_MINUTES * 60 * 1000,
    backoffCapMs: env.PAYMENT_RECONCILE_BACKOFF_CAP_MINUTES * 60 * 1000,
    abandonNotFoundCount: env.PAYMENT_RECONCILE_ABANDON_NOT_FOUND_COUNT,
  });
}

function createReconciliationCoordinator(): ReconciliationCoordinator {
  return new ReconciliationCoordinator({
    unitOfWork: prismaUnitOfWork,
    paymentRepository: prismaPaymentRepository,
    fulfillOrderService: createFulfillOrderService(),
    orderCompletedPublisher: bullmqOrderCompletedPublisher,
    metrics: redisMetricsRecorder,
  });
}

const reconcileRateLimiter = new RedisProviderRateLimiter(
  env.PAYMENT_RECONCILE_RATE_LIMIT_PER_MINUTE,
);

/** Wires `CreateCheckoutUseCase` with concrete Prisma infrastructure. */
export function createCheckoutUseCase(): CreateCheckoutUseCase {
  return new CreateCheckoutUseCase({
    cartRepository: prismaCartRepository,
    unitOfWork: prismaUnitOfWork,
    orderRepository: prismaOrderRepository,
    checkoutLock: redisCheckoutLock,
    providerRegistry: getProviderRegistry(),
  });
}

/** Wires `ProcessWebhookUseCase` with UoW + async OrderCompleted publisher. */
export function createProcessWebhookUseCase(): ProcessWebhookUseCase {
  return new ProcessWebhookUseCase({
    unitOfWork: prismaUnitOfWork,
    fulfillOrderService: createFulfillOrderService(),
    orderCompletedPublisher: bullmqOrderCompletedPublisher,
  });
}

/** Wires `ReconcilePaymentsUseCase` for stale payment recovery. */
export function createReconcilePaymentsUseCase(): ReconcilePaymentsUseCase {
  return new ReconcilePaymentsUseCase({
    paymentRepository: prismaPaymentRepository,
    inquiryRegistry: getInquiryRegistry(),
    reconciliationPolicy: createReconciliationPolicy(),
    coordinator: createReconciliationCoordinator(),
    reconcilePublisher: bullmqReconcilePaymentsPublisher,
    rateLimiter: reconcileRateLimiter,
    metrics: redisMetricsRecorder,
    config: {
      thresholdMinutes: env.PAYMENT_RECONCILE_THRESHOLD_MINUTES,
      batchSize: env.PAYMENT_RECONCILE_BATCH_SIZE,
      useQueue: env.PAYMENT_RECONCILE_USE_QUEUE === 'true',
      maxAttempts: env.PAYMENT_RECONCILE_MAX_ATTEMPTS,
      maxWindowMs: env.PAYMENT_RECONCILE_MAX_WINDOW_HOURS * 60 * 60 * 1000,
      backoffBaseMs: env.PAYMENT_RECONCILE_BACKOFF_BASE_MINUTES * 60 * 1000,
      backoffCapMs: env.PAYMENT_RECONCILE_BACKOFF_CAP_MINUTES * 60 * 1000,
      abandonNotFoundCount: env.PAYMENT_RECONCILE_ABANDON_NOT_FOUND_COUNT,
    },
  });
}

export { PaymentProvider };
