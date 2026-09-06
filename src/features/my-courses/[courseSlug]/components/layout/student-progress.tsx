'use client';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Trophy, ChevronDown } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCourseProgressQuery } from '@/features/my-courses/hooks/use-my-courses-queries';

export default function StudentProgress() {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const { data: progressData, isLoading } = useCourseProgressQuery(courseSlug);

  const completedLectures = progressData?.completedLectures ?? 0;
  const totalLectures = progressData?.totalLectures ?? 0;
  const progressPercentage = progressData?.completionPercentage ?? 0;
  const isCompleted = totalLectures > 0 && completedLectures === totalLectures;

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 animate-pulse">
        <div className="element-center w-10 h-10 rounded-full border-2 border-border">
          <div className="w-5 h-5 rounded-full bg-border" />
        </div>
        <div className="h-3 w-8 bg-border rounded" />
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center group gap-1.5 transition-colors duration-200 cursor-pointer text-xs">
          <div className="relative element-center w-10 h-10">
            {/* Background track circle */}
            <svg
              className="absolute inset-0 w-full h-full -rotate-90"
              viewBox="0 0 40 40"
            >
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                strokeWidth="2"
                className="stroke-border"
              />
              {/* Progress arc */}
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                className="stroke-primary/60 transition-all duration-300"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - progressPercentage / 100)}`}
              />
            </svg>
            <Trophy
              className={`w-5 h-5 transition-colors duration-200 ${isCompleted ? 'text-primary/60' : 'text-primary/30 group-hover:text-primary/60'}`}
            />
          </div>
          <span className="text-muted-foreground group-hover:text-primary/90">
            تقدمك
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary/90" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-4" align="end">
        <div className="space-y-1">
          <h3 className="text-base font-normal text-primary text-right">
            تم إكمال {completedLectures} من أصل {totalLectures}
          </h3>
        </div>
      </PopoverContent>
    </Popover>
  );
}
