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
          position: true,
          video: {
            select: {
              duration: true,
            },
          },
          attachments: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              name: true,
              url: true,
            },
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
