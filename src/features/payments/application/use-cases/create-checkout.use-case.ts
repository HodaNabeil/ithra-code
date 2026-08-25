import type { CartRepository } from '@/features/cart/domain/repositories/cart.repository';
import type {
  CheckoutSessionEntity,
  OrderEntity,
  PaymentEntity,
} from '@/features/payments/domain';
import { env } from '@/config';
import type { CreateCheckoutRequest } from '../contracts/create-checkout.request';
import type { CreateCheckoutResponse } from '../contracts/create-checkout.response';
import { randomUUID } from 'node:crypto';
import { OrderFactory } from '../factories/order.factory';
import { PaymentFactory } from '../factories/payment.factory';
import type { CheckoutLock } from '../ports/checkout-lock';
import type { UnitOfWork } from '../ports';
import type { OrderRepository } from '../ports/order.repository';
import type { PaymentProviderGateway } from '../providers/payment-provider.gateway';
import { PaymentProviderResolver } from '../providers/payment-provider.resolver';
import { CheckoutFingerprintService } from '../services/checkout-fingerprint.service';
import { PriceCalculatorService } from '../services/price-calculator.service';
import {
  CheckoutValidator,
  type CheckoutCartSnapshot,
} from '../validators/checkout.validator';
import { mapCartToCheckoutSnapshot } from '../mappers/checkout-cart.mapper';

export type CreateCheckoutUseCaseDeps = {
  cartRepository: CartRepository;
  unitOfWork: UnitOfWork;
  orderRepository: OrderRepository;
  checkoutLock: CheckoutLock;
  checkoutValidator?: CheckoutValidator;
  priceCalculator?: PriceCalculatorService;
  checkoutFingerprintService?: CheckoutFingerprintService;
  orderFactory?: OrderFactory;
  paymentFactory?: PaymentFactory;
  paymentProviderResolver?: PaymentProviderResolver;
  providerRegistry?: Partial<Record<string, PaymentProviderGateway>>;
};

/**
 * Orchestrates checkout: validate cart, price, create order/payment,
 * delegate provider session creation, and return redirect metadata.
 */
export class CreateCheckoutUseCase {
  private readonly checkoutValidator: CheckoutValidator;
  private readonly priceCalculator: PriceCalculatorService;
  private readonly checkoutFingerprintService: CheckoutFingerprintService;
  private readonly orderFactory: OrderFactory;
  private readonly paymentFactory: PaymentFactory;
  private readonly paymentProviderResolver: PaymentProviderResolver;

  constructor(private readonly deps: CreateCheckoutUseCaseDeps) {
    this.checkoutValidator = deps.checkoutValidator ?? new CheckoutValidator();
    this.priceCalculator = deps.priceCalculator ?? new PriceCalculatorService();
    this.checkoutFingerprintService =
      deps.checkoutFingerprintService ?? new CheckoutFingerprintService();
    this.orderFactory = deps.orderFactory ?? new OrderFactory();
    this.paymentFactory = deps.paymentFactory ?? new PaymentFactory();
    this.paymentProviderResolver =
      deps.paymentProviderResolver ??
      new PaymentProviderResolver(deps.providerRegistry);
  }

  /** Executes the checkout workflow for an authenticated student. */
  async execute(
    request: CreateCheckoutRequest,
  ): Promise<CreateCheckoutResponse> {
    await this.deps.checkoutLock.acquire(request.userId);

    try {
      const cart = await this.loadCart(request.userId);
      const enrolledCourseIds = await this.loadEnrolledCourseIds(
        request.userId,
        cart,
      );

      this.checkoutValidator.validate({
        userId: request.userId,
        provider: request.provider,
        cart,
        enrolledCourseIds,
      });

      const pricing = this.priceCalculator.calculate(cart!);
      const checkoutFingerprint = this.checkoutFingerprintService.fromPricing(
        pricing,
        request.provider,
      );

      const reusable = await this.deps.orderRepository.findReusablePendingOrder(
        {
          userId: request.userId,
          checkoutFingerprint,
        },
      );

      if (reusable) {
        const now = new Date();
        const session = reusable.checkoutSession;

        if (
          session.expiresAt &&
          session.expiresAt > now &&
          session.url &&
          session.status === 'OPEN'
        ) {
          return {
            checkoutSession: session,
            redirectUrl: session.url,
            expiresAt: session.expiresAt,
            reused: true,
          };
        }

        return this.refreshExpiredSession({
          request,
          reusable,
        });
      }

      return this.createNewCheckout({
        request,
        pricing,
        checkoutFingerprint,
      });
    } finally {
      await this.deps.checkoutLock.release(request.userId);
    }
  }

