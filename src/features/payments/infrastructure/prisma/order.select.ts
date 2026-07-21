import { Prisma } from '@prisma/client';

export const orderWithItemsInclude = Prisma.validator<Prisma.OrderInclude>()({
  items: true,
});

export type DB_OrderWithItems = Prisma.OrderGetPayload<{
  include: typeof orderWithItemsInclude;
}>;
