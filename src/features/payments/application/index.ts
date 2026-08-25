export type { CreateCheckoutRequest } from './contracts/create-checkout.request';
export type { CreateCheckoutResponse } from './contracts/create-checkout.response';
export type { ProcessWebhookRequest } from './contracts/process-webhook.request';
export type { ProcessWebhookResponse } from './contracts/process-webhook.response';

export { CheckoutError, isCheckoutError } from './errors/checkout.errors';
export type { CheckoutErrorCode } from './errors/checkout.errors';
export { WebhookError, isWebhookError } from './errors/webhook.errors';
export type { WebhookErrorCode } from './errors/webhook.errors';

export {
  CheckoutValidator,
  SUPPORTED_CHECKOUT_CURRENCIES,
} from './validators/checkout.validator';
export type {
  CheckoutCartCourse,
  CheckoutCartItem,
  CheckoutCartSnapshot,
  CheckoutValidationInput,
} from './validators/checkout.validator';

export {
  PriceCalculatorService,
  toCents,
} from './services/price-calculator.service';
export type {
  PriceCalculationResult,
  PriceLineItem,
} from './services/price-calculator.service';

export { OrderFactory } from './factories/order.factory';
export type { CreateOrderInput } from './factories/order.factory';

export { PaymentFactory } from './factories/payment.factory';
export type { CreatePaymentInput } from './factories/payment.factory';

export type {
  CreateProviderCheckoutInput,
  GetPaymentStatusInput,
  PaymentProviderGateway,
  ProviderCheckoutResult,
  ProviderPaymentOutcome,
  ProviderPaymentStatus,
} from './providers/payment-provider.gateway';

export { PaymentProviderResolver } from './providers/payment-provider.resolver';
export type { PaymentProviderRegistry } from './providers/payment-provider.resolver';
export type {
  PaymentInquiryPort,
  PaymentInquiryRegistry,
} from './ports/payment-inquiry.port';

export type {
  CartFulfillmentRepository,
  CheckoutSessionRepository,
  EnrollmentRepository,
  MarkPaymentFailedInput,
  MarkPaymentSucceededInput,
  OrderCompletedPublisher,
  OrderRepository,
  ReusablePendingOrder,
  PaymentRepository,
  TransactionalRepositories,
  UnitOfWork,
  WebhookEventRepository,
} from './ports';

export type { OrderCompletedEvent } from './events/order-completed.event';

export { CreateCheckoutUseCase } from './use-cases/create-checkout.use-case';
export type { CreateCheckoutUseCaseDeps } from './use-cases/create-checkout.use-case';

export { ProcessWebhookUseCase } from './use-cases/process-webhook.use-case';
export type { ProcessWebhookUseCaseDeps } from './use-cases/process-webhook.use-case';

export { FulfillOrderService } from './services/fulfill-order.service';
export { WebhookReplayGuard } from './services/webhook-replay.guard';
export { CheckoutFingerprintService } from './services/checkout-fingerprint.service';
export { ReconciliationPolicy } from './services/reconciliation-policy.service';
export type {
  ReconciliationPolicyConfig,
  ReconciliationPolicyContext,
} from './services/reconciliation-policy.service';
export type {
  FulfillOrderResult,
  FulfillPaymentInput,
} from './services/fulfill-order.service';

export { ReconcilePaymentsUseCase } from './use-cases/reconcile-payments.use-case';
export type {
  ReconcilePaymentsConfig,
  ReconcilePaymentsSummary,
  ReconcilePaymentsUseCaseDeps,
} from './use-cases/reconcile-payments.use-case';

export { mapCartToCheckoutSnapshot } from './mappers/checkout-cart.mapper';
