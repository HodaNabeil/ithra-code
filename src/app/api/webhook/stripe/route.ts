import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { paymentQueue } from '@/lib/queue';
import { logger } from '@/lib/logger';
import { env } from '@/config/env';
import { PaymentService } from '@/server/services/payment.service';
import Stripe from 'stripe';

async function resolveOrderFromPaymentIntent(intent: Stripe.PaymentIntent) {
  const orderId = intent.metadata?.orderId;

  if (orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, paymentId: true },
    });

    if (order) {
      return order;
    }
  }

  const payment = await PaymentService.findByProviderTransaction(
    'STRIPE',
    intent.id,
  );

  if (!payment) {
    return null;
  }

  return prisma.order.findFirst({
    where: { paymentId: payment.id },
    select: { id: true, userId: true, paymentId: true },
  });
}

async function getCardDetailsFromIntent(intent: Stripe.PaymentIntent) {
  const chargeId =
    typeof intent.latest_charge === 'string'
      ? intent.latest_charge
      : intent.latest_charge?.id;

  if (!chargeId) {
    return {
      paymentMethod: intent.payment_method_types[0],
    };
  }

  const charge = await stripe.charges.retrieve(chargeId);

  return {
    brand: charge.payment_method_details?.card?.brand,
    last4: charge.payment_method_details?.card?.last4,
    paymentMethod: charge.payment_method_details?.type,
  };
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (_err) {
    logger.error('Invalid webhook signature');
    return new Response('Invalid signature', { status: 400 });
  }

  logger.info({ type: event.type }, 'Webhook received');

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent;

    try {
      const order = await resolveOrderFromPaymentIntent(intent);

      if (!order) {
        logger.error(
          { paymentIntentId: intent.id },
          'No order found for payment intent',
        );
        return new Response('Order not found', { status: 404 });
      }

      const cardDetails = await getCardDetailsFromIntent(intent);

      await paymentQueue.add(
        'process-successful-payment',
        {
          orderId: order.id,
          userId: order.userId,
          paymentIntentId: intent.id,
          amountTotal: intent.amount_received ?? intent.amount,
          brand: cardDetails.brand,
          last4: cardDetails.last4,
          paymentMethod: cardDetails.paymentMethod,
        },
        {
          jobId: `stripe_${event.id}`,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );

      logger.info(
        { orderId: order.id, eventId: event.id },
        'Payment intent success queued for fulfillment',
      );
    } catch (_err) {
      logger.error(
        { err: _err, paymentIntentId: intent.id },
        'Failed to handle payment intent success',
      );
      return new Response('Internal Error', { status: 500 });
    }

    return new Response('ok', { status: 200 });
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent;

    try {
      await PaymentService.markPaymentFailedByProviderTransaction(
        'STRIPE',
        intent.id,
        {
          failureCode: intent.last_payment_error?.code ?? undefined,
          failureMessage: intent.last_payment_error?.message ?? undefined,
        },
      );

      logger.info({ paymentIntentId: intent.id }, 'Payment marked as failed');
    } catch (_err) {
      logger.error(
        { err: _err, paymentIntentId: intent.id },
        'Failed to handle payment failure',
      );
      return new Response('Internal Error', { status: 500 });
    }

    return new Response('ok', { status: 200 });
  }

  if (event.type === 'payment_intent.canceled') {
    const intent = event.data.object as Stripe.PaymentIntent;

    try {
      await PaymentService.markPaymentCancelledByProviderTransaction(
        'STRIPE',
        intent.id,
      );

      logger.info(
        { paymentIntentId: intent.id },
        'Payment marked as cancelled',
      );
    } catch (_err) {
      logger.error(
        { err: _err, paymentIntentId: intent.id },
        'Failed to handle payment cancellation',
      );
      return new Response('Internal Error', { status: 500 });
    }

    return new Response('ok', { status: 200 });
  }

  return new Response('ok');
}
