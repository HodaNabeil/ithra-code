import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import {
  getLectureDetails,
  getLectureNavigation,
} from '@/features/my-courses/actions/my-course';
import { LectureView } from '@/features/my-courses/[courseSlug]/components/lecture-details';
import { AITutorConfig } from '@/features/ai-tutor';
import { MY_COURSES_TAGS } from '@/lib/query-keys';

/**
 * LectureDetailsPage (Server Component)
 *
 * SRP: This page's only responsibility is to resolve route parameters
 * and hydrate the React Query cache for the client-side LectureView.
 */
export default async function LectureDetailsPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lectureId: string }>;
}) {
  const { lectureId, courseSlug } = await params;
  const queryClient = new QueryClient();

  // Prefetch data on the server to ensure high performance and SEO
  // This follows the DIP principle by using the same query keys as the client
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: MY_COURSES_TAGS.lecture(lectureId, courseSlug),
      queryFn: () => getLectureDetails(lectureId, courseSlug),
    }),
    queryClient.prefetchQuery({
      queryKey: MY_COURSES_TAGS.navigation(lectureId, courseSlug),
      queryFn: () => getLectureNavigation(lectureId, courseSlug),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LectureView
        lectureId={lectureId}
        courseSlug={courseSlug}
        aiTutorEnabled={AITutorConfig.isEnabled()}
      />
    </HydrationBoundary>
  );
}
