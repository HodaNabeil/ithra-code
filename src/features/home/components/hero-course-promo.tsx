import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { formatPrice } from '@/lib/formatters';

interface Course {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl?: string;
  price?: number;
  currency?: string;
  instructor?: {
    name: string;
  };
}

interface HeroCoursePromoProps {
  course: Course;
}

export function HeroCoursePromo({ course }: HeroCoursePromoProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg hover:border-primary/50 transition-all duration-200">
      {course.thumbnailUrl && (
        <div className="aspect-video bg-muted">
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <h3 className="font-bold text-xl mb-2 text-foreground">
          {course.title}
        </h3>
        {course.instructor && (
          <p className="text-sm text-brand mb-4">مع {course.instructor.name}</p>
        )}
        {course.price != null && (
          <div className="text-lg font-bold text-primary mb-4">
            {formatPrice(course.price, course.currency)}
          </div>
        )}
        <Button asChild className="w-full">
          <Link href={`${PUBLIC_ROUTES.COURSES}/${course.slug}`}>
            ابدأ التعلم
          </Link>
        </Button>
      </div>
    </div>
  );
}
