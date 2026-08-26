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
          subTitle="تعلّم مباشرة مع هدى نبيل"
          title="تعرّف على مدربتك"
        />
        <div className="max-w-5xl mx-auto mt-12 w-full overflow-hidden rounded-xl border border-border bg-black shadow-sm flex flex-col md:flex-row md:items-stretch">
          {/* Image block */}
          <div className="relative w-full aspect-4/5 sm:aspect-3/4 md:aspect-auto md:w-1/2 md:min-h-112.5 shrink-0">
            <Image
              src="/img/hoda.jpg"
              alt="هدى نبيل ابوهشيمة - مطورة الواجهات الأمامية"
              fill
              sizes={INSTRUCTOR_IMAGE_SIZES}
              className="object-cover object-[50%_12%]"
            />
          </div>

          {/* Text content */}
          <div className="p-6 md:p-8 flex flex-col justify-center md:w-1/2 min-w-0">
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mt-1">
              هدى نبيل ابوهشيمة
            </h3>
            <p className="text-brand font-medium mt-2">
              مطوّرة واجهات أمامية ومؤسِّسة IthraCode
            </p>
            <ExpandableContent className="mt-4" initialHeight={150}>
              <div className="space-y-4 text-muted-foreground text-base leading-relaxed">
                <p>
                  مطوّرة واجهات أمامية متخصّصة في بناء تطبيقات ويب حديثة
                  ومتجاوبة، بخبرة عملية في React وNext.js وTypeScript. تعمل
                  حاليًا على تطوير منصات تعلّم إلكتروني متقدّمة تجمع بين
                  الأداء العالي وتجربة مستخدم سلسة.
                </p>
                <p>
                  أسّست IthraCode لتقريب تعلّم البرمجة من الواقع العملي —
                  بعيدًا عن التعقيد غير الضروري. في دوراتها، تنقل خبرتها
                  الميدانية بأسلوب واضح ومتدرّج، لمساعدة المبتدئين والمطورين
                  على بناء مهارات يمكن الاعتماد عليها في سوق العمل.
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
