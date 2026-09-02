/* eslint-disable no-console */
import {
  PrismaClient,
  Role,
  CourseLevel,
  CourseStatus,
  CourseVisibility,
  LectureType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL!.replace(
  /([?&]sslmode=)(require|prefer|verify-ca)\b/gi,
  '$1verify-full',
);

// Use PrismaClient with PostgreSQL adapter (same as PrismaService)
const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('🌱 Starting database seeding...');

  const publishedCatalogFields = { isPublished: true } as const;

  /** Schema defaults are DRAFT + PRIVATE; seed catalog courses as live and public. */
  const publishedPublicCourseFields = {
    status: CourseStatus.PUBLISHED,
    visibility: CourseVisibility.PUBLIC,
    publishedAt: new Date(),
  } as const;

  // Clean existing data (in order of dependencies)
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

  // 1. Create Admin User
  console.log('👤 Creating admin user...');
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@ithracode.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      isEmailVerified: true,
      isActive: true,
      bio: 'System Administrator',
      timezone: 'Asia/Riyadh',
      language: 'ar',
    },
  });
  console.log(`✅ Admin user created: ${adminUser.email}`);

  // Create Instructor User
  console.log('👤 Creating instructor user...');
  const instructorPassword = await bcrypt.hash('Instructor@123', 10);

  const instructorUser = await prisma.user.create({
    data: {
      email: 'instructor@ithracode.com',
      password: instructorPassword,
      firstName: 'محمد',
      lastName: 'أحمد',
      role: Role.INSTRUCTOR,
      isEmailVerified: true,
      isActive: true,
      bio: 'مدرب برمجة متخصص في تطوير الويب',
      timezone: 'Asia/Riyadh',
      language: 'ar',
    },
  });
  console.log(`✅ Instructor user created: ${instructorUser.email}`);

  // Create Student User
  console.log('👤 Creating student user...');
  const studentPassword = await bcrypt.hash('Student@123', 10);

  const studentUser = await prisma.user.create({
    data: {
      email: 'student@ithracode.com',
      password: studentPassword,
      firstName: 'أحمد',
      lastName: 'خالد',
      role: Role.STUDENT,
      isEmailVerified: true,
      isActive: true,
      bio: 'طالب متحمس لتعلم البرمجة',
      timezone: 'Asia/Riyadh',
      language: 'ar',
    },
  });
  console.log(`✅ Student user created: ${studentUser.email}`);

  // 2. Create Learning Paths
  console.log('🛤️  Creating learning paths...');

  const webDevPath = await prisma.path.create({
    data: {
      title: 'مسار تطوير الويب الكامل',
      slug: 'full-stack-web-development',
      tagline: 'من الصفر إلى الاحتراف في عالم تطوير الويب',
      shortDescription:
        'ابدأ رحلتك في تطوير الويب وتعلم HTML، CSS، JavaScript، React، وNode.js',
      description:
        'مسار شامل يغطي جميع جوانب تطوير الويب بما في ذلك HTML، CSS، JavaScript، React، Node.js، وقواعد البيانات',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
      category: 'WEB',
      icon: '💻',
      ...publishedCatalogFields,
      sortOrder: 1,
      metaTitle: 'مسار تطوير الويب الكامل - IthraCode',
      metaDescription:
        'تعلم تطوير تطبيقات الويب الحديثة من البداية حتى الاحتراف',
    },
  });
  console.log(`✅ Path created: ${webDevPath.title}`);

  const backendPath = await prisma.path.create({
    data: {
      title: 'مسار تطوير الخلفية Backend',
      slug: 'backend-development',
      tagline: 'قوة الخوادم وأمان APIs في متناول يدك',
      shortDescription:
        'تعلم بناء أنظمة خلفية قوية وآمنة باستخدام أحدث التقنيات',
      description: 'تعلم كيفية بناء خوادم قوية وآمنة باستخدام Node.js و NestJS',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
      category: 'WEB',
      icon: '⚙️',
      ...publishedCatalogFields,
      sortOrder: 2,
      metaTitle: 'مسار تطوير الخلفية - IthraCode',
      metaDescription: 'تعلم بناء تطبيقات خلفية احترافية',
    },
  });
  console.log(`✅ Path created: ${backendPath.title}`);

  const mobilePath = await prisma.path.create({
    data: {
      title: 'مسار تطوير تطبيقات الموبايل',
      slug: 'mobile-app-development',
      tagline: 'ابن تطبيقات iOS و Android احترافية من فكرة واحدة',
      shortDescription:
        'تعلم React Native و Flutter و Swift لبناء تطبيقات سريعة وجذابة على iOS و Android',
      description:
        'مسار شامل لتطوير تطبيقات الهاتف المحمول يغطي React Native و Flutter وتطوير iOS الأصلي. ستتعلم بناء واجهات متجاوبة، إدارة الحالة، ربط APIs، النشر على App Store و Google Play، وأفضل ممارسات الأداء والأمان.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
      category: 'MOBILE',
      icon: '📱',
      ...publishedCatalogFields,
      sortOrder: 3,
      metaTitle: 'مسار تطوير تطبيقات الموبايل - IthraCode',
      metaDescription:
        'تعلم بناء تطبيقات iOS و Android باستخدام React Native و Flutter',
    },
  });
  console.log(`✅ Path created: ${mobilePath.title}`);

  const dataSciencePath = await prisma.path.create({
    data: {
      title: 'مسار علم البيانات والذكاء الاصطناعي',
      slug: 'data-science-ai',
      tagline: 'حوّل البيانات إلى قرارات ذكية وتطبيقات AI',
      shortDescription:
        'من تحليل البيانات إلى تعلم الآلة والشبكات العصبية — مسار عملي بالكامل',
      description:
        'مسار متكامل يأخذك من أساسيات Python وتحليل البيانات إلى تعلم الآلة والتعلم العميق ومعالجة اللغة الطبيعية. ستعمل على مشاريع واقعية باستخدام Pandas و Scikit-learn و TensorFlow مع التركيز على تطبيقات عملية في السوق العربي.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800',
      category: 'OTHER',
      icon: '🤖',
      ...publishedCatalogFields,
      sortOrder: 4,
      metaTitle: 'مسار علم البيانات والذكاء الاصطناعي - IthraCode',
      metaDescription:
        'تعلم Python وتحليل البيانات وتعلم الآلة والذكاء الاصطناعي',
    },
  });
  console.log(`✅ Path created: ${dataSciencePath.title}`);

  const cybersecurityPath = await prisma.path.create({
    data: {
      title: 'مسار الأمن السيبراني',
      slug: 'cybersecurity',
      tagline: 'احمِ الأنظمة والتطبيقات من التهديدات الرقمية',
      shortDescription:
        'تعلم أمن الشبكات والاختراق الأخلاقي وأمان التطبيقات من الصفر',
      description:
        'مسار متخصص في الأمن السيبراني يغطي أساسيات الشبكات، اختبار الاختراق الأخلاقي، أمان تطبيقات الويب، التشفير، والاستجابة للحوادث. مصمم لمن يريدون بناء مهنة في أمن المعلومات أو تأمين مشاريعهم البرمجية.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800',
      category: 'OTHER',
      icon: '🔒',
      ...publishedCatalogFields,
      sortOrder: 5,
      metaTitle: 'مسار الأمن السيبراني - IthraCode',
      metaDescription: 'تعلم الأمن السيبراني والاختراق الأخلاقي وأمان التطبيقات',
    },
  });
  console.log(`✅ Path created: ${cybersecurityPath.title}`);

  const uiUxPath = await prisma.path.create({
    data: {
      title: 'مسار تصميم واجهات وتجربة المستخدم',
      slug: 'ui-ux-design',
      tagline: 'صمّم تجارب رقمية جميلة وسهلة الاستخدام',
      shortDescription:
        'من مبادئ التصميم إلى Figma والنماذج الأولية — مسار للمصممين والمطورين',
      description:
        'مسار يركز على UI/UX Design من الأساسيات: نظرية الألوان والطباعة، تصميم الواجهات بـ Figma، أبحاث المستخدم، رسم User Flows و Wireframes، بناء Design Systems، والتعاون مع فرق التطوير. مناسب للمصممين المبتدئين والمطورين الذين يريدون تحسين مهاراتهم البصرية.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
      category: 'OTHER',
      icon: '🎨',
      ...publishedCatalogFields,
      sortOrder: 6,
      metaTitle: 'مسار تصميم UI/UX - IthraCode',
      metaDescription: 'تعلم تصميم واجهات المستخدم وتجربة المستخدم مع Figma',
    },
  });
  console.log(`✅ Path created: ${uiUxPath.title}`);

  const gameDevPath = await prisma.path.create({
    data: {
      title: 'مسار تطوير الألعاب',
      slug: 'game-development',
      tagline: 'حوّل أفكارك إلى ألعاب تفاعلية ممتعة',
      shortDescription:
        'تعلم Unity و C# وتصميم الألعاب ثنائية وثلاثية الأبعاد',
      description:
        'مسار عملي لتطوير الألعاب يغطي أساسيات Unity و C#، فيزياء الألعاب، الرسوم المتحركة، تصميم المستويات، أنظمة النقاط والتقدم، ونشر الألعاب على المنصات المختلفة. مشاريع تطبيقية من لعبة 2D بسيطة إلى مشروع 3D كامل.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
      category: 'OTHER',
      icon: '🎮',
      ...publishedCatalogFields,
      sortOrder: 7,
      metaTitle: 'مسار تطوير الألعاب - IthraCode',
      metaDescription: 'تعلم تطوير الألعاب باستخدام Unity و C#',
    },
  });
  console.log(`✅ Path created: ${gameDevPath.title}`);

  const cloudDevOpsPath = await prisma.path.create({
    data: {
      title: 'مسار السحابة و DevOps',
      slug: 'cloud-devops',
      tagline: 'انشر وأدر تطبيقاتك على السحابة بكفاءة واحترافية',
      shortDescription:
        'Docker و AWS و CI/CD و Kubernetes — كل ما تحتاجه لعمليات التطوير الحديثة',
      description:
        'مسار متخصص في البنية التحتية السحابية و DevOps. يغطي Docker و Containerization، خدمات AWS الأساسية، بناء خطوط CI/CD، Kubernetes للتوسع، المراقبة والتسجيل، وأتمتة النشر. مثالي للمطورين الذين يريدون إتقان النشر والإدارة السحابية.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
      category: 'OTHER',
      icon: '☁️',
      ...publishedCatalogFields,
      sortOrder: 8,
      metaTitle: 'مسار السحابة و DevOps - IthraCode',
      metaDescription: 'تعلم Docker و AWS و CI/CD و Kubernetes',
    },
  });
  console.log(`✅ Path created: ${cloudDevOpsPath.title}`);

  const pythonPath = await prisma.path.create({
    data: {
      title: 'مسار Python الشامل',
      slug: 'python-programming',
      tagline: 'لغة البرمجة الأكثر تنوعاً — من السكربتات إلى الويب والأتمتة',
      shortDescription:
        'أتقن Python لبناء تطبيقات ويب وأتمتة وتحليل بيانات',
      description:
        'مسار شامل لتعلم Python من الصفر: الأساسيات والبرمجة الكائنية، التعامل مع الملفات و APIs، بناء تطبيقات ويب بـ Flask/Django، الأتمتة والسكربتات، وأساسيات تحليل البيانات. مناسب للمبتدئين المطلقين ولمن يريدون توسيع مهاراتهم.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
      category: 'OTHER',
      icon: '🐍',
      ...publishedCatalogFields,
      sortOrder: 9,
      metaTitle: 'مسار Python الشامل - IthraCode',
      metaDescription: 'تعلم Python من الصفر للاحتراف',
    },
  });
  console.log(`✅ Path created: ${pythonPath.title}`);

  const fullStackAdvancedPath = await prisma.path.create({
    data: {
      title: 'مسار Full Stack المتقدم',
      slug: 'advanced-full-stack',
      tagline: 'ابن أنظمة ويب معقدة بمعماريات احترافية',
      shortDescription:
        'Next.js و GraphQL و Microservices و TypeScript — للمطورين الجاهزين للخطوة التالية',
      description:
        'مسار متقدم للمطورين الذين أتقنوا الأساسيات ويريدون بناء تطبيقات إنتاجية بمعماريات حديثة. يغطي Next.js App Router، GraphQL، TypeScript المتقدم، أنماط Microservices، تحسين الأداء، والاختبارات الشاملة.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      category: 'WEB',
      icon: '🚀',
      ...publishedCatalogFields,
      sortOrder: 10,
      metaTitle: 'مسار Full Stack المتقدم - IthraCode',
      metaDescription: 'تعلم Next.js و GraphQL ومعماريات الويب المتقدمة',
    },
  });
  console.log(`✅ Path created: ${fullStackAdvancedPath.title}`);

  // 3. Create Tracks
  console.log('🛤️ Creating tracks...');

  // Track 1: Frontend Fundamentals
  const frontendTrack = await prisma.track.create({
    data: {
      pathId: webDevPath.id,
      title: 'مسار أساسيات تطوير الواجهات الأمامية',
      slug: 'frontend-fundamentals',
      shortDescription:
        'تعلم أساسيات HTML، CSS، وJavaScript لبناء واجهات ويب جذابة',
      description: `مسار شامل لتعلم أساسيات تطوير الواجهات الأمامية. ستتعلم HTML5، CSS3، JavaScript ES6+، وأساسيات تصميم الويب المتجاوب.
      
## ما ستتعلمه:
- بناء صفحات ويب باستخدام HTML5
- تنسيق وتصميم الواجهات باستخدام CSS3
- البرمجة باستخدام JavaScript الحديث
- التصميم المتجاوب والـ Mobile-First
- أفضل ممارسات تطوير الويب
- أدوات المطورين ونظام Git`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800',
      category: 'WEB',
      icon: '🎨',
      ...publishedCatalogFields,
      sortOrder: 1,
      metaTitle: 'مسار أساسيات تطوير الواجهات الأمامية - IthraCode',
      metaDescription: 'تعلم HTML، CSS، وJavaScript من الصفر',
    },
  });
  console.log(`✅ Track created: ${frontendTrack.title}`);

  // Track 2: Modern JavaScript & Frameworks
  const jsFrameworksTrack = await prisma.track.create({
    data: {
      pathId: webDevPath.id,
      title: 'مسار JavaScript الحديث وأطر العمل',
      slug: 'modern-javascript-frameworks',
      shortDescription:
        'إتقان JavaScript المتقدم وأطر العمل الحديثة مثل React و Vue',
      description: `تعمق في JavaScript الحديث وتعلم أطر العمل الأكثر شعبية لتطوير تطبيقات ويب احترافية.
      
## محتوى المسار:
- JavaScript ES6+ المتقدم
- البرمجة الكائنية وFunctional Programming
- React.js وإدارة الحالة
- Vue.js وVuex
- TypeScript للمشاريع الكبيرة
- Next.js للتطبيقات متعددة الصفحات
- Webpack وأدوات البناء`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800',
      category: 'WEB',
      icon: '⚛️',
      ...publishedCatalogFields,
      sortOrder: 2,
      metaTitle: 'مسار JavaScript الحديث وأطر العمل - IthraCode',
      metaDescription: 'تعلم React، Vue، وTypeScript',
    },
  });
  console.log(`✅ Track created: ${jsFrameworksTrack.title}`);

  // Track 3: Backend Development
  const backendTrack = await prisma.track.create({
    data: {
      pathId: webDevPath.id,
      title: 'مسار تطوير الخلفية والخوادم',
      slug: 'backend-development-track',
      shortDescription:
        'بناء خوادم قوية وآمنة باستخدام Node.js وقواعد البيانات',
      description: `تعلم تطوير الخلفية من الصفر وبناء APIs احترافية وآمنة.
      
## ما ستتعلمه:
- Node.js وExpress.js
- بناء RESTful APIs
- قواعد البيانات (MongoDB، PostgreSQL)
- المصادقة والتفويض (JWT، OAuth)
- WebSockets والتواصل الفوري
- NestJS للمشاريع الكبيرة
- Docker والنشر على السحابة`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
      category: 'WEB',
      icon: '⚙️',
      ...publishedCatalogFields,
      sortOrder: 3,
      metaTitle: 'مسار تطوير الخلفية والخوادم - IthraCode',
      metaDescription: 'تعلم Node.js وبناء APIs احترافية',
    },
  });
  console.log(`✅ Track created: ${backendTrack.title}`);

  // Track 4: Database & Data Management
  const databaseTrack = await prisma.track.create({
    data: {
      pathId: webDevPath.id,
      title: 'مسار قواعد البيانات وإدارة البيانات',
      slug: 'database-data-management',
      shortDescription:
        'إتقان قواعد البيانات SQL وNoSQL وإدارة البيانات بكفاءة',
      description: `تعلم كيفية تصميم وإدارة قواعد البيانات بكفاءة وأمان.
      
## محتوى المسار:
- أساسيات قواعد البيانات
- PostgreSQL وSQL المتقدم
- MongoDB وNoSQL
- تصميم قواعد البيانات والعلاقات
- الفهرسة والأداء
- النسخ الاحتياطي والاستعادة
- Prisma وORMs الحديثة`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
      category: 'WEB',
      icon: '🗄️',
      ...publishedCatalogFields,
      sortOrder: 4,
      metaTitle: 'مسار قواعد البيانات وإدارة البيانات - IthraCode',
      metaDescription: 'تعلم PostgreSQL، MongoDB، وPrisma',
    },
  });
  console.log(`✅ Track created: ${databaseTrack.title}`);

  // Track 5: DevOps & Deployment
  const devopsTrack = await prisma.track.create({
    data: {
      pathId: webDevPath.id,
      title: 'مسار DevOps والنشر على السحابة',
      slug: 'devops-deployment',
      shortDescription:
        'تعلم Docker، CI/CD، ونشر التطبيقات على AWS وخدمات السحابة',
      description: `إتقان أدوات DevOps ونشر التطبيقات على الإنترنت بأمان وكفاءة.
      
## ما ستتعلمه:
- Git وGitHub للتحكم بالإصدارات
- Docker وContainerization
- CI/CD مع GitHub Actions
- AWS وخدمات السحابة
- Nginx وإدارة الخوادم
- الأمان وأفضل الممارسات
- المراقبة والتسجيل`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800',
      category: 'WEB',
      icon: '🚀',
      ...publishedCatalogFields,
      sortOrder: 5,
      metaTitle: 'مسار DevOps والنشر على السحابة - IthraCode',
      metaDescription: 'تعلم Docker، AWS، وCI/CD',
    },
  });
  console.log(`✅ Track created: ${devopsTrack.title}`);

  // Track 6: Testing & Quality Assurance
  const testingTrack = await prisma.track.create({
    data: {
      pathId: webDevPath.id,
      title: 'مسار الاختبارات وضمان الجودة',
      slug: 'testing-quality-assurance',
      shortDescription: 'تعلم كتابة اختبارات شاملة وبناء تطبيقات موثوقة',
      description: `تعلم كيفية كتابة اختبارات فعالة وضمان جودة التطبيقات.
      
## محتوى المسار:
- أساسيات الاختبارات
- Unit Testing مع Jest
- Integration Testing
- E2E Testing مع Cypress
- Test-Driven Development (TDD)
- Code Coverage وأفضل الممارسات
- Performance Testing`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800',
      category: 'WEB',
      icon: '✅',
      ...publishedCatalogFields,
      sortOrder: 6,
      metaTitle: 'مسار الاختبارات وضمان الجودة - IthraCode',
      metaDescription: 'تعلم Jest، Cypress، وTDD',
    },
  });
  console.log(`✅ Track created: ${testingTrack.title}`);

  // Backend Path Tracks
  const nodeJsBackendTrack = await prisma.track.create({
    data: {
      pathId: backendPath.id,
      title: 'مسار Node.js و Express',
      slug: 'nodejs-express-backend',
      shortDescription: 'بناء خوادم سريعة و APIs مرنة باستخدام Node.js',
      description: `تعلم Node.js من الأساسيات إلى بناء RESTful APIs احترافية مع Express.js.
      
## المحتوى:
- Event Loop وآلية عمل Node.js
- npm وإدارة الحزم
- Express.js و Middleware
- Routing و Request Handling
- Error Handling و Validation
- File Upload و Static Assets`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1619410283995-43d9134e7656?w=800',
      category: 'WEB',
      icon: '🟢',
      ...publishedCatalogFields,
      sortOrder: 1,
      metaTitle: 'مسار Node.js و Express - IthraCode',
      metaDescription: 'تعلم Node.js وبناء APIs مع Express',
    },
  });
  console.log(`✅ Track created: ${nodeJsBackendTrack.title}`);

  const nestJsTrack = await prisma.track.create({
    data: {
      pathId: backendPath.id,
      title: 'مسار NestJS للمشاريع الكبيرة',
      slug: 'nestjs-enterprise',
      shortDescription: 'إطار عمل TypeScript لبناء تطبيقات خلفية قابلة للتوسع',
      description: `إتقان NestJS لبناء تطبيقات مؤسسية منظمة وقابلة للصيانة.
      
## ما ستتعلمه:
- Modules و Controllers و Providers
- Dependency Injection
- Guards و Interceptors و Pipes
- TypeORM و Prisma Integration
- Microservices مع NestJS
- Testing و Documentation`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
      category: 'WEB',
      icon: '🐱',
      ...publishedCatalogFields,
      sortOrder: 2,
      metaTitle: 'مسار NestJS - IthraCode',
      metaDescription: 'تعلم NestJS لبناء تطبيقات خلفية مؤسسية',
    },
  });
  console.log(`✅ Track created: ${nestJsTrack.title}`);

  const apiDesignTrack = await prisma.track.create({
    data: {
      pathId: backendPath.id,
      title: 'مسار تصميم وبناء APIs',
      slug: 'api-design-backend',
      shortDescription: 'REST و GraphQL وأفضل ممارسات تصميم الواجهات البرمجية',
      description: `تعلم تصميم APIs احترافية آمنة وقابلة للتوسع.
      
## المحتوى:
- مبادئ RESTful API Design
- Versioning و Pagination
- Authentication (JWT, OAuth 2.0)
- Rate Limiting و Caching
- GraphQL Schema Design
- API Documentation مع Swagger/OpenAPI`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
      category: 'WEB',
      icon: '🔌',
      ...publishedCatalogFields,
      sortOrder: 3,
      metaTitle: 'مسار تصميم APIs - IthraCode',
      metaDescription: 'تعلم تصميم REST و GraphQL APIs احترافية',
    },
  });
  console.log(`✅ Track created: ${apiDesignTrack.title}`);

  // Mobile Path Tracks
  const reactNativeTrack = await prisma.track.create({
    data: {
      pathId: mobilePath.id,
      title: 'مسار React Native',
      slug: 'react-native-mobile',
      shortDescription: 'ابن تطبيقات iOS و Android بلغة JavaScript واحدة',
      description: `تعلم React Native لبناء تطبيقات موبايل أصلية بكود مشترك.
      
## المحتوى:
- إعداد بيئة React Native و Expo
- Components و Styling
- Navigation مع React Navigation
- State Management
- Native Modules و APIs
- النشر على App Store و Google Play`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      category: 'MOBILE',
      icon: '⚛️',
      ...publishedCatalogFields,
      sortOrder: 1,
      metaTitle: 'مسار React Native - IthraCode',
      metaDescription: 'تعلم بناء تطبيقات موبايل بـ React Native',
    },
  });
  console.log(`✅ Track created: ${reactNativeTrack.title}`);

  const flutterTrack = await prisma.track.create({
    data: {
      pathId: mobilePath.id,
      title: 'مسار Flutter و Dart',
      slug: 'flutter-dart-mobile',
      shortDescription: 'تطبيقات جميلة وسريعة بإطار Google المتعدد المنصات',
      description: `إتقان Flutter و Dart لبناء واجهات موبايل عالية الأداء.
      
## ما ستتعلمه:
- أساسيات Dart
- Widgets و Layout
- State Management (Provider, Riverpod, Bloc)
- Firebase Integration
- Animations و Custom UI
- Build و Release`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
      category: 'MOBILE',
      icon: '💙',
      ...publishedCatalogFields,
      sortOrder: 2,
      metaTitle: 'مسار Flutter - IthraCode',
      metaDescription: 'تعلم Flutter لبناء تطبيقات موبايل',
    },
  });
  console.log(`✅ Track created: ${flutterTrack.title}`);

  const iosTrack = await prisma.track.create({
    data: {
      pathId: mobilePath.id,
      title: 'مسار تطوير iOS بـ Swift',
      slug: 'ios-swift-development',
      shortDescription: 'تطبيقات iPhone و iPad أصلية بأداء عالٍ',
      description: `تعلم Swift و SwiftUI لبناء تطبيقات iOS احترافية.
      
## المحتوى:
- Swift Language Fundamentals
- SwiftUI و UIKit
- Core Data و Persistence
- Networking و APIs
- App Store Guidelines
- TestFlight و النشر`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
      category: 'MOBILE',
      icon: '🍎',
      ...publishedCatalogFields,
      sortOrder: 3,
      metaTitle: 'مسار iOS Swift - IthraCode',
      metaDescription: 'تعلم تطوير تطبيقات iOS بـ Swift',
    },
  });
  console.log(`✅ Track created: ${iosTrack.title}`);

  // Data Science Path Tracks
  const pythonDataTrack = await prisma.track.create({
    data: {
      pathId: dataSciencePath.id,
      title: 'مسار Python لتحليل البيانات',
      slug: 'python-data-analysis',
      shortDescription: 'Pandas و NumPy و Matplotlib — أدوات تحليل البيانات الأساسية',
      description: `تعلم تحليل البيانات واستخراج الرؤى باستخدام Python.
      
## المحتوى:
- Pandas للتعامل مع البيانات
- NumPy للحسابات العددية
- Matplotlib و Seaborn للتصور
- تنظيف البيانات ومعالجتها
- Statistical Analysis
- Jupyter Notebooks`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
      category: 'OTHER',
      icon: '📊',
      ...publishedCatalogFields,
      sortOrder: 1,
      metaTitle: 'مسار Python لتحليل البيانات - IthraCode',
      metaDescription: 'تعلم تحليل البيانات بـ Python',
    },
  });
  console.log(`✅ Track created: ${pythonDataTrack.title}`);

  const machineLearningTrack = await prisma.track.create({
    data: {
      pathId: dataSciencePath.id,
      title: 'مسار تعلم الآلة',
      slug: 'machine-learning',
      shortDescription: 'خوارزميات ML من الانحدار إلى التصنيف والتجميع',
      description: `بناء نماذج تعلم آلي تتنبأ وتصنف وتكتشف الأنماط.
      
## ما ستتعلمه:
- Supervised و Unsupervised Learning
- Regression و Classification
- Decision Trees و Random Forest
- Scikit-learn Pipeline
- Model Evaluation و Cross-Validation
- Feature Engineering`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
      category: 'OTHER',
      icon: '🧠',
      ...publishedCatalogFields,
      sortOrder: 2,
      metaTitle: 'مسار تعلم الآلة - IthraCode',
      metaDescription: 'تعلم Machine Learning من الصفر',
    },
  });
  console.log(`✅ Track created: ${machineLearningTrack.title}`);

  const deepLearningTrack = await prisma.track.create({
    data: {
      pathId: dataSciencePath.id,
      title: 'مسار التعلم العميق',
      slug: 'deep-learning',
      shortDescription: 'شبكات عصبية و TensorFlow و PyTorch للذكاء الاصطناعي',
      description: `تعمق في Deep Learning وبناء نماذج ذكاء اصطناعي متقدمة.
      
## المحتوى:
- Neural Networks Fundamentals
- CNNs للصور
- RNNs و LSTMs للنصوص
- TensorFlow و Keras
- Transfer Learning
- نشر نماذج ML`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800',
      category: 'OTHER',
      icon: '🔬',
      ...publishedCatalogFields,
      sortOrder: 3,
      metaTitle: 'مسار التعلم العميق - IthraCode',
      metaDescription: 'تعلم Deep Learning و TensorFlow',
    },
  });
  console.log(`✅ Track created: ${deepLearningTrack.title}`);

  // Cybersecurity Path Tracks
  const networkSecurityTrack = await prisma.track.create({
    data: {
      pathId: cybersecurityPath.id,
      title: 'مسار أمن الشبكات',
      slug: 'network-security',
      shortDescription: 'فهم الشبكات وحمايتها من الهجمات والثغرات',
      description: `تعلم أساسيات الشبكات وأمنها من منظور دفاعي وهجومي.
      
## المحتوى:
- TCP/IP و OSI Model
- Firewalls و IDS/IPS
- VPN و Tunneling
- Network Scanning
- Packet Analysis
- Wireless Security`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800',
      category: 'OTHER',
      icon: '🌐',
      ...publishedCatalogFields,
      sortOrder: 1,
      metaTitle: 'مسار أمن الشبكات - IthraCode',
      metaDescription: 'تعلم أمن الشبكات وحمايتها',
    },
  });
  console.log(`✅ Track created: ${networkSecurityTrack.title}`);

  const ethicalHackingTrack = await prisma.track.create({
    data: {
      pathId: cybersecurityPath.id,
      title: 'مسار الاختراق الأخلاقي',
      slug: 'ethical-hacking',
      shortDescription: 'اختبر الأنظمة بشكل قانوني واكتشف الثغرات قبل المهاجمين',
      description: `تعلم منهجية الاختراق الأخلاقي وأدوات Penetration Testing.
      
## ما ستتعلمه:
- Reconnaissance و Footprinting
- Vulnerability Assessment
- Exploitation Techniques
- Kali Linux Tools
- Report Writing
- Bug Bounty Basics`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
      category: 'OTHER',
      icon: '🕵️',
      ...publishedCatalogFields,
      sortOrder: 2,
      metaTitle: 'مسار الاختراق الأخلاقي - IthraCode',
      metaDescription: 'تعلم Ethical Hacking و Penetration Testing',
    },
  });
  console.log(`✅ Track created: ${ethicalHackingTrack.title}`);

  const appSecurityTrack = await prisma.track.create({
    data: {
      pathId: cybersecurityPath.id,
      title: 'مسار أمان تطبيقات الويب',
      slug: 'web-application-security',
      shortDescription: 'OWASP Top 10 و حماية APIs والتطبيقات',
      description: `احمِ تطبيقاتك من أشهر هجمات الويب والثغرات الأمنية.
      
## المحتوى:
- OWASP Top 10 (SQL Injection, XSS, CSRF)
- Authentication Vulnerabilities
- API Security
- Secure Coding Practices
- Security Headers و HTTPS
- Security Auditing`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800',
      category: 'OTHER',
      icon: '🛡️',
      ...publishedCatalogFields,
      sortOrder: 3,
      metaTitle: 'مسار أمان تطبيقات الويب - IthraCode',
      metaDescription: 'تعلم أمان تطبيقات الويب و OWASP',
    },
  });
  console.log(`✅ Track created: ${appSecurityTrack.title}`);

  // UI/UX Path Tracks
  const designFundamentalsTrack = await prisma.track.create({
    data: {
      pathId: uiUxPath.id,
      title: 'مسار أساسيات التصميم',
      slug: 'design-fundamentals',
      shortDescription: 'الألوان والطباعة والتكوين — لغة التصميم البصري',
      description: `بناء أساس قوي في مبادئ التصميم البصري.
      
## المحتوى:
- Color Theory و Psychology
- Typography و Hierarchy
- Layout و Grid Systems
- Visual Balance و Contrast
- Design Principles
- Mood Boards`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
      category: 'OTHER',
      icon: '✏️',
      ...publishedCatalogFields,
      sortOrder: 1,
      metaTitle: 'مسار أساسيات التصميم - IthraCode',
      metaDescription: 'تعلم مبادئ التصميم البصري',
    },
  });
  console.log(`✅ Track created: ${designFundamentalsTrack.title}`);

  const figmaTrack = await prisma.track.create({
    data: {
      pathId: uiUxPath.id,
      title: 'مسار Figma الاحترافي',
      slug: 'figma-mastery',
      shortDescription: 'صمّم واجهات تفاعلية ونماذج أولية بأداة التصميم الأشهر',
      description: `إتقان Figma من الصفر إلى المشاريع الاحترافية.
      
## ما ستتعلمه:
- Figma Interface و Tools
- Components و Variants
- Auto Layout و Responsive Design
- Prototyping و Interactions
- Design Systems
- Developer Handoff`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800',
      category: 'OTHER',
      icon: '🖌️',
      ...publishedCatalogFields,
      sortOrder: 2,
      metaTitle: 'مسار Figma - IthraCode',
      metaDescription: 'تعلم التصميم بـ Figma',
    },
  });
  console.log(`✅ Track created: ${figmaTrack.title}`);

  const uxResearchTrack = await prisma.track.create({
    data: {
      pathId: uiUxPath.id,
      title: 'مسار أبحاث تجربة المستخدم',
      slug: 'ux-research',
      shortDescription: 'افهم مستخدميك وصمّم حلولاً تلبي احتياجاتهم الحقيقية',
      description: `تعلم منهجيات UX Research لاتخاذ قرارات تصميم مبنية على البيانات.
      
## المحتوى:
- User Interviews و Surveys
- Personas و User Journeys
- Usability Testing
- A/B Testing
- Information Architecture
- Accessibility (a11y)`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800',
      category: 'OTHER',
      icon: '🔍',
      ...publishedCatalogFields,
      sortOrder: 3,
      metaTitle: 'مسار أبحاث UX - IthraCode',
      metaDescription: 'تعلم UX Research و Usability Testing',
    },
  });
  console.log(`✅ Track created: ${uxResearchTrack.title}`);

  // Game Dev Path Tracks
  const unityBasicsTrack = await prisma.track.create({
    data: {
      pathId: gameDevPath.id,
      title: 'مسار أساسيات Unity',
      slug: 'unity-basics',
      shortDescription: 'محرك الألعاب الأشهر — من المشهد الأول إلى اللعب',
      description: `تعلم Unity و C# لبناء ألعابك الأولى.
      
## المحتوى:
- Unity Editor و Interface
- GameObjects و Components
- C# Scripting Basics
- Physics و Collisions
- Input System
- Scenes و Prefabs`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
      category: 'OTHER',
      icon: '🎯',
      ...publishedCatalogFields,
      sortOrder: 1,
      metaTitle: 'مسار أساسيات Unity - IthraCode',
      metaDescription: 'تعلم Unity و C# لتطوير الألعاب',
    },
  });
  console.log(`✅ Track created: ${unityBasicsTrack.title}`);

  const gameDesignTrack = await prisma.track.create({
    data: {
      pathId: gameDevPath.id,
      title: 'مسار تصميم الألعاب',
      slug: 'game-design',
      shortDescription: 'ميكانيكيات اللعب والقصة والتوازن — فن صناعة الألعاب',
      description: `تعلم مبادئ Game Design لصناعة ألعاب ممتعة ومتوازنة.
      
## ما ستتعلمه:
- Core Game Loop
- Level Design
- Game Economy
- Narrative Design
- Player Psychology
- Playtesting و Iteration`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1538481199705-c710c4e96566?w=800',
      category: 'OTHER',
      icon: '🎲',
      ...publishedCatalogFields,
      sortOrder: 2,
      metaTitle: 'مسار تصميم الألعاب - IthraCode',
      metaDescription: 'تعلم Game Design و Level Design',
    },
  });
  console.log(`✅ Track created: ${gameDesignTrack.title}`);

  // Cloud DevOps Path Tracks
  const dockerTrack = await prisma.track.create({
    data: {
      pathId: cloudDevOpsPath.id,
      title: 'مسار Docker و Containers',
      slug: 'docker-containers',
      shortDescription: 'حاويات Docker و Docker Compose لبيئات تطوير موحدة',
      description: `إتقان Docker لتعبئة ونشر التطبيقات بسهولة.
      
## المحتوى:
- Containers vs VMs
- Dockerfile Best Practices
- Docker Compose
- Docker Networking
- Volume Management
- Multi-stage Builds`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800',
      category: 'OTHER',
      icon: '🐳',
      ...publishedCatalogFields,
      sortOrder: 1,
      metaTitle: 'مسار Docker - IthraCode',
      metaDescription: 'تعلم Docker و Containerization',
    },
  });
  console.log(`✅ Track created: ${dockerTrack.title}`);

  const awsCloudTrack = await prisma.track.create({
    data: {
      pathId: cloudDevOpsPath.id,
      title: 'مسار AWS السحابي',
      slug: 'aws-cloud',
      shortDescription: 'خدمات Amazon Web Services الأساسية للمطورين',
      description: `تعلم نشر وإدارة التطبيقات على AWS.
      
## ما ستتعلمه:
- EC2 و VPC
- S3 و CloudFront
- RDS و DynamoDB
- Lambda Serverless
- IAM و Security
- Cost Management`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
      category: 'OTHER',
      icon: '☁️',
      ...publishedCatalogFields,
      sortOrder: 2,
      metaTitle: 'مسار AWS - IthraCode',
      metaDescription: 'تعلم AWS للمطورين',
    },
  });
  console.log(`✅ Track created: ${awsCloudTrack.title}`);

  const cicdTrack = await prisma.track.create({
    data: {
      pathId: cloudDevOpsPath.id,
      title: 'مسار CI/CD والأتمتة',
      slug: 'cicd-automation',
      shortDescription: 'GitHub Actions وخطوط النشر التلقائي',
      description: `أتمت بناء واختبار ونشر تطبيقاتك.
      
## المحتوى:
- CI/CD Concepts
- GitHub Actions Workflows
- Automated Testing in Pipeline
- Deployment Strategies
- Environment Management
- Monitoring Integration`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800',
      category: 'OTHER',
      icon: '⚡',
      ...publishedCatalogFields,
      sortOrder: 3,
      metaTitle: 'مسار CI/CD - IthraCode',
      metaDescription: 'تعلم CI/CD و GitHub Actions',
    },
  });
  console.log(`✅ Track created: ${cicdTrack.title}`);

  // Python Path Tracks
  const pythonBasicsTrack = await prisma.track.create({
    data: {
      pathId: pythonPath.id,
      title: 'مسار أساسيات Python',
      slug: 'python-basics',
      shortDescription: 'أول خطواتك في عالم البرمجة بلغة Python',
      description: `تعلم Python من الصفر — مثالي للمبتدئين المطلقين.
      
## المحتوى:
- Variables و Data Types
- Control Flow
- Functions و Modules
- OOP Basics
- File Handling
- Error Handling`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
      category: 'OTHER',
      icon: '🐍',
      ...publishedCatalogFields,
      sortOrder: 1,
      metaTitle: 'مسار أساسيات Python - IthraCode',
      metaDescription: 'تعلم Python من الصفر',
    },
  });
  console.log(`✅ Track created: ${pythonBasicsTrack.title}`);

  const pythonWebTrack = await prisma.track.create({
    data: {
      pathId: pythonPath.id,
      title: 'مسار Python لتطوير الويب',
      slug: 'python-web-development',
      shortDescription: 'Flask و Django لبناء تطبيقات ويب بـ Python',
      description: `ابن تطبيقات ويب كاملة باستخدام Python.
      
## ما ستتعلمه:
- Flask REST APIs
- Django MVC Pattern
- ORM و Database Integration
- Templates و Forms
- Authentication
- Deployment`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
      category: 'OTHER',
      icon: '🌍',
      ...publishedCatalogFields,
      sortOrder: 2,
      metaTitle: 'مسار Python Web - IthraCode',
      metaDescription: 'تعلم Flask و Django',
    },
  });
  console.log(`✅ Track created: ${pythonWebTrack.title}`);

  // Advanced Full Stack Path Tracks
  const nextJsAdvancedTrack = await prisma.track.create({
    data: {
      pathId: fullStackAdvancedPath.id,
      title: 'مسار Next.js المتقدم',
      slug: 'nextjs-advanced',
      shortDescription: 'App Router و Server Components و Server Actions',
      description: `إتقان Next.js 14+ لبناء تطبيقات إنتاجية.
      
## المحتوى:
- App Router Architecture
- Server vs Client Components
- Server Actions
- Streaming و Suspense
- Caching Strategies
- Vercel Deployment`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
      category: 'WEB',
      icon: '▲',
      ...publishedCatalogFields,
      sortOrder: 1,
      metaTitle: 'مسار Next.js المتقدم - IthraCode',
      metaDescription: 'تعلم Next.js App Router المتقدم',
    },
  });
  console.log(`✅ Track created: ${nextJsAdvancedTrack.title}`);

  const graphqlAdvancedTrack = await prisma.track.create({
    data: {
      pathId: fullStackAdvancedPath.id,
      title: 'مسار GraphQL المتقدم',
      slug: 'graphql-advanced',
      shortDescription: 'Schema Design و Apollo و Real-time Subscriptions',
      description: `بناء APIs حديثة ومرنة مع GraphQL.
      
## ما ستتعلمه:
- Advanced Schema Design
- Resolvers و DataLoader
- Apollo Server/Client
- Subscriptions
- Federation
- Performance Optimization`,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
      category: 'WEB',
      icon: '◈',
      ...publishedCatalogFields,
      sortOrder: 2,
      metaTitle: 'مسار GraphQL المتقدم - IthraCode',
      metaDescription: 'تعلم GraphQL المتقدم',
    },
  });
  console.log(`✅ Track created: ${graphqlAdvancedTrack.title}`);

  // 4. Create Courses
  console.log('📚 Creating courses...');

  // HTML & CSS Fundamentals Course - Frontend Fundamentals Track
  const htmlCssCourse = await prisma.course.create({
    data: {
      instructorId: instructorUser.id,
      pathId: webDevPath.id,
      trackId: frontendTrack.id,
      title: 'HTML5 و CSS3 - أساسيات تطوير الويب',
      description: `ابدأ رحلتك في تطوير الويب مع HTML5 و CSS3.

## ما ستتعلمه:
- أساسيات HTML5 والعناصر الدلالية
- بناء هيكل صفحات الويب
- CSS3 والتنسيقات المتقدمة
- Flexbox و Grid Layout
- التصميم المتجاوب Responsive Design
- CSS Animations والتحولات
- أفضل ممارسات الويب
- مشاريع عملية متعددة

## المشاريع المضمنة:
- صفحة هبوط Landing Page
- موقع محفظة أعمال Portfolio
- صفحة نموذج تسجيل Form Page`,
      shortDescription: 'تعلم أساسيات HTML و CSS لبناء صفحات ويب احترافية',
      slug: 'html-css-fundamentals',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1523437113738-bbd3cc89fb19?w=800',
      previewVideo: 'https://example.com/videos/html-css-preview.mp4',
      price: 199.0,
      compareAtPrice: 399.0,
      currency: 'USD',
      level: CourseLevel.BEGINNER,
      ...publishedPublicCourseFields,
      isFeatured: true,
      duration: 1200, // 20 hours
      requirements: [
        'لا توجد متطلبات مسبقة',
        'حاسوب بمواصفات متوسطة',
        'محرر نصوص (VS Code)',
      ],
      objectives: [
        'إتقان أساسيات HTML5',
        'فهم CSS3 والتنسيقات',
        'بناء صفحات ويب متجاوبة',
        'استخدام Flexbox و Grid',
        'تطبيق أفضل الممارسات',
      ],
      targetAudience: [
        'المبتدئون في تطوير الويب',
        'الراغبون في تعلم البرمجة',
        'المصممون الذين يريدون تعلم الكود',
      ],
      tags: ['html', 'css', 'web', 'frontend', 'beginner'],
      metaTitle: 'دورة HTML5 و CSS3 - أساسيات تطوير الويب',
      metaDescription: 'تعلم HTML و CSS من الصفر وابن صفحات ويب احترافية',
      certificateEnabled: true,
      maxStudents: 1000,
    },
  });
  console.log(`✅ Course created: ${htmlCssCourse.title}`);

  // JavaScript Fundamentals Course - Frontend Fundamentals Track
  const jsFundamentalsCourse = await prisma.course.create({
    data: {
      instructorId: instructorUser.id,
      pathId: webDevPath.id,
      trackId: frontendTrack.id,
      title: 'JavaScript من الصفر - أساسيات البرمجة التفاعلية',
      description: `تعلم JavaScript من الأساسيات وأضف التفاعلية لمواقعك.

## محتوى الدورة:
- أساسيات JavaScript والمتغيرات
- أنواع البيانات والعمليات
- الشروط والحلقات التكرارية
- الدوال Functions والنطاق Scope
- المصفوفات Arrays والكائنات Objects
- DOM Manipulation
- الأحداث Events والتفاعلية
- ES6+ الميزات الحديثة
- Async/Await والعمليات غير المتزامنة
- Local Storage والتخزين المحلي

## المشاريع العملية:
- آلة حاسبة تفاعلية Calculator
- قائمة مهام Todo List
- لعبة تخمين الأرقام
- تطبيق الطقس Weather App`,
      shortDescription: 'أساسيات JavaScript لبناء مواقع تفاعلية',
      slug: 'javascript-fundamentals',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800',
      previewVideo: 'https://example.com/videos/js-fundamentals-preview.mp4',
      price: 349.0,
      compareAtPrice: 599.0,
      currency: 'USD',
      level: CourseLevel.BEGINNER,
      ...publishedPublicCourseFields,
      isFeatured: true,
      duration: 1800, // 30 hours
      requirements: [
        'معرفة أساسية بـ HTML و CSS',
        'لا توجد خبرة برمجية مطلوبة',
      ],
      objectives: [
        'إتقان أساسيات JavaScript',
        'التعامل مع DOM',
        'بناء تطبيقات تفاعلية',
        'فهم ES6+ الحديث',
        'العمل مع APIs',
      ],
      targetAudience: [
        'المبتدئون في البرمجة',
        'مطورو الويب الجدد',
        'من أكملوا دورة HTML/CSS',
      ],
      tags: ['javascript', 'js', 'programming', 'frontend', 'beginner'],
      metaTitle: 'دورة JavaScript من الصفر',
      metaDescription: 'تعلم JavaScript وأضف التفاعلية لمواقعك',
      certificateEnabled: true,
      maxStudents: 1000,
    },
  });
  console.log(`✅ Course created: ${jsFundamentalsCourse.title}`);

  const nodeJsCourse = await prisma.course.create({
    data: {
      instructorId: instructorUser.id,
      pathId: backendPath.id,
      trackId: nodeJsBackendTrack.id,
      title: 'دورة Node.js الشاملة - من الصفر إلى الاحتراف',
      description: `دورة شاملة لتعلم Node.js من البداية حتى الاحتراف. ستتعلم كيفية بناء تطبيقات خلفية قوية وآمنة باستخدام Node.js و Express و NestJS.

## ما ستتعلمه في هذه الدورة:
- أساسيات Node.js و JavaScript الحديث
- بناء واجهات برمجة تطبيقات RESTful APIs
- العمل مع قواعد البيانات (MongoDB, PostgreSQL)
- المصادقة والتفويض (JWT, OAuth)
- رفع الملفات ومعالجة الصور
- WebSockets والتواصل الفوري
- نشر التطبيقات على السحابة

## المتطلبات:
- معرفة أساسية بـ JavaScript
- فهم مبادئ البرمجة الأساسية`,
      shortDescription: 'تعلم Node.js من الصفر وابن تطبيقات خلفية احترافية',
      slug: 'nodejs-complete-guide',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1619410283995-43d9134e7656?w=800',
      previewVideo: 'https://example.com/videos/nodejs-preview.mp4',
      price: 499.0,
      compareAtPrice: 799.0,
      currency: 'USD',
      level: CourseLevel.BEGINNER,
      ...publishedPublicCourseFields,
      isFeatured: true,
      duration: 1800, // 30 hours
      requirements: [
        'معرفة أساسية بـ JavaScript',
        'فهم مبادئ HTML و CSS',
        'حاسوب بمواصفات متوسطة',
        'اتصال إنترنت مستقر',
      ],
      objectives: [
        'إتقان أساسيات Node.js و npm',
        'بناء RESTful APIs احترافية',
        'التعامل مع قواعد البيانات المختلفة',
        'تطبيق أفضل الممارسات الأمنية',
        'نشر التطبيقات على السحابة',
      ],
      targetAudience: [
        'مطورو الويب المبتدئين',
        'المبرمجون الذين يريدون تعلم تطوير الخلفية',
        'الطلاب الذين يبحثون عن مهارات عملية',
      ],
      tags: ['nodejs', 'javascript', 'backend', 'api', 'nestjs'],
      metaTitle: 'دورة Node.js الشاملة - تعلم تطوير الخلفية',
      metaDescription: 'دورة شاملة لتعلم Node.js وبناء تطبيقات خلفية احترافية',
      certificateEnabled: true,
      maxStudents: 1000,
    },
  });
  console.log(`✅ Course created: ${nodeJsCourse.title}`);

  const reactCourse = await prisma.course.create({
    data: {
      instructorId: instructorUser.id,
      pathId: webDevPath.id,
      trackId: frontendTrack.id,
      title: 'React.js - دورة شاملة لبناء واجهات مستخدم تفاعلية',
      description: `تعلم React.js من الصفر وابن واجهات مستخدم حديثة وتفاعلية.

## محتوى الدورة:
- أساسيات React و JSX
- المكونات Components والخصائص Props
- الحالة State وإدارتها
- React Hooks المتقدمة
- Context API و Redux
- React Router للتنقل
- استدعاء APIs والتعامل مع البيانات
- بناء مشاريع عملية

## المشاريع المضمنة:
- تطبيق قائمة مهام Todo App
- متجر إلكتروني E-commerce
- تطبيق دردشة Chat Application`,
      shortDescription: 'ابن واجهات مستخدم احترافية باستخدام React.js',
      slug: 'react-complete-course',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      previewVideo: 'https://example.com/videos/react-preview.mp4',
      price: 599.0,
      compareAtPrice: 899.0,
      currency: 'USD',
      level: CourseLevel.INTERMEDIATE,
      ...publishedPublicCourseFields,
      isFeatured: true,
      duration: 2400, // 40 hours
      requirements: [
        'معرفة جيدة بـ JavaScript',
        'فهم ES6+ features',
        'معرفة أساسية بـ HTML و CSS',
      ],
      objectives: [
        'فهم عميق لمفاهيم React',
        'بناء مكونات قابلة لإعادة الاستخدام',
        'إدارة الحالة بفعالية',
        'التعامل مع APIs الخارجية',
        'بناء تطبيقات كاملة',
      ],
      targetAudience: [
        'المطورون المهتمون بهذا المجال',
        'الطلاب الذين يبحثون عن تعلم مهارات جديدة',
      ],
      tags: ['react', 'javascript', 'frontend', 'ui', 'hooks'],
      metaTitle: 'دورة React.js الشاملة',
      metaDescription: 'تعلم بناء واجهات مستخدم تفاعلية باستخدام React.js',
      certificateEnabled: true,
      maxStudents: 500,
    },
  });
  console.log(`✅ Course created: ${reactCourse.title}`);

  // Python Programming Course
  const pythonCourse = await prisma.course.create({
    data: {
      instructorId: instructorUser.id,
      pathId: pythonPath.id,
      trackId: pythonBasicsTrack.id,
      title: 'Python للمبتدئين - من الصفر إلى الاحتراف',
      description: `دورة شاملة لتعلم لغة Python من الصفر مع تطبيقات عملية.
## محتوى الدورة:
- أساسيات Python والبرمجة
- هياكل البيانات والخوارزميات
- البرمجة الكائنية OOP
- التعامل مع الملفات وقواعد البيانات
- بناء تطبيقات الويب مع Django/Flask
- Data Science والتحليل`,
      shortDescription: 'تعلم Python من الأساسيات حتى الاحتراف',
      slug: 'python-complete-beginner',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
      price: 399.0,
      compareAtPrice: 699.0,
      currency: 'USD',
      level: CourseLevel.BEGINNER,
      ...publishedPublicCourseFields,
      isFeatured: true,
      duration: 2000,
      requirements: ['لا توجد متطلبات مسبقة', 'حاسوب وإنترنت'],
      objectives: [
        'إتقان أساسيات Python',
        'بناء مشاريع عملية',
        'فهم البرمجة الكائنية',
      ],
      targetAudience: [
        'المطورون المهتمون بهذا المجال',
        'الطلاب الذين يبحثون عن تعلم مهارات جديدة',
      ],
      tags: ['python', 'programming', 'backend', 'beginners'],
      certificateEnabled: true,
    },
  });
  console.log(`✅ Course created: ${pythonCourse.title}`);

  // MongoDB Course
  const mongoDbCourse = await prisma.course.create({
    data: {
      instructorId: instructorUser.id,
      pathId: webDevPath.id,
      trackId: databaseTrack.id,
      title: 'MongoDB - قواعد البيانات NoSQL الحديثة',
      description: `تعلم MongoDB وقواعد بيانات NoSQL من الصفر.
## ما ستتعلمه:
- أساسيات MongoDB وNoSQL
- CRUD Operations المتقدمة
- Aggregation Framework
- Indexing والأداء
- Mongoose مع Node.js
- أفضل الممارسات الأمنية`,
      shortDescription: 'إتقان MongoDB وقواعد بيانات NoSQL',
      slug: 'mongodb-complete-guide',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
      price: 349.0,
      compareAtPrice: 599.0,
      currency: 'USD',
      level: CourseLevel.INTERMEDIATE,
      ...publishedPublicCourseFields,
      duration: 1200,
      requirements: ['معرفة أساسية بقواعد البيانات', 'فهم JavaScript'],
      objectives: [
        'إتقان MongoDB',
        'بناء تطبيقات باستخدام NoSQL',
        'تحسين الأداء',
      ],
      targetAudience: [
        'المطورون المهتمون بهذا المجال',
        'الطلاب الذين يبحثون عن تعلم مهارات جديدة',
      ],
      tags: ['mongodb', 'database', 'nosql', 'backend'],
      certificateEnabled: true,
    },
  });
  console.log(`✅ Course created: ${mongoDbCourse.title}`);

  // Vue.js Course
  const vueCourse = await prisma.course.create({
    data: {
      instructorId: instructorUser.id,
      pathId: webDevPath.id,
      trackId: jsFrameworksTrack.id,
      title: 'Vue.js 3 - إطار العمل التقدمي',
      description: `تعلم Vue.js 3 وابن تطبيقات ويب تفاعلية.
## المحتوى:
- أساسيات Vue 3 و Composition API
- Reactive Data والمكونات
- Vue Router للتنقل
- Vuex/Pinia لإدارة الحالة
- التكامل مع APIs
- بناء SPA كاملة`,
      shortDescription: 'ابن تطبيقات حديثة مع Vue.js 3',
      slug: 'vuejs-3-complete',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
      price: 449.0,
      compareAtPrice: 749.0,
      currency: 'USD',
      level: CourseLevel.INTERMEDIATE,
      ...publishedPublicCourseFields,
      duration: 1800,
      requirements: ['JavaScript ES6+', 'HTML/CSS'],
      objectives: ['إتقان Vue 3', 'بناء SPAs', 'إدارة الحالة'],
      targetAudience: [
        'المطورون المهتمون بهذا المجال',
        'الطلاب الذين يبحثون عن تعلم مهارات جديدة',
      ],
      tags: ['vue', 'javascript', 'frontend', 'spa'],
      certificateEnabled: true,
    },
  });
  console.log(`✅ Course created: ${vueCourse.title}`);

  // Docker & DevOps Course
  const dockerCourse = await prisma.course.create({
    data: {
      instructorId: instructorUser.id,
      pathId: cloudDevOpsPath.id,
      trackId: dockerTrack.id,
      title: 'Docker و DevOps للمطورين',
      description: `تعلم Docker و DevOps وأتمتة نشر التطبيقات.
## محتوى الدورة:
- أساسيات Docker و Containers
- Docker Compose للمشاريع متعددة الخدمات
- CI/CD Pipelines
- Kubernetes مقدمة
- Monitoring والLoggin
- أفضل ممارسات DevOps`,
      shortDescription: 'أتمتة النشر والتطوير مع Docker',
      slug: 'docker-devops-developers',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800',
      price: 549.0,
      compareAtPrice: 899.0,
      currency: 'USD',
      level: CourseLevel.ADVANCED,
      ...publishedPublicCourseFields,
      isFeatured: true,
      duration: 1500,
      requirements: ['معرفة بتطوير التطبيقات', 'Linux أساسيات'],
      objectives: ['إتقان Docker', 'بناء CI/CD', 'نشر التطبيقات'],
      targetAudience: [
        'المطورون المهتمون بهذا المجال',
        'الطلاب الذين يبحثون عن تعلم مهارات جديدة',
      ],
      tags: ['docker', 'devops', 'kubernetes', 'ci-cd'],
      certificateEnabled: true,
    },
  });
  console.log(`✅ Course created: ${dockerCourse.title}`);

  // TypeScript Course - Frontend Fundamentals Track
  const typeScriptCourse = await prisma.course.create({
    data: {
      instructorId: instructorUser.id,
      pathId: webDevPath.id,
      trackId: frontendTrack.id,
      title: 'TypeScript - JavaScript مع الأنواع',
      description: `إتقان TypeScript للمشاريع الاحترافية.
## ما ستتعلمه:
- أساسيات TypeScript
- Types و Interfaces
- Generics المتقدمة
- Decorators و Metadata
- TypeScript مع React/Node
- أفضل الممارسات`,
      shortDescription: 'اكتب كود JavaScript أكثر أماناً مع TypeScript',
      slug: 'typescript-complete-guide',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800',
      price: 299.0,
      compareAtPrice: 499.0,
      currency: 'USD',
      level: CourseLevel.INTERMEDIATE,
      ...publishedPublicCourseFields,
      duration: 1000,
      requirements: ['JavaScript متقدم'],
      objectives: ['إتقان TypeScript', 'كتابة كود آمن', 'استخدام مع المكتبات'],
      targetAudience: [
        'المطورون المهتمون بهذا المجال',
        'الطلاب الذين يبحثون عن تعلم مهارات جديدة',
      ],
      tags: ['typescript', 'javascript', 'types', 'programming'],
      certificateEnabled: true,
    },
  });
  console.log(`✅ Course created: ${typeScriptCourse.title}`);

  // Next.js Course
  const nextJsCourse = await prisma.course.create({
    data: {
      instructorId: instructorUser.id,
      pathId: fullStackAdvancedPath.id,
      trackId: nextJsAdvancedTrack.id,
      title: 'Next.js 14 - React Framework للإنتاج',
      description: `ابن تطبيقات React احترافية مع Next.js 14.
## محتوى الدورة:
- App Router الجديد
- Server Components
- Server Actions
- Static و Dynamic Rendering
- API Routes
- SEO Optimization
- Deployment على Vercel`,
      shortDescription: 'تطوير تطبيقات React احترافية مع Next.js',
      slug: 'nextjs-14-complete',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
      price: 649.0,
      compareAtPrice: 999.0,
      currency: 'USD',
      level: CourseLevel.ADVANCED,
      ...publishedPublicCourseFields,
      isFeatured: true,
      duration: 2200,
      requirements: ['React متقدم', 'TypeScript أساسيات'],
      objectives: ['إتقان Next.js 14', 'بناء تطبيقات Production', 'تحسين SEO'],
      targetAudience: [
        'المطورون المهتمون بهذا المجال',
        'الطلاب الذين يبحثون عن تعلم مهارات جديدة',
      ],
      tags: ['nextjs', 'react', 'ssr', 'seo', 'fullstack'],
      certificateEnabled: true,
    },
  });
  console.log(`✅ Course created: ${nextJsCourse.title}`);

  // GraphQL Course
  const graphqlCourse = await prisma.course.create({
    data: {
      instructorId: instructorUser.id,
      pathId: fullStackAdvancedPath.id,
      trackId: graphqlAdvancedTrack.id,
      title: 'GraphQL - مستقبل APIs',
      description: `تعلم GraphQL وابن APIs حديثة وفعالة.
## المحتوى:
- أساسيات GraphQL
- Schema و Types
- Queries و Mutations
- Resolvers متقدمة
- Apollo Server/Client
- Real-time مع Subscriptions
- أفضل الممارسات`,
      shortDescription: 'ابن APIs قوية ومرنة مع GraphQL',
      slug: 'graphql-complete-course',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
      price: 499.0,
      compareAtPrice: 799.0,
      currency: 'USD',
      level: CourseLevel.ADVANCED,
      ...publishedPublicCourseFields,
      duration: 1400,
      requirements: ['Node.js متقدم', 'REST APIs فهم'],
      objectives: ['إتقان GraphQL', 'بناء APIs حديثة', 'Apollo Stack'],
      targetAudience: [
        'المطورون المهتمون بهذا المجال',
        'الطلاب الذين يبحثون عن تعلم مهارات جديدة',
      ],
      tags: ['graphql', 'api', 'apollo', 'backend'],
      certificateEnabled: true,
    },
  });
  console.log(`✅ Course created: ${graphqlCourse.title}`);

  // Angular Course
  const angularCourse = await prisma.course.create({
    data: {
      instructorId: instructorUser.id,
      pathId: webDevPath.id,
      trackId: jsFrameworksTrack.id,
      title: 'Angular - الإطار الشامل من Google',
      description: `تعلم Angular وابن تطبيقات مؤسسية قوية.
## ما ستتعلمه:
- أساسيات Angular و TypeScript
- Components و Modules
- Services و Dependency Injection
- RxJS و Observables
- Forms و Validation
- Routing متقدم
- State Management مع NgRx`,
      shortDescription: 'ابن تطبيقات مؤسسية مع Angular',
      slug: 'angular-complete-guide',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=800',
      price: 599.0,
      compareAtPrice: 899.0,
      currency: 'USD',
      level: CourseLevel.INTERMEDIATE,
      ...publishedPublicCourseFields,
      duration: 2400,
      requirements: ['TypeScript', 'JavaScript ES6+'],
      objectives: ['إتقان Angular', 'بناء تطبيقات مؤسسية', 'RxJS'],
      targetAudience: [
        'المطورون المهتمون بهذا المجال',
        'الطلاب الذين يبحثون عن تعلم مهارات جديدة',
      ],
      tags: ['angular', 'typescript', 'frontend', 'spa'],
      certificateEnabled: true,
    },
  });
  console.log(`✅ Course created: ${angularCourse.title}`);

  // PostgreSQL Course
  const postgresCourse = await prisma.course.create({
    data: {
      instructorId: instructorUser.id,
      pathId: webDevPath.id,
      trackId: databaseTrack.id,
      title: 'PostgreSQL - قاعدة البيانات العلائقية المتقدمة',
      description: `إتقان PostgreSQL للتطبيقات الاحترافية.
## محتوى الدورة:
- أساسيات SQL و PostgreSQL
- Advanced Queries
- Indexes و Performance
- Transactions و ACID
- JSON Support
- Full-Text Search
- Replication و Backup`,
      shortDescription: 'تعلم PostgreSQL من الأساسيات للاحتراف',
      slug: 'postgresql-advanced',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
      price: 399.0,
      compareAtPrice: 649.0,
      currency: 'USD',
      level: CourseLevel.INTERMEDIATE,
      ...publishedPublicCourseFields,
      duration: 1600,
      requirements: ['SQL أساسيات', 'قواعد البيانات مفاهيم'],
      objectives: ['إتقان PostgreSQL', 'تحسين الأداء', 'Database Design'],
      targetAudience: [
        'المطورون المهتمون بهذا المجال',
        'الطلاب الذين يبحثون عن تعلم مهارات جديدة',
      ],
      tags: ['postgresql', 'sql', 'database', 'backend'],
      certificateEnabled: true,
    },
  });
  console.log(`✅ Course created: ${postgresCourse.title}`);

  // Tailwind CSS Course - Frontend Fundamentals Track
  const tailwindCourse = await prisma.course.create({
    data: {
      instructorId: instructorUser.id,
      pathId: webDevPath.id,
      trackId: frontendTrack.id,
      title: 'Tailwind CSS - التصميم السريع والحديث',
      description: `تعلم Tailwind CSS وصمم واجهات جميلة بسرعة.
## ما ستتعلمه:
- Utility-First CSS
- Responsive Design
- Dark Mode
- Components Building
- التخصيص المتقدم
- أفضل الممارسات
- مشاريع عملية`,
      shortDescription: 'صمم واجهات احترافية بسرعة مع Tailwind',
      slug: 'tailwind-css-complete',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800',
      price: 249.0,
      compareAtPrice: 449.0,
      currency: 'USD',
      level: CourseLevel.BEGINNER,
      ...publishedPublicCourseFields,
      duration: 800,
      requirements: ['HTML/CSS أساسيات'],
      objectives: ['إتقان Tailwind CSS', 'تصميم سريع', 'Responsive Design'],
      targetAudience: [
        'المطورون المهتمون بهذا المجال',
        'الطلاب الذين يبحثون عن تعلم مهارات جديدة',
      ],
      tags: ['tailwind', 'css', 'design', 'frontend'],
      certificateEnabled: true,
    },
  });
  console.log(`✅ Course created: ${tailwindCourse.title}`);

  // AWS Course
  const awsCourse = await prisma.course.create({
    data: {
      instructorId: instructorUser.id,
      pathId: cloudDevOpsPath.id,
      trackId: awsCloudTrack.id,
      title: 'AWS للمطورين - السحابة من Amazon',
      description: `تعلم AWS وانشر تطبيقاتك على السحابة.
## محتوى الدورة:
- مقدمة إلى AWS
- EC2 و S3
- Lambda و Serverless
- RDS و DynamoDB
- CloudFront و CDN
- IAM والأمان
- Cost Optimization`,
      shortDescription: 'انشر تطبيقاتك على AWS',
      slug: 'aws-for-developers',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
      price: 699.0,
      compareAtPrice: 1099.0,
      currency: 'USD',
      level: CourseLevel.ADVANCED,
      ...publishedPublicCourseFields,
      isFeatured: true,
      duration: 2000,
      requirements: ['تطوير التطبيقات', 'Linux أساسيات'],
      objectives: ['إتقان AWS', 'نشر التطبيقات', 'Serverless'],
      targetAudience: [
        'المطورون المهتمون بهذا المجال',
        'الطلاب الذين يبحثون عن تعلم مهارات جديدة',
      ],
      tags: ['aws', 'cloud', 'devops', 'serverless'],
      certificateEnabled: true,
    },
  });
  console.log(`✅ Course created: ${awsCourse.title}`);

  // Testing Course
  const testingCourse = await prisma.course.create({
    data: {
      instructorId: instructorUser.id,
      pathId: webDevPath.id,
      trackId: testingTrack.id,
      title: 'اختبار التطبيقات - Unit, Integration, E2E',
      description: `تعلم كتابة اختبارات احترافية لتطبيقاتك.
## المحتوى:
- أساسيات Testing
- Unit Testing مع Jest
- Integration Testing
- E2E مع Cypress/Playwright
- TDD Methodology
- Mocking و Stubbing
- CI/CD Integration`,
      shortDescription: 'اكتب اختبارات احترافية لتطبيقاتك',
      slug: 'testing-complete-guide',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=800',
      price: 449.0,
      compareAtPrice: 699.0,
      currency: 'USD',
      level: CourseLevel.INTERMEDIATE,
      ...publishedPublicCourseFields,
      duration: 1200,
      requirements: ['JavaScript/TypeScript', 'تطوير التطبيقات'],
      objectives: ['إتقان Testing', 'TDD', 'كتابة اختبارات فعالة'],
      targetAudience: [
        'المطورون المهتمون بهذا المجال',
        'الطلاب الذين يبحثون عن تعلم مهارات جديدة',
      ],
      tags: ['testing', 'jest', 'cypress', 'tdd', 'quality'],
      certificateEnabled: true,
    },
  });
  console.log(`✅ Course created: ${testingCourse.title}`);

  await prisma.course.updateMany({
    where: { instructorId: instructorUser.id },
    data: {
      status: CourseStatus.PUBLISHED,
      visibility: CourseVisibility.PUBLIC,
      publishedAt: new Date(),
    },
  });
  console.log('✅ All seeded courses set to PUBLISHED and PUBLIC');

  // 4. Connect Prerequisites for Node.js course
  console.log('🔗 Connecting prerequisites for Node.js course...');
  await prisma.course.update({
    where: { id: nodeJsCourse.id },
    data: {
      prerequisites: {
        connect: [{ id: typeScriptCourse.id }, { id: pythonCourse.id }],
      },
    },
  });
  console.log('✅ Prerequisites connected for Node.js course');

  // 4a. Create Specific Sections and Lectures for Node.js
  console.log('📑 Creating detailed curriculum for Node.js...');

  const section1 = await prisma.section.create({
    data: {
      courseId: nodeJsCourse.id,
      title: 'مقدمة إلى Node.js',
      description: 'تعرف على Node.js وتعلم الأساسيات',
      position: 0,
      ...publishedCatalogFields,
    },
  });

  const section2 = await prisma.section.create({
    data: {
      courseId: nodeJsCourse.id,
      title: 'بناء أول خادم Express',
      description: 'تعلم كيفية إنشاء خادم ويب باستخدام Express.js',
      position: 1,
      ...publishedCatalogFields,
    },
  });

  const section3 = await prisma.section.create({
    data: {
      courseId: nodeJsCourse.id,
      title: 'التعامل مع قواعد البيانات',
      description: 'ربط تطبيقك بقواعد البيانات المختلفة',
      position: 2,
      ...publishedCatalogFields,
    },
  });

  // Node.js Lectures
  await prisma.lecture.createMany({
    data: [
      {
        sectionId: section1.id,
        title: 'ما هو Node.js؟',
        description: 'مقدمة شاملة عن Node.js وكيف يعمل',
        type: LectureType.VIDEO,
        position: 0,
        ...publishedCatalogFields,
        isFree: true,
      },
      {
        sectionId: section1.id,
        title: 'تثبيت Node.js و npm',
        description: 'خطوات تثبيت Node.js على أنظمة التشغيل المختلفة',
        type: LectureType.VIDEO,
        position: 1,
        ...publishedCatalogFields,
        isFree: true,
      },
      {
        sectionId: section1.id,
        title: 'بيئة التطوير المثالية',
        description: 'إعداد بيئة التطوير باستخدام VS Code',
        type: LectureType.VIDEO,
        position: 2,
        ...publishedCatalogFields,
        isFree: false,
      },
      {
        sectionId: section2.id,
        title: 'أساسيات Express.js',
        description: 'تعرف على Express.js وكيفية استخدامه',
        type: LectureType.VIDEO,
        position: 0,
        ...publishedCatalogFields,
        isFree: false,
      },
      {
        sectionId: section2.id,
        title: 'Routing في Express',
        description: 'تعلم كيفية إنشاء Routes وتنظيمها',
        type: LectureType.VIDEO,
        position: 1,
        ...publishedCatalogFields,
        isFree: false,
      },
      {
        sectionId: section3.id,
        title: 'مقدمة إلى MongoDB',
        description: 'تعلم أساسيات MongoDB وكيفية استخدامها',
        type: LectureType.VIDEO,
        position: 0,
        ...publishedCatalogFields,
        isFree: false,
      },
    ],
  });

  // Create attachments for Node.js lectures
  console.log('📎 Creating attachments for Node.js course...');
  const nodeJsLectures = await prisma.lecture.findMany({
    where: { section: { courseId: nodeJsCourse.id } },
  });

  for (const lecture of nodeJsLectures) {
    if (lecture.title === 'ما هو Node.js؟') {
      await prisma.attachment.createMany({
        data: [
          {
            lectureId: lecture.id,
            name: 'ملاحظات المحاضرة - مقدمة Node.js',
            description: 'ملاحظات مفصلة عن مقدمة Node.js وأساسياته',
            type: 'PDF',
            url: 'https://example.com/notes/nodejs-intro.pdf',
            fileSize: 2048000,
            mimeType: 'application/pdf',
          },
          {
            lectureId: lecture.id,
            name: 'شرائح المحاضرة',
            description: 'شرائح PowerPoint لمحاضرة مقدمة Node.js',
            type: 'PPTX',
            url: 'https://example.com/slides/nodejs-intro.pptx',
            fileSize: 5120000,
            mimeType:
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          },
        ],
      });
    } else if (lecture.title === 'تثبيت Node.js و npm') {
      await prisma.attachment.createMany({
        data: [
          {
            lectureId: lecture.id,
            name: 'دليل التثبيت التفصيلي',
            description: 'خطوات التثبيت على جميع أنظمة التشغيل',
            type: 'PDF',
            url: 'https://example.com/guides/nodejs-installation.pdf',
            fileSize: 1536000,
            mimeType: 'application/pdf',
          },
        ],
      });
    } else if (lecture.title === 'بيئة التطوير المثالية') {
      await prisma.attachment.createMany({
        data: [
          {
            lectureId: lecture.id,
            name: 'قائمة الإضافات المطلوبة',
            description: 'إضافات VS Code الأساسية لتطوير Node.js',
            type: 'DOC',
            url: 'https://example.com/lists/nodejs-extensions.doc',
            fileSize: 3072,
            mimeType: 'application/msword',
          },
        ],
      });
    } else if (lecture.title === 'أساسيات Express.js') {
      await prisma.attachment.createMany({
        data: [
          {
            lectureId: lecture.id,
            name: 'ملاحظات Express.js',
            description: 'ملاحظات مفصلة عن أساسيات Express.js',
            type: 'PDF',
            url: 'https://example.com/notes/express-basics.pdf',
            fileSize: 2560000,
            mimeType: 'application/pdf',
          },
        ],
      });
    } else if (lecture.title === 'Routing في Express') {
      await prisma.attachment.createMany({
        data: [
          {
            lectureId: lecture.id,
            name: 'دليل Routing',
            description: 'شرح مفصل لنظام Routing في Express.js',
            type: 'PDF',
            url: 'https://example.com/guides/express-routing.pdf',
            fileSize: 1792000,
            mimeType: 'application/pdf',
          },
        ],
      });
    } else if (lecture.title === 'مقدمة إلى MongoDB') {
      await prisma.attachment.createMany({
        data: [
          {
            lectureId: lecture.id,
            name: 'ملاحظات MongoDB',
            description: 'ملاحظات عن أساسيات MongoDB',
            type: 'PDF',
            url: 'https://example.com/notes/mongodb-intro.pdf',
            fileSize: 2048000,
            mimeType: 'application/pdf',
          },
        ],
      });
    }
  }

  // 4b. Create Generic Sections and Lectures for OTHER courses
  console.log('📑 Creating generic curriculum for other courses...');
  const allCourses = [
    htmlCssCourse,
    jsFundamentalsCourse,
    reactCourse,
    pythonCourse,
    mongoDbCourse,
    vueCourse,
    dockerCourse,
    typeScriptCourse,
    nextJsCourse,
    graphqlCourse,
    angularCourse,
    postgresCourse,
    tailwindCourse,
    awsCourse,
    testingCourse,
  ];

  for (const course of allCourses) {
    console.log(`  - Adding curriculum to: ${course.title}`);

    // Create Introduction Section
    const introSection = await prisma.section.create({
      data: {
        courseId: course.id,
        title: 'مقدمة في المسار',
        description: `أهلاً بك في دورة ${course.title}`,
        position: 0,
        ...publishedCatalogFields,
      },
    });

    // Create Introduction Lecture
    await prisma.lecture.create({
      data: {
        sectionId: introSection.id,
        title: 'مقدمة عامة',
        description: 'فيديو مقدمة عن محتوى الدورة وأهدافها',
        type: LectureType.VIDEO,
        position: 0,
        ...publishedCatalogFields,
        isFree: true,
      },
    });

    // Create Basics Section
    const basicsSection = await prisma.section.create({
      data: {
        courseId: course.id,
        title: 'الأساسيات والمفاهيم',
        description: 'شرح للمفاهيم الأساسية والأدوات المطلوبة',
        position: 1,
        ...publishedCatalogFields,
      },
    });

    // Create Basics Lecture
    await prisma.lecture.create({
      data: {
        sectionId: basicsSection.id,
        title: 'إعداد بيئة العمل',
        description: 'كيفية تثبيت الأدوات اللازمة والبدء في التطبيق العملي',
        type: LectureType.VIDEO,
        position: 0,
        ...publishedCatalogFields,
        isFree: false,
      },
    });
  }

  // 6. Create Enrollments
  console.log('📝 Creating enrollments...');

  const enrollment1 = await prisma.enrollment.create({
    data: {
      studentId: studentUser.id,
      courseId: nodeJsCourse.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Enrollment created for student in Node.js course`);

  // 7. Create Progress
  console.log('📊 Creating progress records...');

  const firstLectureOfFirstCourse = await prisma.lecture.findFirst({
    where: { section: { courseId: nodeJsCourse.id } },
  });

  if (firstLectureOfFirstCourse) {
    await prisma.progress.create({
      data: {
        enrollmentId: enrollment1.id,
        lectureId: firstLectureOfFirstCourse.id,
        isCompleted: true,
        completedAt: new Date(),
        timeSpent: 600,
      },
    });
  }
  console.log(`✅ Progress record created`);

  // 8. Create Cart for Student
  console.log('🛒 Creating cart for student...');

  const studentCart = await prisma.cart.create({
    data: {
      userId: studentUser.id,
      subtotal: 0,
      discount: 0,
      total: 0,
      currency: 'USD',
    },
  });
  console.log(`✅ Cart created for student`);

  // Add some courses to student's cart
  await prisma.cartItem.createMany({
    data: [
      {
        cartId: studentCart.id,
        courseId: awsCourse.id,
        price: awsCourse.price,
        currency: awsCourse.currency,
      },
      {
        cartId: studentCart.id,
        courseId: testingCourse.id,
        price: testingCourse.price,
        currency: testingCourse.currency,
      },
      {
        cartId: studentCart.id,
        courseId: reactCourse.id,
        price: reactCourse.price,
        currency: reactCourse.currency,
      },
    ],
  });

  // Update cart totals (prices are already Decimal from course records)
  const cartSubtotal =
    Number(awsCourse.price) +
    Number(testingCourse.price) +
    Number(reactCourse.price);
  await prisma.cart.update({
    where: { id: studentCart.id },
    data: {
      subtotal: cartSubtotal.toFixed(2),
      total: cartSubtotal.toFixed(2),
    },
  });
  console.log(
    `✅ Added 3 courses to student's cart (Total: ${cartSubtotal} USD)`,
  );

  // 9. Create Testimonials  
  console.log('💬 Creating testimonials...');

  await prisma.testimonial.createMany({
    data: [
      {
        name: 'أحمد محمد',
        avatarUrl: 'https://i.pravatar.cc/150?img=12',
        content: 'منصة رائعة ساعدتني كثيراً في تعلم البرمجة. المحتوى ممتاز والشرح واضح جداً. أنصح بها بشدة!',
        rating: 5,
        isActive: true,
      },
      {
        name: 'سارة علي',
        avatarUrl: 'https://i.pravatar.cc/150?img=45',
        content: 'تجربة تعليمية مميزة! استفدت كثيراً من دورة React وأصبحت قادرة على بناء تطبيقات احترافية.',
        rating: 5,
        isActive: true,
      },
      {
        name: 'خالد عبدالله',
        avatarUrl: 'https://i.pravatar.cc/150?img=33',
        content: 'أفضل منصة تعليمية عربية للبرمجة. الدورات شاملة والمدربون محترفون جداً.',
        rating: 5,
        isActive: true,
      },
      {
        name: 'فاطمة حسن',
        avatarUrl: 'https://i.pravatar.cc/150?img=47',
        content: 'بدأت من الصفر وأصبحت الآن قادرة على بناء مواقع كاملة. شكراً IthraCode على هذه الفرصة الرائعة!',
        rating: 5,
        isActive: true,
      },
      {
        name: 'محمود إبراهيم',
        avatarUrl: 'https://i.pravatar.cc/150?img=68',
        content: 'دورة Node.js كانت شاملة جداً وعملية. تعلمت كيف أبني APIs احترافية وأنشرها على السحابة.',
        rating: 5,
        isActive: true,
      },
      {
        name: 'نور الدين',
        avatarUrl: null,
        content: 'المنصة سهلة الاستخدام والدعم الفني ممتاز. حصلت على إجابات لكل أسئلتي بسرعة.',
        rating: 4,
        isActive: true,
      },
      {
        name: 'ريم أحمد',
        avatarUrl: 'https://i.pravatar.cc/150?img=20',
        content: 'استثمار رائع! قيمة الدورات أعلى بكثير من السعر. المحتوى غني والمشاريع العملية مفيدة جداً.',
        rating: 5,
        isActive: true,
      },
      {
        name: 'عمر خالد',
        avatarUrl: 'https://i.pravatar.cc/150?img=51',
        content: 'تعلمت TypeScript بطريقة سلسة ومنظمة. الشرح مبسط والأمثلة واقعية.',
        rating: 5,
        isActive: true,
      },
      {
        name: 'منى سعيد',
        avatarUrl: null,
        content: 'دورة Docker كانت ممتازة! الآن أستطيع نشر تطبيقاتي بثقة وكفاءة.',
        rating: 4,
        isActive: true,
      },
      {
        name: 'يوسف محمد',
        avatarUrl: 'https://i.pravatar.cc/150?img=60',
        content: 'منصة احترافية بكل المقاييس. الشهادات معتمدة وساعدتني في الحصول على وظيفة أحلامي!',
        rating: 5,
        isActive: true,
      },
    ],
  });
  console.log('✅ Created 10 testimonials');

  // 9b. Create FAQs
  console.log('❓ Creating FAQs...');

  await prisma.faq.createMany({
    data: [
      {
        question: 'هل IthraCode مجرد منصة لتعليم البرمجة؟',
        answer:
          'IthraCode هي منظومة تهدف إلى مساعدة الأفراد على تعلم البرمجة وتطوير مهاراتهم من خلال تجربة عملية مرتبطة باحتياجات سوق العمل. ومع تطور المنصة، نعمل على بناء بيئة تربط بين التعلم، بناء المهارات، الفرص المهنية، والتعاون مع الشركات والعملاء.',
        sortOrder: 1,
        isActive: true,
      },
      {
        question: 'هل المنصة مناسبة للمبتدئين؟',
        answer:
          'نعم، صُممت المنصة للمبتدئين والمطورين متوسطي المستوى، بمسار تعليمي يبدأ من الأساسيات ويتقدم تدريجياً.',
        sortOrder: 2,
        isActive: true,
      },
      {
        question: 'كيف أستفيد من التجارب الواقعية؟',
        answer:
          'نقدّم أمثلة ومشاريع مستوحاة من تجارب حقيقية في الشركات، مع شرح خطوات التنفيذ والأخطاء الشائعة، لتطبيق ما تتعلمه عملياً.',
        sortOrder: 3,
        isActive: true,
      },
      {
        question: 'هل أستطيع الوصول للمحتوى بعد الشراء؟',
        answer:
          'نعم، بمجرد إتمام الشراء ستتمكن من الوصول إلى جميع محاضرات الدورة وموادها بشكل دائم ودون أي قيود زمنية.',
        sortOrder: 4,
        isActive: true,
      },
      {
        question: 'ما طرق الدفع المتاحة؟',
        answer:
          'نوفر طرق دفع آمنة تشمل البطاقات الائتمانية والمحافظ الإلكترونية المحلية، مع دعم العملات المتاحة في منطقتك.',
        sortOrder: 5,
        isActive: true,
      },
      {
        question: 'هل يوجد دعم فني؟',
        answer:
          'نعم، يمكنك التواصل مع فريق الدعم للحصول على مساعدة بخصوص الدورات والمحتوى التعليمي.',
        sortOrder: 6,
        isActive: true,
      },
    ],
  });
  console.log('✅ Created 6 FAQs');

  // 10. Create Reviews (will be combined with testimonials)
  console.log('⭐ Creating reviews for courses...');

  await prisma.review.createMany({
    data: [
      {
        courseId: nodeJsCourse.id,
        userId: studentUser.id,
        rating: 5,
        comment: 'دورة Node.js رائعة! تعلمت كيف أبني APIs احترافية من البداية للنهاية. المشاريع العملية كانت مفيدة جداً.',
      },
      {
        courseId: reactCourse.id,
        userId: studentUser.id,
        rating: 5,
        comment: 'أفضل دورة React بالعربي! الشرح واضح والمشاريع واقعية. أصبحت قادراً على بناء تطبيقات React معقدة.',
      },
      {
        courseId: htmlCssCourse.id,
        userId: studentUser.id,
        rating: 4,
        comment: 'دورة ممتازة للمبتدئين. تعلمت أساسيات HTML و CSS بطريقة سلسة ومنظمة.',
      },
      {
        courseId: jsFundamentalsCourse.id,
        userId: studentUser.id,
        rating: 5,
        comment: 'JavaScript أصبحت لغتي المفضلة بعد هذه الدورة! الشرح رائع والتمارين مفيدة.',
      },
    ],
  });
  console.log('✅ Created 4 reviews');


  console.log('\n✨ Database seeding completed successfully!\n');
  console.log('📋 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`👤 Users created: 3`);
  console.log(`   - Admin: admin@ithracode.com / Admin@123`);
  console.log(`   - Instructor: instructor@ithracode.com / Instructor@123`);
  console.log(`   - Student: student@ithracode.com / Student@123`);
  console.log(`\n🛤️  Paths created: 10`);
  console.log(`🛤️  Tracks created: 30`);
  console.log(`📚 Courses created: 2`);
  console.log(`📑 Sections created: 5`);
  console.log(`🎥 Lectures created: 10`);
  console.log(`📎 Attachments created: 23`);
  console.log(`📝 Enrollments created: 1`);
  console.log(`📊 Progress records created: 1`);
  console.log(`🛒 Cart items created: 3`);
  console.log(`💬 Testimonials created: 10`);
  console.log(`❓ FAQs created: 6`);
  console.log(`⭐ Reviews created: 4 (rating >= 4 will show as testimonials)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Summary
  console.log('\n✨ Database seeding completed successfully!\n');
  console.log('📋 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Users created: 3');
  console.log('   - Admin: admin@ithracode.com / Admin@123');
  console.log('   - Instructor: instructor@ithracode.com / Instructor@123');
  console.log('   - Student: student@ithracode.com / Student@123');
  console.log('');
  console.log('🛤️  Paths created: 10');
  console.log('🛤️  Tracks created: 30');
  console.log('📚 Courses created: 14');
  console.log('📑 Sections created: 5 (for first 2 courses)');
  console.log('🎥 Lectures created: 10 (for first 2 courses)');
  console.log('📎 Attachments created: 23 (for first 2 courses)');
  console.log('📝 Enrollments created: 1');
  console.log('📊 Progress records created: 1');
  console.log('🛒 Cart items created: 3');
  console.log('💬 Testimonials created: 10');
  console.log('❓ FAQs created: 6');
  console.log('⭐ Reviews created: 4 (rating >= 4 will show as testimonials)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
