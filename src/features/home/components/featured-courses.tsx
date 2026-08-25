import Link from 'next/link';
import type { CourseListDTO } from '@/types/course/course.dto';
import SectionHeading from './section-heading';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { HomeCourseCard } from './home-course-card';


interface FeaturedCoursesProps {
  courses: CourseListDTO[];
}

export function FeaturedCourses({ courses }: FeaturedCoursesProps) {
  return (
    <section className="pb-16 md:pb-20 lg:pb-24">
      <div className="container">
        <SectionHeading
          subTitle="بعض الدورات"
          title="ارفع مستوى مهاراتك في البرمجة"
        />
        <p className="mt-6 mx-auto text-center max-w-[50ch] text-lg lg:leading-8 text-muted-foreground">
          سواء كنت تريد الانتقال إلى مهنة في مجال التكنولوجيا أو التقدم في
          وظيفتك الحالية، فإن دوراتي تمنحك المعرفة والخبرة التي تحتاجها لتحقيق
          النجاح.
        </p>

        <div className="mt-20">
          {courses.length > 0 ? (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mx-auto max-w-[calc(350px*3)]">
              {courses.map((course) => (
                <li
                  key={course.id}
                  className="[&:nth-child(3n)_.course-hover-card]:lg:right-auto [&:nth-child(3n)_.course-hover-card]:lg:left-[calc(100%+0.8rem)] [&:nth-child(3n)_.course-hover-card]:lg:slide-in-from-left-2"
                >
                  <HomeCourseCard course={course} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-lg text-muted-foreground text-center">
              لا يوجد دورات متاحة
            </p>
          )}

          <div className="mt-14 text-center">
            <Link
              href={PUBLIC_ROUTES.COURSES}
              className="inline-flex items-center justify-center text-primary-foreground w-fit mx-auto transition-all duration-200 bg-primary hover:bg-primary/90 rounded-3xl px-6 h-10"
            >
              عرض جميع الدورات
            </Link>
            <p className="my-6 text-base text-muted-foreground">
              لست متأكدا من أين تبدأ؟ تحقق من{' '}
              <Link
                href={PUBLIC_ROUTES.LEARNING_PATHS}
                className="font-semibold border-b border-primary text-accent-foreground hover:border-transparent duration-200 transition-all"
              >
                مسارات التعلم
              </Link>{' '}
              لدينا
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
