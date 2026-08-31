'use client';

import { Progress } from '@/components/ui/progress';

interface CourseProgressProps {
  progress: number;
  className?: string;
}

export const CourseProgress = ({
  progress,
  className = '',
}: CourseProgressProps) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <Progress value={progress} className="h-[2px]" />
      <div className="flex justify-between items-center text-xs font-bold">
        <span className="text-progress-indicator">تم إكمال %{progress}</span>
      </div>
    </div>
  );
};
