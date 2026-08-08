import type { Prisma, PrismaClient } from '@prisma/client';

/**
 * A Prisma client that may be either the root client or a transaction-scoped
 * client. Repositories accept this so the same code path works inside and
 * outside a Unit of Work transaction.
 */
export type PrismaClientLike = PrismaClient | Prisma.TransactionClient;
