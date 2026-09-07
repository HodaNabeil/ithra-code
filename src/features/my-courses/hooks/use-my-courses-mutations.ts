import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateLectureProgressClient } from '@/features/courses/lecture-progress/api/update-lecture-progress.client';
import { MY_COURSES_TAGS } from '@/lib/query-keys';
import type { MyCourseLecturesDTO } from '@/features/my-courses/dto/my-courses.dto';

export function useToggleLectureCompletion(courseSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      lectureId,
      isCompleted,
    }: {
      lectureId: string;
      isCompleted: boolean;
    }) =>
      updateLectureProgressClient({
        courseIdOrSlug: courseSlug,
        lectureId,
        isCompleted,
      }),
    onMutate: async ({ lectureId, isCompleted }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: MY_COURSES_TAGS.sections(courseSlug),
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(
        MY_COURSES_TAGS.sections(courseSlug),
      );

      // Optimistically update to the new value
      queryClient.setQueryData<MyCourseLecturesDTO>(
        MY_COURSES_TAGS.sections(courseSlug),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            sections: old.sections.map((section) => ({
              ...section,
              lectures: section.lectures.map((lecture) =>
                lecture.id === lectureId
                  ? { ...lecture, isCompleted }
                  : lecture,
              ),
            })),
          };
        },
      );

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          MY_COURSES_TAGS.sections(courseSlug),
          context.previousData,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: MY_COURSES_TAGS.sections(courseSlug),
      });
    },
  });
}
