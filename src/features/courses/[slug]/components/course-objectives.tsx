import { Check } from 'lucide-react';
import { ExpandableContent } from '@/components/shared/expandable-content';
import type { Course } from '@/types/course/course.types';

interface CourseObjectivesProps {
  objectives: Course['objectives'];
}

export function CourseObjectives({ objectives }: CourseObjectivesProps) {
  return (
    <div className="flex flex-col gap-4 p-6 border border-primary/20 rounded-xl">
      <h4 className="font-bold text-lg text-right mb-2">ما ستتعلمه</h4>

      <ExpandableContent initialHeight={200}>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {objectives.map((objective, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground leading-snug">
                {objective}
              </span>
            </li>
          ))}
        </ul>
      </ExpandableContent>
    </div>
  );
}
