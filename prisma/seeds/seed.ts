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
  console.log('🌱 Starting Engineering Decisions database seeding...');

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
      bio: 'Instructor focused on practical software engineering and technical decision-making.',
      timezone: 'Asia/Riyadh',
      language: 'ar',
    },
  });

  console.log('🧭 Creating Engineering Decisions path...');

  const engineeringPath = await prisma.path.create({
    data: {
      title: 'Engineering Decisions',

      slug: 'engineering-decisions',

      tagline:
        'Learn how engineers think, evaluate trade-offs, and make better technical decisions.',

      shortDescription:
        'A practical engineering path focused on making better technical decisions from idea to production.',

      description:
        'Engineering Decisions is a practical learning path about how software engineers think when building real applications. Explore how to move from requirements to architecture, design data and APIs, structure frontend applications, handle authentication and authorization, evaluate performance and scalability, and make reliable deployment and production decisions. The focus is not on one technology or one type of application, but on understanding the reasoning, trade-offs, constraints, and consequences behind engineering decisions.',

      thumbnailUrl:
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',

      category: 'WEB',

      icon: '🧭',

      isPublished: true,

      sortOrder: 1,

      metaTitle: 'Engineering Decisions | IthraCode',

      metaDescription:
        'Learn how software engineers make technical decisions across architecture, APIs, databases, frontend, security, performance, and production.',
    },
  });

  console.log('📚 Creating Engineering Decisions course...');

  const course = await prisma.course.create({
    data: {
      instructorId: instructor.id,

      pathId: engineeringPath.id,

      title: 'Engineering Decisions',

      slug: 'engineering-decisions',

      description:
        'How do engineers decide what to build, how to structure it, which technologies to use, and when a solution is good enough for production? This course explores the thinking process behind real-world software engineering decisions. You will learn how to move from requirements to architecture, evaluate different approaches, understand technical trade-offs, design databases and APIs, structure frontend applications, handle authentication and authorization, think about performance and scalability, and prepare applications for production. Instead of presenting one "best" solution, the course focuses on how to evaluate options, understand constraints, communicate decisions, and learn from what happens after the system is shipped.',

      shortDescription:
        'Learn how engineers evaluate options, understand trade-offs, and make technical decisions from idea to production.',

      thumbnailUrl:
        'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800',

      previewVideo:
        'https://example.com/videos/engineering-decisions-preview.mp4',

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
        'Basic programming knowledge',
        'Basic understanding of web applications',
        'Familiarity with at least one programming language',
        'No specific framework or technology is required',
      ],

      objectives: [
        'Understand how engineers move from requirements to technical decisions',
        'Evaluate multiple solutions using constraints and trade-offs',
        'Design application architecture based on real requirements',
        'Understand the reasoning behind database and API design decisions',
        'Structure frontend applications for maintainability and scalability',
        'Make informed authentication, authorization, security, and performance decisions',
        'Understand how engineering decisions affect production and operations',
        'Communicate technical decisions clearly with other engineers and stakeholders',
        'Recognize when to keep a solution simple and when additional complexity is justified',
        'Learn how architecture evolves as an application, team, and requirements grow',
      ],

      targetAudience: [
        'Software developers who want to improve their engineering decision-making',
        'Frontend developers who want to understand systems beyond the UI',
        'Backend developers who want a structured approach to technical decisions',
        'Developers preparing for technical interviews',
        'Engineers working on real-world applications',
        'Developers moving from implementation-focused work toward broader engineering thinking',
      ],

      tags: [
        'engineering',
        'software-engineering',
        'architecture',
        'system-design',
        'api-design',
        'database-design',
        'frontend-architecture',
        'decision-making',
        'trade-offs',
        'production',
      ],

      metaTitle: 'Engineering Decisions - From Idea to Production | IthraCode',

      metaDescription:
        'Learn how engineers make technical decisions from idea to production through architecture, database design, APIs, frontend architecture, security, performance, and real-world trade-offs.',

      certificateEnabled: true,

      maxStudents: 500,
    },
  });

  console.log('❓ Creating FAQs...');

  await prisma.faq.createMany({
    data: [
      {
        question: 'ما هو موضوع الكورس؟',

        answer:
          'الكورس يركز على طريقة التفكير الهندسي عند بناء التطبيقات، بدايةً من فهم المتطلبات واختيار الـArchitecture، مرورًا بتصميم الـDatabase والـAPIs والـFrontend والـSecurity والـPerformance، وحتى الـDeployment والـProduction.',

        sortOrder: 1,

        isActive: true,
      },

      {
        question: 'هل الكورس مرتبط بنوع معين من التطبيقات؟',

        answer:
          'لا. المبادئ التي يتم شرحها عامة ويمكن تطبيقها على أنواع مختلفة من التطبيقات مثل SaaS وE-commerce وBooking وCRM وEdTech وغيرها. سيتم استخدام أمثلة واقعية لتوضيح طريقة التفكير والقرارات الهندسية.',

        sortOrder: 2,

        isActive: true,
      },

      {
        question: 'هل الكورس مرتبط بتكنولوجيا معينة؟',

        answer:
          'لا. الهدف ليس تعلم Framework أو Technology معينة، وإنما فهم كيفية تقييم الخيارات واختيار الحل المناسب بناءً على المتطلبات والـConstraints والـTrade-offs.',

        sortOrder: 3,

        isActive: true,
      },

      {
        question: 'هل الكورس مناسب للمبتدئين؟',

        answer:
          'الكورس مناسب أكثر لمن لديهم أساسيات البرمجة وتطوير التطبيقات. لا تحتاج إلى خبرة متقدمة، لكن من المفيد أن تكون لديك خبرة بسيطة في بناء تطبيقات أو التعامل مع APIs وقواعد البيانات.',

        sortOrder: 4,

        isActive: true,
      },

      {
        question: 'هل الكورس يشرح System Design؟',

        answer:
          'يتناول الكورس العديد من مفاهيم الـSystem Design والـSoftware Architecture، لكنه لا يركز على حفظ تصميمات جاهزة. التركيز الأساسي هو فهم المشكلة، مقارنة الحلول، تحليل الـTrade-offs، واتخاذ القرار المناسب.',

        sortOrder: 5,

        isActive: true,
      },

      {
        question: 'هل الكورس مناسب للـFrontend Developers؟',

        answer:
          'نعم. الكورس يساعد الـFrontend Developers على فهم الصورة الكاملة للتطبيق، وكيف تؤثر قرارات الـAPI والـDatabase والـAuthentication والـPerformance والـInfrastructure على الـFrontend وتجربة المستخدم.',

        sortOrder: 6,

        isActive: true,
      },

      {
        question: 'هل الكورس مفيد للـTechnical Interviews؟',

        answer:
          'نعم. يساعدك الكورس على تطوير طريقة التفكير في أسئلة الـArchitecture والـSystem Design والـTrade-offs، والأهم هو تعلم كيفية شرح سبب اختيار حل تقني معين بدلًا من مجرد ذكر الحل.',

        sortOrder: 7,

        isActive: true,
      },

      {
        question: 'هل سأتعلم بناء مشروع كامل؟',

        answer:
          'التركيز الأساسي ليس على بناء مشروع CRUD واحد، وإنما على فهم القرارات الهندسية التي تظهر أثناء بناء التطبيقات الحقيقية. سيتم استخدام Case Studies وأمثلة واقعية لشرح كيف تنتقل القرارات من الفكرة إلى الـProduction.',

        sortOrder: 8,

        isActive: true,
      },

      {
        question: 'هل هناك حل واحد صحيح لكل Engineering Decision؟',

        answer:
          'لا. في الـSoftware Engineering غالبًا توجد أكثر من طريقة صحيحة. الهدف هو تعلم كيفية تقييم الخيارات بناءً على الـRequirements والـConstraints والـTrade-offs وحجم الـTeam والـProduct واحتياجات الـProduction.',

        sortOrder: 9,

        isActive: true,
      },
    ],
  });

  console.log('✅ Engineering Decisions seed completed successfully');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`👤 Instructor: ${instructor.email}`);
  console.log(`🧭 Path: ${engineeringPath.title}`);
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
