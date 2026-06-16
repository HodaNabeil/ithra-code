import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';
import { CartDataType } from '@/types/cart/cart';

type CartWithItems = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        course: {
          include: {
            sections: {
              include: { lectures: { select: { videoDuration: true } } };
            };
          };
        };
      };
    };
  };
}>;

type CourseWithContent = Prisma.CourseGetPayload<{
  include: {
    sections: {
      include: { lectures: { select: { videoDuration: true } } };
    };
  };
}>;

export async function getCart(): Promise<{
  success: boolean;
  data: CartDataType;
  message: string;
}> {
  const session = await auth();
  const userId = session?.user?.id;

  let cartItemsData: CourseWithContent[] = [];
  let dbCartRecord: CartWithItems | null = null;

  if (userId) {
    dbCartRecord = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            course: {
              include: {
                sections: {
                  include: { lectures: { select: { videoDuration: true } } },
                },
              },
            },
          },
        },
      },
    });
    cartItemsData =
      dbCartRecord?.items.map((item) => item.course as CourseWithContent) || [];
  } else {
    const cookieStore = await cookies();
    const guestCartCookie = cookieStore.get('guest_cart')?.value;

    if (guestCartCookie) {
      try {
        const courseIds = JSON.parse(guestCartCookie);
        cartItemsData = await prisma.course.findMany({
          where: { id: { in: courseIds } },
          include: {
            sections: {
              include: { lectures: { select: { videoDuration: true } } },
            },
          },
        });
      } catch (_e) {
        cartItemsData = [];
      }
    }
  }

  const serializedItems = cartItemsData.map((course) => {
    const allLectures = course.sections?.flatMap((s) => s.lectures) || [];
    const totalLectures = allLectures.length;
    const totalSeconds = allLectures.reduce(
      (acc: number, lec) => acc + (lec.videoDuration || 0),
      0,
    );

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return {
      ...course,
      price: Number(course.price),
      compareAtPrice: course.compareAtPrice
        ? Number(course.compareAtPrice)
        : null,
      objectives: course.objectives ?? [],
      rating: 0,
      ratingCount: 0,
      lecturesCount: totalLectures,
      hours: hours > 0 ? hours : null,
      totalDurationText:
        hours > 0 ? `${hours} ساعة و ${minutes} دقيقة` : `${minutes} دقيقة`,
      createdAt: course.createdAt?.toISOString(),
      updatedAt: course.updatedAt?.toISOString(),
      publishedAt: course.publishedAt?.toISOString() || null,
      sections: undefined,
    };
  });

  const subtotal = serializedItems.reduce((acc, item) => acc + item.price, 0);
  const discount = 0;

  return {
    success: true,
    data: {
      id: dbCartRecord?.id || 'guest',
      userId: userId || null,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: discount,
      total: parseFloat((subtotal - discount).toFixed(2)),
      currency: serializedItems[0]?.currency || 'EGP',
      items: serializedItems,
      coupon: {
        code: 'NONE',
        type: 'PERCENTAGE',
        value: 0,
        description: 'لا يوجد كود خصم',
      },
      createdAt:
        dbCartRecord?.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt:
        dbCartRecord?.updatedAt?.toISOString() || new Date().toISOString(),
    },
    message: 'تم جلب بيانات السلة بنجاح',
  };
}
