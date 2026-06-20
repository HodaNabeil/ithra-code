/* eslint-disable no-console */
import { EnrollmentStatus, PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

// ─── Reviewers ────────────────────────────────────────────────────────────────

const REVIEWERS = [
  { firstName: 'سارة', lastName: 'محمود' },
  { firstName: 'عمر', lastName: 'عبدالله' },
  { firstName: 'ليلى', lastName: 'حسن' },
  { firstName: 'يوسف', lastName: 'إبراهيم' },
  { firstName: 'نور', lastName: 'الدين' },
  { firstName: 'فاطمة', lastName: 'علي' },
  { firstName: 'خالد', lastName: 'المنصور' },
  { firstName: 'رنا', lastName: 'السيد' },
  { firstName: 'تامر', lastName: 'حسين' },
  { firstName: 'دينا', lastName: 'صالح' },
  { firstName: 'أحمد', lastName: 'الشريف' },
  { firstName: 'مريم', lastName: 'خالد' },
  { firstName: 'سامي', lastName: 'النجار' },
  { firstName: 'هدى', lastName: 'عمران' },
  { firstName: 'باسل', lastName: 'القاسم' },
  { firstName: 'إيمان', lastName: 'درويش' },
  { firstName: 'وليد', lastName: 'الجابر' },
  { firstName: 'منال', lastName: 'العتيبي' },
  { firstName: 'زياد', lastName: 'الحربي' },
  { firstName: 'رهف', lastName: 'السلمان' },
  { firstName: 'محمد', lastName: 'الغامدي' },
  { firstName: 'شهد', lastName: 'الزهراني' },
  { firstName: 'عبدالرحمن', lastName: 'الدوسري' },
  { firstName: 'نوف', lastName: 'القحطاني' },
  { firstName: 'فيصل', lastName: 'العسيري' },
  { firstName: 'لمى', lastName: 'الشمري' },
  { firstName: 'ناصر', lastName: 'المطيري' },
  { firstName: 'غادة', lastName: 'الرشيدي' },
  { firstName: 'طارق', lastName: 'البلوي' },
  { firstName: 'أسماء', lastName: 'الحمدان' },
];

// ─── Review data (30 entries) ─────────────────────────────────────────────────

const REVIEW_DATA: { rating: number; comment: string; daysAgo: number }[] = [
  // 5-star reviews
  {
    rating: 5,
    comment:
      'دورة ممتازة جداً! شرح واضح ومبسط وتغطي كل جوانب Node.js بشكل احترافي. استفدت كثيراً من الأمثلة العملية.',
    daysAgo: 2,
  },
  {
    rating: 5,
    comment:
      'أفضل دورة Node.js تعلمتها باللغة العربية. المدرب يشرح بأسلوب رائع ومشوق. أنصح بها كل من يريد تعلم تطوير الخلفية.',
    daysAgo: 4,
  },
  {
    rating: 5,
    comment:
      'محتوى ثري جداً وتغطية شاملة من الصفر حتى الاحتراف. المشاريع العملية ساعدتني على فهم المفاهيم بشكل أعمق.',
    daysAgo: 7,
  },
  {
    rating: 5,
    comment:
      'واحدة من أفضل الدورات التي حضرتها. الأسلوب العملي المتبع في الشرح يجعل فهم المفاهيم المعقدة أمراً سهلاً.',
    daysAgo: 10,
  },
  {
    rating: 5,
    comment:
      'أنهيت الدورة في أسبوعين وأنا الآن قادر على بناء تطبيقات خلفية كاملة. شكراً جزيلاً على هذا المحتوى الرائع!',
    daysAgo: 13,
  },
  {
    rating: 5,
    comment:
      'الدورة تتجاوز توقعاتي بكثير. الشرح منهجي ومتسلسل ويبني فهماً حقيقياً للغة وليس مجرد حفظ. استمر!',
    daysAgo: 17,
  },
  {
    rating: 5,
    comment:
      'بدأت الدورة وأنا لا أعرف شيئاً عن Node.js والآن أستطيع بناء APIs كاملة. هذا هو التعليم الحقيقي!',
    daysAgo: 21,
  },
  {
    rating: 5,
    comment:
      'جودة الصوت والصورة ممتازة والشرح احترافي. الدورة تستحق كل ريال دفعته. أنصح بها بشدة.',
    daysAgo: 25,
  },
  {
    rating: 5,
    comment:
      'المشاريع التطبيقية في نهاية كل قسم هي ما جعل هذه الدورة استثنائية. تعلمت أكثر بكثير مما توقعت.',
    daysAgo: 30,
  },
  {
    rating: 5,
    comment:
      'أفضل استثمار قمت به في تطوير مهاراتي. الدورة شاملة ومنظمة وتغطي أحدث الممارسات في عالم Node.js.',
    daysAgo: 35,
  },
  {
    rating: 5,
    comment:
      'الدورة غيّرت مساري المهني تماماً. حصلت على وظيفتي الأولى كمطور خلفية بعد إكمالها. شكراً!',
    daysAgo: 40,
  },
  {
    rating: 5,
    comment:
      'شرح Express وMongoose والمصادقة كان رائعاً. كل موضوع يُشرح بعمق كافٍ مع أمثلة حقيقية من بيئة العمل.',
    daysAgo: 45,
  },

  // 4-star reviews
  {
    rating: 4,
    comment:
      'دورة قيّمة ومحتواها ممتاز. كنت أتمنى أن تكون هناك تمارين إضافية بعد كل قسم، لكن بشكل عام رائعة.',
    daysAgo: 8,
  },
  {
    rating: 4,
    comment:
      'الدورة جيدة جداً وشاملة. الشرح واضح وسهل الفهم. أتمنى إضافة المزيد من الأمثلة على الأمان وحماية APIs.',
    daysAgo: 15,
  },
  {
    rating: 4,
    comment:
      'دورة شاملة ومنظمة بشكل ممتاز. تعلمت الكثير عن Express وقواعد البيانات. سأكمل باقي الدورات على المنصة.',
    daysAgo: 22,
  },
  {
    rating: 4,
    comment:
      'محتوى جيد جداً لكن سرعة الشرح أحياناً تكون سريعة قليلاً. المادة العلمية ممتازة وأنصح بالدورة.',
    daysAgo: 28,
  },
  {
    rating: 4,
    comment:
      'الدورة غطّت معظم ما أحتاجه كمطور مبتدئ. الشرح واضح ومنظم. تمنيت وجود مزيد من التمارين التفاعلية.',
    daysAgo: 33,
  },
  {
    rating: 4,
    comment:
      'محتوى ممتاز وشامل لجميع جوانب Node.js. المدرب يشرح ببساطة وبأمثلة واقعية. أنصح به للمبتدئين.',
    daysAgo: 38,
  },
  {
    rating: 4,
    comment:
      'استفدت كثيراً من الدورة خاصةً أقسام قواعد البيانات والـ REST APIs. تستحق أربع نجوم بامتياز.',
    daysAgo: 50,
  },
  {
    rating: 4,
    comment:
      'الدورة ممتازة للمبتدئين وحتى المتوسطين. المفاهيم تُشرح بوضوح تام مع تطبيق عملي فوري.',
    daysAgo: 55,
  },

  // 3-star reviews
  {
    rating: 3,
    comment:
      'الدورة جيدة بشكل عام، لكن بعض الدروس تحتاج إلى تحديث لتواكب آخر إصدارات Node.js. المحتوى الأساسي ممتاز.',
    daysAgo: 20,
  },
  {
    rating: 3,
    comment:
      'محتوى متوسط. الشرح واضح لكن الدورة تفتقر إلى التعمق في بعض المواضيع المتقدمة مثل الـ Microservices.',
    daysAgo: 42,
  },
  {
    rating: 3,
    comment:
      'الدورة تغطي الأساسيات بشكل جيد لكنني كنت أتوقع مزيداً من المشاريع الكاملة. مناسبة للمبتدئين فقط.',
    daysAgo: 60,
  },
  {
    rating: 3,
    comment:
      'بعض الدروس مكررة والمحتوى يمكن تكثيفه أكثر. مع ذلك الشرح واضح والمعلومات الأساسية متوفرة.',
    daysAgo: 65,
  },

  // 2-star reviews
  {
    rating: 2,
    comment:
      'الشرح جيد في البداية لكن الدروس المتقدمة تحتاج إلى مزيد من التفصيل. كنت أتوقع تغطية أعمق لـ NestJS.',
    daysAgo: 48,
  },
  {
    rating: 2,
    comment:
      'الدورة تحتاج إلى تحديث شامل. بعض المكتبات المستخدمة أصبحت قديمة وهناك طرق أفضل الآن. جهد المدرب واضح.',
    daysAgo: 70,
  },

  // 1-star reviews
  {
    rating: 1,
    comment:
      'لم أستفد كثيراً من الدورة. المحتوى متاح مجاناً على الإنترنت بجودة أفضل. أنصح بالبحث قبل الاشتراك.',
    daysAgo: 75,
  },
  {
    rating: 1,
    comment:
      'لم تلبِّ الدورة توقعاتي. الشرح سطحي والأمثلة قديمة. أتمنى تحديث المحتوى ليواكب متطلبات السوق الحالية.',
    daysAgo: 80,
  },

  // More 5-star reviews for better distribution
  {
    rating: 5,
    comment:
      'لم أتوقع أن أتعلم كل هذا في وقت قصير. الدورة منظمة بشكل رائع والمدرب متمكن من المادة تماماً.',
    daysAgo: 85,
  },
  {
    rating: 4,
    comment:
      'دورة ممتازة وتستحق وقتك ومالك. تعلمت Node.js من الصفر وأصبحت أستطيع بناء مشاريع حقيقية. شكراً!',
    daysAgo: 90,
  },
];

async function seedReviews() {
  console.log('⭐ Seeding reviews for nodejs-complete-guide...\n');

  // ── 1. Find the course ────────────────────────────────────────────────────
  const course = await prisma.course.findUnique({
    where: { slug: 'nodejs-complete-guide' },
  });

  if (!course) {
    console.log(
      '⚠️  Course "nodejs-complete-guide" not found. Please run the main seed first.',
    );
    return;
  }
  console.log(`📚 Found course: ${course.title}`);

  // ── 2. Create reviewer accounts & enroll them ─────────────────────────────
  const hashedPassword = await bcrypt.hash('Student@123', 10);
  const reviewerIds: string[] = [];

  console.log('\n👥 Creating reviewer accounts...');

  for (let i = 0; i < REVIEWERS.length; i++) {
    const reviewer = REVIEWERS[i];
    if (!reviewer) continue;

    const { firstName, lastName } = reviewer;
    const email = `reviewer${i + 1}@simplearabcode.com`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: Role.STUDENT,
        isEmailVerified: true,
        isActive: true,
        timezone: 'Asia/Riyadh',
        language: 'ar',
      },
    });

    reviewerIds.push(user.id);
    console.log(`  ✅ ${firstName} ${lastName} (${email})`);

    // Enroll the reviewer if not already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: user.id,
          courseId: course.id,
        },
      },
    });

    if (!existingEnrollment) {
      await prisma.enrollment.create({
        data: {
          studentId: user.id,
          courseId: course.id,
          status: EnrollmentStatus.ACTIVE,
        },
      });
    }
  }

  // ── 3. Seed reviews ───────────────────────────────────────────────────────
  console.log('\n⭐ Creating reviews...');
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < REVIEW_DATA.length; i++) {
    const reviewData = REVIEW_DATA[i];
    const reviewer = REVIEWERS[i];
    const userId = reviewerIds[i];
    if (!reviewData || !reviewer || !userId) continue;

    const { rating, comment, daysAgo } = reviewData;

    const existing = await prisma.review.findUnique({
      where: {
        courseId_userId: {
          courseId: course.id,
          userId,
        },
      },
    });

    if (existing) {
      console.log(
        `  ⏭️  Review by ${reviewer.firstName} already exists — skipping`,
      );
      skipped++;
      continue;
    }

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);

    await prisma.review.create({
      data: {
        courseId: course.id,
        userId,
        rating,
        comment,
        createdAt,
        updatedAt: createdAt,
      },
    });

    console.log(
      `  ✅ ${reviewer.firstName} ${reviewer.lastName} — ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)`,
    );
    created++;
  }

  // ── 4. Print summary ──────────────────────────────────────────────────────
  const { _avg, _count } = await prisma.review.aggregate({
    where: { courseId: course.id },
    _avg: { rating: true },
    _count: { id: true },
  });

  // Rating distribution
  const distribution = await prisma.review.groupBy({
    by: ['rating'],
    where: { courseId: course.id },
    _count: { id: true },
    orderBy: { rating: 'desc' },
  });

  console.log('\n✨ Reviews seeded successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📚 Course         : ${course.title}`);
  console.log(`⭐ Reviews created : ${created}`);
  console.log(`⏭️  Reviews skipped : ${skipped}`);
  console.log(`📊 Total reviews  : ${_count.id}`);
  console.log(`📈 Avg rating     : ${(_avg.rating ?? 0).toFixed(1)} / 5.0`);
  console.log('\n📊 Rating distribution:');
  for (const d of distribution) {
    const bar = '█'.repeat(d._count.id);
    console.log(`  ${d.rating}★  ${bar} (${d._count.id})`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function main() {
  try {
    await seedReviews();
  } catch (error) {
    console.error('❌ Error seeding reviews:', error);
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
