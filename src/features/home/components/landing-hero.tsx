import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/shared/link';
import { APP_ROUTES } from '@/constants/enums';

export function LandingHero() {
  return (
    <section className="section-padding ">
      <div className="container flex flex-col lg:flex-row items-center gap-8 lg:gap-12 xl:gap-16">
        <div className="flex flex-col  text-right w-full lg:w-1/2 lg:max-w-xl gap-6">
          <h1 className="text-foreground">ithracode</h1>
          <p className="text-muted-foreground leading-relaxed">
            هي منصة تهدف الي تعليم البرمجة بأبسط الطرق الممكنة مع وجود مجموعة
            متنوعة من الدورات التي تجمع بين الشرح المفصل والتجارب العملية للوصول
            إلى أفضل النتائج.
          </p>
          <Button
            asChild
            className="rounded-full px-8 h-12 text-base font-semibold bg-linear-to-r from-collection-purple-500 to-collection-blue-500 text-white hover:opacity-90 transition-opacity border-0"
          >
            <Link href={APP_ROUTES.COURSES}>ابدأ الان (مجانًا) ←</Link>
          </Button>
        </div>

        <div className="w-full lg:w-1/2 flex justify-center">
          <Image
            src="/img/landing.webp"
            alt="ithracode — code editor preview"
            width={2488}
            height={1680}
            priority
            className="w-full max-w-lg lg:max-w-none h-auto"
            sizes="(max-width: 1024px) 90vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}
