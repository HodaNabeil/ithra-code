import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/api-response';
import { addCartItemBodySchema } from '@/features/cart/presentation/validators/add-cart-item.validator';
import { Prisma, EnrollmentStatus, CourseStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    // 1. Authentication Check & Security
    const session = await auth();
    if (!session?.user?.id) {
      return apiError('يجب تسجيل الدخول لإضافة عناصر إلى السلة', 401);
    }

    const userId = session.user.id;

    // 2. Strict Input Validation (Instant 400 if invalid CUID)
    const body = await req.json().catch(() => ({}));
    const parsed = addCartItemBodySchema.safeParse(body);

    if (!parsed.success) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = (parsed as any).error;
      const message = error?.issues?.[0]?.message || 'بيانات الطلب غير صالحة';
      return apiError(message, 400);
    }

    const { courseId } = parsed.data;

    // 3. Resilient Business Logic inside a Prisma $transaction (Race Condition Isolation)
    const result = await prisma.$transaction(async (tx) => {
      // 3.1. Course Existence & Lean Fetching (Avoid over-fetching arrays)
      const course = await tx.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          status: true,
          price: true,
          currency: true,
        },
      });

      if (!course) {
        throw new Error('COURSE_NOT_FOUND');
      }

      // 3.2. Status Check
      if (course.status !== CourseStatus.PUBLISHED) {
        throw new Error('COURSE_NOT_PUBLISHED');
      }

      // 3.3. Free Course Blocker (Price = 0 must use direct enrollment path)
      if (course.price.isZero() || course.price.toNumber() <= 0) {
        throw new Error('FREE_COURSE_DIRECT_ENROLLMENT');
      }

      // 3.4. Pre-enrollment Check (Verify user doesn't already own the course)
      const existingEnrollment = await tx.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: userId,
            courseId,
          },
        },
        select: { status: true },
      });

      if (
        existingEnrollment &&
        (existingEnrollment.status === EnrollmentStatus.ACTIVE ||
          existingEnrollment.status === EnrollmentStatus.COMPLETED)
      ) {
        throw new Error('ALREADY_ENROLLED');
      }

      // 3.5. Duplicate Prevention (Explicit code-level check)
      const userCart = await tx.cart.findUnique({
        where: { userId },
        include: { items: true },
      });

      if (userCart) {
        const alreadyInCart = userCart.items.some(
          (item) => item.courseId === courseId,
        );
        if (alreadyInCart) {
          throw new Error('ALREADY_IN_CART');
        }

        // 3.6. Currency Consistency (Prevent mixed currency checkout errors)
        const firstItem = userCart.items[0];
        if (firstItem) {
          const firstItemCurrency = firstItem.currency;
          if (course.currency !== firstItemCurrency) {
            throw new Error('CURRENCY_MISMATCH');
          }
        }
      }

      // 3.7. Price Snapshotting (Freeze quoted price at moment of addition)
      const cart = await tx.cart.upsert({
        where: { userId },
        create: {
          userId,
          currency: course.currency,
          subtotal: course.price,
          total: course.price,
          items: {
            create: {
              courseId,
              price: course.price,
              currency: course.currency,
            },
          },
        },
        update: {
          items: {
            create: {
              courseId,
              price: course.price,
              currency: course.currency,
            },
          },
        },
        include: { items: true },
      });

      // 3.8. Recalculate Totals (Atomic update)
      const subtotal = cart.items.reduce(
        (acc, item) => acc.plus(item.price),
        new Prisma.Decimal(0),
      );

      // Discount logic would normally go here (set to 0 for now)
      const discount = new Prisma.Decimal(0);
      const total = subtotal.minus(discount);

      return await tx.cart.update({
        where: { id: cart.id },
        data: {
          subtotal,
          discount,
          total,
        },
        include: {
          items: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  thumbnailUrl: true,
                  slug: true,
                },
              },
            },
          },
        },
      });
    });

    /**
     * CHECKOUT RE-VALIDATION ARCHITECTURE (CRUCIAL DOWNSTREAM FIX):
     * TODO: The upcoming `POST /api/checkout` endpoint MUST NOT blindly trust these saved snapshots.
     * It must enforce a secondary verification policy that re-checks if the courses are still `PUBLISHED`
     * and that the user hasn't enrolled elsewhere right before pulling funds.
     */

    // Transform to match CartData DTO
    const transformedCart = {
      id: result.id,
      userId: result.userId,
      subtotal: result.subtotal.toNumber(),
      discount: result.discount.toNumber(),
      total: result.total.toNumber(),
      currency: result.currency,
      items: result.items.map((item) => ({
        id: item.id,
        courseId: item.courseId,
        price: item.price.toNumber(),
        currency: item.currency,
        title: item.course.title,
        slug: item.course.slug,
        thumbnailUrl: item.course.thumbnailUrl,
        addedAt: item.addedAt.toISOString(),
        totalDurationText: '', // Placeholder, would require additional fetching
      })),
      coupon: null, // Logic for coupon can be added here
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };

    return apiSuccess(transformedCart, 'تمت إضافة الدورة إلى السلة بنجاح');
  } catch (error: unknown) {
    // 5. Critical Security & Edge Case Fixes
    
    // Handle Prisma's Unique Constraint violation (P2002) cleanly
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return apiError('هذه الدورة موجودة بالفعل في سلتك', 400);
      }
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Map business logic errors to friendly Arabic responses
    const errorMap: Record<string, { message: string; status: number }> = {
      COURSE_NOT_FOUND: { message: 'الدورة التدريبية غير موجودة', status: 404 },
      COURSE_NOT_PUBLISHED: { message: 'هذه الدورة غير متاحة للشراء حالياً', status: 400 },
      FREE_COURSE_DIRECT_ENROLLMENT: { message: 'هذه الدورة مجانية، يمكنك التسجيل فيها مباشرة', status: 400 },
      ALREADY_ENROLLED: { message: 'أنت مشترك بالفعل في هذه الدورة', status: 400 },
      ALREADY_IN_CART: { message: 'هذه الدورة موجودة بالفعل في سلتك', status: 400 },
      CURRENCY_MISMATCH: { message: 'لا يمكن إضافة دورات بعملات مختلفة إلى نفس السلة', status: 400 },
    };

    const businessError = errorMap[errorMessage];
    if (businessError) {
      return apiError(businessError.message, businessError.status);
    }

    console.error('[CART_ADD_ERROR]', error);
    return apiError('حدث خطأ غير متوقع أثناء إضافة الدورة إلى السلة', 500);
  }
}
