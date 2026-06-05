'use server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { env } from '@/config/env';
import { stripe } from '@/lib/stripe';

export async function addToCart(courseId: string, userId?: string) {
  try {
    if (userId) {
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userExists) {
        return {
          success: false,
          error: 'جلسة المستخدم منتهية، يرجى إعادة تسجيل الدخول',
        };
      }
      let cart = await prisma.cart.findUnique({
        where: { userId: userId },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId: userId },
        });
      }

      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { price: true },
      });

      if (!course) {
        return { success: false, error: 'هذه الدورة غير موجودة' };
      }

      await prisma.cartItem.upsert({
        where: {
          cartId_courseId: {
            cartId: cart.id,
            courseId: courseId,
          },
        },
        update: {},
        create: {
          cartId: cart.id,
          courseId: courseId,
          price: course.price,
        },
      });

      revalidatePath('/cart');
      revalidatePath(`/courses/${courseId}`);

      return { success: true, method: 'database' };
    }

    const cookieStore = await cookies();
    const guestCart = cookieStore.get('guest_cart')?.value;
    const cartItems: string[] = guestCart ? JSON.parse(guestCart) : [];
    if (!cartItems.includes(courseId)) {
      cartItems.push(courseId);

      cookieStore.set('guest_cart', JSON.stringify(cartItems), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: 'lax',
      });
    }

    revalidatePath('/cart');
    return { success: true, method: 'cookie' };
  } catch (error) {
    console.error('Cart Error:', error);
    return { success: false, error: 'فشلت عملية الإضافة' };
  }
}

export async function mergeCart(userId: string) {
  const cookieStore = await cookies();
  const guestCart = cookieStore.get('guest_cart')?.value;

  if (guestCart) {
    try {
      const courseIds: string[] = JSON.parse(guestCart);

      const cart = await prisma.cart.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });

      const courses = await prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: { id: true, price: true },
      });

      await Promise.all(
        courses.map((course) =>
          prisma.cartItem.upsert({
            where: {
              cartId_courseId: { cartId: cart.id, courseId: course.id },
            },
            update: {},
            create: {
              cartId: cart.id,
              courseId: course.id,
              price: course.price,
            },
          }),
        ),
      );

      cookieStore.delete('guest_cart');
    } catch (e) {
      console.error('Error merging cart:', e);
    }
  }
}

export async function removeFromCart(courseId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  try {
    if (userId) {
      const userCart = await prisma.cart.findUnique({
        where: { userId },
      });

      if (userCart) {
        await prisma.cartItem.delete({
          where: {
            cartId_courseId: {
              cartId: userCart.id,
              courseId: courseId,
            },
          },
        });
      }
    } else {
      const cookieStore = await cookies();
      const guestCart = cookieStore.get('guest_cart')?.value;

      if (guestCart) {
        let courseIds = JSON.parse(guestCart) as string[];
        courseIds = courseIds.filter((id) => id !== courseId);

        cookieStore.set('guest_cart', JSON.stringify(courseIds), {
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });
      }
    }

    revalidatePath('/cart');
    return { success: true };
  } catch (error) {
    console.error('Delete Error:', error);
    return { success: false, message: 'فشل حذف الدورة' };
  }
}

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

    // We don't create the Order record yet, we'll do it in the webhook
    // Or we can create it here as PENDING like in the single course checkout
    // Let's follow the same pattern as in src/app/api/checkout/route.ts

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

    // Update Stripe session metadata now that we have the real IDs
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
