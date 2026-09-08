/* eslint-disable no-console */
import {
  CourseLevel,
  CourseStatus,
  CourseVisibility,
  PrismaClient,
  Role,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!.replace(
  /([?&]sslmode=)(require|prefer|verify-ca)\b/gi,
  '$1verify-full',
);

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('🌱 Starting minimal database seeding...');

  console.log('🧹 Cleaning existing data...');
  await prisma.progress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.session.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.lecture.deleteMany();
  await prisma.section.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.review.deleteMany();
  await prisma.faq.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.videoCollection.deleteMany();
  await prisma.course.deleteMany();
  await prisma.track.deleteMany();
  await prisma.path.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Creating instructor user...');
  const instructorPassword = await bcrypt.hash('Instructor@123', 10);
  const instructor = await prisma.user.create({
    data: {
      email: 'instructor@ithracode.com',
      password: instructorPassword,
      firstName: 'Ithra',
      lastName: 'Instructor',
      role: Role.INSTRUCTOR,
      isEmailVerified: true,
      isActive: true,
      bio: 'Instructor for strategic software engineering content.',
      timezone: 'Asia/Riyadh',
      language: 'ar',
    },
  });

  console.log('🛤️ Creating one path...');
  const engineeringPath = await prisma.path.create({
    data: {
      title: 'Engineering Decisions',
      slug: 'engineering-leadership-path',
      tagline: 'Decide faster, scale smarter, deliver with confidence.',
      shortDescription:
        'An advanced path for engineers who lead architecture decisions, scalability direction, and high-impact delivery.',
      description:
        'This path gives developers and team leads a decision system used by high-performing engineering teams. You will master architecture trade-off analysis, build for scalability and reliability from day one, cut technical risk before it becomes rework, and align engineering choices with measurable product outcomes.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
      category: 'WEB',
      icon: '🧭',
      isPublished: true,
      sortOrder: 1,
      metaTitle: 'Engineering Decisions - ithracode',
      metaDescription:
        'Master high-impact engineering decisions across architecture, scalability, reliability, and product delivery.',
    },
  });

  console.log('📚 Creating one course: Engineering Decisions...');
  const course = await prisma.course.create({
    data: {
      instructorId: instructor.id,
      pathId: engineeringPath.id,
      title: 'Engineering Decisions',
      slug: 'engineering-decisions',
      description:
        'A high-impact course for engineers who want to make stronger technical decisions in real-world teams. Learn a practical framework for trade-off analysis, architecture decision records (ADRs), technical risk control, and clear decision communication across stakeholders.',
      shortDescription:
        'Learn how senior engineers evaluate trade-offs, reduce risk, and make high-confidence technical decisions.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800',
      previewVideo: 'https://example.com/videos/engineering-decisions-preview.mp4',
      price: 20.0,
      compareAtPrice: 499.0,
      currency: 'USD',
      level: CourseLevel.INTERMEDIATE,
      status: CourseStatus.PUBLISHED,
      visibility: CourseVisibility.PUBLIC,
      publishedAt: new Date(),
      isFeatured: true,
      duration: 0,
      requirements: [
        'Basic software development experience',
        'Familiarity with web application architecture',
      ],
      objectives: [
        'Evaluate trade-offs using a clear framework',
        'Write and review architecture decision records (ADRs)',
        'Reduce decision risk and rework',
      ],
      targetAudience: [
        'Mid-level software engineers',
        'Tech leads and engineering managers',
      ],
      tags: ['engineering', 'architecture', 'decision-making', 'leadership'],
      metaTitle: 'Engineering Decisions - ithracode',
      metaDescription:
        'Learn the decision frameworks senior engineers use for architecture, delivery, and scalable systems.',
      certificateEnabled: true,
      maxStudents: 500,
    },
  });

  console.log('❓ Creating FAQs...');
  await prisma.faq.createMany({
    data: [
      {
        question: 'هل الكورس مناسب للمبتدئين؟',
        answer:
          'الكورس مناسب أكثر للمطورين الذين لديهم أساسيات البرمجة وتطوير الويب. لا يشترط خبرة متقدمة، لكن يفضّل أن تكون لديك معرفة مبدئية بالـJavaScript أو أي لغة برمجة أخرى.',
        sortOrder: 1,
        isActive: true,
      },
      {
        question: 'هل الكورس عملي أم نظري؟',
        answer:
          'الكورس يجمع بين الفهم النظري والتطبيق العملي. الهدف ليس حفظ المصطلحات، بل فهم القرارات والمفاضلات وتطبيقها على أمثلة ومشاريع واقعية.',
        sortOrder: 2,
        isActive: true,
      },
      {
        question: 'هل أحتاج إلى تعلم تقنية معينة قبل الكورس؟',
        answer:
          'لا تحتاج إلى الالتزام بتقنية معينة. معرفة أساسية بتطوير الويب وJavaScript كافية للبدء، وستتم مناقشة التقنيات باعتبارها حلولاً لها مزايا وقيود.',
        sortOrder: 3,
        isActive: true,
      },
      {
        question: 'هل الكورس يشرح System Design؟',
        answer:
          'نعم، يتناول الكورس مفاهيم مرتبطة بالـSystem Design والـSoftware Architecture، لكنه يركز على طريقة التفكير واتخاذ القرار أكثر من التركيز على حفظ تصميمات جاهزة.',
        sortOrder: 4,
        isActive: true,
      },
      {
        question: 'هل الكورس مناسب لمقابلات العمل؟',
        answer:
          'نعم. يساعدك الكورس على فهم أسئلة المقابلات المتعلقة بالـArchitecture والـTrade-offs، كما يطوّر قدرتك على شرح سبب اختيار حل تقني معين.',
        sortOrder: 5,
        isActive: true,
      },
      {
        question: 'هل سأتعلم بناء مشروع كامل؟',
        answer:
          'الكورس يركز على القرارات الهندسية التي تظهر أثناء بناء التطبيقات. سيتم استخدام أمثلة ودراسات حالة واقعية، لكن الهدف الأساسي هو تطوير طريقة التفكير الهندسي وليس تقديم مشروع CRUD تقليدي فقط.',
        sortOrder: 6,
        isActive: true,
      },
    ],
  });

  console.log('✅ Seed completed successfully');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`👤 Instructor: ${instructor.email}`);
  console.log(`🛤️ Path: ${engineeringPath.title}`);
  console.log(`📚 Course: ${course.title} (${course.slug})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
