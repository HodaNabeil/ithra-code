/**
 * Backend payment engine E2E.
 *
 * System under test (via composition root only):
 *   CreateCheckoutUseCase → FakePaymentGateway → ProcessWebhookUseCase
 *   → Enrollment → Cart cleanup → Completed order
 *
 * Prerequisites (must already be true — not fixed here):
 *   - migrations applied (checkout_sessions, webhook_events)
 *   - Redis reachable
 *   - seed: at least one STUDENT and one PUBLISHED+PUBLIC course
 *
 * Usage:
 *   PAYMENT_PROVIDER=fake pnpm payment:e2e
 *   PAYMENT_PROVIDER=paymob pnpm payment:e2e
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import {
  createCheckoutUseCase,
  createProcessWebhookUseCase,
} from '@/features/payments/infrastructure/di/payments.container';
import {
  PaymentProvider,
  isSupportedPaymentProvider,
} from '@/features/payments/domain';
import type { ProcessWebhookRequest } from '@/features/payments/application';
import {
  CourseStatus,
  CourseVisibility,
  EnrollmentStatus,
  OrderStatus,
  PaymentStatus,
} from '@/generated/prisma/enums';

type AssertContext = Record<string, unknown>;

function assert(condition: unknown, message: string, ctx?: AssertContext): asserts condition {
  if (!condition) {
    const suffix = ctx ? ` ${JSON.stringify(ctx)}` : '';
    throw new Error(`ASSERT: ${message}${suffix}`);
  }
}

function resolveProvider(): PaymentProvider {
  const raw = (process.env.PAYMENT_PROVIDER ?? 'fake').toLowerCase().trim();

  if (raw === 'fake') {
    // CASH is always registered to FakePaymentGateway in the composition root.
    return PaymentProvider.CASH;
  }

  const upper = raw.toUpperCase();
  assert(
    isSupportedPaymentProvider(upper),
    `Unsupported PAYMENT_PROVIDER="${raw}". Use fake|paymob|stripe|paypal|cash`,
  );
  return upper;
}

async function findStudentId(): Promise<string> {
  const student = await prisma.user.findFirst({
    where: { role: 'STUDENT' },
    select: { id: true, email: true },
    orderBy: { createdAt: 'asc' },
  });
  assert(student, 'No STUDENT user in seed data');
  console.log(`  student: ${student.email} (${student.id})`);
  return student.id;
}

async function findPurchasableCourseId(studentId: string): Promise<{
  courseId: string;
  price: number;
  currency: 'EGP' | 'USD';
}> {
  const enrolled = await prisma.enrollment.findMany({
    where: { studentId, status: EnrollmentStatus.ACTIVE },
    select: { courseId: true },
  });
  const enrolledIds = enrolled.map((e) => e.courseId);

  const course = await prisma.course.findFirst({
    where: {
      status: CourseStatus.PUBLISHED,
      visibility: CourseVisibility.PUBLIC,
      id: { notIn: enrolledIds.length > 0 ? enrolledIds : undefined },
      NOT: { instructorId: studentId },
    },
    select: { id: true, title: true, price: true, currency: true },
    orderBy: { createdAt: 'asc' },
  });

  assert(
    course,
    'No PUBLISHED+PUBLIC course available that the student is not enrolled in',
  );
  console.log(`  course: ${course.title} (${course.id})`);

  return {
    courseId: course.id,
    price: Number(course.price),
    currency: course.currency as 'EGP' | 'USD',
  };
}

/** Fixture only — Prisma for seed setup, not for fulfillment wiring. */
async function ensureCartWithCourse(
  studentId: string,
  course: { courseId: string; price: number; currency: 'EGP' | 'USD' },
): Promise<void> {
  const cart = await prisma.cart.upsert({
    where: { userId: studentId },
    create: {
      userId: studentId,
      currency: course.currency,
      subtotal: course.price,
      discount: 0,
      total: course.price,
    },
    update: {
      couponId: null,
      currency: course.currency,
      subtotal: course.price,
      discount: 0,
      total: course.price,
    },
  });

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      courseId: course.courseId,
      price: course.price,
      currency: course.currency,
    },
  });
}

