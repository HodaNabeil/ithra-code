import Image from 'next/image';
import Link from 'next/link';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { HeroCoursePromo } from './hero-course-promo';
import { HERO_IMAGE_SIZES } from '@/features/home/constants/image-sizes';

interface Course {
  id: string;
  title: string;
  slug: string;
  price?: number;
  instructor?: {
    name: string;
  };
}

interface HeroSectionProps {
  promoCourse?: Course;
}

export default function HeroSection({ promoCourse }: HeroSectionProps) {
  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="text-center md:text-right">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance animate-in fade-in slide-in-from-bottom-4 duration-700">
              تعلم البرمجة ببساطة وفعالية
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed text-pretty max-w-prose mx-auto md:mx-0 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
              أتقن البرمجة مع{' '}
              <span className="text-brand">IthraCode</span> عبر خبرات وتجارب
              واقعية من الشركات. منصة تعليمية تؤهّلك لسوق العمل بفرص وظيفية
              ودخل متميز.
            </p>
            <div className="mt-8 sm:mt-10 flex items-center justify-center md:justify-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <Link
                href={PUBLIC_ROUTES.COURSES}
                className="group inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-3xl px-6 sm:px-8 h-11 sm:h-12 text-base sm:text-lg font-medium transition-colors hover:bg-primary/90"
              >
                ابدأ التعلم الآن
                <span className="transition-transform group-hover:-translate-x-1">
                  ←
                </span>
              </Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md animate-in fade-in slide-in-from-end-8 duration-700 delay-200">
            {/* Ambient glowing background */}
            <div
              className="absolute -inset-4 rounded-4xl bg-linear-to-tr from-brand/20 via-primary/20 to-purple-500/20 blur-3xl opacity-70 animate-pulse"
              style={{ animationDuration: '4s' }}
              aria-hidden
            />
            <div className="hero-float relative">
              {promoCourse ? (
                <HeroCoursePromo course={promoCourse} />
              ) : (
                <Image
                  src="/img/home/why-ithracode-steps.webp"
                  alt="IthraCode - تعلم البرمجة خطوة بخطوة"
                  width={480}
                  height={480}
                  priority
                  fetchPriority="high"
                  className="relative z-10 w-full h-auto rounded-4xl object-cover"
                  sizes={HERO_IMAGE_SIZES}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
