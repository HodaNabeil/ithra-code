'use server';

import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { env } from '@/config/env';
import { stripe } from '@/lib/stripe';

export async function createCartCheckout(userId: string, userEmail: string) {
  try {
    const userCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!userCart || userCart.items.length === 0) {
      throw new Error('السلة فارغة');
    }

    const headerList = await headers();
    const origin = headerList.get('origin') || env.NEXT_PUBLIC_APP_URL;

    const lineItems = userCart.items.map((item) => ({
      price_data: {
        currency: (item.course.currency || 'EGP').toLowerCase(),
        product_data: {
          name: item.course.title,
          description: item.course.shortDescription || undefined,
        },
        unit_amount: Math.round(Number(item.course.price) * 100),
      },
      quantity: 1,
    }));

    const orderNumber = `ORD-CART-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const stripeSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      customer_email: userEmail,
      metadata: {
        userId: userId,
        orderNumber,
        isCartCheckout: 'true',
      },
    });

    const totalCents = lineItems.reduce(
      (acc, item) => acc + item.price_data.unit_amount,
      0,
    );
    const currency = userCart.items[0]?.course.currency || 'EGP';

    const [payment, order] = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          amountCents: totalCents,
          currency,
          provider: 'STRIPE',
          status: 'PENDING',
          stripeSessionId: stripeSession.id,
        },
      });

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: userId,
          subtotalCents: totalCents,
          totalCents: totalCents,
          currency,
          status: 'PENDING',
          paymentId: payment.id,
          stripeSessionId: stripeSession.id,
          items: {
            create: userCart.items.map((item) => ({
              courseId: item.course.id,
              priceCents: Math.round(Number(item.course.price) * 100),
              currency: item.course.currency || 'EGP',
            })),
          },
        },
      });

      return [payment, order];
    });

    await stripe.checkout.sessions.update(stripeSession.id, {
      metadata: {
        userId: userId,
        orderId: order.id,
        paymentId: payment.id,
        isCartCheckout: 'true',
      },
    });

    return { url: stripeSession.url };
  } catch (error) {
    console.error('[CART_CHECKOUT_ERROR]', error);
    throw error;
  }
}
