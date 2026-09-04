'use server';
import { CourseStatus, Prisma } from '@prisma/client';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { publishCourseUseCase } from '@/features/courses/use-cases/publish-course.use-case';
import { defaultPublishCourseUseCaseDeps } from '@/features/courses/wiring/publish-course.wiring';

// 0. الحصول على المسارات (Paths)
export async function getPaths() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  return await prisma.path.findMany({
    select: {
      id: true,
      title: true,
    },
    orderBy: {
      title: 'asc',
    },
  });
}

// 1. إنشاء كورس جديد (Initial Create)
export async function createCourse(slug: string, pathId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  // حماية: التأكد إن اللي داخل هو الأدمن/المحاضر
  if (!userId) {
    throw new Error('غير مصرح لك بالقيام بهذا الإجراء');
  }

  const course = await prisma.course.create({
    data: {
      instructorId: userId,
      title: slug,
      description: '', // قيمة افتراضية للحقل المطلوب
      thumbnailUrl: '', // قيمة افتراضية للحقل المطلوب
      slug: slug.toLowerCase().trim().replace(/\s+/g, '-'), // تحويل العنوان لـ URL slug
      status: 'DRAFT',
      pathId, // تم التعديل ليأخذ القيمة من الواجهة
      price: 0,
    },
  });

  revalidatePath('/admin/courses');
  return course;
}

// 2. تحديث بيانات الكورس (Update)
export async function updateCourse(
  courseId: string,
  values: Prisma.CourseUpdateInput,
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) throw new Error('Unauthorized');

  const existing = await prisma.course.findFirst({
    where: {
      id: courseId,
      instructorId: userId,
    },
    select: {
      id: true,
      slug: true,
      status: true,
    },
  });

  if (!existing) {
    throw new Error('Unauthorized');
  }

  const nextStatus =
    typeof values.status === 'string' ? values.status : values.status?.set;

  if (
    nextStatus === CourseStatus.PUBLISHED &&
    existing.status !== CourseStatus.PUBLISHED
  ) {
    const published = await publishCourseUseCase(
      {
        courseIdOrSlug: existing.id,
        user: { id: userId, role: session.user.role },
      },
      defaultPublishCourseUseCaseDeps,
    );

    const {
      status: _status,
      publishedAt: _publishedAt,
      visibility: _visibility,
      ...remainingValues
    } = values;

    if (Object.keys(remainingValues).length === 0) {
      revalidatePath(`/admin/courses/${courseId}`);
      revalidatePath('/courses');
      return published;
    }

    const course = await prisma.course.update({
      where: {
        id: courseId,
        instructorId: userId,
      },
      data: remainingValues,
    });

    revalidatePath(`/admin/courses/${courseId}`);
    revalidatePath('/courses');
    return course;
  }

  const course = await prisma.course.update({
    where: {
      id: courseId,
      instructorId: userId,
    },
    data: {
      ...values,
    },
  });

  // تحديث الكاش لضمان ظهور التعديلات فوراً
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath('/courses');

  return course;
}

// 3. حذف الكورس (Delete)
export async function deleteCourse(courseId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) throw new Error('Unauthorized');

  // ملاحظة: لو الكورس فيه فيديوهات على Mux، يفضل تمسحي الـ Assets من Mux أولاً

  await prisma.course.delete({
    where: {
      id: courseId,
      instructorId: userId,
    },
  });

  revalidatePath('/admin/courses');
  redirect('/admin/courses');
}
