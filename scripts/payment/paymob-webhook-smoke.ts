/**
 * Local Paymob webhook smoke test.
 *
 * Posts a signed processed-transaction payload to the app's webhook route.
 * Use this to verify HMAC + fulfillment without exposing localhost to Paymob.
 *
 * Prerequisites:
 *   - app running (`pnpm dev`)
 *   - Redis reachable
 *   - PAYMOB_HMAC_SECRET set in .env
 *   - an existing PENDING order (e.g. after opening /payment/checkout)
 *
 * Usage:
 *   pnpm payment:webhook-smoke -- --order-id <order-uuid>
 *   pnpm payment:webhook-smoke -- --create-checkout
 *   pnpm payment:webhook-smoke -- --order-id <id> --fail
 *   pnpm payment:webhook-smoke -- --order-id <id> --base-url https://xxxx.ngrok-free.app
 */
import 'dotenv/config';
import { randomInt } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { createCheckoutUseCase } from '@/features/payments/infrastructure/di/payments.container';
import { PaymentProvider } from '@/features/payments/domain';
import { readPaymobConfig } from '@/features/payments/infrastructure/gateways/paymob/paymob.config';
import { computePaymobTransactionHmac } from '@/features/payments/infrastructure/gateways/paymob/paymob.hmac';

type CliOptions = {
  orderId: string | null;
  createCheckout: boolean;
  fail: boolean;
  baseUrl: string;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    orderId: null,
    createCheckout: false,
    fail: false,
    baseUrl: process.env.WEBHOOK_SMOKE_BASE_URL ?? 'http://localhost:3000',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--order-id') {
      options.orderId = argv[++i] ?? null;
      continue;
    }
    if (arg === '--create-checkout') {
      options.createCheckout = true;
      continue;
    }
    if (arg === '--fail') {
      options.fail = true;
      continue;
    }
    if (arg === '--base-url') {
      options.baseUrl = (argv[++i] ?? options.baseUrl).replace(/\/$/, '');
      continue;
    }
  }

  return options;
}

async function resolveOrderId(options: CliOptions): Promise<string> {
  if (options.orderId) {
    return options.orderId;
  }

  if (!options.createCheckout) {
    throw new Error(
      'Pass --order-id <uuid> (from checkout) or --create-checkout to create one.',
    );
  }

  const student = await prisma.user.findFirst({
    where: { role: 'STUDENT' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true },
  });

  if (!student) {
    throw new Error('No STUDENT user found. Run `pnpm seed` first.');
  }

  const enrolledCourseIds = await prisma.enrollment.findMany({
    where: { studentId: student.id, status: 'ACTIVE' },
    select: { courseId: true },
  });

  const course = await prisma.course.findFirst({
    where: {
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      id: { notIn: enrolledCourseIds.map((row) => row.courseId) },
    },
    select: { id: true, price: true, currency: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!course) {
    throw new Error('No purchasable course found for smoke checkout.');
  }

  const price = Number(course.price);
  const cart = await prisma.cart.upsert({
    where: { userId: student.id },
    create: {
      userId: student.id,
      currency: course.currency,
      subtotal: price,
      discount: 0,
      total: price,
    },
    update: {
      couponId: null,
      currency: course.currency,
      subtotal: price,
      discount: 0,
      total: price,
    },
  });

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      courseId: course.id,
      price,
      currency: course.currency,
    },
  });

  const checkout = await createCheckoutUseCase().execute({
    userId: student.id,
    provider: PaymentProvider.PAYMOB,
    successUrl: `${options.baseUrl}/payment/success`,
    cancelUrl: `${options.baseUrl}/cart`,
  });

  console.log(`Created checkout for ${student.email}`);
  console.log(`orderId: ${checkout.checkoutSession.orderId}`);

  return checkout.checkoutSession.orderId;
}

function buildPaymobPayload(input: {
  orderId: string;
  amountCents: number;
  currency: string;
  success: boolean;
  transactionId: number;
  paymobOrderId: number;
}) {
  const transaction = {
    id: input.transactionId,
    success: input.success,
    pending: false,
    amount_cents: input.amountCents,
    currency: input.currency,
    integration_id: 0,
    error_occured: !input.success,
    created_at: new Date().toISOString(),
    has_parent_transaction: false,
    is_3d_secure: false,
    is_auth: false,
    is_capture: false,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    owner: 0,
    special_reference: input.orderId,
    order: {
      id: input.paymobOrderId,
      merchant_order_id: input.orderId,
    },
    source_data: {
      pan: '0008',
      sub_type: 'Visa',
      type: 'card',
    },
    data: input.success ? undefined : { message: 'Smoke test declined' },
  };

  return {
    type: 'TRANSACTION',
    obj: transaction,
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const config = readPaymobConfig();

  if (!config?.hmacSecret) {
    throw new Error('PAYMOB_HMAC_SECRET is missing in .env');
  }

  const orderId = await resolveOrderId(options);
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { totalCents: true, currency: true, status: true },
  });

  console.log(`Order status before webhook: ${order.status}`);

  const transactionId = randomInt(100_000, 9_999_999);
  const paymobOrderId = randomInt(100_000, 9_999_999);
  const success = !options.fail;
  const payload = buildPaymobPayload({
    orderId,
    amountCents: order.totalCents,
    currency: order.currency,
    success,
    transactionId,
    paymobOrderId,
  });

  const transaction = payload.obj as Record<string, unknown>;
  const hmac = computePaymobTransactionHmac({
    transaction,
    hmacSecret: config.hmacSecret,
  });

  const url = `${options.baseUrl}/api/payment/webhooks/paymob?hmac=${encodeURIComponent(hmac)}`;
  console.log(`POST ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await response.text();
  console.log(`Response: ${response.status}`);
  console.log(body);

  if (!response.ok) {
    process.exitCode = 1;
    return;
  }

  const updated = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { payment: true },
  });

  console.log(
    `Order after webhook: ${updated.status} | payment: ${updated.payment?.status ?? 'n/a'}`,
  );
}

main()
  .catch((error) => {
    console.error('Paymob webhook smoke test failed');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(process.exitCode ?? 0);
  });
