import Link from 'next/link';
import { PUBLIC_ROUTES } from '@/constants/routes';
import SectionHeading from './section-heading';

interface Course {
  id: string;
  title: string;
  description?: string;
  price?: number;
  slug: string;
  thumbnailUrl?: string;
  instructor?: {
    name: string;
  };
}

interface FeaturedCoursesProps {
  courses: Course[];
}

export default function FeaturedCourses({ courses }: FeaturedCoursesProps) {
  if (!courses || courses.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container element-center flex-col">
        <SectionHeading subTitle="الدورات" title="دورات مميزة من IthraCode" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 w-full">
          {courses.map((course) => (
            <div
              key={course.id}
              className="border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
            >
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
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {course.title}
                </h3>
                {course.description && (
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {course.description}
                  </p>
                )}
                {course.instructor && (
                  <p className="text-sm text-brand mb-4">
                    المدرب: {course.instructor.name}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  {course.price && (
                    <span className="font-bold text-lg">
                      {course.price} جنيه
                    </span>
                  )}
                  <Link
                    href={`${PUBLIC_ROUTES.COURSES}/${course.slug}`}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    عرض الدورة
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link
            href={PUBLIC_ROUTES.COURSES}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80"
          >
            عرض جميع الدورات
          </Link>
        </div>
      </div>
    </section>
  );
}