  private async createNewCheckout(input: {
    request: CreateCheckoutRequest;
    pricing: ReturnType<PriceCalculatorService['calculate']>;
    checkoutFingerprint: string;
  }): Promise<CreateCheckoutResponse> {
    const order = this.orderFactory.create({
      userId: input.request.userId,
      pricing: input.pricing,
      checkoutFingerprint: input.checkoutFingerprint,
    });

    const payment = this.paymentFactory.create({
      order,
      provider: input.request.provider,
    });

    const orderWithPayment: OrderEntity = {
      ...order,
      paymentId: payment.id,
    };

    await this.deps.unitOfWork.execute(async ({ orders, payments }) => {
      await payments.save(payment);
      await orders.save(orderWithPayment);
    });

    return this.createProviderSessionAndPersist({
      request: input.request,
      order: orderWithPayment,
      payment,
    });
  }

  private async refreshExpiredSession(input: {
    request: CreateCheckoutRequest;
    reusable: {
      order: OrderEntity;
      payment: PaymentEntity;
      checkoutSession: CheckoutSessionEntity;
    };
  }): Promise<CreateCheckoutResponse> {
    await this.deps.unitOfWork.execute(async ({ checkoutSessions }) => {
      await checkoutSessions.markExpired(input.reusable.checkoutSession.id);
    });

    return this.createProviderSessionAndPersist({
      request: input.request,
      order: input.reusable.order,
      payment: input.reusable.payment,
    });
  }

  private async createProviderSessionAndPersist(input: {
    request: CreateCheckoutRequest;
    order: OrderEntity;
    payment: PaymentEntity;
  }): Promise<CreateCheckoutResponse> {
    const providerGateway = this.paymentProviderResolver.resolve(
      input.request.provider,
    );

    await this.deps.checkoutLock.extend(input.request.userId);

    const providerSession = await providerGateway.createCheckoutSession({
      orderId: input.order.id,
      userId: input.request.userId,
      provider: input.request.provider,
      amountCents: input.order.totalCents,
      currency: input.order.currency,
      successUrl: input.request.successUrl,
      cancelUrl: input.request.cancelUrl,
    });

    const checkoutSession = await this.deps.unitOfWork.execute(
      async ({ checkoutSessions, payments }) => {
        const firstReconcileAt = new Date(
          Date.now() + env.PAYMENT_RECONCILE_THRESHOLD_MINUTES * 60_000,
        );
        await payments.markProcessingAndScheduleReconcile(
          input.payment.id,
          firstReconcileAt,
        );

        return checkoutSessions.save(
          this.buildCheckoutSession({
            order: input.order,
            payment: input.payment,
            provider: input.request.provider,
            providerSession,
          }),
        );
      },
    );

    return {
      checkoutSession,
      redirectUrl: providerSession.redirectUrl,
      expiresAt: providerSession.expiresAt,
      clientSecret: providerSession.clientSecret,
      publicKey: providerSession.publicKey,
      reused: false,
    };
  }

  private async loadCart(userId: string): Promise<CheckoutCartSnapshot | null> {
    const cart = await this.deps.cartRepository.findByUserId(userId);

    if (!cart) {
      return null;
    }

    return mapCartToCheckoutSnapshot(cart);
  }

  private async loadEnrolledCourseIds(
    userId: string,
    cart: CheckoutCartSnapshot | null,
  ): Promise<Set<string>> {
    if (!cart || cart.items.length === 0) {
      return new Set();
    }

    const courseIds = cart.items.map((item) => item.courseId);

    return this.deps.cartRepository.findActiveEnrollmentCourseIds(
      userId,
      courseIds,
    );
  }

  private buildCheckoutSession(input: {
    order: OrderEntity;
    payment: PaymentEntity;
    provider: CreateCheckoutRequest['provider'];
    providerSession: {
      providerSessionId: string;
      redirectUrl: string;
      expiresAt: Date;
    };
  }): CheckoutSessionEntity {
    return {
      id: randomUUID(),
      orderId: input.order.id,
      userId: input.order.userId,
      provider: input.provider,
      providerSessionId: input.providerSession.providerSessionId,
      status: 'OPEN',
      amountCents: input.payment.amountCents,
      currency: input.payment.currency,
      url: input.providerSession.redirectUrl,
      expiresAt: input.providerSession.expiresAt,
      createdAt: new Date(),
    };
  }
}
