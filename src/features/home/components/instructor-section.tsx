import Image from 'next/image';
import { ExpandableContent } from '@/components/shared/expandable-content';
import SocialLinks from '@/components/shared/footer/social-links';
import SectionHeading from './section-heading';
import { INSTRUCTOR_IMAGE_SIZES } from '@/features/home/constants/image-sizes';

export default function InstructorSection() {
  return (
    <section className="pb-16 md:pb-20 lg:pb-24">
      <div className="container element-center flex-col">
        <SectionHeading
          subTitle="تعلّم مباشرة مع Hoda Abu Hashima"
          title="تعرّف على مدربتك"
          subTitleUppercase={false}
        />
        <div className="max-w-5xl mx-auto mt-12 w-full overflow-hidden rounded-xl border border-border bg-card [--fade-background:var(--card)] shadow-sm flex flex-col md:flex-row md:items-start">
          {/* Image block */}
          <div
            className="relative w-full aspect-4/5 sm:aspect-3/4 md:aspect-auto
           md:w-1/2 md:min-h-112.5 shrink-0"
          >
            <Image
              src="/img/hoda.jpg"
              alt="Hoda Abu Hashima - مطورة الواجهات الأمامية"
              fill
              sizes={INSTRUCTOR_IMAGE_SIZES}
              className="object-cover "
            />
          </div>

          {/* Text content */}
          <div className="p-6 md:p-8 flex flex-col justify-center md:w-1/2 min-w-0">
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mt-1">
              Hoda Abu Hashima
            </h3>
            <p className="text-brand mt-2 font-bold">Founder & Instructor</p>
            <ExpandableContent className="mt-4">
              <div className="space-y-4 text-muted-foreground text-base leading-relaxed">
                <p>
                  هدي (Frontend Engineer) متخصّصة في تصميم وبناء تطبيقات ويب
                  حديثة وعالية الأداء وقابلة للتوسع (Scalable Web Applications).
                  تتمتع بكفاءة متقدمة في تطوير الواجهات الأمامية (Frontend
                  Development) باستخدام React وNext.js وTypeScript، إلى جانب
                  خبرة في هندسة البرمجيات (Software Engineering)، وتصميم
                  معماريات الواجهات (Frontend Architecture)، وبناء أنظمة مكوّنات
                  قابلة لإعادة الاستخدام (Reusable Component Systems)، وتحسين
                  الأداء وتجربة المستخدم وتحسين محركات البحث (SEO).
                </p>
                <p>
                  تمتلك هدى كذلك خلفية برمجية متينة في C++ وJava، تعزّز فهمها
                  لأساسيات البرمجة وهندسة البرمجيات وحل المشكلات التقنية
                  المعقدة، إلى جانب خبرة عملية في التكامل مع الواجهات الخلفية
                  (Backend APIs) وتطوير حلول متكاملة تشمل المصادقة، والمدفوعات،
                  وإدارة البيانات، وتتبع تقدّم المستخدمين، مما يمكّنها من تحويل
                  المتطلبات التقنية إلى حلول متكاملة جاهزة للنشر في بيئات
                  الإنتاج (Production-Ready Solutions).
                </p>
                <p>
                  وإلى جانب مسيرتها التقنية، عملت هدى كمدرّبة تقنية (Tech
                  Instructor) في عدد من المؤسسات والبرامج التعليمية، من بينها
                  مؤسسة العرب التابعة للجامعة الأمريكية بالقاهرة، حيث قامت
                  بتدريب المبتدئين وتبسيط المفاهيم البرمجية والتقنية وتقديمها
                  بأسلوب عملي ومنهجي. كما أسّست IthraCode بهدف تقديم تجربة
                  تعليمية عملية تساعد المتعلّمين على بناء أساس قوي في البرمجة
                  وتطوير مهارات قابلة للتطبيق من خلال المشاريع الواقعية.
                </p>
              </div>
            </ExpandableContent>

            <div className="mt-6">
              <SocialLinks />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
