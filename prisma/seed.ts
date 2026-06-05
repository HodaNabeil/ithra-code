import {
  PrismaClient,
  Role,
  CourseLevel,
  CourseStatus,
  CourseVisibility,
  PathCategory,
  LectureType,
  AttachmentType,
  Currency,
  PathSectionType,
  EnrollmentStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Seeding started...');

  // 1. Clean up everything
  console.log('🧹 Cleaning up existing data...');

  // Order matters due to foreign key constraints
  await prisma.progress.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.lecture.deleteMany();
  await prisma.section.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.consultationBooking.deleteMany();
  await prisma.instructorAvailability.deleteMany();
  await prisma.review.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.couponCourse.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.course.deleteMany();
  await prisma.pathSection.deleteMany();
  await prisma.track.deleteMany();
  await prisma.path.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.googleCalendarToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Database cleaned.');

  // 2. Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  console.log('👥 Creating users...');
  await prisma.user.create({
    data: {
      email: 'admin@ithracode.com',
      firstName: 'Admin',
      lastName: 'Ithra',
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
      isEmailVerified: true,
    },
  });

  const instructor = await prisma.user.create({
    data: {
      email: 'instructor@ithracode.com',
      firstName: 'Ziad',
      lastName: 'Amr',
      password: hashedPassword,
      role: Role.INSTRUCTOR,
      isActive: true,
      isEmailVerified: true,
      bio: 'Professional Software Engineer with years of experience in Web Technologies.',
      profilePicture:
        'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
    },
  });

  const student = await prisma.user.create({
    data: {
      email: 'student@ithracode.com',
      firstName: 'Hoda',
      lastName: 'Student',
      password: hashedPassword,
      role: Role.STUDENT,
      isActive: true,
      isEmailVerified: true,
    },
  });

  console.log('✅ Users created.');

  // 3. Create a Path
  console.log('🛣️ Creating Path...');
  const webPath = await prisma.path.create({
    data: {
      title: 'Full-stack Web Development',
      slug: 'fullstack-web-development',
      tagline: 'Master the art of building complete web applications.',
      shortDescription:
        'The most comprehensive path to becoming a web developer.',
      description:
        'Go from zero to hero in web development. Learn HTML, CSS, JavaScript, React, Node.js, and more.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
      category: PathCategory.WEB,
      isPublished: true,
    },
  });

  // 4. Create Tracks
  console.log('🛤️ Creating Tracks...');
  const frontendTrack = await prisma.track.create({
    data: {
      title: 'Frontend Mastery',
      slug: 'frontend-mastery',
      shortDescription: 'Master the user interface development.',
      description:
        'Learn everything from HTML/CSS to advanced React and Next.js.',
      pathId: webPath.id,
      category: PathCategory.WEB,
      isPublished: true,
      sortOrder: 1,
      metaTitle: 'Frontend Mastery Track — Learn React & Next.js',
      metaDescription:
        'The complete frontend track covering React 19, Next.js 15, and modern UI patterns.',
    },
  });

  const backendTrack = await prisma.track.create({
    data: {
      title: 'Backend & Database Engineering',
      slug: 'backend-database-engineering',
      shortDescription: 'Build robust, scalable server-side systems.',
      description:
        'Deep dive into databases, APIs, and backend architecture. Master PostgreSQL, query optimization, and data modeling for production-grade applications.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31',
      pathId: webPath.id,
      category: PathCategory.WEB,
      isPublished: true,
      sortOrder: 2,
      metaTitle: 'Backend & Database Track — PostgreSQL & APIs',
      metaDescription:
        'Master backend development and database engineering with PostgreSQL, indexing, and server-side architecture.',
    },
  });

  // 5. Add Path Sections
  console.log('🧩 Creating Path Sections...');
  await prisma.pathSection.createMany({
    data: [
      {
        pathId: webPath.id,
        type: PathSectionType.TITLE,
        content: 'Why follow this path?',
        order: 1,
      },
      {
        pathId: webPath.id,
        type: PathSectionType.PARAGRAPH,
        content:
          'This path is carefully curated to take you through the most relevant technologies in the industry today.',
        order: 2,
      },
    ],
  });

  // 6. Create Courses
  console.log('📚 Creating Courses...');

  // Course 1: Next.js 15
  const courseNext = await prisma.course.create({
    data: {
      title: 'Next.js 15 Masterclass',
      slug: 'nextjs-15-masterclass',
      description:
        'Master the latest features of Next.js 15, including App Router, Server Actions, and Partial Prerendering (PPR). This course covers everything from basic setup to advanced patterns.',
      shortDescription:
        'The ultimate guide to Next.js 15 and modern React patterns.',
      price: 499.99,
      level: CourseLevel.ADVANCED,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1618477247222-acbdb0e159b3',
      instructorId: instructor.id,
      pathId: webPath.id,
      trackId: frontendTrack.id,
      status: CourseStatus.PUBLISHED,
      visibility: CourseVisibility.PUBLIC,
      currency: Currency.EGP,
      objectives: [
        'Build high-performance apps with Next.js 15',
        'Master Server Components and Client Components',
        'Implement advanced Server Actions and Data Fetching',
        'Learn Partial Prerendering and Middleware',
      ],
      requirements: [
        'Solid React knowledge',
        'Experience with TypeScript',
        'Node.js installed',
      ],
      targetAudience: [
        'Frontend developers looking to upgrade',
        'Full-stack engineers',
        'Tech leads',
      ],
    },
  });

  // Course 2: React 19
  const courseReact = await prisma.course.create({
    data: {
      title: 'React 19 Deep Dive',
      slug: 'react-19-deep-dive',
      description:
        'Deep dive into the internals of React 19. Learn about the new Compiler, Actions API, and the "use" hook. Understand how React handles concurrency and state in the modern era.',
      shortDescription: 'Master the future of React development.',
      price: 399.99,
      level: CourseLevel.INTERMEDIATE,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
      instructorId: instructor.id,
      pathId: webPath.id,
      trackId: frontendTrack.id,
      status: CourseStatus.PUBLISHED,
      visibility: CourseVisibility.PUBLIC,
      currency: Currency.EGP,
      objectives: [
        'Understand React 19 Compiler',
        'Use the new Actions API for form handling',
        'Master the "use" hook for promises and context',
        'Optimize performance with concurrent features',
      ],
      requirements: [
        'Basic React knowledge',
        'Modern JavaScript (ES6+)',
        'A curious mind',
      ],
      targetAudience: [
        'React developers',
        'Web developers transitioning to React',
      ],
    },
  });

  // Course 3: PostgreSQL
  const coursePg = await prisma.course.create({
    data: {
      title: 'PostgreSQL for Developers',
      slug: 'postgresql-for-developers',
      description:
        'Go beyond "SELECT * FROM users". This comprehensive course takes you from SQL basics all the way to advanced PostgreSQL features used in production: indexing strategies, query optimization, JSONB, full-text search, row-level security, transactions, and connection pooling. By the end, you will design and optimize databases like a senior engineer.',
      shortDescription:
        'From SQL basics to production-grade PostgreSQL. The database course every backend developer needs.',
      price: 299.99,
      compareAtPrice: 449.99,
      level: CourseLevel.BEGINNER,
      thumbnailUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713',
      previewVideo: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      instructorId: instructor.id,
      pathId: webPath.id,
      trackId: backendTrack.id,
      status: CourseStatus.PUBLISHED,
      visibility: CourseVisibility.PUBLIC,
      currency: Currency.EGP,
      isFeatured: true,
      certificateEnabled: true,
      maxStudents: 500,
      metaTitle: 'PostgreSQL for Developers — Complete Database Course',
      metaDescription:
        'Learn PostgreSQL from scratch to advanced. Covers SQL, schema design, indexing, JSONB, full-text search, transactions, and row-level security.',
      tags: ['postgresql', 'sql', 'database', 'backend', 'data engineering'],
      objectives: [
        'Write confident SQL queries from simple SELECTs to complex window functions',
        'Design normalized, efficient relational schemas',
        'Implement B-Tree, GIN, and GiST indexes for maximum query performance',
        'Use JSONB to store and query flexible document-style data',
        'Build full-text search without external services like Elasticsearch',
        'Manage transactions, understand isolation levels, and prevent deadlocks',
        'Secure data with Row Level Security (RLS)',
        'Configure connection pooling for production traffic',
      ],
      requirements: [
        'Basic computer literacy',
        'No prior SQL knowledge required — we start from zero',
        'A laptop with internet access',
        'Curiosity about how data is stored and retrieved',
      ],
      targetAudience: [
        'Backend developers who want to master databases',
        'Junior developers moving from ORM-only to raw SQL',
        'Data analysts who want to write professional-grade queries',
        'System architects designing scalable data models',
        'Full-stack developers who want to stop treating the DB as a black box',
      ],
    },
  });

  console.log('✅ Courses created.');

  // ═══════════════════════════════════════════════════════════════════
  // 7. NEXT.JS 15 MASTERCLASS — Sections & Lectures
  // ═══════════════════════════════════════════════════════════════════
  console.log('📖 Adding content to Next.js 15 course...');

  // --- Section 1: Getting Started ---
  const nextS1 = await prisma.section.create({
    data: {
      courseId: courseNext.id,
      title: 'Getting Started with Next.js 15',
      position: 1,
      isPublished: true,
    },
  });

  const nextLec1 = await prisma.lecture.create({
    data: {
      sectionId: nextS1.id,
      title: 'Course Overview & What You Will Build',
      description: 'A walkthrough of the final project and course roadmap.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 480,
      position: 1,
      isPublished: true,
      isFree: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: nextS1.id,
      title: 'Installing Node.js, pnpm & Creating Your First App',
      description:
        'Step-by-step environment setup with pnpm and create-next-app.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 720,
      position: 2,
      isPublished: true,
      isFree: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: nextS1.id,
      title: 'Project Structure Explained',
      description:
        'Understanding every file and folder in a fresh Next.js 15 project.',
      type: LectureType.TEXT,
      content: `# Project Structure\n\n\`\`\`\napp/\n├── layout.tsx    → Root layout\n├── page.tsx      → Home page\n├── globals.css   → Global styles\npublic/           → Static assets\nnext.config.ts    → Configuration\n\`\`\`\n\nEach folder inside \`app/\` becomes a route automatically.`,
      position: 3,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: nextS1.id,
      title: 'TypeScript Configuration & Best Practices',
      description: 'Setting up strict TypeScript with path aliases.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 540,
      position: 4,
      isPublished: true,
    },
  });

  // --- Section 2: Routing & Navigation ---
  const nextS2 = await prisma.section.create({
    data: {
      courseId: courseNext.id,
      title: 'Routing & Navigation',
      position: 2,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: nextS2.id,
      title: 'File-Based Routing Deep Dive',
      description: 'Pages, layouts, templates, and route groups.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 900,
      position: 1,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: nextS2.id,
      title: 'Dynamic Routes & Catch-All Segments',
      description: 'Building dynamic pages with [slug] and [...params].',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 780,
      position: 2,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: nextS2.id,
      title: 'Parallel Routes & Intercepting Routes',
      description: 'Advanced routing patterns for modals and split views.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 1020,
      position: 3,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: nextS2.id,
      title: 'Route Groups & Layout Nesting',
      description: 'Organizing routes without affecting URL structure.',
      type: LectureType.TEXT,
      content: `# Route Groups\n\nWrap folders in parentheses to group routes:\n\n\`\`\`\napp/\n├── (marketing)/\n│   ├── about/page.tsx\n│   └── pricing/page.tsx\n├── (dashboard)/\n│   ├── settings/page.tsx\n│   └── analytics/page.tsx\n\`\`\`\n\nEach group can have its own \`layout.tsx\`.`,
      position: 4,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: nextS2.id,
      title: 'Client-Side Navigation with Link & useRouter',
      description: 'Prefetching, programmatic navigation, and scroll behavior.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 660,
      position: 5,
      isPublished: true,
    },
  });

  // --- Section 3: Server & Client Components ---
  const nextS3 = await prisma.section.create({
    data: {
      courseId: courseNext.id,
      title: 'Server & Client Components',
      position: 3,
      isPublished: true,
    },
  });

  const nextLec3 = await prisma.lecture.create({
    data: {
      sectionId: nextS3.id,
      title: 'Understanding React Server Components',
      description: 'Why RSCs are the default and how they reduce bundle size.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 1200,
      position: 1,
      isPublished: true,
    },
  });

  await prisma.attachment.create({
    data: {
      lectureId: nextLec3.id,
      name: 'RSC Cheatsheet',
      type: AttachmentType.PDF,
      url: 'https://example.com/rsc-cheatsheet.pdf',
      fileSize: 1024 * 500,
      position: 1,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: nextS3.id,
      title: 'When to Use "use client"',
      description:
        'Identifying interactive boundaries and keeping the client bundle small.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 840,
      position: 2,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: nextS3.id,
      title: 'Composition Patterns: Server ↔ Client',
      description:
        'Passing server data to client components via props and children.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 960,
      position: 3,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: nextS3.id,
      title: 'Server vs Client Components Comparison',
      description: 'Side-by-side comparison and decision matrix.',
      type: LectureType.TEXT,
      content: `# Server vs Client Components\n\n| Feature | Server | Client |\n|---|---|---|\n| Render location | Server | Browser |\n| Can use hooks | ❌ | ✅ |\n| Can access DB | ✅ | ❌ |\n| In JS bundle | ❌ | ✅ |\n| Event handlers | ❌ | ✅ |\n\n**Rule of thumb:** Default to Server Components. Add \`"use client"\` only when you need interactivity.`,
      position: 4,
      isPublished: true,
    },
  });

  // --- Section 4: Data Fetching & Caching ---
  const nextS4 = await prisma.section.create({
    data: {
      courseId: courseNext.id,
      title: 'Data Fetching & Caching',
      position: 4,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: nextS4.id,
      title: 'Fetching Data in Server Components',
      description:
        'Using async/await directly in components with the fetch API.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 900,
      position: 1,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: nextS4.id,
      title: 'Caching Strategies: Static, Dynamic & ISR',
      description: 'Understanding the caching layers and revalidation.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 1080,
      position: 2,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: nextS4.id,
      title: 'Server Actions & Mutations',
      description:
        'Using "use server" for form submissions and data mutations.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 1140,
      position: 3,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: nextS4.id,
      title: 'Loading States, Streaming & Suspense',
      description:
        'Progressive rendering with loading.tsx and Suspense boundaries.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 780,
      position: 4,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: nextS4.id,
      title: 'Error Handling & error.tsx',
      description: 'Graceful error boundaries and recovery patterns.',
      type: LectureType.TEXT,
      content: `# Error Handling in Next.js 15\n\nCreate an \`error.tsx\` file in any route segment:\n\n\`\`\`tsx\n'use client';\n\nexport default function Error({ error, reset }: { error: Error; reset: () => void }) {\n  return (\n    <div>\n      <h2>Something went wrong!</h2>\n      <button onClick={() => reset()}>Try again</button>\n    </div>\n  );\n}\n\`\`\`\n\n**Key points:**\n- Must be a Client Component\n- Wraps the route segment in a React Error Boundary\n- The \`reset\` function lets you attempt recovery`,
      position: 5,
      isPublished: true,
    },
  });

  // --- Section 5: Deployment & Performance ---
  const nextS5 = await prisma.section.create({
    data: {
      courseId: courseNext.id,
      title: 'Deployment & Performance',
      position: 5,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: nextS5.id,
      title: 'Deploying to Vercel',
      description:
        'One-click deploy, environment variables, and preview deployments.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 600,
      position: 1,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: nextS5.id,
      title: 'Self-Hosting with Docker',
      description: 'Building a production Docker image with standalone output.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 960,
      position: 2,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: nextS5.id,
      title: 'Performance Optimization & Core Web Vitals',
      description:
        'Image optimization, font loading, bundle analysis, and LCP optimization.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 1080,
      position: 3,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: nextS5.id,
      title: 'Partial Prerendering (PPR)',
      description: 'The cutting-edge hybrid rendering model in Next.js 15.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 900,
      position: 4,
      isPublished: true,
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // 8. REACT 19 DEEP DIVE — Sections & Lectures
  // ═══════════════════════════════════════════════════════════════════
  console.log('📖 Adding content to React 19 course...');

  // --- Section 1: Welcome & React 19 Overview ---
  const reactS1 = await prisma.section.create({
    data: {
      courseId: courseReact.id,
      title: 'Welcome & React 19 Overview',
      position: 1,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: reactS1.id,
      title: 'What Changed in React 19',
      description: 'High-level overview of every new feature and deprecation.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 600,
      position: 1,
      isPublished: true,
      isFree: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: reactS1.id,
      title: 'Setting Up the Playground',
      description: 'Creating a React 19 sandbox for experimentation.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 420,
      position: 2,
      isPublished: true,
      isFree: true,
    },
  });

  // --- Section 2: The React Compiler ---
  const reactS2 = await prisma.section.create({
    data: {
      courseId: courseReact.id,
      title: 'The React Compiler',
      position: 2,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: reactS2.id,
      title: 'Goodbye useMemo & useCallback',
      description: 'How the compiler automates memoization.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 900,
      position: 1,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: reactS2.id,
      title: 'How the Compiler Works Under the Hood',
      description: 'Static analysis, IR, and automatic optimization passes.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 1200,
      position: 2,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: reactS2.id,
      title: 'Rules of React the Compiler Enforces',
      description: 'Understanding idempotency and purity constraints.',
      type: LectureType.TEXT,
      content: `# Rules of React\n\nThe compiler expects your components to follow these rules:\n\n1. **Components must be pure** — same props → same JSX output\n2. **Hooks must be called in the same order** — no conditionals\n3. **No mutations during render** — side effects in useEffect only\n4. **Props and state are immutable** — always create new references\n\nBreaking these rules won't crash your app, but the compiler may skip optimization for that component.`,
      position: 3,
      isPublished: true,
    },
  });

  // --- Section 3: Actions API ---
  const reactS3 = await prisma.section.create({
    data: {
      courseId: courseReact.id,
      title: 'Actions API & Form Handling',
      position: 3,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: reactS3.id,
      title: 'Introduction to Actions',
      description: 'The new way to handle async operations in React.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 780,
      position: 1,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: reactS3.id,
      title: 'useActionState & Form Actions',
      description: 'Building forms with progressive enhancement.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 1020,
      position: 2,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: reactS3.id,
      title: 'useFormStatus for Pending States',
      description: 'Showing loading indicators during form submissions.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 600,
      position: 3,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: reactS3.id,
      title: 'useOptimistic for Instant UI Updates',
      description: 'Optimistic updates that roll back on failure.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 840,
      position: 4,
      isPublished: true,
    },
  });

  // --- Section 4: New Hooks & APIs ---
  const reactS4 = await prisma.section.create({
    data: {
      courseId: courseReact.id,
      title: 'New Hooks & APIs',
      position: 4,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: reactS4.id,
      title: 'The "use" Hook for Promises',
      description: 'Reading async data directly in components with Suspense.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 900,
      position: 1,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: reactS4.id,
      title: 'The "use" Hook for Context',
      description:
        'Conditionally reading context — no more useContext limitations.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 720,
      position: 2,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: reactS4.id,
      title: 'Ref as a Prop & Cleanup Functions',
      description:
        'No more forwardRef — refs are now regular props in React 19.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 660,
      position: 3,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: reactS4.id,
      title: 'React 19 Hooks Summary',
      description: 'Quick-reference cheat sheet for all new and updated hooks.',
      type: LectureType.TEXT,
      content: `# React 19 Hooks Cheat Sheet\n\n| Hook | Purpose |\n|---|---|\n| \`use(promise)\` | Read promise value in render |\n| \`use(context)\` | Conditional context reading |\n| \`useActionState\` | Form state + actions |\n| \`useFormStatus\` | Pending state for forms |\n| \`useOptimistic\` | Optimistic UI updates |\n\n**Deprecated:**\n- \`forwardRef\` → use \`ref\` as a prop\n- \`useContext\` → use \`use(context)\``,
      position: 4,
      isPublished: true,
    },
  });

  // --- Section 5: Migration & Real-World Project ---
  const reactS5 = await prisma.section.create({
    data: {
      courseId: courseReact.id,
      title: 'Migration & Real-World Project',
      position: 5,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: reactS5.id,
      title: 'Migrating from React 18 to 19',
      description: 'Step-by-step upgrade guide and codemods.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 1080,
      position: 1,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: reactS5.id,
      title: 'Building a Task Manager with React 19',
      description:
        'Putting it all together: actions, optimistic updates, and the compiler.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 1800,
      position: 2,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: reactS5.id,
      title: 'Course Recap & Next Steps',
      description:
        'Summary of key takeaways and recommended learning resources.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 480,
      position: 3,
      isPublished: true,
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // 9. POSTGRESQL FOR DEVELOPERS — Sections & Lectures
  // ═══════════════════════════════════════════════════════════════════
  console.log('📖 Adding content to PostgreSQL course...');

  // ─── Section 1: Getting Started ───────────────────────────────────
  const pgS1 = await prisma.section.create({
    data: {
      courseId: coursePg.id,
      title: 'Getting Started with PostgreSQL',
      description:
        "Set up your environment and understand why PostgreSQL is the developer's database of choice.",
      position: 1,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS1.id,
      title: 'Why PostgreSQL? History & Ecosystem',
      description:
        'Understand what makes PostgreSQL stand out: ACID compliance, extensibility, and its thriving ecosystem in 2025.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 540,
      position: 1,
      isPublished: true,
      isFree: true,
    },
  });

  const pgLec2 = await prisma.lecture.create({
    data: {
      sectionId: pgS1.id,
      title: 'Installing PostgreSQL on Mac, Linux & Windows',
      description:
        'Step-by-step installation guide for all major operating systems using official packages and Homebrew.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 720,
      position: 2,
      isPublished: true,
      isFree: true,
    },
  });

  await prisma.attachment.createMany({
    data: [
      {
        lectureId: pgLec2.id,
        name: 'Installation Cheatsheet (PDF)',
        type: AttachmentType.PDF,
        url: 'https://example.com/pg-install-cheatsheet.pdf',
        fileSize: 1024 * 300,
        position: 1,
      },
    ],
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS1.id,
      title: 'Your First psql Session — Navigating the CLI',
      description:
        'Connect to a database, list tables, run queries, and use \\d commands like a pro.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 660,
      position: 3,
      isPublished: true,
      isFree: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS1.id,
      title: 'GUI Tools: pgAdmin 4, DBeaver & DataGrip',
      description:
        'Explore the most popular visual clients, their strengths, and when to use each one.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 480,
      position: 4,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS1.id,
      title: 'PostgreSQL Configuration & the postgresql.conf File',
      description:
        'Key configuration parameters every developer should know: work_mem, max_connections, shared_buffers.',
      type: LectureType.TEXT,
      content: `# Key postgresql.conf Settings\n\n| Parameter | Default | Purpose |\n|---|---|---|\n| \`max_connections\` | 100 | Max simultaneous client connections |\n| \`shared_buffers\` | 128MB | Memory for caching data pages |\n| \`work_mem\` | 4MB | Memory per sort/hash operation |\n| \`effective_cache_size\` | 4GB | Planner estimate of OS cache |\n| \`wal_level\` | replica | Write-Ahead Log detail level |\n\n## Recommended Dev Settings\n\`\`\`ini\nshared_buffers = 256MB\nwork_mem = 16MB\nlog_min_duration_statement = 100\n\`\`\``,
      position: 5,
      isPublished: true,
    },
  });

  // ─── Section 2: SQL Foundations ───────────────────────────────────
  const pgS2 = await prisma.section.create({
    data: {
      courseId: coursePg.id,
      title: 'SQL Foundations',
      description:
        'Build a rock-solid foundation in SQL — the language every database speaks.',
      position: 2,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS2.id,
      title: 'Data Types: Choosing the Right Type for Every Column',
      description:
        'INTEGER vs BIGINT, VARCHAR vs TEXT, TIMESTAMP vs TIMESTAMPTZ — making the right choice matters.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 780,
      position: 1,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS2.id,
      title: 'CREATE TABLE, INSERT, SELECT, UPDATE & DELETE',
      description:
        'The CRUD operations in PostgreSQL with real-world examples.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 1020,
      position: 2,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS2.id,
      title: 'Filtering with WHERE, LIKE, IN & BETWEEN',
      description:
        'Write precise filters to retrieve exactly the records you need.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 840,
      position: 3,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS2.id,
      title: 'Sorting, Pagination: ORDER BY, LIMIT & OFFSET',
      description: 'Implement performant pagination for APIs and dashboards.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 600,
      position: 4,
      isPublished: true,
    },
  });

  const pgLec_sqlRef = await prisma.lecture.create({
    data: {
      sectionId: pgS2.id,
      title: 'SQL Quick Reference Sheet',
      description:
        'A printable summary of all essential SQL commands covered in this section.',
      type: LectureType.TEXT,
      content: `# SQL Quick Reference\n\n## Creating a Table\n\`\`\`sql\nCREATE TABLE users (\n  id        BIGSERIAL PRIMARY KEY,\n  email     TEXT      NOT NULL UNIQUE,\n  name      TEXT,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\`\`\`\n\n## Inserting Data\n\`\`\`sql\nINSERT INTO users (email, name) VALUES\n  ('alice@example.com', 'Alice'),\n  ('bob@example.com', 'Bob');\n\`\`\`\n\n## Querying\n\`\`\`sql\nSELECT id, email FROM users\nWHERE name ILIKE '%ali%'\nORDER BY created_at DESC\nLIMIT 10 OFFSET 0;\n\`\`\`\n\n## Updating & Deleting\n\`\`\`sql\nUPDATE users SET name = 'Alice Smith' WHERE id = 1;\nDELETE FROM users WHERE id = 2;\n\`\`\``,
      position: 5,
      isPublished: true,
    },
  });

  await prisma.attachment.create({
    data: {
      lectureId: pgLec_sqlRef.id,
      name: 'SQL Quick Reference (PDF)',
      type: AttachmentType.PDF,
      url: 'https://example.com/sql-quick-reference.pdf',
      fileSize: 1024 * 450,
      position: 1,
    },
  });

  // ─── Section 3: JOINs & Aggregations ──────────────────────────────
  const pgS3 = await prisma.section.create({
    data: {
      courseId: coursePg.id,
      title: 'JOINs & Aggregations',
      description:
        'Combine data from multiple tables and derive meaningful insights with aggregation functions.',
      position: 3,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS3.id,
      title: 'INNER JOIN — Matching Rows Across Tables',
      description:
        'The most common join type explained with practical examples.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 780,
      position: 1,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS3.id,
      title: 'LEFT, RIGHT & FULL OUTER JOINs',
      description:
        'Handling NULL values and retrieving unmatched rows from either side.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 900,
      position: 2,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS3.id,
      title: 'GROUP BY, HAVING & Aggregate Functions',
      description:
        'COUNT, SUM, AVG, MIN, MAX — summarize data like a data analyst.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 1020,
      position: 3,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS3.id,
      title: 'Window Functions: ROW_NUMBER, RANK & LEAD/LAG',
      description:
        'Perform calculations across a set of rows without collapsing them into a single result.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 1140,
      position: 4,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS3.id,
      title: 'Subqueries, CTEs & Lateral JOINs',
      description:
        'Write readable, maintainable complex queries with Common Table Expressions.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 1080,
      position: 5,
      isPublished: true,
    },
  });

  // ─── Section 4: Schema Design & Data Modeling ──────────────────────
  const pgS4 = await prisma.section.create({
    data: {
      courseId: coursePg.id,
      title: 'Schema Design & Data Modeling',
      description:
        'Learn to design schemas that are clean, normalized, and built to scale.',
      position: 4,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS4.id,
      title: 'Normalization: 1NF → 2NF → 3NF',
      description:
        'Eliminate data redundancy and update anomalies through proper normalization.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 1080,
      position: 1,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS4.id,
      title: 'Primary Keys, Surrogate Keys & Natural Keys',
      description:
        'BIGSERIAL vs UUID vs CUID — choosing the right primary key strategy.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 840,
      position: 2,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS4.id,
      title: 'Foreign Keys, Constraints & CASCADE Rules',
      description:
        'Enforce referential integrity and understand ON DELETE CASCADE vs RESTRICT.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 900,
      position: 3,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS4.id,
      title: 'Modeling Relations: One-to-Many, Many-to-Many & Self-Referencing',
      description:
        'Real-world ER diagrams and how to translate them into Postgres tables.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 1020,
      position: 4,
      isPublished: true,
    },
  });

  const pgLec_schemaRef = await prisma.lecture.create({
    data: {
      sectionId: pgS4.id,
      title: 'Schema Design Cheat Sheet',
      description:
        'A reference guide for schema design decisions and naming conventions.',
      type: LectureType.TEXT,
      content: `# Schema Design Best Practices\n\n## Naming Conventions\n- Tables: **snake_case plural** → \`users\`, \`order_items\`\n- Columns: **snake_case** → \`first_name\`, \`created_at\`\n- Foreign keys: **{table}_id** → \`user_id\`, \`course_id\`\n- Booleans: **is_** or **has_** prefix → \`is_active\`, \`has_verified_email\`\n\n## Always Include\n- \`id BIGSERIAL PRIMARY KEY\` or \`id TEXT PRIMARY KEY DEFAULT gen_random_uuid()\`\n- \`created_at TIMESTAMPTZ DEFAULT NOW()\`\n- \`updated_at TIMESTAMPTZ DEFAULT NOW()\` (with trigger or ORM)\n\n## Data Type Quick Guide\n| Use Case | Type |\n|---|---|\n| Text (any length) | TEXT |\n| Short strings with limit | VARCHAR(n) |\n| Large integers | BIGINT |\n| Money | NUMERIC(10,2) |\n| Timestamps | TIMESTAMPTZ |\n| True/False | BOOLEAN |\n| JSON data | JSONB |\n| UUIDs | UUID |`,
      position: 5,
      isPublished: true,
    },
  });

  await prisma.attachment.create({
    data: {
      lectureId: pgLec_schemaRef.id,
      name: 'Schema Design Reference (PDF)',
      type: AttachmentType.PDF,
      url: 'https://example.com/pg-schema-design.pdf',
      fileSize: 1024 * 380,
      position: 1,
    },
  });

  // ─── Section 5: Indexing & Query Performance ───────────────────────
  const pgS5 = await prisma.section.create({
    data: {
      courseId: coursePg.id,
      title: 'Indexing & Query Performance',
      description:
        'Make your queries blazing fast with the right indexing strategies.',
      position: 5,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS5.id,
      title: 'How PostgreSQL Executes a Query (Query Planner)',
      description:
        'Understand seq scans, index scans, hash joins, and nested loops.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 960,
      position: 1,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS5.id,
      title: 'Reading EXPLAIN & EXPLAIN ANALYZE Output',
      description:
        'Decode query plans, identify bottlenecks, and understand cost estimates.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 1200,
      position: 2,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS5.id,
      title: 'B-Tree Indexes: The Workhorse',
      description:
        'Default index type — when to create them, composite indexes, and index-only scans.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 1080,
      position: 3,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS5.id,
      title: 'GIN & GiST Indexes for Arrays, JSONB & Full-Text',
      description: 'Specialized indexes for complex data types.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 900,
      position: 4,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS5.id,
      title: 'Partial & Expression Indexes',
      description:
        'Index only the rows you query — saving space and boosting speed.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 780,
      position: 5,
      isPublished: true,
    },
  });

  // ─── Section 6: Advanced PostgreSQL Features ───────────────────────
  const pgS6 = await prisma.section.create({
    data: {
      courseId: coursePg.id,
      title: 'Advanced PostgreSQL Features',
      description:
        'Unlock powerful Postgres-specific capabilities that eliminate the need for external services.',
      position: 6,
      isPublished: true,
    },
  });

  const pgLec_jsonb = await prisma.lecture.create({
    data: {
      sectionId: pgS6.id,
      title: 'JSONB — Postgres as a Document Store',
      description:
        'Store, query, index, and update JSON data natively with full SQL power.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 1080,
      position: 1,
      isPublished: true,
    },
  });

  await prisma.attachment.create({
    data: {
      lectureId: pgLec_jsonb.id,
      name: 'JSONB Operators Cheatsheet (PDF)',
      type: AttachmentType.PDF,
      url: 'https://example.com/jsonb-cheatsheet.pdf',
      fileSize: 1024 * 400,
      position: 1,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS6.id,
      title: 'Full-Text Search with tsvector & tsquery',
      description:
        'Build language-aware search without Elasticsearch — ranks results by relevance too.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 960,
      position: 2,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS6.id,
      title: 'Transactions & ACID Guarantees',
      description:
        'BEGIN, COMMIT, ROLLBACK, SAVEPOINT — safe multi-statement operations.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 900,
      position: 3,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS6.id,
      title: 'Isolation Levels & Deadlocks',
      description:
        'READ COMMITTED, REPEATABLE READ, SERIALIZABLE — trade-offs between safety and performance.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 1020,
      position: 4,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS6.id,
      title: 'Row Level Security (RLS) for Multi-Tenant Apps',
      description:
        'Enforce per-user data access policies directly in the database layer.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 840,
      position: 5,
      isPublished: true,
    },
  });

  // ─── Section 7: Production & Deployment ───────────────────────────
  const pgS7 = await prisma.section.create({
    data: {
      courseId: coursePg.id,
      title: 'Production & Deployment',
      description:
        'Take your PostgreSQL knowledge to production: pooling, backups, monitoring, and hosting.',
      position: 7,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS7.id,
      title: 'Connection Pooling with PgBouncer & Supabase Pooler',
      description:
        'Prevent connection exhaustion and scale to thousands of concurrent users.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 840,
      position: 1,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS7.id,
      title: 'Backups: pg_dump, pg_restore & Continuous Archiving',
      description: 'Reliable backup strategies and point-in-time recovery.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 900,
      position: 2,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS7.id,
      title: 'Monitoring with pg_stat_statements & Slow Query Log',
      description:
        'Identify the slowest queries in production and fix them before users complain.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 780,
      position: 3,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS7.id,
      title: 'Hosting Options: Supabase, Railway, Neon & AWS RDS',
      description:
        'Compare managed Postgres services and choose the right one for your project.',
      type: LectureType.VIDEO,
      videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      videoDuration: 720,
      position: 4,
      isPublished: true,
    },
  });

  await prisma.lecture.create({
    data: {
      sectionId: pgS7.id,
      title: 'Course Recap, Next Steps & Resource List',
      description:
        'Summary of what you learned, where to go next, and the best Postgres resources online.',
      type: LectureType.TEXT,
      content: `# Course Recap & Next Steps\n\n## What You Mastered\n- ✅ SQL from scratch to advanced window functions\n- ✅ Schema design, normalization, and relationships\n- ✅ Query optimization with EXPLAIN ANALYZE\n- ✅ Indexing: B-Tree, GIN, GiST, partial\n- ✅ JSONB, full-text search, transactions, RLS\n- ✅ Production: pooling, backups, monitoring\n\n## Where to Go Next\n1. **Prisma ORM** — use your SQL knowledge with a type-safe ORM\n2. **Supabase** — Postgres with a full backend platform\n3. **TimescaleDB** — PostgreSQL for time-series data\n4. **PostGIS** — Geospatial data in PostgreSQL\n\n## Essential Resources\n- [Official Docs](https://www.postgresql.org/docs/)\n- [Use the Index, Luke](https://use-the-index-luke.com/) — indexing explained\n- [Explain Depesz](https://explain.depesz.com/) — visualize EXPLAIN output\n- [pgexercises.com](https://pgexercises.com/) — interactive SQL practice`,
      position: 5,
      isPublished: true,
    },
  });

  // 9. Enroll Student in Next.js course
  console.log('🎓 Enrolling student...');
  const enrollment = await prisma.enrollment.create({
    data: {
      studentId: student.id,
      courseId: courseNext.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  // 10. Add Progress
  console.log('📈 Adding student progress...');
  await prisma.progress.create({
    data: {
      enrollmentId: enrollment.id,
      lectureId: nextLec1.id,
      isCompleted: true,
      completedAt: new Date(),
    },
  });

  // 11. Add Review
  console.log('⭐ Adding reviews...');
  await prisma.review.create({
    data: {
      courseId: courseNext.id,
      userId: student.id,
      rating: 5,
      comment: 'Excellent course! The section on Next.js 15 is mind-blowing.',
    },
  });

  // 12. Instructor Availability
  console.log('📅 Adding instructor availability...');
  await prisma.instructorAvailability.createMany({
    data: [
      {
        instructorId: instructor.id,
        dayOfWeek: 1, // Monday
        startTime: '10:00',
        endTime: '14:00',
        pricePerSlot: 50.0,
        currency: Currency.USD,
      },
      {
        instructorId: instructor.id,
        dayOfWeek: 3, // Wednesday
        startTime: '16:00',
        endTime: '20:00',
        pricePerSlot: 60.0,
        currency: Currency.USD,
      },
    ],
  });

  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
