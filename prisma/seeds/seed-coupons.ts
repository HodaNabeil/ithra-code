/* eslint-disable no-console */
import { PrismaClient, CouponType, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!.replace(
  /([?&]sslmode=)(require|prefer|verify-ca)\b/gi,
  '$1verify-full'
);

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

async function seedCoupons() {
  console.log('🎟️  Seeding coupons...');

  // Get all existing courses to link coupons to
  const courses = await prisma.course.findMany({
    select: { id: true },
    take: 5,
  });

  if (courses.length === 0) {
    console.log(
      '⚠️  No courses found. Skipping coupon seeding (coupons require courses).',
    );
    return;
  }

  const courseIds = courses.map((c) => c.id);
  console.log(`📚 Found ${courseIds.length} courses to link coupons to`);

  // Percentage discount coupon
  await prisma.coupon.upsert({
    where: { code: 'SAVE20' },
    update: {},
    create: {
      code: 'SAVE20',
      description: '20% off selected courses',
      type: CouponType.PERCENTAGE,
      value: new Prisma.Decimal(20),
      isActive: true,
      maxUses: 100,
      usedCount: 0,
      maxUsesPerUser: 1,
      courses: {
        create: courseIds.map((courseId) => ({
          courseId,
        })),
      },
    },
  });

  // Fixed amount discount coupon
  await prisma.coupon.upsert({
    where: { code: 'DISCOUNT10' },
    update: {},
    create: {
      code: 'DISCOUNT10',
      description: '$10 off your order',
      type: CouponType.FIXED,
      value: new Prisma.Decimal(10),
      isActive: true,
      maxUses: 50,
      usedCount: 0,
      maxUsesPerUser: 1,
      minOrderAmount: new Prisma.Decimal(50),
      courses: {
        create: courseIds.map((courseId) => ({
          courseId,
        })),
      },
    },
  });

  // Limited time offer
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + 30);

  await prisma.coupon.upsert({
    where: { code: 'BLACKFRIDAY' },
    update: {},
    create: {
      code: 'BLACKFRIDAY',
      description: 'Black Friday - 30% off',
      type: CouponType.PERCENTAGE,
      value: new Prisma.Decimal(30),
      isActive: true,
      startsAt: now,
      expiresAt: future,
      maxUses: 200,
      usedCount: 0,
      maxUsesPerUser: 1,
      courses: {
        create: courseIds.map((courseId) => ({
          courseId,
        })),
      },
    },
  });

  console.log('✅ Coupons seeded successfully');
}

async function main() {
  try {
    await seedCoupons();
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
