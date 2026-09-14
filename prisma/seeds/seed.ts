/* eslint-disable no-console */

import {
  CourseLevel,
  CourseStatus,
  CourseVisibility,
  EnrollmentStatus,
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

const INSTRUCTOR_EMAIL = 'instructor@ithracode.com';
const ENROLLED_STUDENT_EMAIL = 'hodanabeil67@gmail.com';
const ENGINEERING_PATH_SLUG = 'engineering-decisions';
const ADVANCED_FRONTEND_TRACK_SLUG = 'advanced-frontend-track';
const ENGINEERING_COURSE_SLUG = 'engineering-decisions';

async function main() {
  console.log('🌱 Starting Engineering Decisions database seeding...');
  console.log('ℹ️  Preserving existing users and FAQs');

  console.log('👤 Upserting instructor user...');

  const instructorPassword = await bcrypt.hash('Instructor@123', 10);

  const instructor = await prisma.user.upsert({
    where: { email: INSTRUCTOR_EMAIL },
    update: {
      role: Role.INSTRUCTOR,
      isEmailVerified: true,
      isActive: true,
    },
    create: {
      email: INSTRUCTOR_EMAIL,
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

  console.log('🧭 Upserting Engineering Decisions path...');

  const engineeringPath = await prisma.path.upsert({
    where: { slug: ENGINEERING_PATH_SLUG },
    update: {
      title: 'Engineering Decisions',
      tagline:
        'انتقل من كتابة واجهات إلى تصميم Frontend Architecture قابل للتوسع والأداء.',
      shortDescription:
        'مسار Frontend Architecture يركز على Design Systems و Rendering و Performance و Production.',
      description:
        'هذا المسار صُمم لينقلك إلى مستوى Frontend Architect. التركيز ليس على مجرد كتابة كود، بل على كيفية تصميم وبناء Infrastructure برمجية قوية، قابلة للتوسع (Scalable)، وفائقة الأداء للتطبيقات والمنصات التجارية الضخمة (Enterprise Applications). ستتعلم تحويل تصاميم Figma إلى Design System مستدام باستخدام Tailwind CSS و Shadcn UI، واتخاذ قرارات Rendering و State Management مع SSR و CSR و Zustand و TanStack React Query، وتحسين Core Web Vitals و Technical SEO، وصولاً إلى Frontend DevOps و Telemetry عبر Docker و GitHub Actions و Sentry و New Relic و Google Tag Manager.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
      category: 'WEB',
      icon: '🧭',
      isPublished: true,
      sortOrder: 1,
      metaTitle: 'Engineering Decisions | IthraCode',
      metaDescription:
        'Learn frontend architecture decisions across design systems, rendering, Next.js, performance, and production.',
    },
    create: {
      title: 'Engineering Decisions',
      slug: ENGINEERING_PATH_SLUG,
      tagline:
        'انتقل من كتابة واجهات إلى تصميم Frontend Architecture قابل للتوسع والأداء.',
      shortDescription:
        'مسار Frontend Architecture يركز على Design Systems و Rendering و Performance و Production.',
      description:
        'هذا المسار صُمم لينقلك إلى مستوى Frontend Architect. التركيز ليس على مجرد كتابة كود، بل على كيفية تصميم وبناء Infrastructure برمجية قوية، قابلة للتوسع (Scalable)، وفائقة الأداء للتطبيقات والمنصات التجارية الضخمة (Enterprise Applications). ستتعلم تحويل تصاميم Figma إلى Design System مستدام باستخدام Tailwind CSS و Shadcn UI، واتخاذ قرارات Rendering و State Management مع SSR و CSR و Zustand و TanStack React Query، وتحسين Core Web Vitals و Technical SEO، وصولاً إلى Frontend DevOps و Telemetry عبر Docker و GitHub Actions و Sentry و New Relic و Google Tag Manager.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
      category: 'WEB',
      icon: '🧭',
      isPublished: true,
      sortOrder: 1,
      metaTitle: 'Engineering Decisions | IthraCode',
      metaDescription:
        'Learn frontend architecture decisions across design systems, rendering, Next.js, performance, and production.',
    },
  });

  console.log('🛤️ Upserting frontend track...');

  const advancedFrontendTrack = await prisma.track.upsert({
    where: { slug: ADVANCED_FRONTEND_TRACK_SLUG },
    update: {
      pathId: engineeringPath.id,
      title: 'Advanced Frontend Track',
      shortDescription:
        'Frontend architecture, rendering, performance, and production operations for enterprise applications.',
      description:
        'هذا التراك صُمم خصيصاً ليتجاوز حدود التطوير التقليدي، لينتقل بك إلى مستوى Frontend Architect. التركيز هنا ليس على مجرد كتابة كود، بل على كيفية تصميم وبناء Infrastructure برمجية قوية، قابلة للتوسع (Scalable)، وفائقة الأداء للتطبيقات والمنصات التجارية الضخمة (Enterprise Applications).\n\n1. معمارية الأنظمة المرئية (Visual Architecture): كيفية تحويل تصاميم Figma المعقدة إلى Design System مرن ومستدام باستخدام أدوات حديثة مثل Tailwind CSS و Shadcn UI لتوحيد الـ UI Components.\n\n2. استراتيجيات الرندر وإدارة الحالات (Rendering & State Engineering): فهم عميق لآليات الرندر الحديثة مثل Server-Side Rendering (SSR) و Client-Side Rendering (CSR)، وحل المعضلات المعمارية المعقدة مثل أخطاء الـ Hydration Mismatch، وإدارة الـ Global State بكفاءة عالية باستخدام Zustand.\n\n3. السيو التقني وتحسين الأداء (Technical SEO & Web Performance): هندسة الأداء لانتزاع تفوق كامل في مؤشرات Google Core Web Vitals (مثل LCP, INP, CLS)، وإعداد الـ Dynamic Sitemaps و JSON-LD Schema، وبناء استراتيجيات Caching ذكية للبيانات عبر TanStack React Query.\n\n4. عمليات الواجهة الأمامية والمراقبة (Frontend DevOps & Telemetry): أتمتة دورة حياة الكود من خلال التغليف باستخدام Docker وبناء خطوط أتمتة (CI/CD Pipelines) عبر GitHub Actions، وربط أنظمة الـ Telemetry لرصد الأخطاء والأداء حياً في بيئة الـ Production باستخدام Sentry و New Relic، بالإضافة إلى إدارة أدوات التتبع والتسويق عبر Google Tag Manager.',
      category: 'WEB',
      icon: '🎨',
      isPublished: true,
      sortOrder: 1,
      metaTitle: 'Advanced Frontend Track | IthraCode',
      metaDescription:
        'Learn frontend architecture, rendering, SEO, performance, Docker, CI/CD, and production telemetry decisions.',
    },
    create: {
      pathId: engineeringPath.id,
      title: 'Advanced Frontend Track',
      slug: ADVANCED_FRONTEND_TRACK_SLUG,
      shortDescription:
        'Frontend architecture, rendering, performance, and production operations for enterprise applications.',
      description:
        'هذا التراك صُمم خصيصاً ليتجاوز حدود التطوير التقليدي، لينتقل بك إلى مستوى Frontend Architect. التركيز هنا ليس على مجرد كتابة كود، بل على كيفية تصميم وبناء Infrastructure برمجية قوية، قابلة للتوسع (Scalable)، وفائقة الأداء للتطبيقات والمنصات التجارية الضخمة (Enterprise Applications).\n\n1. معمارية الأنظمة المرئية (Visual Architecture): كيفية تحويل تصاميم Figma المعقدة إلى Design System مرن ومستدام باستخدام أدوات حديثة مثل Tailwind CSS و Shadcn UI لتوحيد الـ UI Components.\n\n2. استراتيجيات الرندر وإدارة الحالات (Rendering & State Engineering): فهم عميق لآليات الرندر الحديثة مثل Server-Side Rendering (SSR) و Client-Side Rendering (CSR)، وحل المعضلات المعمارية المعقدة مثل أخطاء الـ Hydration Mismatch، وإدارة الـ Global State بكفاءة عالية باستخدام Zustand.\n\n3. السيو التقني وتحسين الأداء (Technical SEO & Web Performance): هندسة الأداء لانتزاع تفوق كامل في مؤشرات Google Core Web Vitals (مثل LCP, INP, CLS)، وإعداد الـ Dynamic Sitemaps و JSON-LD Schema، وبناء استراتيجيات Caching ذكية للبيانات عبر TanStack React Query.\n\n4. عمليات الواجهة الأمامية والمراقبة (Frontend DevOps & Telemetry): أتمتة دورة حياة الكود من خلال التغليف باستخدام Docker وبناء خطوط أتمتة (CI/CD Pipelines) عبر GitHub Actions، وربط أنظمة الـ Telemetry لرصد الأخطاء والأداء حياً في بيئة الـ Production باستخدام Sentry و New Relic، بالإضافة إلى إدارة أدوات التتبع والتسويق عبر Google Tag Manager.',
      category: 'WEB',
      icon: '🎨',
      isPublished: true,
      sortOrder: 1,
      metaTitle: 'Advanced Frontend Track | IthraCode',
      metaDescription:
        'Learn frontend architecture, rendering, SEO, performance, Docker, CI/CD, and production telemetry decisions.',
    },
  });

  console.log('📚 Upserting Engineering Decisions course...');

  const course = await prisma.course.upsert({
    where: { slug: ENGINEERING_COURSE_SLUG },
    update: {
      instructorId: instructor.id,
      pathId: engineeringPath.id,
      trackId: advancedFrontendTrack.id,
      title: 'Engineering Decisions',
      description:
        'How do frontend engineers decide how to structure UI, choose rendering strategies, manage state, optimize performance, and ship interfaces to production? This course explores the thinking process behind real-world frontend engineering decisions across Design Systems, Tailwind CSS, Shadcn UI, Next.js, SSR, CSR, Hydration, Zustand, TanStack React Query, Core Web Vitals, Technical SEO, Docker, CI/CD, and frontend telemetry. Instead of presenting one "best" solution, the course focuses on how to evaluate options, understand constraints, communicate decisions, and learn from what happens after the UI reaches production.',
      shortDescription:
        'Master frontend engineering decisions from design systems and rendering to performance and production.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800',
      previewVideo: null,
      price: 0,
      compareAtPrice: 499.0,
      currency: 'USD',
      level: CourseLevel.INTERMEDIATE,
      status: CourseStatus.PUBLISHED,
      visibility: CourseVisibility.PUBLIC,
      publishedAt: new Date(),
      isFeatured: true,
      requirements: [
        'Basic programming knowledge',
        'Basic understanding of web applications',
        'Basic JavaScript knowledge',
      ],
      objectives: [
        'Build scalable frontend architecture with Tailwind CSS and Shadcn UI',
        'Translate Figma designs into maintainable design systems and UI infrastructure',
        'Choose rendering and state strategies using SSR, CSR, Zustand, and React Query',
        'Apply Next.js frontend architecture decisions with App Router and Server Components',
        'Improve Technical SEO, Core Web Vitals, and frontend performance budgets',
        'Make production decisions around Docker, CI/CD, Sentry, New Relic, and GTM',
        'Communicate frontend technical decisions clearly with engineers and stakeholders',
        'Recognize when to keep a UI solution simple and when additional complexity is justified',
        'Understand how frontend architecture evolves as products, teams, and requirements grow',
        'Evaluate frontend trade-offs in enterprise and high-traffic applications',
      ],
      targetAudience: [
        'Frontend developers who want stronger architecture and decision-making skills',
        'React developers moving from component building toward frontend engineering',
        'JavaScript developers preparing for frontend architecture interviews',
        'UI engineers working on SaaS, E-Commerce, and enterprise web platforms',
        'Developers who use Next.js and want deeper rendering and performance decisions',
        'Engineers who want to understand frontend production operations and telemetry',
      ],
      tags: [
        'javascript',
        'frontend',
        'react',
        'nextjs',
        'engineering',
        'software-engineering',
        'frontend-architecture',
        'design-systems',
        'rendering',
        'performance',
        'technical-seo',
        'decision-making',
        'trade-offs',
        'production',
      ],
      metaTitle: 'Engineering Decisions - Frontend Architecture | IthraCode',
      metaDescription:
        'Learn frontend engineering decisions across design systems, Next.js, rendering, performance, and production.',
      certificateEnabled: true,
      maxStudents: 500,
    },
    create: {
      instructorId: instructor.id,
      pathId: engineeringPath.id,
      trackId: advancedFrontendTrack.id,
      title: 'Engineering Decisions',
      slug: ENGINEERING_COURSE_SLUG,
      description:
        'How do frontend engineers decide how to structure UI, choose rendering strategies, manage state, optimize performance, and ship interfaces to production? This course explores the thinking process behind real-world frontend engineering decisions across Design Systems, Tailwind CSS, Shadcn UI, Next.js, SSR, CSR, Hydration, Zustand, TanStack React Query, Core Web Vitals, Technical SEO, Docker, CI/CD, and frontend telemetry. Instead of presenting one "best" solution, the course focuses on how to evaluate options, understand constraints, communicate decisions, and learn from what happens after the UI reaches production.',
      shortDescription:
        'Master frontend engineering decisions from design systems and rendering to performance and production.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800',
      previewVideo: null,
      price: 0,
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
        'Basic JavaScript knowledge',
      ],
      objectives: [
        'Build scalable frontend architecture with Tailwind CSS and Shadcn UI',
        'Translate Figma designs into maintainable design systems and UI infrastructure',
        'Choose rendering and state strategies using SSR, CSR, Zustand, and React Query',
        'Apply Next.js frontend architecture decisions with App Router and Server Components',
        'Improve Technical SEO, Core Web Vitals, and frontend performance budgets',
        'Make production decisions around Docker, CI/CD, Sentry, New Relic, and GTM',
        'Communicate frontend technical decisions clearly with engineers and stakeholders',
        'Recognize when to keep a UI solution simple and when additional complexity is justified',
        'Understand how frontend architecture evolves as products, teams, and requirements grow',
        'Evaluate frontend trade-offs in enterprise and high-traffic applications',
      ],
      targetAudience: [
        'Frontend developers who want stronger architecture and decision-making skills',
        'React developers moving from component building toward frontend engineering',
        'JavaScript developers preparing for frontend architecture interviews',
        'UI engineers working on SaaS, E-Commerce, and enterprise web platforms',
        'Developers who use Next.js and want deeper rendering and performance decisions',
        'Engineers who want to understand frontend production operations and telemetry',
      ],
      tags: [
        'javascript',
        'frontend',
        'react',
        'nextjs',
        'engineering',
        'software-engineering',
        'frontend-architecture',
        'design-systems',
        'rendering',
        'performance',
        'technical-seo',
        'decision-making',
        'trade-offs',
        'production',
      ],
      metaTitle: 'Engineering Decisions - Frontend Architecture | IthraCode',
      metaDescription:
        'Learn frontend engineering decisions across design systems, Next.js, rendering, performance, and production.',
      certificateEnabled: true,
      maxStudents: 500,
    },
  });

  console.log(`🎓 Ensuring enrollment for ${ENROLLED_STUDENT_EMAIL}...`);

  const enrolledStudentPassword = await bcrypt.hash('Student@123', 10);

  const enrolledStudent = await prisma.user.upsert({
    where: { email: ENROLLED_STUDENT_EMAIL },
    update: {
      isEmailVerified: true,
      isActive: true,
    },
    create: {
      email: ENROLLED_STUDENT_EMAIL,
      password: enrolledStudentPassword,
      firstName: 'Hoda',
      lastName: 'Nabeil',
      role: Role.STUDENT,
      isEmailVerified: true,
      isActive: true,
      timezone: 'Asia/Riyadh',
      language: 'ar',
    },
  });

  await prisma.enrollment.upsert({
    where: {
      studentId_courseId: {
        studentId: enrolledStudent.id,
        courseId: course.id,
      },
    },
    update: {
      status: EnrollmentStatus.ACTIVE,
    },
    create: {
      studentId: enrolledStudent.id,
      courseId: course.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  console.log('✅ Engineering Decisions seed completed successfully');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`👤 Instructor: ${instructor.email}`);
  console.log(`🧭 Path: ${engineeringPath.title}`);
  console.log(`🛤️ Track: ${advancedFrontendTrack.title}`);
  console.log(`📚 Course: ${course.title} (${course.slug}) — price: ${course.price}`);
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