function buildWebhookRequest(input: {
  provider: PaymentProvider;
  orderId: string;
  outcome: 'succeeded' | 'failed';
  providerEventId: string;
}): ProcessWebhookRequest {
  return {
    provider: input.provider,
    providerEventId: input.providerEventId,
    type: 'e2e.payment.processed',
    payload: {
      source: 'payment:e2e',
      orderId: input.orderId,
      outcome: input.outcome,
    },
    outcome: input.outcome,
    orderId: input.orderId,
    providerTransactionId: `e2e_txn_${input.orderId}`,
    paymentMethod: 'card',
    last4: '4242',
    brand: 'visa',
    failureCode: input.outcome === 'failed' ? 'DECLINED' : null,
    failureMessage:
      input.outcome === 'failed' ? 'E2E simulated payment failure' : null,
  };
}

async function assertPostCheckoutState(orderId: string): Promise<{
  courseIds: string[];
  userId: string;
  totalCents: number;
  paymentId: string;
}> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, payment: true },
  });
  const session = await prisma.checkoutSession.findFirst({
    where: { orderId },
  });

  assert(order.status === OrderStatus.PENDING, 'Order should be PENDING after checkout', {
    status: order.status,
  });
  assert(order.payment, 'Order must have a payment after checkout');
  assert(
    order.payment.status === PaymentStatus.PROCESSING,
    'Payment should be PROCESSING after checkout',
    { status: order.payment.status },
  );
  assert(
    order.payment.amountCents === order.totalCents,
    'Payment amount must equal order total',
    {
      paymentAmount: order.payment.amountCents,
      orderTotal: order.totalCents,
    },
  );
  assert(session, 'CheckoutSession must be persisted');
  assert(
    session.status === 'OPEN',
    'CheckoutSession should be OPEN after checkout',
    { status: session.status },
  );
  assert(
    session.orderId === orderId && session.userId === order.userId,
    'CheckoutSession must reference order and user',
  );
  assert(
    session.amountCents === order.totalCents,
    'CheckoutSession amount must equal order total',
    {
      sessionAmount: session.amountCents,
      orderTotal: order.totalCents,
    },
  );
  assert(session.providerSessionId, 'CheckoutSession must store providerSessionId');

  return {
    courseIds: order.items.map((i) => i.courseId),
    userId: order.userId,
    totalCents: order.totalCents,
    paymentId: order.payment.id,
  };
}

async function countWebhookEvents(
  provider: PaymentProvider,
  providerEventId: string,
): Promise<number> {
  return prisma.webhookEvent.count({
    where: { provider, providerEventId },
  });
}

async function countActiveEnrollments(
  studentId: string,
  courseIds: string[],
): Promise<number> {
  return prisma.enrollment.count({
    where: {
      studentId,
      courseId: { in: courseIds },
      status: EnrollmentStatus.ACTIVE,
    },
  });
}

async function countCartItems(userId: string): Promise<number> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { _count: { select: { items: true } } },
  });
  return cart?._count.items ?? 0;
}

async function runFailedPaymentScenario(
  provider: PaymentProvider,
  studentId: string,
  course: { courseId: string; price: number; currency: 'EGP' | 'USD' },
): Promise<void> {
  console.log('\n[1/3] Failed payment scenario');
  await ensureCartWithCourse(studentId, course);

  const checkout = await createCheckoutUseCase().execute({
    userId: studentId,
    provider,
    successUrl: 'http://localhost:3000/payment/success',
    cancelUrl: 'http://localhost:3000/cart',
  });

  const orderId = checkout.checkoutSession.orderId;
  const mid = await assertPostCheckoutState(orderId);
  const cartBefore = await countCartItems(studentId);
  assert(cartBefore === 1, 'Cart should have 1 item before failed webhook');

  const providerEventId = `e2e_fail_${orderId}_${randomUUID()}`;
  const result = await createProcessWebhookUseCase().execute(
    buildWebhookRequest({
      provider,
      orderId,
      outcome: 'failed',
      providerEventId,
    }),
  );

  assert(result.fulfilled === false, 'Failed webhook must not fulfill');
  assert(result.duplicate === false, 'Failed webhook must not be duplicate');

  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: mid.paymentId },
  });
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
  });

  assert(
    payment.status === PaymentStatus.FAILED,
    'Payment must be FAILED',
    { status: payment.status },
  );
  assert(
    order.status === OrderStatus.PENDING,
    'Order must stay PENDING on payment failure',
    { status: order.status },
  );
  assert(
    (await countActiveEnrollments(studentId, mid.courseIds)) === 0,
    'No enrollments on failed payment',
  );
  assert(
    (await countCartItems(studentId)) === 1,
    'Cart must remain intact after failed payment',
  );
  assert(
    (await countWebhookEvents(provider, providerEventId)) === 1,
    'WebhookEvent must be stored once for failed payment',
  );

  console.log('  OK — payment FAILED, order PENDING, cart intact, no enrollment');
}

