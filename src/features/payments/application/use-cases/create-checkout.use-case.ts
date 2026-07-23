import type { CartRepository } from '@/features/cart/domain/repositories/cart.repository';
import type {
  CheckoutSessionEntity,
  OrderEntity,
  PaymentEntity,
} from '@/features/payments/domain';
import type { CreateCheckoutRequest } from '../contracts/create-checkout.request';
import type { CreateCheckoutResponse } from '../contracts/create-checkout.response';
import { randomUUID } from 'node:crypto';
import { OrderFactory } from '../factories/order.factory';
import { PaymentFactory } from '../factories/payment.factory';
import type { UnitOfWork } from '../ports';
import type { PaymentProviderGateway } from '../providers/payment-provider.gateway';
import { PaymentProviderResolver } from '../providers/payment-provider.resolver';
import { PriceCalculatorService } from '../services/price-calculator.service';
import {
  CheckoutValidator,
  type CheckoutCartSnapshot,
} from '../validators/checkout.validator';
import { mapCartToCheckoutSnapshot } from '../mappers/checkout-cart.mapper';

export type CreateCheckoutUseCaseDeps = {
  cartRepository: CartRepository;
  unitOfWork: UnitOfWork;
  checkoutValidator?: CheckoutValidator;
  priceCalculator?: PriceCalculatorService;
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
  private readonly orderFactory: OrderFactory;
  private readonly paymentFactory: PaymentFactory;
  private readonly paymentProviderResolver: PaymentProviderResolver;

  constructor(private readonly deps: CreateCheckoutUseCaseDeps) {
    this.checkoutValidator =
      deps.checkoutValidator ?? new CheckoutValidator();
    this.priceCalculator = deps.priceCalculator ?? new PriceCalculatorService();
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

    const order = this.orderFactory.create({
      userId: request.userId,
      pricing,
    });

    const payment = this.paymentFactory.create({
      order,
      provider: request.provider,
    });

    const orderWithPayment: OrderEntity = {
      ...order,
      paymentId: payment.id,
    };

    // Tx1: persist payment then order atomically, and COMMIT before the
    // external provider call. `payments.id` is the FK target of
    // `orders.payment_id`, so the payment must be inserted first.
    await this.deps.unitOfWork.execute(async ({ orders, payments }) => {
      await payments.save(payment);
      await orders.save(orderWithPayment);
    });

    const providerGateway = this.paymentProviderResolver.resolve(
      request.provider,
    );

    const providerSession = await providerGateway.createCheckoutSession({
      orderId: order.id,
      userId: request.userId,
      provider: request.provider,
      amountCents: order.totalCents,
      currency: order.currency,
      successUrl: request.successUrl,
      cancelUrl: request.cancelUrl,
    });

    // Tx2: record the checkout session and move the payment to PROCESSING.
    const checkoutSession = await this.deps.unitOfWork.execute(
      async ({ checkoutSessions, payments }) => {
        await payments.markProcessing(payment.id);

        return checkoutSessions.save(
          this.buildCheckoutSession({
            order: orderWithPayment,
            payment,
            provider: request.provider,
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
    };
  }

  private async loadCart(
    userId: string,
  ): Promise<CheckoutCartSnapshot | null> {
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
