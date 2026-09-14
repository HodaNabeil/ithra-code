import { LectureWorkspace } from '@/features/my-courses/[courseSlug]/components/lecture-details/lecture-workspace';

/** Learning view when the course has no lecture to open yet. */
export default function CourseLectureEntryPage() {
  return (
    <LectureWorkspace>
      <div className="flex aspect-video w-full items-center justify-center bg-black">
        <p className="px-6 text-center text-white/80">
          لا يتوفر مصدر تشغيل لهذه المحاضرة
        </p>
      </div>
    </LectureWorkspace>
  );
}
