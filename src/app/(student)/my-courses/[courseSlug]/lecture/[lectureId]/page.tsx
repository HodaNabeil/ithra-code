import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { getCourseSections } from '@/features/courses/course-sections';
import { getLecture } from '@/features/courses/lecture-detail';
import { LecturePlayer } from '@/features/my-courses/[courseSlug]/components/lecture-details';
import { mapLectureNavigationFromSections } from '@/features/my-courses/lib/my-course.mapper';
import { auth } from '@/lib/auth';
import {
  LECTURE_DETAIL_TAGS,
  MY_COURSES_TAGS,
} from '@/lib/query-keys';

/**
 * LectureDetailsPage (Server Component)
 *
 * SRP: This page's only responsibility is to resolve route parameters
 * and hydrate the React Query cache for the client-side LecturePlayer.
 */
export default async function LectureDetailsPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lectureId: string }>;
}) {
  const { lectureId, courseSlug } = await params;
  const session = await auth();
  const queryClient = new QueryClient();

  if (session?.user?.id) {
    const viewer = { id: session.user.id, role: session.user.role };

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: LECTURE_DETAIL_TAGS.detail(lectureId),
        queryFn: () => getLecture({ lectureId, user: viewer }),
      }),
      queryClient.prefetchQuery({
        queryKey: MY_COURSES_TAGS.navigation(lectureId, courseSlug),
        queryFn: async () => {
          const sections = await getCourseSections({
            courseIdOrSlug: courseSlug,
            user: viewer,
          });

          return mapLectureNavigationFromSections(
            sections,
            lectureId,
            courseSlug,
          );
        },
      }),
    ]);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LecturePlayer lectureId={lectureId} courseSlug={courseSlug} />
    </HydrationBoundary>
  );
}
