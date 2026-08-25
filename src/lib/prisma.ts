import { env } from '@/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Normalize connection string to replace sslmode=require (or prefer or verify-ca) with sslmode=verify-full
// to prevent the pg-connection-string warning without altering behavior.
const connectionString = env.DATABASE_URL.replace(
  /([?&]sslmode=)(require|prefer|verify-ca)\b/gi,
  '$1verify-full',
);

// Create a connection pool for PostgreSQL
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
