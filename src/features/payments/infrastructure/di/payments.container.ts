import { prismaCartRepository } from '@/features/cart/infrastructure/prisma/repositories/prisma-cart.repository';
import {
  CreateCheckoutUseCase,
  type PaymentProviderRegistry,
} from '@/features/payments/application';
import { ProcessWebhookUseCase } from '@/features/payments/application/use-cases/process-webhook.use-case';
import {
  PaymentProvider,
  SUPPORTED_PAYMENT_PROVIDERS,
} from '@/features/payments/domain';
import { FakePaymentGateway } from '../gateways/fake-payment.gateway';
import { readPaymobConfig } from '../gateways/paymob/paymob.config';
import { PaymobGateway } from '../gateways/paymob/paymob.gateway';
import { prismaUnitOfWork } from '../prisma/prisma-unit-of-work';
import { bullmqOrderCompletedPublisher } from '../queue/order-completed.publisher';

/**
 * Composition root for the payments module.
 *
 * This is the ONLY place allowed to know concrete infrastructure classes.
 * Use cases receive their dependencies (repositories, Unit of Work, provider
 * gateways) already wired here.
 */

/**
 * Builds the provider registry consumed by `PaymentProviderResolver`.
 *
 * Every supported provider is backed by the deterministic `FakePaymentGateway`
 * so the full workflow can be validated end-to-end (Phase 5). Phase 6 replaces
 * the `PAYMOB` entry with the real `PaymobGateway` when it is configured.
 */
function buildProviderRegistry(): PaymentProviderRegistry {
  const registry: PaymentProviderRegistry = {};

  for (const provider of SUPPORTED_PAYMENT_PROVIDERS) {
    registry[provider] = new FakePaymentGateway(provider);
  }

  // Phase 6: use the real Paymob gateway when it is fully configured; otherwise
  // the fake gateway remains, keeping the workflow runnable in dev/CI.
  const paymobConfig = readPaymobConfig();
  if (paymobConfig) {
    registry[PaymentProvider.PAYMOB] = new PaymobGateway(paymobConfig);
  }

  return registry;
}

let providerRegistry: PaymentProviderRegistry | null = null;

function getProviderRegistry(): PaymentProviderRegistry {
  providerRegistry ??= buildProviderRegistry();
  return providerRegistry;
}

/** Wires `CreateCheckoutUseCase` with concrete Prisma infrastructure. */
export function createCheckoutUseCase(): CreateCheckoutUseCase {
  return new CreateCheckoutUseCase({
    cartRepository: prismaCartRepository,
    unitOfWork: prismaUnitOfWork,
    providerRegistry: getProviderRegistry(),
  });
}

/** Wires `ProcessWebhookUseCase` with UoW + async OrderCompleted publisher. */
export function createProcessWebhookUseCase(): ProcessWebhookUseCase {
  return new ProcessWebhookUseCase({
    unitOfWork: prismaUnitOfWork,
    orderCompletedPublisher: bullmqOrderCompletedPublisher,
  });
}

export { PaymentProvider };
