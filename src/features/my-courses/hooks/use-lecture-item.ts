import { useParams, useRouter } from 'next/navigation';
import { useToggleLectureCompletion } from '@/features/my-courses/hooks/useMyCoursesMutations';

/**
 * Custom hook to handle lecture item logic.
 * Encapsulates navigation, completion status management, and formatting (SRP).
 */
export function useLectureItem(id: string, courseSlug: string) {
  const router = useRouter();
  const params = useParams();

  const toggleMutation = useToggleLectureCompletion(courseSlug);

  const isActive = params.lectureId === id;

  const handleSelect = () => {
    router.push(`/my-courses/${courseSlug}/learn/lecture/${id}`);
  };

  const handleToggleComplete = async (checked: boolean) => {
    toggleMutation.mutate({ lectureId: id, isCompleted: checked });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    return `${minutes} د`;
  };

  return {
    isActive,
    isPending: toggleMutation.isPending,
    handleSelect,
    handleToggleComplete,
    formatDuration,
  };
}
