import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleLectureCompletion } from '../actions/my-course';
import { MY_COURSES_TAGS } from '@/lib/query-keys';

export function useToggleLectureCompletion(courseSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      lectureId,
      isCompleted,
    }: {
      lectureId: string;
      isCompleted: boolean;
    }) => toggleLectureCompletion(lectureId, isCompleted),
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
      queryClient.setQueryData(
        MY_COURSES_TAGS.sections(courseSlug),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            sections: old.sections.map((section: any) => ({
              ...section,
              lectures: section.lectures.map((lecture: any) =>
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
