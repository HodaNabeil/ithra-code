import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { paymentQueue } from '@/lib/queue';
import { logger } from '@/lib/logger';
import { env } from '@/config/env';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event;

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const orderId = session.metadata.orderId;

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { userId: true },
      });

      if (!order) {
        logger.error({ orderId }, 'Order not found in webhook');
        return new Response('Order not found', { status: 404 });
      }

      await paymentQueue.add(
        'process-successful-payment',
        {
          orderId,
          userId: order.userId,
          sessionId: session.id,
          paymentIntentId: session.payment_intent,
          amountTotal: session.amount_total,
        },
        {
          jobId: `stripe_${event.id}`, // Deduplication
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );

      logger.info(
        { orderId, eventId: event.id },
        'Payment event queued successfully',
      );

      return new Response('ok', { status: 200 });
    } catch (_err) {
      logger.error({ err: _err, orderId }, 'Failed to queue payment job');
      return new Response('Internal Error', { status: 500 });
    }
  }

  return new Response('ok');
}
