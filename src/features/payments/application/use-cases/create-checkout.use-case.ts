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
import type { PaymentProviderGateway } from '../providers/payment-provider.gateway';
import { PaymentProviderResolver } from '../providers/payment-provider.resolver';
import { PriceCalculatorService } from '../services/price-calculator.service';
import {
  CheckoutValidator,
  type CheckoutCartSnapshot,
} from '../validators/checkout.validator';
import { mapCartToCheckoutSnapshot } from '../mappers/checkout-cart.mapper';

export interface OrderRepository {
  save(order: OrderEntity): Promise<OrderEntity>;
}

export interface PaymentRepository {
  save(payment: PaymentEntity): Promise<PaymentEntity>;
}

export interface CheckoutSessionRepository {
  save(session: CheckoutSessionEntity): Promise<CheckoutSessionEntity>;
}

export type CreateCheckoutUseCaseDeps = {
  cartRepository: CartRepository;
  orderRepository: OrderRepository;
  paymentRepository: PaymentRepository;
  checkoutSessionRepository: CheckoutSessionRepository;
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

    // TODO: Wrap order + payment persistence in a database transaction.
    const savedOrder = await this.deps.orderRepository.save(orderWithPayment);
    const savedPayment = await this.deps.paymentRepository.save(payment);

    const providerGateway = this.paymentProviderResolver.resolve(
      request.provider,
    );

    const providerSession = await providerGateway.createCheckoutSession({
      orderId: savedOrder.id,
      userId: request.userId,
      provider: request.provider,
      amountCents: savedOrder.totalCents,
      currency: savedOrder.currency,
      successUrl: request.successUrl,
      cancelUrl: request.cancelUrl,
    });

    const checkoutSession = await this.deps.checkoutSessionRepository.save(
      this.buildCheckoutSession({
        order: savedOrder,
        payment: savedPayment,
        provider: request.provider,
        providerSession,
      }),
    );

    return {
      checkoutSession,
      redirectUrl: providerSession.redirectUrl,
      expiresAt: providerSession.expiresAt,
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