async function runSuccessAndDuplicateScenarios(
  provider: PaymentProvider,
  studentId: string,
  course: { courseId: string; price: number; currency: 'EGP' | 'USD' },
): Promise<void> {
  console.log('\n[2/3] Success payment scenario');
  await ensureCartWithCourse(studentId, course);

  const checkout = await createCheckoutUseCase().execute({
    userId: studentId,
    provider,
    successUrl: 'http://localhost:3000/payment/success',
    cancelUrl: 'http://localhost:3000/cart',
  });

  assert(checkout.redirectUrl.includes('order='), 'Fake redirect should include order id');
  const orderId = checkout.checkoutSession.orderId;
  const mid = await assertPostCheckoutState(orderId);

  const providerEventId = `e2e_ok_${orderId}_${randomUUID()}`;
  const webhookRequest = buildWebhookRequest({
    provider,
    orderId,
    outcome: 'succeeded',
    providerEventId,
  });

  const result = await createProcessWebhookUseCase().execute(webhookRequest);

  assert(result.fulfilled === true, 'Success webhook must fulfill');
  assert(result.duplicate === false, 'Success webhook must not be duplicate');
  assert(result.orderId === orderId, 'Response orderId must match');

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { payment: true, items: true },
  });
  const session = await prisma.checkoutSession.findFirst({
    where: { orderId },
  });

  assert(order.status === OrderStatus.COMPLETED, 'Order must be COMPLETED');
  assert(order.payment, 'Payment must exist');
  assert(
    order.payment.status === PaymentStatus.SUCCEEDED,
    'Payment must be SUCCEEDED',
  );
  assert(
    order.payment.amountCents === order.totalCents,
    'Payment amount must equal order total after success',
  );
  assert(session, 'CheckoutSession must still exist');
  assert(
    session.status === 'OPEN',
    'CheckoutSession remains OPEN (fulfillment does not mutate session yet)',
    { status: session.status },
  );
  assert(
    (await countWebhookEvents(provider, providerEventId)) === 1,
    'WebhookEvent must be stored exactly once',
  );
  assert(
    (await countActiveEnrollments(studentId, mid.courseIds)) === mid.courseIds.length,
    'ACTIVE enrollment required for every purchased course',
  );
  assert(
    (await countCartItems(studentId)) === 0,
    'Cart must be empty after successful fulfillment',
  );

  console.log('  OK — order COMPLETED, payment SUCCEEDED, enrolled, cart cleared');

  console.log('\n[3/3] Duplicate webhook scenario');
  const enrollmentsBefore = await countActiveEnrollments(
    studentId,
    mid.courseIds,
  );

  const dup = await createProcessWebhookUseCase().execute(webhookRequest);

  assert(dup.duplicate === true, 'Replay must return duplicate=true');
  assert(dup.fulfilled === false, 'Replay must not re-fulfill');
  assert(
    (await countWebhookEvents(provider, providerEventId)) === 1,
    'Duplicate must not create another WebhookEvent',
  );
  assert(
    (await countActiveEnrollments(studentId, mid.courseIds)) === enrollmentsBefore,
    'Duplicate must not create another enrollment',
  );

  console.log('  OK — duplicate=true, single WebhookEvent, no extra enrollment');
}

async function main(): Promise<void> {
  const provider = resolveProvider();
  console.log(`Payment engine E2E (provider config → ${provider})`);

  // Lightweight prerequisite probes (fail fast; do not repair).
  await prisma.checkoutSession.findFirst();
  await prisma.webhookEvent.findFirst();

  const studentId = await findStudentId();
  // Two distinct courses so failure order and success order never share enrollment state.
  const failCourse = await findPurchasableCourseId(studentId);
  await runFailedPaymentScenario(provider, studentId, failCourse);

  const successCourse = await findPurchasableCourseId(studentId);
  await runSuccessAndDuplicateScenarios(provider, studentId, successCourse);

  console.log('\nAll payment engine E2E scenarios passed.');
}

main()
  .catch((error) => {
    console.error('\nPayment engine E2E FAILED');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    // BullMQ / ioredis keep the process alive unless we exit explicitly.
    process.exit(process.exitCode ?? 0);
  });
