import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { env } from '@/config/env';
import { Currency } from '@prisma/client';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  try {
    const { userId, items, courseId, userEmail } = await req.json();

    if (!userId) {
      return new Response('Missing userId', { status: 400 });
    }

    const line_items: any[] = [];
    let totalCents = 0;
    const orderItemsData: any[] = [];

    // Handle cart items if provided, or single courseId
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const itemPriceCents = Math.round(Number(item.price) * 100);
        line_items.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.title,
              description: item.shortDescription || undefined,
            },
            unit_amount: itemPriceCents,
          },
          quantity: 1,
        });
        totalCents += itemPriceCents;
        orderItemsData.push({
          courseId: item.id,
          priceCents: itemPriceCents,
          currency: Currency.USD,
        });
      }
    } else if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return new Response('Course not found', { status: 404 });
      }

      const priceCents = Math.round(Number(course.price) * 100);
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: course.title,
            description: course.shortDescription || undefined,
          },
          unit_amount: priceCents,
        },
        quantity: 1,
      });
      totalCents = priceCents;
      orderItemsData.push({
        courseId: course.id,
        priceCents: priceCents,
        currency: Currency.USD,
      });
    } else {
      return new Response('Missing items or courseId', { status: 400 });
    }

    // 1️⃣ Create Order record
    const order = await prisma.order.create({
      data: {
        userId,
        orderNumber: `ORD-${randomUUID()}`,
        subtotalCents: totalCents,
        totalCents: totalCents,
        currency: Currency.USD,
        status: 'PENDING',
        items: {
          create: orderItemsData,
        },
      },
    });

    // 2️⃣ Create Stripe session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}&orderId=${order.id}`,
      cancel_url: items
        ? `${env.NEXT_PUBLIC_APP_URL}/cart`
        : `${env.NEXT_PUBLIC_APP_URL}/courses`,
      customer_email: userEmail || undefined,
      metadata: {
        orderId: order.id,
        userId,
      },
    });

    // 3️⃣ Store session ID in order
    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripeSessionId: session.id,
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('[CHECKOUT_ERROR]', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
