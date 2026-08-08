import { Prisma } from '@prisma/client';

export const myCourseLecturesSelect = Prisma.validator<Prisma.CourseSelect>()({
  title: true,
  sections: {
    orderBy: { position: 'asc' },
    select: {
      id: true,
      title: true,
      position: true,
      lectures: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          title: true,
          video: {
            select: {
              duration: true,
            },
          },
          _count: {
            select: { attachments: true },
          },
          progress: {
            select: {
              isCompleted: true,
            },
          },
        },
      },
    },
  },
});

export type DB_MyCourseLectures = Prisma.CourseGetPayload<{
  select: typeof myCourseLecturesSelect;
}>;
