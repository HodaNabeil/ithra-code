import {
  ExpandableContent,
  FormattedTextContent,
} from '@/components/shared/expandable-content';
import { Link } from '@/components/shared/link';
import type { PathDetailDTO } from '@/types/path/path.dto';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { formatDuration } from '@/lib/formatters';
import { formatCourseLevel } from '@/features/courses/lib/course-formatters';

interface PathTracksProps {
  tracks: PathDetailDTO['tracks'];
}

export function PathTracks({ tracks }: PathTracksProps) {
  return (
    <div className="container">
      <div className="max-w-prose flex flex-col gap-14 mt-14 mb-10">
        {tracks.map((track) => (
          <section key={track.id} className="border-b pb-6 border-border">
            <h2 className="text-3xl lg:text-4xl mb-6 font-medium md:font-semibold text-foreground">
              {track.title}
            </h2>
            {track.description && (
              <ExpandableContent
                initialHeight={200}
                expandLabel="عرض المزيد"
                collapseLabel="عرض أقل"
              >
                <FormattedTextContent
                  content={track.description}
                  className="mb-6"
                />
              </ExpandableContent>
            )}

            {/* Display courses list */}
            {track.courses && track.courses.length > 0 && (
              <ul className="flex flex-col">
                {track.courses.map((course, index) => {
                  const isLast = track.courses!.length - 1 === index;

                  return (
                    <li key={course.id} className="relative flex gap-7">
                      <div className="relative flex flex-col items-center w-3 shrink-0">
                        <div className="w-3 h-3 mt-2 bg-brand rounded-full z-10 shrink-0"></div>
                        {!isLast && (
                          <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-0.5 h-full bg-brand/90 z-0"></div>
                        )}
                      </div>

                      <div className="pb-7 flex-1">
                        <h3 className="text-xl text-foreground font-medium block w-fit border-b-2 border-transparent hover:border-brand transition-all duration-200">
                          <Link
                            href={`${PUBLIC_ROUTES.COURSES}/${course.slug}`}
                          >
                            {course.title}
                          </Link>
                        </h3>
                        <p className="text-muted-foreground text-base">
                          {formatCourseLevel(course.level)}
                          {course.hours &&
                            ` . ${formatDuration(course.hours * 60, 'ar')}`}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
