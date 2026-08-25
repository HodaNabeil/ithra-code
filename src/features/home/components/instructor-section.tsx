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
        <div className="max-w-5xl mx-auto mt-12 w-full">
          <div className="rounded-2xl overflow-hidden shadow-sm border border-border bg-card flex flex-col md:flex-row">
            {/* Image block */}
            <div className="md:w-1/2 shrink-0">
              <Image
                src="/img/hoda.jpg"
                alt="هدى نبيل أبو هاشم - مطورة الواجهات الأمامية"
                width={800}
                height={1000}
                sizes={INSTRUCTOR_IMAGE_SIZES}
                className="w-full h-full object-cover object-top max-h-112.5"
              />
            </div>

            {/* Text content */}
            <div className="p-6 flex flex-col justify-center md:w-1/2">
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mt-1">
                هدي نبيل ابوهشيمة
              </h3>
              <p className="text-brand font-medium mt-2">
                مطورة الواجهات الأمامية ومؤسسة المنصة
              </p>
              <ExpandableContent className="mt-4" initialHeight={150}>
                <p className="text-muted-foreground text-base leading-relaxed">
                  هدى نبيل مطورة واجهات أمامية متخصصة مع خبرة واسعة في بناء
                  تطبيقات الويب الحديثة والمتجاوبة. تتمتع بخبرة عملية في تقنيات
                  React.js وNext.js وTypeScript، وتعمل حاليًا على تطوير منصات
                  التعلم الإلكتروني المتقدمة.
                </p>
              </ExpandableContent>

              <div className="mt-6">
                <SocialLinks />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
